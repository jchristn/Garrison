namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Keepers;
    using Garrison.Core.Models;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Core.Templates;
    using SyslogLogging;

    /// <summary>
    /// The keeper wake scheduler (AA1.5, AA-014). The control-plane leader calls <see cref="SweepAsync(CancellationToken)"/>
    /// from its maintenance pass. Each sweep:
    /// <list type="number">
    /// <item>finishes ticks whose run has ended (a run that ended without garrison_keeper_complete_tick records
    /// Unreported, or Failed when the run failed), computes the next wake, and frees the mandate for its next tick;</item>
    /// <item>claims due wakes with one compare-and-set on the mandate's next wake and active tick, so several replicas
    /// start exactly one tick per wake, and starts each tick as a run of kind Keeper;</item>
    /// <item>records a Skipped tick and moves the next wake by one interval when a timer wake comes due while the previous
    /// tick still runs (single-flight). A manual or message wake waits and starts as soon as that tick finishes.</item>
    /// </list>
    /// Up to Autonomy.SchedulerSweepConcurrency mandates of a sweep are handled at the same time; each claim stays a
    /// compare-and-set on its own mandate. Run completion also finishes the tick at once through
    /// <see cref="OnRunFinishedAsync"/>. Thread-safe.
    /// </summary>
    public class KeeperScheduler
    {
        #region Public-Members

        /// <summary>
        /// Org unit budgets (AA7.6). When set, a due wake of a keeper whose agent sits in a capped subtree is recorded as
        /// Skipped (BudgetExhausted) and the capped unit's manager is told. Null to skip the check.
        /// </summary>
        public OrgBudgetGuard? OrgBudgets { get; set; } = null;

        /// <summary>
        /// Options, refreshed from the Autonomy.* cluster settings.
        /// </summary>
        public KeeperOptions Options
        {
            get
            {
                return _Options;
            }
        }

        /// <summary>
        /// Raised after a tick starts, is skipped, or finishes, with the tick as stored. Handlers must not throw.
        /// </summary>
        public event EventHandler<MandateTick>? TickChanged;

        /// <summary>
        /// Escalation service (AA2.4). When set, a tick's input carries the answers to the keeper's escalations that no
        /// earlier tick carried, rendered through escalation-answered (AA-042). Null when escalations are not wired.
        /// </summary>
        public EscalationService? Escalations { get; set; } = null;

        /// <summary>
        /// Scoped memory (AA4.8). When set, a tick's input carries the agent's own entries tagged for recall, rendered
        /// through memory-recall. Null when agent memory is turned off.
        /// </summary>
        public MemoryService? Memory { get; set; } = null;

        /// <summary>
        /// Reports (AA5.5). When set, a tick's input carries the reports its agent's subordinates filed since the keeper's
        /// previous tick started, rendered through report-digest. Null when reports are not wired.
        /// </summary>
        public ReportService? Reports { get; set; } = null;

        /// <summary>
        /// Messages (AA6.5). When set, a tick's input carries its agent's queued messages, oldest first, up to
        /// Messaging.MaxMessagesPerDelivery, rendered through inbox-delivery, and those messages are marked delivered to the
        /// tick's run. Null when messaging is not wired.
        /// </summary>
        public MessageService? Messages { get; set; } = null;

        /// <summary>
        /// Freezes (AA3.2). When set, a due wake of a keeper under a freeze or the kill switch is recorded as Skipped and its
        /// next wake moves on by one interval. Null when freezes are not wired.
        /// </summary>
        public FreezeService? Freezes { get; set; } = null;

        /// <summary>
        /// When a keeper reaches its daily cap, its first wake after the window resets is spread over up to this many
        /// seconds (never more than its current interval), so keepers capped on the same day do not all wake at midnight
        /// UTC together. Minimum 0, maximum 3600, default 300.
        /// </summary>
        public int CapResetSpreadSeconds
        {
            get
            {
                return _CapResetSpreadSeconds;
            }
            set
            {
                _CapResetSpreadSeconds = Math.Clamp(value, 0, 3600);
            }
        }

        /// <summary>
        /// Seconds a claimed tick may go without a run before the sweep fails it (the replica that claimed it died before
        /// starting the run). Minimum 30, maximum 3600, default 120.
        /// </summary>
        public int OrphanedClaimSeconds
        {
            get
            {
                return _OrphanedClaimSeconds;
            }
            set
            {
                _OrphanedClaimSeconds = Math.Clamp(value, 30, 3600);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunService _Runs;
        private readonly RunAsAuthorization _RunAs;
        private readonly KeeperOptions _Options;
        private readonly LoggingModule _Logging;
        private readonly KeeperIntervalCalculator _Intervals;
        private readonly KeeperTemplateResolver _Templates;
        private readonly string _Header = "[Keepers] ";
        private DateTime _LastSweepUtc = DateTime.MinValue;
        private DateTime _LastPruneUtc = DateTime.MinValue;
        private int _OrphanedClaimSeconds = 120;
        private int _CapResetSpreadSeconds = 300;
        private readonly MandateBudgetReader _Budgets;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="runs">Run service.</param>
        /// <param name="runAs">Run-as checks.</param>
        /// <param name="options">Options.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public KeeperScheduler(DatabaseDriverBase database, RunService runs, RunAsAuthorization runAs, KeeperOptions options, LoggingModule logging)
            : this(database, runs, runAs, options, logging, new KeeperIntervalCalculator())
        {
        }

        /// <summary>
        /// Instantiate with an interval calculator (for tests that fix the random source).
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="runs">Run service.</param>
        /// <param name="runAs">Run-as checks.</param>
        /// <param name="options">Options.</param>
        /// <param name="logging">Logging.</param>
        /// <param name="intervals">Interval calculator.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public KeeperScheduler(DatabaseDriverBase database, RunService runs, RunAsAuthorization runAs, KeeperOptions options, LoggingModule logging, KeeperIntervalCalculator intervals)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _RunAs = runAs ?? throw new ArgumentNullException(nameof(runAs));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            _Intervals = intervals ?? throw new ArgumentNullException(nameof(intervals));
            _Templates = new KeeperTemplateResolver(database);
            _Budgets = new MandateBudgetReader(database);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Run one sweep when Autonomy.SchedulerSweepSeconds has passed since the last one (the leader's maintenance step).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a tick started, finished, or was skipped.</returns>
        public async Task<bool> SweepAsync(CancellationToken token)
        {
            DateTime now = DateTime.UtcNow;
            if ((now - _LastSweepUtc).TotalSeconds < _Options.SchedulerSweepSeconds) return false;
            _LastSweepUtc = now;
            return await SweepAsync(now, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Run one sweep at a given time. Used by the leader and by tests.
        /// </summary>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a tick started, finished, or was skipped.</returns>
        public async Task<bool> SweepAsync(DateTime nowUtc, CancellationToken token)
        {
            _Intervals.DefaultJitterPercent = _Options.DefaultJitterPercent;
            bool changed = false;

            // A keeper that reached its daily cap ticks again once its window has reset (AA3.3).
            int reactivated = await _Database.Mandates.ReactivateCapsAsync(nowUtc, token).ConfigureAwait(false);
            if (reactivated > 0)
            {
                _Logging.Info(_Header + reactivated + " keeper(s) past their daily cap reset are active again");
                changed = true;
            }

            // Each mandate is finished or claimed with its own compare-and-set, so a batch can run in parallel
            // (Autonomy.SchedulerSweepConcurrency) without changing what any one wake does.
            List<Mandate> active = await _Database.Mandates.ListWithActiveTickAsync(_Options.MaxDueClaimsPerSweep, token).ConfigureAwait(false);
            // A wake late in a large batch is handled later than the sweep began; the sweep's clock moves on with it, so
            // a tick's startedUtc (and the tick lag metric) is when the tick was claimed, not when the sweep started.
            long started = Stopwatch.GetTimestamp();
            if (await ForEachAsync(active, (mandate, ct) => ReconcileAsync(mandate, nowUtc + Stopwatch.GetElapsedTime(started), ct), token).ConfigureAwait(false)) changed = true;

            List<Mandate> due = await _Database.Mandates.ListDueAsync(nowUtc, _Options.MaxDueClaimsPerSweep, token).ConfigureAwait(false);
            if (due.Count > 0)
            {
                // Agents, deployments, and tick templates are read once per sweep for all of its ticks.
                KeeperSweepCache cache = new KeeperSweepCache(_Database, _Templates);
                if (await ForEachAsync(due, (mandate, ct) => WakeDueAsync(mandate, nowUtc + Stopwatch.GetElapsedTime(started), cache, ct), token).ConfigureAwait(false)) changed = true;
            }

            if ((nowUtc - _LastPruneUtc).TotalHours >= 1)
            {
                _LastPruneUtc = nowUtc;
                int pruned = await _Database.MandateTicks.PruneAsync(nowUtc.AddDays(-_Options.TickHistoryRetentionDays), token).ConfigureAwait(false);
                if (pruned > 0)
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.RetentionDeleted, pruned, GarrisonMetrics.Tags("kind", "mandate_ticks"));
                    changed = true;
                }
            }
            return changed;
        }

        /// <summary>
        /// Finish a keeper tick as soon as its run ends. Called from run completion on any replica; the compare-and-set on
        /// the mandate's active tick makes a second call (or the sweep) a no-op.
        /// </summary>
        /// <param name="run">Finished run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task OnRunFinishedAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (run.Kind != RunKindEnum.Keeper || String.IsNullOrEmpty(run.MandateId) || String.IsNullOrEmpty(run.MandateTickId)) return;
            try
            {
                Mandate? mandate = await _Database.Mandates.ReadAsync(run.TenantId, run.MandateId, token).ConfigureAwait(false);
                if (mandate == null || mandate.ActiveTickId != run.MandateTickId) return;
                MandateTick? tick = await _Database.MandateTicks.ReadAsync(run.TenantId, run.MandateTickId, token).ConfigureAwait(false);
                if (tick == null) return;
                await FinishAsync(mandate, tick, run, null, null, DateTime.UtcNow, true, token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                // The sweep finishes the tick later; completion of the run itself must not fail because of it.
                _Logging.Warn(_Header + "could not finish the tick of run " + run.Id + " now; the sweep will: " + e.Message);
            }
        }

        /// <summary>
        /// Render the input a tick would receive, without starting it. Used by previews and tests.
        /// </summary>
        /// <param name="mandate">Mandate.</param>
        /// <param name="tick">Tick (wake source and scheduled time).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rendered input.</returns>
        /// <exception cref="ArgumentNullException">Thrown when mandate or tick is null.</exception>
        /// <exception cref="TemplateException">Thrown when the template fails to render.</exception>
        public async Task<string> RenderInputAsync(Mandate mandate, MandateTick tick, CancellationToken token = default)
        {
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            if (tick == null) throw new ArgumentNullException(nameof(tick));
            PromptTemplate template = await _Templates.ResolveAsync(mandate.TenantId, KeeperTemplateResolver.TickTemplateName, PromptTemplateKindEnum.Task, token).ConfigureAwait(false);
            return await RenderAsync(mandate, tick, template, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task<bool> ForEachAsync(List<Mandate> mandates, Func<Mandate, CancellationToken, Task<bool>> work, CancellationToken token)
        {
            if (mandates.Count < 1) return false;
            int concurrency = Math.Min(_Options.SchedulerSweepConcurrency, mandates.Count);
            if (concurrency <= 1)
            {
                bool any = false;
                foreach (Mandate mandate in mandates)
                {
                    token.ThrowIfCancellationRequested();
                    if (await work(mandate, token).ConfigureAwait(false)) any = true;
                }
                return any;
            }

            int changed = 0;
            ParallelOptions options = new ParallelOptions();
            options.MaxDegreeOfParallelism = concurrency;
            options.CancellationToken = token;
            await Parallel.ForEachAsync(mandates, options, async (mandate, ct) =>
            {
                if (await work(mandate, ct).ConfigureAwait(false)) Interlocked.Exchange(ref changed, 1);
            }).ConfigureAwait(false);
            return Interlocked.CompareExchange(ref changed, 0, 0) == 1;
        }

        private async Task<bool> WakeDueAsync(Mandate mandate, DateTime nowUtc, KeeperSweepCache cache, CancellationToken token)
        {
            if (!mandate.NextWakeUtc.HasValue) return false;
            DateTime expected = mandate.NextWakeUtc.Value;
            WakeSourceEnum source = mandate.PendingWakeSource ?? WakeSourceEnum.Timer;

            // A freeze on the mandate, its agent, or its deployment, or the kill switch, skips the wake (AA3.2); the
            // schedule moves on by one interval, so lifting it later does not release a burst of overdue ticks.
            Freeze? freeze = Freezes != null ? await Freezes.FindForMandateAsync(mandate, token).ConfigureAwait(false) : null;
            if (freeze != null)
            {
                bool killSwitch = freeze.TargetKind == FreezeTargetKindEnum.TenantAutonomy;
                string why = killSwitch
                    ? "The autonomy kill switch is on (" + freeze.Id + "), so this wake was skipped."
                    : FreezeService.Describe(freeze) + " is frozen by " + freeze.Id + ", so this wake was skipped.";
                bool skippedFrozen = await SkipAsync(mandate, source, expected, nowUtc, killSwitch ? "KillSwitch" : "Frozen", why, token).ConfigureAwait(false);
                if (skippedFrozen) Freezes!.Skipped(freeze);
                return skippedFrozen;
            }

            if (OrgBudgets != null)
            {
                OrgBudgetBreach? breach = await OrgBudgets.FindBreachAsync(mandate.TenantId, mandate.AgentId, nowUtc, token).ConfigureAwait(false);
                if (breach != null)
                {
                    bool skippedBudget = await SkipAsync(mandate, source, expected, nowUtc, "BudgetExhausted", OrgBudgetGuard.Message(breach) + " This wake was skipped.", token).ConfigureAwait(false);
                    if (skippedBudget) await OrgBudgets.FreezeIfOverrunAsync(breach, token).ConfigureAwait(false);
                    if (skippedBudget) await OrgBudgets.NotifyAsync(mandate.TenantId, mandate.AgentId, breach, mandate.RunAsType, mandate.RunAsId, "keeper:" + mandate.Name, token).ConfigureAwait(false);
                    return skippedBudget;
                }
            }

            if (!String.IsNullOrEmpty(mandate.ActiveTickId))
            {
                // Single-flight: a non-timer wake waits for the running tick; a timer wake is recorded as Skipped and the
                // schedule moves on by one interval.
                if (source != WakeSourceEnum.Timer) return false;
                return await SkipAsync(mandate, source, expected, nowUtc, "PreviousTickRunning",
                    "The previous tick (" + mandate.ActiveTickId + (mandate.ActiveRunId != null ? ", run " + mandate.ActiveRunId : String.Empty) + ") was still running, so this wake was skipped.", token).ConfigureAwait(false);
            }

            // Daily spend cap (AA3.3): a keeper that has spent its daily budget stops until the UTC day ends.
            MandateRevision? revision = String.IsNullOrEmpty(mandate.CurrentRevisionId) ? null
                : await _Database.MandateRevisions.ReadAsync(mandate.TenantId, mandate.CurrentRevisionId, token).ConfigureAwait(false);
            if (revision != null && revision.BudgetPerDayUsd.HasValue)
            {
                MandateBudgetStatus budget = await _Budgets.ReadAsync(mandate.TenantId, mandate.Id, revision, nowUtc, token).ConfigureAwait(false);
                if (budget.DayRemainingUsd.HasValue && budget.DayRemainingUsd.Value <= 0) return await CapAsync(mandate, revision, budget, source, expected, nowUtc, token).ConfigureAwait(false);
            }

            MandateTick tick = NewTick(mandate, source, expected, nowUtc);
            if (!await _Database.Mandates.TryClaimAsync(mandate.Id, expected, tick.Id, token).ConfigureAwait(false)) return false;
            await _Database.MandateTicks.CreateAsync(tick, token).ConfigureAwait(false);
            GarrisonMetrics.Observe(GarrisonMetricCatalog.KeeperTickLag, Math.Max(0, (nowUtc - expected).TotalSeconds), "source", Label(source));
            mandate.ActiveTickId = tick.Id;
            await StartAsync(mandate, tick, nowUtc, cache, token).ConfigureAwait(false);
            return true;
        }

        private async Task<bool> SkipAsync(Mandate mandate, WakeSourceEnum source, DateTime expected, DateTime nowUtc, string code, string message, CancellationToken token)
        {
            int interval = Math.Max(1, mandate.CurrentIntervalSeconds);
            if (!await _Database.Mandates.TryDeferAsync(mandate.Id, expected, nowUtc.AddSeconds(interval), token).ConfigureAwait(false)) return false;
            MandateTick skipped = NewTick(mandate, source, expected, nowUtc);
            skipped.Outcome = TickOutcomeEnum.Skipped;
            skipped.FinishedUtc = nowUtc;
            skipped.ErrorCode = code;
            skipped.ErrorMessage = message;
            await _Database.MandateTicks.CreateAsync(skipped, token).ConfigureAwait(false);
            Finished(mandate, skipped);
            return true;
        }

        private async Task<bool> CapAsync(Mandate mandate, MandateRevision revision, MandateBudgetStatus budget, WakeSourceEnum source, DateTime expected, DateTime nowUtc, CancellationToken token)
        {
            int spread = Math.Min(_CapResetSpreadSeconds, Math.Max(0, mandate.CurrentIntervalSeconds));
            DateTime resume = budget.WindowResetUtc.AddSeconds(spread > 0 ? Random.Shared.Next(0, spread + 1) : 0);
            if (!await _Database.Mandates.TrySetStatusAsync(mandate.TenantId, mandate.Id, MandateStatusEnum.Active, MandateStatusEnum.CapReached, resume, token).ConfigureAwait(false)) return false;

            string spent = budget.DaySpentUsd.ToString("0.####", CultureInfo.InvariantCulture);
            string limit = revision.BudgetPerDayUsd!.Value.ToString("0.####", CultureInfo.InvariantCulture);
            MandateTick capped = NewTick(mandate, source, expected, nowUtc);
            capped.Outcome = TickOutcomeEnum.Skipped;
            capped.FinishedUtc = nowUtc;
            capped.ErrorCode = "CapReached";
            capped.ErrorMessage = "The keeper spent " + spent + " USD today, reaching its daily budget of " + limit + " USD. It ticks again after " + Iso(resume) + ".";
            await _Database.MandateTicks.CreateAsync(capped, token).ConfigureAwait(false);
            GarrisonMetrics.Count(GarrisonMetricCatalog.SpendCapHits, "scope", "mandate_day");
            mandate.Status = MandateStatusEnum.CapReached;
            Finished(mandate, capped);

            if (Escalations != null)
            {
                try
                {
                    Escalation notice = new Escalation();
                    notice.Question = "Keeper " + mandate.Name + " reached its daily budget: it spent " + spent + " USD of " + limit + " USD today and stopped ticking. It resumes after " + Iso(resume) + ". To let it continue sooner, publish a revision with a larger budgetPerDayUsd and resume it.";
                    notice.Severity = EscalationSeverityEnum.Urgent;
                    notice.Options.Add(new EscalationOption { Key = "acknowledged", Label = "Leave it stopped until the window resets" });
                    notice.DefaultAnswer = "acknowledged";
                    notice.TimeoutAction = EscalationTimeoutActionEnum.UseDefaultAnswer;
                    notice.TimeoutSeconds = (int)Math.Clamp(Math.Ceiling((resume - nowUtc).TotalSeconds), 60, 2592000);
                    await Escalations.RaiseForMandateAsync(mandate, revision, capped.Id, notice, token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + "mandate " + mandate.Id + " (" + mandate.Name + ") reached its cap but the escalation could not be raised: " + e.Message);
                }
            }
            return true;
        }

        private async Task StartAsync(Mandate mandate, MandateTick tick, DateTime nowUtc, KeeperSweepCache cache, CancellationToken token)
        {
            string? code = null;
            string? message = null;
            MessageDelivery? delivery = null;
            try
            {
                Agent agent = await cache.AgentAsync(mandate.TenantId, mandate.AgentId, token).ConfigureAwait(false)
                    ?? throw new ConflictException("AgentNotFound", "Agent " + mandate.AgentId + " of mandate " + mandate.Name + " no longer exists.");
                string? denied = await _RunAs.DeniedAsync(mandate.TenantId, mandate.RunAsType, mandate.RunAsId, mandate.RunAsName, agent.Id, "Mandate " + mandate.Name, token).ConfigureAwait(false);
                if (denied != null) throw new ConflictException("RunAsNotAuthorized", denied);
                if (String.IsNullOrEmpty(mandate.CurrentRevisionId)) throw new ConflictException("NoPublishedRevision", "Mandate " + mandate.Name + " has no published revision.");

                PromptTemplate template = await cache.TickTemplateAsync(mandate.TenantId, token).ConfigureAwait(false);
                string input;
                try
                {
                    input = await RenderAsync(mandate, tick, template, token).ConfigureAwait(false);
                }
                catch (TemplateException e)
                {
                    throw new ConflictException("TemplateRenderFailed", "Tick template " + template.Name + " failed to render: " + e.Message);
                }
                tick.TemplateName = template.Name;
                tick.TemplateVersion = template.CurrentVersion;

                List<Escalation> answers = Escalations == null ? new List<Escalation>() : await _Database.Escalations.ListUndeliveredAsync(mandate.TenantId, mandate.Id, token).ConfigureAwait(false);
                if (answers.Count > 0)
                {
                    try
                    {
                        input = input.TrimEnd() + Environment.NewLine + Environment.NewLine + await Escalations!.RenderAnswersAsync(mandate.TenantId, answers, token).ConfigureAwait(false);
                    }
                    catch (TemplateException e)
                    {
                        throw new ConflictException("TemplateRenderFailed", "Template escalation-answered failed to render: " + e.Message);
                    }
                }

                MemoryService? memory = Memory;
                if (memory != null)
                {
                    // AA4.8: the agent's entries tagged for recall reach the tick only through the memory-recall template.
                    string? recall;
                    try
                    {
                        recall = await memory.RenderRecallAsync(mandate.TenantId, agent.Id, token).ConfigureAwait(false);
                    }
                    catch (TemplateException e)
                    {
                        throw new ConflictException("TemplateRenderFailed", "Template memory-recall failed to render: " + e.Message);
                    }
                    if (recall != null) input = input.TrimEnd() + Environment.NewLine + Environment.NewLine + recall;
                }

                ReportService? reports = Reports;
                if (reports != null)
                {
                    // AA5.5: subordinates' reports reach the tick only through the report-digest template.
                    string? digest;
                    try
                    {
                        digest = await reports.RenderDigestAsync(mandate.TenantId, agent.Id, await PreviousTickStartAsync(mandate, tick, token).ConfigureAwait(false), token).ConfigureAwait(false);
                    }
                    catch (TemplateException e)
                    {
                        throw new ConflictException("TemplateRenderFailed", "Template report-digest failed to render: " + e.Message);
                    }
                    if (digest != null) input = input.TrimEnd() + Environment.NewLine + Environment.NewLine + digest;

                    // AA10.3: the organization's top agent is asked for its brief to the board through board-brief.
                    string? brief;
                    try
                    {
                        brief = await reports.RenderBoardBriefAsync(mandate, nowUtc, token).ConfigureAwait(false);
                    }
                    catch (TemplateException e)
                    {
                        throw new ConflictException("TemplateRenderFailed", "Template board-brief failed to render: " + e.Message);
                    }
                    if (brief != null) input = input.TrimEnd() + Environment.NewLine + Environment.NewLine + brief;
                }

                MessageService? messages = Messages;
                if (messages != null)
                {
                    // AA6.5: queued mail reaches the tick only through the inbox-delivery template; the claim keeps another
                    // replica's tick or a Message run from delivering the same messages.
                    try
                    {
                        delivery = await messages.ClaimDeliveryAsync(mandate.TenantId, agent.Id, token).ConfigureAwait(false);
                    }
                    catch (TemplateException e)
                    {
                        throw new ConflictException("TemplateRenderFailed", "Template inbox-delivery failed to render: " + e.Message);
                    }
                    if (delivery != null) input = input.TrimEnd() + Environment.NewLine + Environment.NewLine + delivery.Text;
                }

                RunCreateContext create = new RunCreateContext();
                create.TenantId = mandate.TenantId;
                create.Agent = agent;
                create.DeploymentId = mandate.DeploymentId;
                create.Deployment = String.IsNullOrEmpty(mandate.DeploymentId) ? null : await cache.DeploymentAsync(mandate.TenantId, mandate.DeploymentId, token).ConfigureAwait(false);
                create.Input = input;
                create.InputContentType = "text/plain";
                create.Kind = RunKindEnum.Keeper;
                create.CallerType = mandate.RunAsType;
                create.CallerId = mandate.RunAsId;
                create.CallerName = "keeper:" + mandate.Name;
                create.IdempotencyKey = "keeper:" + tick.Id;
                create.Surface = "keeper";
                create.MandateId = mandate.Id;
                create.MandateTickId = tick.Id;
                Run run = await _Runs.CreateAsync(create, token).ConfigureAwait(false);
                tick.RunId = run.Id;
                await _Database.MandateTicks.UpdateAsync(tick, token).ConfigureAwait(false);
                if (answers.Count > 0) await _Database.Escalations.MarkDeliveredAsync(mandate.TenantId, answers.Select(a => a.Id).ToList(), tick.Id, token).ConfigureAwait(false);
                if (delivery != null)
                {
                    await messages!.CompleteDeliveryAsync(delivery, run.Id, token).ConfigureAwait(false);
                    delivery = null;
                }
                await _Database.Mandates.SetActiveRunAsync(mandate.Id, tick.Id, run.Id, token).ConfigureAwait(false);
                _Logging.Info(_Header + "mandate " + mandate.Id + " (" + mandate.Name + ") tick " + tick.Id + " started run " + run.Id + " (" + tick.WakeSource + ") " + GarrisonTracing.LogFields("tenant", mandate.TenantId, "mandate", mandate.Name));
                Raise(tick);
                return;
            }
            catch (ConflictException e)
            {
                code = e.Code;
                message = e.Message;
            }
            catch (ValidationException e)
            {
                code = e.Codes.Values.FirstOrDefault() ?? e.Code;
                message = e.Message;
            }
            catch (NotFoundException e)
            {
                code = "NotFound";
                message = e.Message;
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                _Logging.Warn(_Header + "mandate " + mandate.Id + " (" + mandate.Name + ") tick " + tick.Id + " could not start: " + e);
                code = "InternalError";
                message = "The tick run could not be started: " + e.Message;
            }

            if (delivery != null && Messages != null) await Messages.ReleaseDeliveryAsync(delivery).ConfigureAwait(false);
            await FinishAsync(mandate, tick, null, code, message, nowUtc, true, CancellationToken.None).ConfigureAwait(false);
        }

        private async Task<bool> ReconcileAsync(Mandate mandate, DateTime nowUtc, CancellationToken token)
        {
            if (String.IsNullOrEmpty(mandate.ActiveTickId)) return false;
            MandateTick? tick = await _Database.MandateTicks.ReadAsync(mandate.TenantId, mandate.ActiveTickId, token).ConfigureAwait(false);
            if (tick == null)
            {
                // The tick row is gone (pruned or deleted); free the mandate without a record.
                MandateTick orphan = NewTick(mandate, WakeSourceEnum.Timer, nowUtc, nowUtc);
                orphan.Id = mandate.ActiveTickId;
                return await FinishAsync(mandate, orphan, null, "TickMissing", "The active tick record was not found.", nowUtc, false, token).ConfigureAwait(false);
            }

            string? runId = mandate.ActiveRunId ?? tick.RunId;
            if (String.IsNullOrEmpty(runId))
            {
                if ((nowUtc - tick.StartedUtc).TotalSeconds < _OrphanedClaimSeconds) return false;
                return await FinishAsync(mandate, tick, null, "StartInterrupted", "The replica that claimed this tick stopped before starting its run.", nowUtc, true, token).ConfigureAwait(false);
            }

            Run? run = await _Database.Runs.ReadRowAsync(runId, token).ConfigureAwait(false);
            if (run != null && !RunService.IsTerminal(run.Status)) return false;
            return await FinishAsync(mandate, tick, run, run == null ? "RunMissing" : null, run == null ? "The tick's run " + runId + " no longer exists." : null, nowUtc, true, token).ConfigureAwait(false);
        }

        private async Task<bool> FinishAsync(Mandate mandate, MandateTick tick, Run? run, string? errorCode, string? errorMessage, DateTime nowUtc, bool recordTick, CancellationToken token)
        {
            TickOutcomeEnum outcome = Outcome(tick, run, errorCode);
            MandateRevision? revision = String.IsNullOrEmpty(mandate.CurrentRevisionId) ? null
                : await _Database.MandateRevisions.ReadAsync(mandate.TenantId, mandate.CurrentRevisionId, token).ConfigureAwait(false);

            Mandate update = new Mandate();
            update.Id = mandate.Id;
            update.TenantId = mandate.TenantId;
            update.LastTickUtc = nowUtc;
            update.LastTickOutcome = outcome;
            int? applied = null;
            if (revision != null)
            {
                KeeperIntervalResult next = _Intervals.Next(revision, mandate.CurrentIntervalSeconds, mandate.ConsecutiveQuietTicks, outcome, tick.Reported ? tick.RequestedNextWakeSeconds : null, nowUtc);
                update.CurrentIntervalSeconds = next.IntervalSeconds;
                update.ConsecutiveQuietTicks = next.ConsecutiveQuietTicks;
                update.NextWakeUtc = mandate.Status == MandateStatusEnum.Active ? next.NextWakeUtc : null;
                applied = next.AppliedIntervalSeconds;
                GarrisonMetrics.Observe(GarrisonMetricCatalog.KeeperInterval, next.AppliedIntervalSeconds, "mode", revision.WakeMode.ToString().ToLowerInvariant());
            }
            else
            {
                update.CurrentIntervalSeconds = mandate.CurrentIntervalSeconds;
                update.ConsecutiveQuietTicks = 0;
                update.NextWakeUtc = null;
            }

            if (!await _Database.Mandates.TryFinishTickAsync(update, tick.Id, token).ConfigureAwait(false)) return false;
            if (!recordTick) return true;

            tick.FinishedUtc = nowUtc;
            tick.Outcome = outcome;
            tick.AppliedIntervalSeconds = applied;
            if (run != null)
            {
                tick.RunId = run.Id;
                tick.CostUsd = run.CostUsd;
            }
            if (errorCode != null)
            {
                tick.ErrorCode = errorCode;
                tick.ErrorMessage = errorMessage;
            }
            else if (run != null && !tick.Reported && run.Status != RunStatusEnum.Succeeded)
            {
                tick.ErrorCode = "Run" + run.Status;
                tick.ErrorMessage = run.ErrorMessage;
            }
            await _Database.MandateTicks.UpdateAsync(tick, token).ConfigureAwait(false);
            Finished(mandate, tick);
            return true;
        }

        private static TickOutcomeEnum Outcome(MandateTick tick, Run? run, string? errorCode)
        {
            if (tick.Reported && tick.Outcome.HasValue) return tick.Outcome.Value;
            if (errorCode != null || run == null) return TickOutcomeEnum.Failed;
            if (run.Status == RunStatusEnum.Failed || run.Status == RunStatusEnum.TimedOut) return TickOutcomeEnum.Failed;
            return TickOutcomeEnum.Unreported;
        }

        private async Task<DateTime> PreviousTickStartAsync(Mandate mandate, MandateTick tick, CancellationToken token)
        {
            // Reports filed since the previous tick that started a run began; the first tick sees those since the mandate
            // was created.
            EnumerationResult<MandateTick> recent = await _Database.MandateTicks.EnumerateAsync(mandate.TenantId, mandate.Id, null, new EnumerationQuery { MaxResults = 10 }, token).ConfigureAwait(false);
            MandateTick? previous = recent.Objects.Where(t => t.Id != tick.Id && !String.IsNullOrEmpty(t.RunId)).OrderByDescending(t => t.StartedUtc).FirstOrDefault();
            return previous?.StartedUtc ?? mandate.CreatedUtc;
        }

        private async Task<string> RenderAsync(Mandate mandate, MandateTick tick, PromptTemplate template, CancellationToken token)
        {
            List<MandateTick> recent = _Options.TickInputRecentTicks > 0
                ? await _Database.MandateTicks.ListRecentAsync(mandate.TenantId, mandate.Id, _Options.TickInputRecentTicks, token).ConfigureAwait(false)
                : new List<MandateTick>();

            TemplateContext context = new TemplateContext();
            Dictionary<string, object?> mandateMap = TemplateContext.NewMap();
            mandateMap["id"] = mandate.Id;
            mandateMap["name"] = mandate.Name;
            mandateMap["description"] = mandate.Description;
            mandateMap["revisionNumber"] = (long)mandate.CurrentRevisionNumber;
            context.Set("mandate", mandateMap);

            Dictionary<string, object?> tickMap = TemplateContext.NewMap();
            tickMap["id"] = tick.Id;
            tickMap["wakeSource"] = tick.WakeSource.ToString();
            tickMap["isTimer"] = tick.WakeSource == WakeSourceEnum.Timer;
            tickMap["isManual"] = tick.WakeSource == WakeSourceEnum.Manual;
            tickMap["isOther"] = tick.WakeSource != WakeSourceEnum.Timer && tick.WakeSource != WakeSourceEnum.Manual;
            tickMap["scheduledUtc"] = Iso(tick.ScheduledUtc);
            tickMap["lastTickUtc"] = mandate.LastTickUtc.HasValue ? Iso(mandate.LastTickUtc.Value) : null;
            tickMap["lastOutcome"] = mandate.LastTickOutcome?.ToString();
            tickMap["number"] = mandate.TickCount;
            List<object?> items = new List<object?>();
            foreach (MandateTick earlier in recent)
            {
                Dictionary<string, object?> item = TemplateContext.NewMap();
                item["startedUtc"] = Iso(earlier.StartedUtc);
                item["outcome"] = earlier.Outcome?.ToString();
                item["summary"] = earlier.Summary;
                items.Add(item);
            }
            tickMap["recent"] = items;
            tickMap["hasRecent"] = items.Count > 0;
            context.Set("tick", tickMap);
            context.Set("tenant.id", mandate.TenantId);
            context.Set("now", DateTime.UtcNow);

            return TemplateRenderer.Render(template.Content, context, new TemplateRenderOptions { TemplateName = template.Name }).Trim();
        }

        private static MandateTick NewTick(Mandate mandate, WakeSourceEnum source, DateTime scheduledUtc, DateTime nowUtc)
        {
            MandateTick tick = new MandateTick();
            tick.TenantId = mandate.TenantId;
            tick.MandateId = mandate.Id;
            tick.RevisionId = mandate.CurrentRevisionId;
            tick.RevisionNumber = mandate.CurrentRevisionNumber;
            tick.WakeSource = source;
            tick.ScheduledUtc = scheduledUtc;
            tick.StartedUtc = nowUtc;
            return tick;
        }

        private void Finished(Mandate mandate, MandateTick tick)
        {
            string outcome = tick.Outcome?.ToString() ?? "Unknown";
            GarrisonMetrics.Count(GarrisonMetricCatalog.KeeperTicks, "outcome", outcome.ToLowerInvariant(), "source", Label(tick.WakeSource));
            string text = _Header + "mandate " + mandate.Id + " (" + mandate.Name + ") tick " + tick.Id + " " + outcome
                + (tick.RunId != null ? " run " + tick.RunId : String.Empty)
                + (tick.ErrorCode != null ? " (" + tick.ErrorCode + ": " + tick.ErrorMessage + ")" : String.Empty)
                + " " + GarrisonTracing.LogFields("tenant", mandate.TenantId, "mandate", mandate.Name);
            if (tick.Outcome == TickOutcomeEnum.Failed) _Logging.Warn(text);
            else _Logging.Info(text);
            Raise(tick);
        }

        private void Raise(MandateTick tick)
        {
            try
            {
                TickChanged?.Invoke(this, tick);
            }
            catch (Exception e)
            {
                _Logging.Warn(_Header + "tick listener failed: " + e.Message);
            }
        }

        private static string Label(WakeSourceEnum source)
        {
            return source.ToString().ToLowerInvariant();
        }

        private static string Iso(DateTime value)
        {
            return value.ToString("o", CultureInfo.InvariantCulture);
        }

        #endregion
    }
}
