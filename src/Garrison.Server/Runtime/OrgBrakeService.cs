namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Org-scale brakes (AA11.4, AA11.6): the cascade cancel of a unit's subtree, which stops every queued and running run of
    /// its agents, the keeper ticks those runs carry, the open escalations its agents raised, and the queued messages
    /// addressed to them, in one audited action; and the cancellation of one keeper tick's run that an organization rollback
    /// with activeTicks Cancel uses. A cascade does not freeze; a freeze is a separate action. Thread-safe.
    /// </summary>
    public class OrgBrakeService
    {
        #region Public-Members

        /// <summary>
        /// Most runs one cascade cancels. Minimum 1, maximum 100000, default 10000.
        /// </summary>
        public int MaxCancelledRuns
        {
            get
            {
                return _MaxCancelledRuns;
            }
            set
            {
                _MaxCancelledRuns = Math.Clamp(value, 1, 100000);
            }
        }

        /// <summary>
        /// Most escalations and most messages one cascade resolves per agent. Minimum 1, maximum 100000, default 5000.
        /// </summary>
        public int MaxResolvedPerAgent
        {
            get
            {
                return _MaxResolvedPerAgent;
            }
            set
            {
                _MaxResolvedPerAgent = Math.Clamp(value, 1, 100000);
            }
        }

        /// <summary>
        /// Maximum length of a cascade reason. Fixed at 1024 characters.
        /// </summary>
        public static int MaxReasonLength
        {
            get
            {
                return 1024;
            }
        }

        /// <summary>
        /// Keeper scheduler, which finishes a tick as soon as its cancelled run has ended. Null leaves ticks to the
        /// scheduler's sweep.
        /// </summary>
        public KeeperScheduler? Keepers { get; set; } = null;

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly AuditService _Audit;
        private readonly ChainOfCommand _Chain;
        private readonly RunService _Runs;
        private readonly EscalationService _Escalations;
        private readonly LoggingModule _Logging;
        private readonly string _Header = "[OrgBrakes] ";
        private int _MaxCancelledRuns = 10000;
        private int _MaxResolvedPerAgent = 5000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="audit">Audit service.</param>
        /// <param name="chain">Chain of command over live revisions.</param>
        /// <param name="runs">Run service, whose cancellation path every cancelled run takes.</param>
        /// <param name="escalations">Escalation service.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public OrgBrakeService(DatabaseDriverBase database, AuditService audit, ChainOfCommand chain, RunService runs, EscalationService escalations, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Chain = chain ?? throw new ArgumentNullException(nameof(chain));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Escalations = escalations ?? throw new ArgumentNullException(nameof(escalations));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Cancel everything in a unit's subtree of the live tree: every queued, running, or suspended run of its agents
        /// (through the run cancellation path, so running runs go to Cancelling), the keeper ticks those runs carry, the open
        /// escalations its agents raised (withdrawn with the reason), and the queued messages addressed to them (Expired).
        /// One audit record, UnitCascadeCancelled, carries the counts and the caller.
        /// </summary>
        /// <param name="ctx">The person or credential (Organization Update).</param>
        /// <param name="organization">Organization, read in the caller's tenant.</param>
        /// <param name="unitIdOrName">Unit identifier or name in the live tree.</param>
        /// <param name="reason">Why, at most 1024 characters, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>What was stopped.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or organization is null.</exception>
        /// <exception cref="ValidationException">Thrown when the reason is too long.</exception>
        /// <exception cref="ConflictException">Thrown with OrganizationNotLive when the organization has no live revision.</exception>
        /// <exception cref="NotFoundException">Thrown when the unit is not in the organization's live tree.</exception>
        public async Task<CascadeCancelResult> CancelAllAsync(RequestContext ctx, Organization organization, string? unitIdOrName, string? reason, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            string? why = String.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
            if (why != null && why.Length > MaxReasonLength)
                throw new ValidationException("The request is invalid.", new Dictionary<string, string> { { "reason", "At most " + MaxReasonLength + " characters." } }, new Dictionary<string, string> { { "reason", "TooLong" } });
            OrgTree? tree = await _Chain.LiveTreeAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
            if (tree == null) throw new ConflictException("OrganizationNotLive", "Organization " + organization.Name + " has no live revision; publish one before cancelling a unit's work.");
            string value = (unitIdOrName ?? String.Empty).Trim();
            OrgUnit unit = (value.Length == 0 ? null : tree.Unit(value) ?? tree.UnitByName(value))
                ?? throw new NotFoundException("Unit " + value + " not found in the live tree of organization " + organization.Name + ".");

            using (Activity? span = GarrisonTracing.Start("org cascade cancel", ActivityKind.Internal))
            {
                span?.SetTag("garrison.tenant", organization.TenantId);
                span?.SetTag("garrison.org.id", organization.Id);
                span?.SetTag("garrison.org.unit.id", unit.Id);
                CascadeCancelResult result = new CascadeCancelResult();
                result.OrganizationId = organization.Id;
                result.UnitId = unit.Id;
                result.UnitName = unit.Name;
                List<string> agents = tree.SubtreeAgentIds(unit.Id).OrderBy(a => a, StringComparer.Ordinal).ToList();

                // Runs first, so a run blocked on an escalation is cancelled rather than resumed by the withdrawal.
                foreach (string agentId in agents)
                {
                    token.ThrowIfCancellationRequested();
                    if (result.RunsCancelled >= _MaxCancelledRuns) break;
                    List<Run> active = await _Database.Runs.ListActiveInScopeAsync(organization.TenantId, FreezeTargetKindEnum.Agent, agentId, _MaxCancelledRuns - result.RunsCancelled, token).ConfigureAwait(false);
                    foreach (Run run in active)
                    {
                        token.ThrowIfCancellationRequested();
                        OrgCancelOutcome outcome = await CancelOneAsync(run, token).ConfigureAwait(false);
                        if (!outcome.Requested) continue;
                        result.RunsCancelled++;
                        result.RunIds.Add(run.Id);
                        if (outcome.Tick) result.TicksCancelled++;
                    }
                }

                foreach (string agentId in agents)
                {
                    token.ThrowIfCancellationRequested();
                    result.EscalationsWithdrawn += await WithdrawEscalationsAsync(ctx, organization.TenantId, agentId, why ?? "Cancelled with everything in unit " + unit.Name + ".", token).ConfigureAwait(false);
                    List<AgentMessage> expired = await _Database.AgentMessages.ExpireQueuedForRecipientAsync(organization.TenantId, agentId, DateTime.UtcNow, _MaxResolvedPerAgent, token).ConfigureAwait(false);
                    result.MessagesExpired += expired.Count;
                    foreach (AgentMessage message in expired) GarrisonMetrics.Count(GarrisonMetricCatalog.Messages, "urgency", message.Urgency.ToString().ToLowerInvariant(), "outcome", "expired");
                }

                result.CompletedUtc = DateTime.UtcNow;
                GarrisonMetrics.Count(GarrisonMetricCatalog.CascadeCancels, "organization", organization.Name);
                string description = "Cancelled everything in unit " + unit.Name + " of organization " + organization.Name + ": " + result.RunsCancelled + " run(s), "
                    + result.TicksCancelled + " tick(s), " + result.EscalationsWithdrawn + " escalation(s) withdrawn, " + result.MessagesExpired + " queued message(s) expired"
                    + (why != null ? ". Reason: " + why : ".");
                await _Audit.WriteAsync(ctx, AuditEventTypeEnum.UnitCascadeCancelled, "Organization", organization.Id, description, organization.TenantId, token).ConfigureAwait(false);
                _Logging.Info(_Header + description + " by " + (ctx.PrincipalName ?? ctx.PrincipalId ?? "unknown") + " " + GarrisonTracing.LogFields("tenant", organization.TenantId));
                span?.SetTag("garrison.org.cascade.runs", result.RunsCancelled);
                GarrisonTracing.Ok(span);
                return result;
            }
        }

        /// <summary>
        /// Cancel the run of a keeper tick in flight and, when the run has ended, finish its tick at once. Used by an
        /// organization rollback with activeTicks Cancel.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a cancellation was requested.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<bool> CancelTickRunAsync(string tenantId, string runId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(runId)) return false;
            Run? run = await _Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false);
            if (run == null || RunService.IsTerminal(run.Status) || run.Status == RunStatusEnum.Cancelling) return false;
            return (await CancelOneAsync(run, token).ConfigureAwait(false)).Requested;
        }

        #endregion

        #region Private-Methods

        private async Task<OrgCancelOutcome> CancelOneAsync(Run run, CancellationToken token)
        {
            Run updated;
            try
            {
                updated = await _Runs.CancelAsync(run, token).ConfigureAwait(false);
            }
            catch (ConflictException)
            {
                // It finished while the list was read.
                return new OrgCancelOutcome(false, false);
            }
            bool tick = run.Kind == RunKindEnum.Keeper && !String.IsNullOrEmpty(run.MandateTickId);
            if (tick && Keepers != null && RunService.IsTerminal(updated.Status))
            {
                await Keepers.OnRunFinishedAsync(updated, token).ConfigureAwait(false);
            }
            return new OrgCancelOutcome(true, tick);
        }

        private async Task<int> WithdrawEscalationsAsync(RequestContext ctx, string tenantId, string agentId, string reason, CancellationToken token)
        {
            int withdrawn = 0;
            int attempts = 0;
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            while (withdrawn < _MaxResolvedPerAgent && attempts++ < 1000)
            {
                token.ThrowIfCancellationRequested();
                EscalationFilter filter = new EscalationFilter { TenantId = tenantId, Status = EscalationStatusEnum.Open, AgentId = agentId, MaxResults = 100 };
                EnumerationResult<Escalation> page = await _Database.Escalations.EnumerateAsync(filter, token).ConfigureAwait(false);
                List<Escalation> fresh = page.Objects.Where(e => seen.Add(e.Id)).ToList();
                if (fresh.Count == 0) break;
                foreach (Escalation escalation in fresh)
                {
                    try
                    {
                        await _Escalations.WithdrawForPersonAsync(ctx, escalation, reason, token).ConfigureAwait(false);
                        withdrawn++;
                    }
                    catch (ConflictException)
                    {
                        // Answered, cancelled, or withdrawn by another request meanwhile.
                    }
                }
            }
            return withdrawn;
        }

        #endregion
    }
}
