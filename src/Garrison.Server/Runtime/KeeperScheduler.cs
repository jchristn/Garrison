namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
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
    /// Run completion also finishes the tick at once through <see cref="OnRunFinishedAsync"/>. Thread-safe.
    /// </summary>
    public class KeeperScheduler
    {
        #region Public-Members

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

            List<Mandate> active = await _Database.Mandates.ListWithActiveTickAsync(_Options.MaxDueClaimsPerSweep, token).ConfigureAwait(false);
            foreach (Mandate mandate in active)
            {
                token.ThrowIfCancellationRequested();
                if (await ReconcileAsync(mandate, nowUtc, token).ConfigureAwait(false)) changed = true;
            }

            List<Mandate> due = await _Database.Mandates.ListDueAsync(nowUtc, _Options.MaxDueClaimsPerSweep, token).ConfigureAwait(false);
            foreach (Mandate mandate in due)
            {
                token.ThrowIfCancellationRequested();
                if (await WakeDueAsync(mandate, nowUtc, token).ConfigureAwait(false)) changed = true;
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

        private async Task<bool> WakeDueAsync(Mandate mandate, DateTime nowUtc, CancellationToken token)
        {
            if (!mandate.NextWakeUtc.HasValue) return false;
            DateTime expected = mandate.NextWakeUtc.Value;
            WakeSourceEnum source = mandate.PendingWakeSource ?? WakeSourceEnum.Timer;

            if (!String.IsNullOrEmpty(mandate.ActiveTickId))
            {
                // Single-flight: a non-timer wake waits for the running tick; a timer wake is recorded as Skipped and the
                // schedule moves on by one interval.
                if (source != WakeSourceEnum.Timer) return false;
                int interval = Math.Max(1, mandate.CurrentIntervalSeconds);
                if (!await _Database.Mandates.TryDeferAsync(mandate.Id, expected, nowUtc.AddSeconds(interval), token).ConfigureAwait(false)) return false;
                MandateTick skipped = NewTick(mandate, source, expected, nowUtc);
                skipped.Outcome = TickOutcomeEnum.Skipped;
                skipped.FinishedUtc = nowUtc;
                skipped.ErrorCode = "PreviousTickRunning";
                skipped.ErrorMessage = "The previous tick (" + mandate.ActiveTickId + (mandate.ActiveRunId != null ? ", run " + mandate.ActiveRunId : String.Empty) + ") was still running, so this wake was skipped.";
                await _Database.MandateTicks.CreateAsync(skipped, token).ConfigureAwait(false);
                Finished(mandate, skipped);
                return true;
            }

            MandateTick tick = NewTick(mandate, source, expected, nowUtc);
            if (!await _Database.Mandates.TryClaimAsync(mandate.Id, expected, tick.Id, token).ConfigureAwait(false)) return false;
            await _Database.MandateTicks.CreateAsync(tick, token).ConfigureAwait(false);
            GarrisonMetrics.Observe(GarrisonMetricCatalog.KeeperTickLag, Math.Max(0, (nowUtc - expected).TotalSeconds), "source", Label(source));
            mandate.ActiveTickId = tick.Id;
            await StartAsync(mandate, tick, nowUtc, token).ConfigureAwait(false);
            return true;
        }

        private async Task StartAsync(Mandate mandate, MandateTick tick, DateTime nowUtc, CancellationToken token)
        {
            string? code = null;
            string? message = null;
            try
            {
                Agent agent = await _Database.Agents.ReadAsync(mandate.TenantId, mandate.AgentId, token).ConfigureAwait(false)
                    ?? throw new ConflictException("AgentNotFound", "Agent " + mandate.AgentId + " of mandate " + mandate.Name + " no longer exists.");
                string? denied = await _RunAs.DeniedAsync(mandate.TenantId, mandate.RunAsType, mandate.RunAsId, mandate.RunAsName, agent.Id, "Mandate " + mandate.Name, token).ConfigureAwait(false);
                if (denied != null) throw new ConflictException("RunAsNotAuthorized", denied);
                if (String.IsNullOrEmpty(mandate.CurrentRevisionId)) throw new ConflictException("NoPublishedRevision", "Mandate " + mandate.Name + " has no published revision.");

                PromptTemplate template = await _Templates.ResolveAsync(mandate.TenantId, KeeperTemplateResolver.TickTemplateName, PromptTemplateKindEnum.Task, token).ConfigureAwait(false);
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

                RunCreateContext create = new RunCreateContext();
                create.TenantId = mandate.TenantId;
                create.Agent = agent;
                create.DeploymentId = mandate.DeploymentId;
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
