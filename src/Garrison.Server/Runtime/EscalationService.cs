namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Escalations;
    using Garrison.Core.Keepers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Core.Templates;
    using Garrison.Server.Services;
    using SyslogLogging;

    /// <summary>
    /// Escalations (AA2, AA-016, AA-038 to AA-043): a run raises a question to a person or an agent and gets an answer.
    /// Raising validates and routes it (people are notified; an Agent target gets a run of its default deployment);
    /// answering, cancelling, withdrawing, and the timeout sweep resolve it exactly once (compare-and-set on Open), then
    /// pass the result on: an escalated-up escalation answers its parent, a Blocking escalation resumes or cancels its run,
    /// and a keeper's answered escalation wakes the keeper. Thread-safe.
    /// </summary>
    public class EscalationService
    {
        #region Public-Members

        /// <summary>
        /// Chain of command that resolves the Manager target and escalate-up (AA7.5), or null to refuse Manager with
        /// ManagerUnavailable.
        /// </summary>
        public ChainOfCommand? Chain { get; set; } = null;

        /// <summary>
        /// Raised after every change (raise, answer, cancel, withdraw, escalate up, expire) for the escalations channel and
        /// notifications. Listener failures are logged and do not affect the change.
        /// </summary>
        public event EventHandler<EscalationChange>? Changed;

        /// <summary>
        /// Resumes a suspended run (durable continuation), given tenant and run; null when continuation is not wired.
        /// </summary>
        public Func<string, string, CancellationToken, Task<bool>>? ResumeRunAsync { get; set; } = null;

        /// <summary>
        /// Cancels a run, given tenant and run; null when not wired.
        /// </summary>
        public Func<string, string, CancellationToken, Task>? CancelRunAsync { get; set; } = null;

        /// <summary>
        /// The clock. Default UTC now; tests replace it to drive timeouts.
        /// </summary>
        public Func<DateTime> Now
        {
            get
            {
                return _Now;
            }
            set
            {
                _Now = value ?? (() => DateTime.UtcNow);
            }
        }


        /// <summary>
        /// Messages (AA6.7). When set, an escalation to an agent is delivered as an urgent message linked to it instead of
        /// starting a run directly. Null when messaging is not wired.
        /// </summary>
        public MessageService? Messages { get; set; } = null;

        #endregion

        #region Private-Members

        private static readonly string _Header = "[Escalations] ";
        private readonly DatabaseDriverBase _Database;
        private readonly AuditService _Audit;
        private readonly EscalationOptions _Options;
        private readonly RunService _Runs;
        private readonly RunAsAuthorization _RunAs;
        private readonly KeeperTemplateResolver _Templates;
        private readonly LoggingModule _Logging;
        private Func<DateTime> _Now = () => DateTime.UtcNow;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="audit">Audit writer.</param>
        /// <param name="options">Escalation options.</param>
        /// <param name="runs">Run service, for Agent targets.</param>
        /// <param name="runAs">Run-as authorization, for Agent targets.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public EscalationService(DatabaseDriverBase database, AuditService audit, EscalationOptions options, RunService runs, RunAsAuthorization runAs, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _RunAs = runAs ?? throw new ArgumentNullException(nameof(runAs));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            _Templates = new KeeperTemplateResolver(database);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Raise an escalation from a run. Fills the raising run, agent, keeper, and epoch from the run; resolves the default
        /// target when none is given (AA-043); checks that a Blocking escalation can suspend the run; stores it; and routes it.
        /// A Blocking escalation is recorded on the run as the wait it suspends on.
        /// </summary>
        /// <param name="run">The raising run.</param>
        /// <param name="request">Question, options, severity, mode, target, default answer, timeout, and timeout action.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored escalation (with warnings when the timeout was adjusted).</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or request is null.</exception>
        /// <exception cref="ValidationException">Thrown when the escalation or its target is invalid (TargetRequired, ReferenceNotFound).</exception>
        /// <exception cref="ConflictException">Thrown with ManagerUnavailable, BlockingUnsupported, or RunNotActive.</exception>
        public async Task<Escalation> RaiseAsync(Run run, Escalation request, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (RunService.IsTerminal(run.Status)) throw new ConflictException("RunNotActive", "Run " + run.Id + " has finished; it cannot raise an escalation.");

            // A replayed raise (the same question from the same run, for example after a retry or a resume) returns the
            // escalation it raised the first time instead of raising another.
            string question = (request.Question ?? String.Empty).Trim();
            EnumerationResult<Escalation> raised = await _Database.Escalations.EnumerateAsync(new EscalationFilter { TenantId = run.TenantId, RaisingRunId = run.Id, MaxResults = 1000 }, token).ConfigureAwait(false);
            Escalation? earlier = raised.Objects.FirstOrDefault(e => String.Equals(e.Question, question, StringComparison.Ordinal));
            if (earlier != null) return earlier;

            Escalation escalation = request;
            escalation.Id = String.Empty;
            escalation.TenantId = run.TenantId;
            escalation.RaisingRunId = run.Id;
            escalation.LeaseEpoch = run.LeaseEpoch;
            escalation.AgentId = run.AgentId;
            escalation.AgentName = run.AgentName;
            escalation.MandateId = run.MandateId;
            escalation.MandateTickId = run.MandateTickId;
            escalation.Status = EscalationStatusEnum.Open;
            escalation.ParentEscalationId = null;
            escalation.EscalatedToId = null;
            escalation.RoutedRunId = null;
            ClearResolution(escalation);
            escalation.DeliveredTickId = null;

            if (String.IsNullOrWhiteSpace(escalation.TargetId) && escalation.TargetKind != EscalationTargetKindEnum.Manager)
            {
                await DefaultTargetAsync(run, escalation, token).ConfigureAwait(false);
            }
            ApplyTimeout(escalation);
            EscalationValidator.ValidateRaise(escalation, _Options.MaxQuestionBytes);
            await ResolveTargetAsync(escalation, token).ConfigureAwait(false);
            if (escalation.Mode == EscalationModeEnum.Blocking) await CheckBlockingAsync(run, token).ConfigureAwait(false);

            escalation.ExpiresUtc = _Now().AddSeconds(escalation.TimeoutSeconds);
            await _Database.Escalations.CreateAsync(escalation, token).ConfigureAwait(false);
            if (escalation.Mode == EscalationModeEnum.Blocking) await _Database.Runs.SetEscalationAsync(run.TenantId, run.Id, escalation.Id, token).ConfigureAwait(false);
            await AuditAsync(RunContext(run), escalation, "Raised escalation " + escalation.Id + " (" + escalation.Severity + ", " + escalation.Mode + ") from run " + run.Id + " to " + Describe(escalation) + ".", token).ConfigureAwait(false);
            _Logging.Info(_Header + escalation.Id + " raised by run " + run.Id + " (" + run.AgentName + ") to " + Describe(escalation) + ", " + escalation.Severity + ", " + escalation.Mode + ", expires " + escalation.ExpiresUtc.Value.ToString("o", CultureInfo.InvariantCulture));
            Raise(escalation, "escalation.raised");
            await RouteAsync(escalation, run.CallerType, run.CallerId, run.CallerName, token).ConfigureAwait(false);
            return escalation;
        }

        /// <summary>
        /// Raise an escalation on behalf of a keeper that has no run, such as the notice that it reached its daily spend
        /// cap (AA3.3). It goes to the human default: the revision's default target when that is a user or role, otherwise
        /// the user the mandate runs as. It is marked delivered to the given tick, so its text never reaches the keeper's
        /// input; it is for people.
        /// </summary>
        /// <param name="mandate">Mandate.</param>
        /// <param name="revision">The revision in force, for its default target.</param>
        /// <param name="tickId">The tick that recorded the event.</param>
        /// <param name="request">Question, options, default answer, severity, timeout, and timeout action.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The escalation, or null when the keeper has no human to ask.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the request is invalid.</exception>
        public async Task<Escalation?> RaiseForMandateAsync(Mandate mandate, MandateRevision? revision, string tickId, Escalation request, CancellationToken token = default)
        {
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            if (String.IsNullOrEmpty(tickId)) throw new ArgumentNullException(nameof(tickId));
            if (request == null) throw new ArgumentNullException(nameof(request));
            Escalation escalation = request;
            escalation.Id = String.Empty;
            escalation.TenantId = mandate.TenantId;
            escalation.RaisingRunId = null;
            escalation.LeaseEpoch = 0;
            escalation.AgentId = mandate.AgentId;
            Agent? agent = await _Database.Agents.ReadAsync(mandate.TenantId, mandate.AgentId, token).ConfigureAwait(false);
            escalation.AgentName = agent?.Name;
            escalation.MandateId = mandate.Id;
            escalation.MandateTickId = tickId;
            escalation.Mode = EscalationModeEnum.NonBlocking;
            escalation.Status = EscalationStatusEnum.Open;
            escalation.ParentEscalationId = null;
            escalation.EscalatedToId = null;
            escalation.RoutedRunId = null;
            ClearResolution(escalation);

            if (revision?.EscalationTargetKind == EscalationTargetKindEnum.User || revision?.EscalationTargetKind == EscalationTargetKindEnum.Role)
            {
                escalation.TargetKind = revision.EscalationTargetKind.Value;
                escalation.TargetId = revision.EscalationTargetId;
            }
            else if (mandate.RunAsType == PrincipalTypeEnum.User && !String.IsNullOrEmpty(mandate.RunAsId))
            {
                escalation.TargetKind = EscalationTargetKindEnum.User;
                escalation.TargetId = mandate.RunAsId;
            }
            else
            {
                _Logging.Warn(_Header + "mandate " + mandate.Id + " (" + mandate.Name + ") has no user or role to ask: " + escalation.Question);
                return null;
            }

            ApplyTimeout(escalation);
            EscalationValidator.ValidateRaise(escalation, _Options.MaxQuestionBytes);
            try
            {
                await ResolveTargetAsync(escalation, token).ConfigureAwait(false);
            }
            catch (ValidationException e)
            {
                _Logging.Warn(_Header + "mandate " + mandate.Id + " (" + mandate.Name + ") default target is unusable: " + e.Message);
                return null;
            }
            escalation.ExpiresUtc = _Now().AddSeconds(escalation.TimeoutSeconds);
            escalation.DeliveredTickId = tickId;
            await _Database.Escalations.CreateAsync(escalation, token).ConfigureAwait(false);
            RequestContext system = new RequestContext { TenantId = mandate.TenantId, PrincipalType = PrincipalTypeEnum.Administrator, PrincipalName = "keeper:" + mandate.Name };
            await AuditAsync(system, escalation, "Raised escalation " + escalation.Id + " (" + escalation.Severity + ") for mandate " + mandate.Name + " to " + Describe(escalation) + ".", token).ConfigureAwait(false);
            _Logging.Info(_Header + escalation.Id + " raised for mandate " + mandate.Id + " (" + mandate.Name + ") to " + Describe(escalation) + ", " + escalation.Severity);
            Raise(escalation, "escalation.raised");
            return escalation;
        }

        /// <summary>
        /// Raise a notice without a raising run (AA7.6): an org unit reached its budget. It goes to the given agent (the
        /// capped unit's manager), or, with no agent above, to the given person. It is routed like any escalation, so an
        /// agent target receives it as an urgent message.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="subjectAgentId">The agent the notice is about (the capped unit's lead or the refused run's agent), or null.</param>
        /// <param name="targetAgentId">The manager agent to ask, or null for the person.</param>
        /// <param name="fallbackUserId">The person to ask when no agent is above, or null.</param>
        /// <param name="request">Question, context, options, severity, and timeout.</param>
        /// <param name="callerType">Principal a routed agent run executes as.</param>
        /// <param name="callerId">Identifier of that principal, or null.</param>
        /// <param name="callerName">Name of that principal, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The escalation, or null when there is nobody to ask.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or request is null.</exception>
        /// <exception cref="ValidationException">Thrown when the request is invalid.</exception>
        public async Task<Escalation?> RaiseNoticeAsync(string tenantId, string? subjectAgentId, string? targetAgentId, string? fallbackUserId, Escalation request, PrincipalTypeEnum callerType, string? callerId, string? callerName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (request == null) throw new ArgumentNullException(nameof(request));
            Escalation escalation = request;
            escalation.Id = String.Empty;
            escalation.TenantId = tenantId;
            escalation.RaisingRunId = null;
            escalation.LeaseEpoch = 0;
            escalation.AgentId = subjectAgentId;
            Agent? subject = String.IsNullOrEmpty(subjectAgentId) ? null : await _Database.Agents.ReadAsync(tenantId, subjectAgentId, token).ConfigureAwait(false);
            escalation.AgentName = subject?.Name;
            escalation.MandateId = null;
            escalation.MandateTickId = null;
            escalation.Mode = EscalationModeEnum.NonBlocking;
            escalation.Status = EscalationStatusEnum.Open;
            escalation.ParentEscalationId = null;
            escalation.EscalatedToId = null;
            escalation.RoutedRunId = null;
            ClearResolution(escalation);
            if (!String.IsNullOrEmpty(targetAgentId))
            {
                escalation.TargetKind = EscalationTargetKindEnum.Agent;
                escalation.TargetId = targetAgentId;
            }
            else if (!String.IsNullOrEmpty(fallbackUserId))
            {
                escalation.TargetKind = EscalationTargetKindEnum.User;
                escalation.TargetId = fallbackUserId;
            }
            else
            {
                _Logging.Warn(_Header + "notice about agent " + (subjectAgentId ?? "none") + " has nobody to ask: " + escalation.Question);
                return null;
            }
            ApplyTimeout(escalation);
            EscalationValidator.ValidateRaise(escalation, _Options.MaxQuestionBytes);
            try
            {
                await ResolveTargetAsync(escalation, token).ConfigureAwait(false);
            }
            catch (ValidationException e)
            {
                _Logging.Warn(_Header + "notice target " + escalation.TargetKind + " " + escalation.TargetId + " is unusable: " + e.Message);
                return null;
            }
            escalation.ExpiresUtc = _Now().AddSeconds(escalation.TimeoutSeconds);
            await _Database.Escalations.CreateAsync(escalation, token).ConfigureAwait(false);
            RequestContext system = new RequestContext { TenantId = tenantId, PrincipalType = PrincipalTypeEnum.Administrator, PrincipalName = "garrison" };
            await AuditAsync(system, escalation, "Raised notice " + escalation.Id + " (" + escalation.Severity + ") to " + Describe(escalation) + ".", token).ConfigureAwait(false);
            _Logging.Info(_Header + escalation.Id + " notice raised to " + Describe(escalation) + ", " + escalation.Severity);
            Raise(escalation, "escalation.raised");
            await RouteAsync(escalation, callerType, callerId, callerName, token).ConfigureAwait(false);
            return escalation;
        }

        /// <summary>
        /// Answer an Open escalation (AA-038, AA-039). An escalated-up escalation is answered through the one it was
        /// escalated to, so answering it directly is refused.
        /// </summary>
        /// <param name="ctx">The answering principal.</param>
        /// <param name="escalation">The escalation, read in the caller's tenant.</param>
        /// <param name="answer">Choice and text.</param>
        /// <param name="source">User for people and credentials, Agent for a target agent's run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The answered escalation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the answer does not fit the escalation.</exception>
        /// <exception cref="ConflictException">Thrown with EscalationNotOpen or EscalatedUp.</exception>
        public async Task<Escalation> AnswerAsync(RequestContext ctx, Escalation escalation, EscalationAnswerRequest answer, EscalationResolutionSourceEnum source, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (escalation == null) throw new ArgumentNullException(nameof(escalation));
            if (answer == null) throw new ArgumentNullException(nameof(answer));
            RequireOpen(escalation);
            if (!String.IsNullOrEmpty(escalation.EscalatedToId)) throw new ConflictException("EscalatedUp", "Escalation " + escalation.Id + " was escalated up to " + escalation.EscalatedToId + "; answer that one.");
            EscalationValidator.ValidateAnswer(escalation, answer);
            escalation.Status = EscalationStatusEnum.Answered;
            escalation.AnswerChoice = answer.Choice;
            escalation.AnswerText = answer.Text;
            await ResolveAsync(ctx, escalation, source, Who(ctx), "escalation.answered", "Answered escalation " + escalation.Id + (answer.Choice != null ? " with " + answer.Choice : String.Empty) + ".", token).ConfigureAwait(false);
            return escalation;
        }

        /// <summary>
        /// Cancel an Open escalation. A run blocked on it is cancelled too.
        /// </summary>
        /// <param name="ctx">The cancelling principal.</param>
        /// <param name="escalation">The escalation, read in the caller's tenant.</param>
        /// <param name="reason">Optional reason, kept as the answer text.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The cancelled escalation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or escalation is null.</exception>
        /// <exception cref="ConflictException">Thrown with EscalationNotOpen.</exception>
        public async Task<Escalation> CancelAsync(RequestContext ctx, Escalation escalation, string? reason, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (escalation == null) throw new ArgumentNullException(nameof(escalation));
            RequireOpen(escalation);
            escalation.Status = EscalationStatusEnum.Cancelled;
            escalation.AnswerChoice = null;
            escalation.AnswerText = String.IsNullOrWhiteSpace(reason) ? null : Truncate(reason.Trim(), EscalationValidator.MaxAnswerLength);
            await ResolveAsync(ctx, escalation, EscalationResolutionSourceEnum.User, Who(ctx), "escalation.cancelled", "Cancelled escalation " + escalation.Id + ".", token).ConfigureAwait(false);
            return escalation;
        }

        /// <summary>
        /// Withdraw an Open escalation from the run that raised it, or from a later tick of the same keeper (AA-038).
        /// </summary>
        /// <param name="run">The calling run.</param>
        /// <param name="escalation">The escalation, read in the run's tenant.</param>
        /// <param name="reason">Optional reason.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The withdrawn escalation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or escalation is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the run did not raise it.</exception>
        /// <exception cref="ConflictException">Thrown with EscalationNotOpen.</exception>
        public async Task<Escalation> WithdrawAsync(Run run, Escalation escalation, string? reason, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (escalation == null) throw new ArgumentNullException(nameof(escalation));
            bool own = escalation.RaisingRunId == run.Id || (!String.IsNullOrEmpty(run.MandateId) && escalation.MandateId == run.MandateId);
            if (!own) throw new NotFoundException("Escalation not found.");
            RequireOpen(escalation);
            escalation.Status = EscalationStatusEnum.Withdrawn;
            escalation.AnswerChoice = null;
            escalation.AnswerText = String.IsNullOrWhiteSpace(reason) ? null : Truncate(reason.Trim(), EscalationValidator.MaxAnswerLength);
            await ResolveAsync(RunContext(run), escalation, EscalationResolutionSourceEnum.Raiser, run.AgentName, "escalation.withdrawn", "Withdrew escalation " + escalation.Id + ".", token).ConfigureAwait(false);
            await CloseChildrenAsync(escalation, token).ConfigureAwait(false);
            return escalation;
        }

        /// <summary>
        /// Run the timeout action of every Open escalation whose timeout has passed, up to MaxExpiredPerSweep. Called by the
        /// leader's maintenance loop.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when any escalation changed.</returns>
        public async Task<bool> SweepAsync(CancellationToken token = default)
        {
            DateTime now = _Now();
            List<Escalation> expired = await _Database.Escalations.ListExpiredAsync(now, _Options.MaxExpiredPerSweep, token).ConfigureAwait(false);
            bool changed = false;
            foreach (Escalation row in expired)
            {
                token.ThrowIfCancellationRequested();
                try
                {
                    Escalation? escalation = await _Database.Escalations.ReadAsync(row.TenantId, row.Id, token).ConfigureAwait(false);
                    if (escalation == null || escalation.Status != EscalationStatusEnum.Open) continue;
                    changed = await TimeoutAsync(escalation, token).ConfigureAwait(false) || changed;
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + row.Id + " timeout action failed: " + e.Message);
                }
            }
            return changed;
        }

        /// <summary>
        /// Escalate an Open escalation to its next target (AA-040): the keeper's default target when the escalation is not
        /// already addressed to it. The parent stays Open with no timeout and takes the child's answer.
        /// </summary>
        /// <param name="escalation">The escalation.</param>
        /// <param name="by">Who escalated it, for the audit record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new escalation, or null when there is no next target or another request escalated it first.</returns>
        /// <exception cref="ArgumentNullException">Thrown when escalation is null.</exception>
        public async Task<Escalation?> EscalateUpAsync(Escalation escalation, string by, CancellationToken token = default)
        {
            if (escalation == null) throw new ArgumentNullException(nameof(escalation));
            if (escalation.Status != EscalationStatusEnum.Open || !String.IsNullOrEmpty(escalation.EscalatedToId)) return null;
            Escalation? next = await NextTargetAsync(escalation, token).ConfigureAwait(false);
            if (next == null) return null;
            if (!await _Database.Escalations.TrySetEscalatedToAsync(escalation.TenantId, escalation.Id, next.Id, token).ConfigureAwait(false)) return null;
            await _Database.Escalations.CreateAsync(next, token).ConfigureAwait(false);
            escalation.EscalatedToId = next.Id;
            escalation.ExpiresUtc = null;
            RequestContext system = new RequestContext { TenantId = escalation.TenantId, PrincipalType = PrincipalTypeEnum.Administrator, PrincipalName = "garrison" };
            await AuditAsync(system, escalation, "Escalated " + escalation.Id + " up to " + next.Id + " (" + Describe(next) + ") by " + by + ".", token).ConfigureAwait(false);
            _Logging.Info(_Header + escalation.Id + " escalated up to " + next.Id + " (" + Describe(next) + ") by " + by);
            Raise(escalation, "escalation.escalated");
            Raise(next, "escalation.raised");
            Run? raising = String.IsNullOrEmpty(escalation.RaisingRunId) ? null : await _Database.Runs.ReadAsync(escalation.TenantId, escalation.RaisingRunId, token).ConfigureAwait(false);
            await RouteAsync(next, raising?.CallerType ?? PrincipalTypeEnum.User, raising?.CallerId, raising?.CallerName, token).ConfigureAwait(false);
            return next;
        }

        /// <summary>
        /// Render the answers to a run's escalations through escalation-answered (AA2.8), for a keeper tick's input or a
        /// Blocking escalation's resume prompt. The answers are framed as data.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="escalations">Resolved escalations.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The rendered text, and the template used.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or escalations is null.</exception>
        public async Task<string> RenderAnswersAsync(string tenantId, List<Escalation> escalations, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (escalations == null) throw new ArgumentNullException(nameof(escalations));
            PromptTemplate template = await _Templates.ResolveAsync(tenantId, "escalation-answered", PromptTemplateKindEnum.Task, token).ConfigureAwait(false);
            TemplateContext context = new TemplateContext();
            List<object?> answers = new List<object?>();
            foreach (Escalation e in escalations)
            {
                EscalationOption? chosen = e.AnswerChoice == null ? null : e.Options.FirstOrDefault(o => String.Equals(o.Key, e.AnswerChoice, StringComparison.Ordinal));
                answers.Add(new Dictionary<string, object?>
                {
                    ["id"] = e.Id,
                    ["question"] = e.Question,
                    ["status"] = e.Status.ToString().ToLowerInvariant(),
                    ["resolvedBy"] = e.ResolvedBy,
                    ["choice"] = e.AnswerChoice,
                    ["choiceLabel"] = chosen?.Label,
                    ["text"] = e.AnswerText,
                    ["unanswered"] = e.Status != EscalationStatusEnum.Answered
                });
            }
            context.Set("answers", answers);
            context.Set("tenant.id", tenantId);
            return TemplateRenderer.Render(template.Content, context, new TemplateRenderOptions { TemplateName = template.Name, AllowSecrets = false });
        }

        #endregion

        #region Private-Methods

        private async Task<bool> TimeoutAsync(Escalation escalation, CancellationToken token)
        {
            RequestContext system = new RequestContext { TenantId = escalation.TenantId, PrincipalType = PrincipalTypeEnum.Administrator, PrincipalName = "timeout" };
            switch (escalation.TimeoutAction)
            {
                case EscalationTimeoutActionEnum.UseDefaultAnswer when escalation.DefaultAnswer != null:
                    escalation.Status = EscalationStatusEnum.Answered;
                    escalation.AnswerChoice = escalation.Options.Count > 0 ? escalation.DefaultAnswer : null;
                    escalation.AnswerText = escalation.Options.Count > 0 ? null : escalation.DefaultAnswer;
                    return await ResolveAsync(system, escalation, EscalationResolutionSourceEnum.Timeout, "timeout", "escalation.answered", "Timed out; answered escalation " + escalation.Id + " with its default answer.", token).ConfigureAwait(false);
                case EscalationTimeoutActionEnum.Cancel:
                    escalation.Status = EscalationStatusEnum.Cancelled;
                    return await ResolveAsync(system, escalation, EscalationResolutionSourceEnum.Timeout, "timeout", "escalation.cancelled", "Timed out; cancelled escalation " + escalation.Id + ".", token).ConfigureAwait(false);
                case EscalationTimeoutActionEnum.EscalateUp:
                    if (await EscalateUpAsync(escalation, "timeout", token).ConfigureAwait(false) != null) return true;
                    break;
            }
            escalation.Status = EscalationStatusEnum.Expired;
            return await ResolveAsync(system, escalation, EscalationResolutionSourceEnum.Timeout, "timeout", "escalation.expired", "Timed out; escalation " + escalation.Id + " expired with no answer.", token).ConfigureAwait(false);
        }

        private async Task<bool> ResolveAsync(RequestContext ctx, Escalation escalation, EscalationResolutionSourceEnum source, string? by, string change, string description, CancellationToken token)
        {
            escalation.ResolutionSource = source;
            escalation.ResolvedBy = by;
            escalation.ResolvedUtc = _Now();
            if (!await _Database.Escalations.TryResolveAsync(escalation, token).ConfigureAwait(false))
            {
                throw new ConflictException("EscalationNotOpen", "Escalation " + escalation.Id + " was resolved by another request.");
            }
            await AuditAsync(ctx, escalation, description, token).ConfigureAwait(false);
            _Logging.Info(_Header + escalation.Id + " " + escalation.Status.ToString().ToLowerInvariant() + " (" + source + (by != null ? ", " + by : String.Empty) + ")");
            Raise(escalation, change);
            await AfterResolvedAsync(escalation, token).ConfigureAwait(false);
            return true;
        }

        private async Task AfterResolvedAsync(Escalation escalation, CancellationToken token)
        {
            // An escalated-up escalation takes the answer of the one it was escalated to (AA-040).
            if (!String.IsNullOrEmpty(escalation.ParentEscalationId))
            {
                Escalation? parent = await _Database.Escalations.ReadAsync(escalation.TenantId, escalation.ParentEscalationId, token).ConfigureAwait(false);
                if (parent != null && parent.Status == EscalationStatusEnum.Open)
                {
                    parent.Status = escalation.Status == EscalationStatusEnum.Withdrawn ? EscalationStatusEnum.Cancelled : escalation.Status;
                    parent.AnswerChoice = escalation.AnswerChoice;
                    parent.AnswerText = escalation.AnswerText;
                    RequestContext system = new RequestContext { TenantId = parent.TenantId, PrincipalType = PrincipalTypeEnum.Administrator, PrincipalName = "garrison" };
                    try
                    {
                        await ResolveAsync(system, parent, EscalationResolutionSourceEnum.System, escalation.ResolvedBy, Change(parent.Status), "Escalation " + parent.Id + " resolved through " + escalation.Id + ".", token).ConfigureAwait(false);
                    }
                    catch (ConflictException)
                    {
                        // Resolved meanwhile (withdrawn by its run); nothing to pass on.
                    }
                }
            }

            if (String.IsNullOrEmpty(escalation.RaisingRunId)) return;

            if (escalation.Mode == EscalationModeEnum.Blocking)
            {
                if (escalation.Status == EscalationStatusEnum.Cancelled)
                {
                    if (CancelRunAsync != null) await CancelRunAsync(escalation.TenantId, escalation.RaisingRunId, token).ConfigureAwait(false);
                }
                else if (ResumeRunAsync != null)
                {
                    await ResumeRunAsync(escalation.TenantId, escalation.RaisingRunId, token).ConfigureAwait(false);
                }
                return;
            }

            // A keeper's answered escalation wakes it once; the tick that starts carries every undelivered answer (AA-042).
            if (escalation.Status == EscalationStatusEnum.Answered && !String.IsNullOrEmpty(escalation.MandateId))
            {
                bool woken = await _Database.Mandates.RequestWakeAsync(escalation.TenantId, escalation.MandateId, WakeSourceEnum.EscalationAnswer, _Now(), token).ConfigureAwait(false);
                if (woken) _Logging.Info(_Header + escalation.Id + " answer wakes mandate " + escalation.MandateId);
            }
        }

        private async Task CloseChildrenAsync(Escalation escalation, CancellationToken token)
        {
            string? childId = escalation.EscalatedToId;
            int guard = 0;
            while (!String.IsNullOrEmpty(childId) && guard++ < 32)
            {
                Escalation? child = await _Database.Escalations.ReadAsync(escalation.TenantId, childId, token).ConfigureAwait(false);
                if (child == null || child.Status != EscalationStatusEnum.Open) return;
                child.Status = EscalationStatusEnum.Cancelled;
                child.ResolutionSource = EscalationResolutionSourceEnum.System;
                child.ResolvedBy = "garrison";
                child.ResolvedUtc = _Now();
                child.AnswerText = "The escalation it was raised for was withdrawn.";
                if (!await _Database.Escalations.TryResolveAsync(child, token).ConfigureAwait(false)) return;
                Raise(child, "escalation.cancelled");
                childId = child.EscalatedToId;
            }
        }

        private async Task RouteAsync(Escalation escalation, PrincipalTypeEnum callerType, string? callerId, string? callerName, CancellationToken token)
        {
            using (System.Diagnostics.Activity? span = GarrisonTracing.Start("escalation route", System.Diagnostics.ActivityKind.Internal))
            {
                span?.SetTag("garrison.tenant", escalation.TenantId);
                span?.SetTag("garrison.escalation.id", escalation.Id);
                span?.SetTag("garrison.escalation.target_kind", escalation.TargetKind.ToString());
                await RouteCoreAsync(escalation, callerType, callerId, callerName, span, token).ConfigureAwait(false);
            }
        }

        private async Task RouteCoreAsync(Escalation escalation, PrincipalTypeEnum callerType, string? callerId, string? callerName, System.Diagnostics.Activity? span, CancellationToken token)
        {
            if (escalation.TargetKind != EscalationTargetKindEnum.Agent || String.IsNullOrEmpty(escalation.TargetId)) return;
            MessageService? messages = Messages;
            if (messages != null)
            {
                // AA6.7: an agent-targeted escalation arrives as an urgent message linked to it; the escalation record stays
                // the source of truth and is answered with garrison_answer_escalation.
                try
                {
                    AgentMessage sent = await messages.SendForEscalationAsync(escalation, callerType, callerId, callerName, token).ConfigureAwait(false);
                    span?.SetTag("garrison.message.id", sent.Id);
                    if (!String.IsNullOrEmpty(sent.DeliveredRunId))
                    {
                        escalation.RoutedRunId = sent.DeliveredRunId;
                        await _Database.Escalations.SetRoutedRunAsync(escalation.TenantId, escalation.Id, sent.DeliveredRunId, token).ConfigureAwait(false);
                    }
                    _Logging.Info(_Header + escalation.Id + " sent to agent " + escalation.TargetId + " as urgent message " + sent.Id);
                }
                catch (Exception e) when (e is ConflictException || e is ValidationException || e is NotFoundException)
                {
                    // The escalation stays open for people to answer; its timeout still applies.
                    span?.SetStatus(System.Diagnostics.ActivityStatusCode.Error, e.Message);
                    _Logging.Warn(_Header + escalation.Id + " could not be sent to agent " + escalation.TargetId + " as a message: " + e.Message);
                }
                return;
            }
            try
            {
                Agent agent = await _Database.Agents.ReadAsync(escalation.TenantId, escalation.TargetId, token).ConfigureAwait(false)
                    ?? throw new ConflictException("AgentNotFound", "Agent " + escalation.TargetId + " no longer exists.");
                string? denied = await _RunAs.DeniedAsync(escalation.TenantId, callerType, callerId, callerName, agent.Id, "Escalation " + escalation.Id, token).ConfigureAwait(false);
                if (denied != null) throw new ConflictException("RunAsNotAuthorized", denied);
                PromptTemplate template = await _Templates.ResolveAsync(escalation.TenantId, "escalation-received", PromptTemplateKindEnum.Task, token).ConfigureAwait(false);
                TemplateContext context = new TemplateContext();
                List<object?> options = escalation.Options.Select(o => (object?)new Dictionary<string, object?> { ["key"] = o.Key, ["label"] = o.Label }).ToList();
                context.Set("escalation", new Dictionary<string, object?>
                {
                    ["id"] = escalation.Id,
                    ["question"] = escalation.Question,
                    ["context"] = escalation.Context,
                    ["severity"] = escalation.Severity.ToString(),
                    ["raisingAgent"] = escalation.AgentName ?? "Another agent",
                    ["options"] = options,
                    ["hasOptions"] = options.Count > 0,
                    ["defaultAnswer"] = escalation.DefaultAnswer,
                    ["expiresUtc"] = escalation.ExpiresUtc?.ToString("o", CultureInfo.InvariantCulture)
                });
                context.Set("tenant.id", escalation.TenantId);
                string input = TemplateRenderer.Render(template.Content, context, new TemplateRenderOptions { TemplateName = template.Name, AllowSecrets = false });
                RunCreateContext create = new RunCreateContext();
                create.TenantId = escalation.TenantId;
                create.Agent = agent;
                create.Input = input;
                create.InputContentType = "text/plain";
                create.CallerType = callerType;
                create.CallerId = callerId;
                create.CallerName = "escalation:" + escalation.Id;
                create.IdempotencyKey = "escalation:" + escalation.Id;
                create.Surface = "escalation";
                Run routed = await _Runs.CreateAsync(create, token).ConfigureAwait(false);
                escalation.RoutedRunId = routed.Id;
                await _Database.Escalations.SetRoutedRunAsync(escalation.TenantId, escalation.Id, routed.Id, token).ConfigureAwait(false);
                _Logging.Info(_Header + escalation.Id + " routed to agent " + agent.Name + " as run " + routed.Id);
            }
            catch (Exception e) when (e is ConflictException || e is ValidationException || e is NotFoundException || e is TemplateException)
            {
                // The escalation stays open for people to answer; its timeout still applies.
                span?.SetStatus(System.Diagnostics.ActivityStatusCode.Error, e.Message);
                _Logging.Warn(_Header + escalation.Id + " could not start a run of agent " + escalation.TargetId + ": " + e.Message);
            }
        }

        private async Task DefaultTargetAsync(Run run, Escalation escalation, CancellationToken token)
        {
            if (!String.IsNullOrEmpty(run.MandateId))
            {
                Mandate? mandate = await _Database.Mandates.ReadAsync(run.TenantId, run.MandateId, token).ConfigureAwait(false);
                if (mandate != null && !String.IsNullOrEmpty(mandate.CurrentRevisionId))
                {
                    MandateRevision? revision = await _Database.MandateRevisions.ReadAsync(run.TenantId, mandate.CurrentRevisionId, token).ConfigureAwait(false);
                    if (revision?.EscalationTargetKind != null)
                    {
                        escalation.TargetKind = revision.EscalationTargetKind.Value;
                        escalation.TargetId = revision.EscalationTargetId;
                        return;
                    }
                }
            }
            if (run.CallerType == PrincipalTypeEnum.User && !String.IsNullOrEmpty(run.CallerId))
            {
                escalation.TargetKind = EscalationTargetKindEnum.User;
                escalation.TargetId = run.CallerId;
                return;
            }
            throw new ValidationException("The escalation needs a target: this run has no default (no keeper default target and no calling user).",
                new Dictionary<string, string> { { "targetId", "A target is required." } }, new Dictionary<string, string> { { "targetId", "TargetRequired" } });
        }

        private async Task ResolveTargetAsync(Escalation escalation, CancellationToken token)
        {
            string id = (escalation.TargetId ?? String.Empty).Trim();
            switch (escalation.TargetKind)
            {
                case EscalationTargetKindEnum.Manager:
                    await ResolveManagerAsync(escalation, escalation.AgentId, escalation.MandateId, escalation.RaisingRunId, token).ConfigureAwait(false);
                    return;
                case EscalationTargetKindEnum.User:
                    User? user = await _Database.Users.ReadAsync(escalation.TenantId, id, token).ConfigureAwait(false)
                        ?? await _Database.Users.ReadByEmailAsync(escalation.TenantId, id, token).ConfigureAwait(false);
                    if (user == null) throw Missing("The target user does not exist in this tenant.");
                    escalation.TargetId = user.Id;
                    escalation.TargetName = user.Email;
                    return;
                case EscalationTargetKindEnum.Role:
                    Role? role = await _Database.Roles.ReadAsync(escalation.TenantId, id, token).ConfigureAwait(false)
                        ?? await _Database.Roles.ReadByNameAsync(escalation.TenantId, id, token).ConfigureAwait(false)
                        ?? await _Database.Roles.ReadByNameAsync(null, id, token).ConfigureAwait(false);
                    if (role == null) throw Missing("The target role does not exist.");
                    escalation.TargetId = role.Id;
                    escalation.TargetName = role.Name;
                    return;
                default:
                    Agent? agent = await _Database.Agents.ReadAsync(escalation.TenantId, id, token).ConfigureAwait(false)
                        ?? await _Database.Agents.ReadByNameAsync(escalation.TenantId, id, token).ConfigureAwait(false);
                    if (agent == null) throw Missing("The target agent does not exist in this tenant.");
                    escalation.TargetId = agent.Id;
                    escalation.TargetName = agent.Name;
                    return;
            }
        }

        private async Task CheckBlockingAsync(Run run, CancellationToken token)
        {
            Deployment? deployment = String.IsNullOrEmpty(run.DeploymentId) ? null : await _Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            HarnessProfile? profile = deployment == null ? null : await _Database.HarnessProfiles.ReadAsync(run.TenantId, deployment.HarnessProfileId, token).ConfigureAwait(false);
            if (deployment == null || !deployment.SuspensionEnabled || run.Executor != RunExecutorEnum.Process || profile == null || !profile.SupportsResume || String.IsNullOrEmpty(profile.SessionFormat))
            {
                throw new ConflictException("BlockingUnsupported", "This run cannot suspend while it waits (it needs a Process executor, a deployment with suspension enabled, and a harness that can resume). Raise the escalation as NonBlocking and fetch the answer with garrison_get_escalation.");
            }
        }

        private async Task ResolveManagerAsync(Escalation escalation, string? subjectAgentId, string? mandateId, string? raisingRunId, CancellationToken token)
        {
            // The manager is the agent directly above the subject in a live organization; above the root it is the board,
            // which is asked through a person: the keeper's run-as user, or the user who started the raising run.
            if (Chain == null) throw new ConflictException("ManagerUnavailable", "Escalating to a manager needs organizations, which are not wired on this server; address a user, role, or agent instead.");
            if (String.IsNullOrEmpty(subjectAgentId)) throw new ConflictException("ManagerUnavailable", "Only an agent has a manager; address a user, role, or agent instead.");
            List<string> managers = await Chain.ManagersAsync(escalation.TenantId, subjectAgentId, token).ConfigureAwait(false);
            if (managers.Count > 0)
            {
                Agent? manager = await _Database.Agents.ReadAsync(escalation.TenantId, managers[0], token).ConfigureAwait(false);
                if (manager == null) throw new ConflictException("ManagerUnavailable", "The manager of agent " + subjectAgentId + " no longer exists.");
                escalation.TargetKind = EscalationTargetKindEnum.Agent;
                escalation.TargetId = manager.Id;
                escalation.TargetName = manager.Name;
                return;
            }
            if (!await Chain.BoardManagesAsync(escalation.TenantId, subjectAgentId, token).ConfigureAwait(false))
            {
                throw new ConflictException("ManagerUnavailable", "Agent " + subjectAgentId + " holds no position in a live organization, so it has no manager; address a user, role, or agent instead.");
            }
            string? person = null;
            if (!String.IsNullOrEmpty(mandateId))
            {
                Mandate? mandate = await _Database.Mandates.ReadAsync(escalation.TenantId, mandateId, token).ConfigureAwait(false);
                if (mandate != null && mandate.RunAsType == PrincipalTypeEnum.User) person = mandate.RunAsId;
            }
            if (String.IsNullOrEmpty(person) && !String.IsNullOrEmpty(raisingRunId))
            {
                Run? raising = await _Database.Runs.ReadAsync(escalation.TenantId, raisingRunId, token).ConfigureAwait(false);
                if (raising != null && raising.CallerType == PrincipalTypeEnum.User) person = raising.CallerId;
            }
            if (String.IsNullOrEmpty(person))
            {
                throw new ConflictException("ManagerUnavailable", "The board is above agent " + subjectAgentId + ", but no person behind this run can be asked; address a user or role instead.");
            }
            User? user = await _Database.Users.ReadAsync(escalation.TenantId, person, token).ConfigureAwait(false);
            if (user == null) throw new ConflictException("ManagerUnavailable", "The person behind this run no longer exists; address a user or role instead.");
            escalation.TargetKind = EscalationTargetKindEnum.User;
            escalation.TargetId = user.Id;
            escalation.TargetName = user.Email;
        }

        private async Task<Escalation?> NextTargetAsync(Escalation escalation, CancellationToken token)
        {
            // In an organization, an escalation to an agent goes up to that agent's manager, and finally to the board.
            if (Chain != null && escalation.TargetKind == EscalationTargetKindEnum.Agent && !String.IsNullOrEmpty(escalation.TargetId)
                && (await Chain.PositionsAsync(escalation.TenantId, escalation.TargetId, token).ConfigureAwait(false)).Count > 0)
            {
                Escalation up = ChildOf(escalation);
                up.TargetKind = EscalationTargetKindEnum.Manager;
                up.TargetId = null;
                try
                {
                    string? rootMandate = escalation.MandateId;
                    string? rootRun = escalation.RaisingRunId;
                    if (!String.IsNullOrEmpty(escalation.ParentEscalationId) && (String.IsNullOrEmpty(rootMandate) || String.IsNullOrEmpty(rootRun)))
                    {
                        Escalation? parent = await _Database.Escalations.ReadAsync(escalation.TenantId, escalation.ParentEscalationId, token).ConfigureAwait(false);
                        rootMandate ??= parent?.MandateId;
                        rootRun ??= parent?.RaisingRunId;
                    }
                    await ResolveManagerAsync(up, escalation.TargetId, rootMandate, rootRun, token).ConfigureAwait(false);
                    if (up.TargetKind != escalation.TargetKind || !String.Equals(up.TargetId, escalation.TargetId, StringComparison.Ordinal))
                    {
                        up.ExpiresUtc = _Now().AddSeconds(up.TimeoutSeconds);
                        return up;
                    }
                }
                catch (ConflictException e)
                {
                    _Logging.Warn(_Header + escalation.Id + " has no manager above agent " + escalation.TargetId + ": " + e.Message);
                }
            }
            if (String.IsNullOrEmpty(escalation.MandateId) && String.IsNullOrEmpty(escalation.ParentEscalationId)) return null;
            string? mandateId = escalation.MandateId;
            if (String.IsNullOrEmpty(mandateId) && !String.IsNullOrEmpty(escalation.ParentEscalationId))
            {
                Escalation? root = await _Database.Escalations.ReadAsync(escalation.TenantId, escalation.ParentEscalationId, token).ConfigureAwait(false);
                mandateId = root?.MandateId;
            }
            if (String.IsNullOrEmpty(mandateId)) return null;
            Mandate? mandate = await _Database.Mandates.ReadAsync(escalation.TenantId, mandateId, token).ConfigureAwait(false);
            if (mandate == null || String.IsNullOrEmpty(mandate.CurrentRevisionId)) return null;
            MandateRevision? revision = await _Database.MandateRevisions.ReadAsync(escalation.TenantId, mandate.CurrentRevisionId, token).ConfigureAwait(false);
            if (revision?.EscalationTargetKind == null || revision.EscalationTargetKind == EscalationTargetKindEnum.Manager) return null;
            if (revision.EscalationTargetKind == escalation.TargetKind && String.Equals(revision.EscalationTargetId, escalation.TargetId, StringComparison.Ordinal)) return null;

            Escalation next = ChildOf(escalation);
            next.TargetKind = revision.EscalationTargetKind.Value;
            next.TargetId = revision.EscalationTargetId;
            try
            {
                await ResolveTargetAsync(next, token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is ValidationException || e is ConflictException)
            {
                _Logging.Warn(_Header + escalation.Id + " next target " + next.TargetKind + " " + next.TargetId + " is unusable: " + e.Message);
                return null;
            }
            next.ExpiresUtc = _Now().AddSeconds(next.TimeoutSeconds);
            return next;
        }

        private static Escalation ChildOf(Escalation escalation)
        {
            Escalation next = new Escalation();
            next.TenantId = escalation.TenantId;
            next.AgentId = escalation.AgentId;
            next.AgentName = escalation.AgentName;
            next.ParentEscalationId = escalation.Id;
            next.Severity = escalation.Severity;
            next.Mode = EscalationModeEnum.NonBlocking;
            next.Question = escalation.Question;
            next.Context = escalation.Context;
            next.Options = escalation.Options.Select(o => new EscalationOption { Key = o.Key, Label = o.Label, Order = o.Order }).ToList();
            next.DefaultAnswer = escalation.DefaultAnswer;
            next.TimeoutSeconds = escalation.TimeoutSeconds;
            next.TimeoutAction = escalation.TimeoutAction;
            return next;
        }

        private void ApplyTimeout(Escalation escalation)
        {
            if (escalation.TimeoutSeconds == 0) escalation.TimeoutSeconds = _Options.DefaultTimeoutSeconds;
        }

        private static void RequireOpen(Escalation escalation)
        {
            if (escalation.Status != EscalationStatusEnum.Open)
            {
                throw new ConflictException("EscalationNotOpen", "Escalation " + escalation.Id + " is " + escalation.Status + "; only an Open escalation can change.");
            }
        }

        private static void ClearResolution(Escalation escalation)
        {
            escalation.AnswerChoice = null;
            escalation.AnswerText = null;
            escalation.ResolvedBy = null;
            escalation.ResolutionSource = null;
            escalation.ResolvedUtc = null;
        }

        private static ValidationException Missing(string message)
        {
            return new ValidationException(message, new Dictionary<string, string> { { "targetId", message } }, new Dictionary<string, string> { { "targetId", "ReferenceNotFound" } });
        }

        private static string Change(EscalationStatusEnum status)
        {
            switch (status)
            {
                case EscalationStatusEnum.Answered: return "escalation.answered";
                case EscalationStatusEnum.Expired: return "escalation.expired";
                case EscalationStatusEnum.Withdrawn: return "escalation.withdrawn";
                default: return "escalation.cancelled";
            }
        }

        private static string Describe(Escalation escalation)
        {
            return escalation.TargetKind + (String.IsNullOrEmpty(escalation.TargetName) ? (escalation.TargetId != null ? " " + escalation.TargetId : String.Empty) : " " + escalation.TargetName);
        }

        private static string? Who(RequestContext ctx)
        {
            return ctx.PrincipalName ?? ctx.PrincipalId;
        }

        private static string Truncate(string value, int max)
        {
            return value.Length <= max ? value : value.Substring(0, max);
        }

        private static RequestContext RunContext(Run run)
        {
            return new RequestContext { TenantId = run.TenantId, PrincipalType = PrincipalTypeEnum.Run, RunId = run.Id, PrincipalName = run.AgentName };
        }

        private async Task AuditAsync(RequestContext ctx, Escalation escalation, string description, CancellationToken token)
        {
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Escalation", escalation.Id, description, escalation.TenantId, token).ConfigureAwait(false);
        }

        private void Raise(Escalation escalation, string type)
        {
            string outcome = type.Substring(type.IndexOf('.') + 1);
            string kind = escalation.TargetKind.ToString().ToLowerInvariant();
            GarrisonMetrics.Count(GarrisonMetricCatalog.Escalations, 1, GarrisonMetrics.Tags("target_kind", kind, "severity", escalation.Severity.ToString().ToLowerInvariant(), "outcome", outcome));
            if (escalation.Status == EscalationStatusEnum.Answered && escalation.ResolvedUtc.HasValue)
            {
                GarrisonMetrics.Observe(GarrisonMetricCatalog.EscalationAnswerDuration, Math.Max(0, (escalation.ResolvedUtc.Value - escalation.CreatedUtc).TotalSeconds), GarrisonMetrics.Tags("target_kind", kind));
            }
            try
            {
                Changed?.Invoke(this, new EscalationChange { Escalation = escalation, Type = type });
            }
            catch (Exception e)
            {
                _Logging.Warn(_Header + "change listener failed: " + e.Message);
            }
        }

        #endregion
    }
}
