namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Backplane;
    using SyslogLogging;

    /// <summary>
    /// Freezes and the autonomy kill switch (AA3, AA-017). Applies and lifts freezes, answers whether a run or a keeper
    /// wake is frozen, and keeps each tenant's active freezes in a short cache so admission stays cheap. A change drops the
    /// tenant's cache here and, through the backplane, on every other replica; the cache also expires after
    /// <see cref="CacheSeconds"/> in case a message is lost. Thread-safe.
    /// </summary>
    public class FreezeService
    {
        #region Public-Members

        /// <summary>
        /// Backplane that tells other replicas to drop a tenant's cached freezes. Null (the default) leaves them to the
        /// cache expiry.
        /// </summary>
        public IEventBackplane? Backplane { get; set; } = null;

        /// <summary>
        /// Cancels one run through the normal cancellation path. Set by the runtime module; null skips cancellation when a
        /// freeze asks for it.
        /// </summary>
        public Func<Run, CancellationToken, Task>? CancelRunAsync { get; set; } = null;

        /// <summary>
        /// Chain of command that expands OrgUnit and Organization freezes to the agents below them (AA7.7), or null to
        /// refuse those targets with OrganizationsUnavailable.
        /// </summary>
        public ChainOfCommand? Chain { get; set; } = null;

        /// <summary>
        /// Seconds a tenant's cached active freezes are trusted without a backplane message. Minimum 1, maximum 300,
        /// default 30.
        /// </summary>
        public int CacheSeconds
        {
            get
            {
                return _CacheSeconds;
            }
            set
            {
                _CacheSeconds = Math.Clamp(value, 1, 300);
            }
        }

        /// <summary>
        /// When a mandate freeze is lifted, the keeper's next wake is spread over up to this many seconds (never more than
        /// its current interval), so lifting many freezes at once does not start every tick together. Minimum 0, maximum
        /// 3600, default 60.
        /// </summary>
        public int ResumeSpreadSeconds
        {
            get
            {
                return _ResumeSpreadSeconds;
            }
            set
            {
                _ResumeSpreadSeconds = Math.Clamp(value, 0, 3600);
            }
        }

        /// <summary>
        /// Most runs one freeze cancels when it asks for cancelActiveRuns. Minimum 1, maximum 100000, default 10000.
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
        /// Maximum length of a freeze or lift reason. Fixed at 2000 characters.
        /// </summary>
        public static int MaxReasonLength
        {
            get
            {
                return 2000;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly AuditService _Audit;
        private readonly LoggingModule _Logging;
        private readonly ConcurrentDictionary<string, FreezeSnapshot> _Cache = new ConcurrentDictionary<string, FreezeSnapshot>(StringComparer.Ordinal);
        private readonly string _Header = "[Freezes] ";
        private int _CacheSeconds = 30;
        private int _ResumeSpreadSeconds = 60;
        private int _MaxCancelledRuns = 10000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="audit">Audit.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public FreezeService(DatabaseDriverBase database, AuditService audit, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The active freezes of a tenant, from the cache when it is fresh.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Active freezes, oldest first.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<IReadOnlyList<Freeze>> ActiveAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            DateTime now = DateTime.UtcNow;
            return (await SnapshotAsync(tenantId, token).ConfigureAwait(false)).Freezes;
        }

        /// <summary>
        /// The first active freeze that covers a run: one on its agent, deployment, mandate, or app, or the kill switch for
        /// a keeper run.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="deploymentId">Deployment identifier, or null.</param>
        /// <param name="mandateId">Mandate identifier for a keeper tick, or null.</param>
        /// <param name="appId">Agentic app identifier for a run started through an app, or null.</param>
        /// <param name="keeper">True for a keeper tick, which the kill switch stops.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The freeze, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<Freeze?> FindAsync(string tenantId, string? agentId, string? deploymentId, string? mandateId, string? appId, bool keeper, CancellationToken token = default)
        {
            FreezeSnapshot snapshot = await SnapshotAsync(tenantId, token).ConfigureAwait(false);
            IReadOnlyList<Freeze> active = snapshot.Freezes;
            if (active.Count == 0) return null;
            foreach (Freeze freeze in active)
            {
                switch (freeze.TargetKind)
                {
                    case FreezeTargetKindEnum.TenantAutonomy:
                        if (keeper) return freeze;
                        break;
                    case FreezeTargetKindEnum.Agent:
                        if (Same(freeze.TargetId, agentId)) return freeze;
                        break;
                    case FreezeTargetKindEnum.Deployment:
                        if (Same(freeze.TargetId, deploymentId)) return freeze;
                        break;
                    case FreezeTargetKindEnum.Mandate:
                        if (Same(freeze.TargetId, mandateId)) return freeze;
                        break;
                    case FreezeTargetKindEnum.App:
                        if (Same(freeze.TargetId, appId)) return freeze;
                        break;
                }
            }
            if (!String.IsNullOrEmpty(agentId) && snapshot.OrgAgents.TryGetValue(agentId, out Freeze? org)) return org;
            return null;
        }

        /// <summary>
        /// Refuse a new run that an active freeze covers (AA3.2).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="deploymentId">Deployment identifier, or null.</param>
        /// <param name="mandateId">Mandate identifier for a keeper tick, or null.</param>
        /// <param name="appId">Agentic app identifier, or null.</param>
        /// <param name="keeper">True for a keeper tick.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="FrozenException">Thrown when a freeze covers the run.</exception>
        public async Task RequireNotFrozenAsync(string tenantId, string? agentId, string? deploymentId, string? mandateId, string? appId, bool keeper, CancellationToken token = default)
        {
            Freeze? freeze = await FindAsync(tenantId, agentId, deploymentId, mandateId, appId, keeper, token).ConfigureAwait(false);
            if (freeze == null) return;
            GarrisonMetrics.Count(GarrisonMetricCatalog.Freezes, "target_kind", Label(freeze.TargetKind), "action", "refused");
            throw new FrozenException(freeze.Id, freeze.TargetKind, Describe(freeze) + " is frozen by " + freeze.Id + (String.IsNullOrEmpty(freeze.Reason) ? String.Empty : " (" + freeze.Reason + ")") + "; new runs are refused until it is lifted.");
        }

        /// <summary>
        /// The active freeze that stops a keeper's wakes: one on its mandate, agent, or deployment, or the kill switch.
        /// </summary>
        /// <param name="mandate">Mandate.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The freeze, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when mandate is null.</exception>
        public async Task<Freeze?> FindForMandateAsync(Mandate mandate, CancellationToken token = default)
        {
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            return await FindAsync(mandate.TenantId, mandate.AgentId, mandate.DeploymentId, mandate.Id, null, true, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Resolve a freeze target to its identifier and name without freezing it, so a route can authorize a new freeze
        /// against the target (UT-01).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="targetKind">Target kind.</param>
        /// <param name="target">Identifier or name of the target; ignored for TenantAutonomy.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>An unsaved freeze carrying the target kind, identifier, and name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        /// <exception cref="ValidationException">Thrown when the kind is unknown or the target is missing.</exception>
        /// <exception cref="NotFoundException">Thrown when the target does not exist in the tenant.</exception>
        public async Task<Freeze> ResolveTargetAsync(string tenantId, FreezeTargetKindEnum targetKind, string? target, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (!Enum.IsDefined(targetKind)) throw Invalid("targetKind", "InvalidValue", "targetKind must be Agent, Deployment, Mandate, App, OrgUnit, Organization, or TenantAutonomy.");
            Freeze freeze = new Freeze();
            freeze.Id = String.Empty;
            freeze.TenantId = tenantId;
            freeze.TargetKind = targetKind;
            await ResolveTargetAsync(tenantId, target, freeze, token).ConfigureAwait(false);
            return freeze;
        }

        /// <summary>
        /// Apply a freeze. The target may be named by identifier or by name. A Mandate freeze sets the mandate's status to
        /// Frozen. With cancelActiveRuns, the runs already in scope are cancelled through the normal cancellation path.
        /// </summary>
        /// <param name="ctx">The person or credential applying it (Create on Freeze).</param>
        /// <param name="tenantId">Tenant identifier from the route.</param>
        /// <param name="request">Target kind, target, reason, and cancelActiveRuns.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored freeze.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or request is null.</exception>
        /// <exception cref="ValidationException">Thrown when the target is missing or the reason is too long.</exception>
        /// <exception cref="NotFoundException">Thrown when the target does not exist in the tenant.</exception>
        /// <exception cref="ConflictException">Thrown with AlreadyFrozen when an active freeze already covers the target, or OrganizationsUnavailable for OrgUnit and Organization when organizations are not wired.</exception>
        public async Task<Freeze> ApplyAsync(RequestContext ctx, string tenantId, Freeze request, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (!Enum.IsDefined(request.TargetKind)) throw Invalid("targetKind", "InvalidValue", "targetKind must be Agent, Deployment, Mandate, App, OrgUnit, Organization, or TenantAutonomy.");
            if ((request.TargetKind == FreezeTargetKindEnum.OrgUnit || request.TargetKind == FreezeTargetKindEnum.Organization) && Chain == null)
                throw new ConflictException("OrganizationsUnavailable", request.TargetKind + " freezes need organizations, which are not wired on this server; freeze an agent, deployment, mandate, or app instead.");
            string? reason = Reason(request.Reason, "reason");

            Freeze freeze = new Freeze();
            freeze.Id = String.Empty;
            freeze.TenantId = tenantId;
            freeze.TargetKind = request.TargetKind;
            freeze.Reason = reason;
            freeze.CancelActiveRuns = request.CancelActiveRuns;
            freeze.CreatedById = ctx.PrincipalId;
            freeze.CreatedByName = ctx.PrincipalName ?? ctx.PrincipalId;
            await ResolveTargetAsync(tenantId, request.TargetId, freeze, token).ConfigureAwait(false);

            Freeze? existing = await _Database.Freezes.ReadActiveAsync(tenantId, freeze.TargetKind, freeze.TargetId, token).ConfigureAwait(false);
            if (existing != null) throw new ConflictException("AlreadyFrozen", Describe(existing) + " is already frozen by " + existing.Id + ". Lift that freeze first, or leave it in place.");

            await _Database.Freezes.CreateAsync(freeze, token).ConfigureAwait(false);
            Changed(tenantId);
            GarrisonMetrics.Count(GarrisonMetricCatalog.Freezes, "target_kind", Label(freeze.TargetKind), "action", "applied");
            if (freeze.TargetKind == FreezeTargetKindEnum.Mandate) await FreezeMandateAsync(tenantId, freeze.TargetId, token).ConfigureAwait(false);
            if (freeze.TargetKind == FreezeTargetKindEnum.Organization) await SetOrganizationStatusAsync(tenantId, freeze.TargetId, OrganizationStatusEnum.Active, OrganizationStatusEnum.Frozen, token).ConfigureAwait(false);

            AuditEventTypeEnum eventType = freeze.TargetKind == FreezeTargetKindEnum.TenantAutonomy ? AuditEventTypeEnum.KillSwitchChanged : AuditEventTypeEnum.FreezeApplied;
            string what = freeze.TargetKind == FreezeTargetKindEnum.TenantAutonomy ? "Turned the autonomy kill switch on (" + freeze.Id + ")" : "Froze " + Describe(freeze) + " (" + freeze.Id + ")";
            await _Audit.WriteAsync(ctx, eventType, "Freeze", freeze.Id, what + (reason != null ? ": " + reason : ".") + (freeze.CancelActiveRuns ? " Active runs are cancelled." : String.Empty), tenantId, token).ConfigureAwait(false);
            _Logging.Info(_Header + what + " by " + freeze.CreatedByName + (freeze.CancelActiveRuns ? ", cancelling active runs" : String.Empty) + " " + GarrisonTracing.LogFields("tenant", tenantId));

            if (freeze.CancelActiveRuns) freeze.CancelledRunCount = await CancelScopeAsync(freeze, token).ConfigureAwait(false);
            return freeze;
        }

        /// <summary>
        /// Lift an active freeze. Lifting a Mandate freeze returns a Frozen mandate to Active with its next wake spread
        /// over <see cref="ResumeSpreadSeconds"/>.
        /// </summary>
        /// <param name="ctx">The person or credential lifting it (Update on Freeze).</param>
        /// <param name="freeze">The freeze, read in the caller's tenant.</param>
        /// <param name="reason">Why, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The lifted freeze.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or freeze is null.</exception>
        /// <exception cref="ValidationException">Thrown when the reason is too long.</exception>
        /// <exception cref="ConflictException">Thrown with FreezeLifted when it was already lifted.</exception>
        public async Task<Freeze> LiftAsync(RequestContext ctx, Freeze freeze, string? reason, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (freeze == null) throw new ArgumentNullException(nameof(freeze));
            if (!freeze.Active) throw new ConflictException("FreezeLifted", "Freeze " + freeze.Id + " was already lifted.");
            freeze.LiftReason = Reason(reason, "reason");
            freeze.LiftedById = ctx.PrincipalId;
            freeze.LiftedByName = ctx.PrincipalName ?? ctx.PrincipalId;
            freeze.LiftedUtc = DateTime.UtcNow;
            if (!await _Database.Freezes.TryLiftAsync(freeze, token).ConfigureAwait(false))
            {
                freeze.LiftedUtc = null;
                throw new ConflictException("FreezeLifted", "Freeze " + freeze.Id + " was lifted by another request.");
            }
            Changed(freeze.TenantId);
            GarrisonMetrics.Count(GarrisonMetricCatalog.Freezes, "target_kind", Label(freeze.TargetKind), "action", "lifted");
            if (freeze.TargetKind == FreezeTargetKindEnum.Mandate) await ThawMandateAsync(freeze.TenantId, freeze.TargetId, token).ConfigureAwait(false);
            if (freeze.TargetKind == FreezeTargetKindEnum.Organization) await SetOrganizationStatusAsync(freeze.TenantId, freeze.TargetId, OrganizationStatusEnum.Frozen, OrganizationStatusEnum.Active, token).ConfigureAwait(false);

            AuditEventTypeEnum eventType = freeze.TargetKind == FreezeTargetKindEnum.TenantAutonomy ? AuditEventTypeEnum.KillSwitchChanged : AuditEventTypeEnum.FreezeLifted;
            string what = freeze.TargetKind == FreezeTargetKindEnum.TenantAutonomy ? "Turned the autonomy kill switch off (" + freeze.Id + ")" : "Lifted freeze " + freeze.Id + " on " + Describe(freeze);
            await _Audit.WriteAsync(ctx, eventType, "Freeze", freeze.Id, what + (freeze.LiftReason != null ? ": " + freeze.LiftReason : "."), freeze.TenantId, token).ConfigureAwait(false);
            _Logging.Info(_Header + what + " by " + freeze.LiftedByName + " " + GarrisonTracing.LogFields("tenant", freeze.TenantId));
            return freeze;
        }

        /// <summary>
        /// The kill switch of a tenant, read from the database.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The state.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<KillSwitchState> ReadKillSwitchAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            Freeze? freeze = await _Database.Freezes.ReadActiveAsync(tenantId, FreezeTargetKindEnum.TenantAutonomy, tenantId, token).ConfigureAwait(false);
            return State(tenantId, freeze);
        }

        /// <summary>
        /// Turn the kill switch on (apply a TenantAutonomy freeze) or off (lift it). Setting it to its current state changes
        /// nothing.
        /// </summary>
        /// <param name="ctx">The person or credential (Update on Freeze).</param>
        /// <param name="tenantId">Tenant identifier from the route.</param>
        /// <param name="request">Enabled and reason.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new state.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or request is null.</exception>
        /// <exception cref="ValidationException">Thrown when enabled is missing or the reason is too long.</exception>
        public async Task<KillSwitchState> SetKillSwitchAsync(RequestContext ctx, string tenantId, KillSwitchRequest request, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (!request.Enabled.HasValue) throw Invalid("enabled", "Required", "enabled is required: true stops keeper ticks, false lets them resume.");
            Freeze? current = await _Database.Freezes.ReadActiveAsync(tenantId, FreezeTargetKindEnum.TenantAutonomy, tenantId, token).ConfigureAwait(false);
            if (request.Enabled.Value)
            {
                if (current != null) return State(tenantId, current);
                Freeze freeze = new Freeze();
                freeze.TargetKind = FreezeTargetKindEnum.TenantAutonomy;
                freeze.TargetId = tenantId;
                freeze.Reason = request.Reason;
                try
                {
                    return State(tenantId, await ApplyAsync(ctx, tenantId, freeze, token).ConfigureAwait(false));
                }
                catch (ConflictException e) when (e.Code == "AlreadyFrozen")
                {
                    return await ReadKillSwitchAsync(tenantId, token).ConfigureAwait(false);
                }
            }
            if (current == null) return State(tenantId, null);
            try
            {
                await LiftAsync(ctx, current, request.Reason, token).ConfigureAwait(false);
            }
            catch (ConflictException e) when (e.Code == "FreezeLifted")
            {
            }
            return State(tenantId, null);
        }

        /// <summary>
        /// Record a keeper wake a freeze skipped.
        /// </summary>
        /// <param name="freeze">The freeze.</param>
        public void Skipped(Freeze freeze)
        {
            if (freeze == null) return;
            GarrisonMetrics.Count(GarrisonMetricCatalog.Freezes, "target_kind", Label(freeze.TargetKind), "action", "skipped");
        }

        /// <summary>
        /// Drop a tenant's cached freezes. Called for backplane messages from other replicas.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        public void Invalidate(string? tenantId)
        {
            if (String.IsNullOrEmpty(tenantId)) return;
            _Cache.TryRemove(tenantId, out FreezeSnapshot? _);
        }

        /// <summary>
        /// An organization was published, rolled back, or deleted: organization freezes may now cover other agents, so the
        /// tenant's cache is dropped here and on every replica.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        public void OrganizationChanged(string? tenantId)
        {
            if (String.IsNullOrEmpty(tenantId)) return;
            Changed(tenantId);
        }

        /// <summary>
        /// Drop every cached tenant (after the backplane resynchronizes).
        /// </summary>
        public void InvalidateAll()
        {
            _Cache.Clear();
        }

        /// <summary>
        /// Describe a freeze's target for messages, for example "Agent billing-agent".
        /// </summary>
        /// <param name="freeze">Freeze.</param>
        /// <returns>Description.</returns>
        /// <exception cref="ArgumentNullException">Thrown when freeze is null.</exception>
        public static string Describe(Freeze freeze)
        {
            if (freeze == null) throw new ArgumentNullException(nameof(freeze));
            if (freeze.TargetKind == FreezeTargetKindEnum.TenantAutonomy) return "Autonomous work in tenant " + freeze.TargetId;
            return freeze.TargetKind + " " + (freeze.TargetName ?? freeze.TargetId);
        }

        #endregion

        #region Private-Methods

        private async Task<FreezeSnapshot> SnapshotAsync(string tenantId, CancellationToken token)
        {
            DateTime now = DateTime.UtcNow;
            if (_Cache.TryGetValue(tenantId, out FreezeSnapshot? cached) && (now - cached.LoadedUtc).TotalSeconds < _CacheSeconds) return cached;
            List<Freeze> active = await _Database.Freezes.ListActiveAsync(tenantId, token).ConfigureAwait(false);
            Dictionary<string, Freeze> orgAgents = new Dictionary<string, Freeze>(StringComparer.Ordinal);
            if (Chain != null && active.Any(f => f.TargetKind == FreezeTargetKindEnum.OrgUnit || f.TargetKind == FreezeTargetKindEnum.Organization))
            {
                foreach (Freeze freeze in active)
                {
                    if (freeze.TargetKind != FreezeTargetKindEnum.OrgUnit && freeze.TargetKind != FreezeTargetKindEnum.Organization) continue;
                    foreach (string agentId in await OrgAgentsAsync(freeze, token).ConfigureAwait(false))
                    {
                        if (!orgAgents.ContainsKey(agentId)) orgAgents[agentId] = freeze;
                    }
                }
            }
            FreezeSnapshot snapshot = new FreezeSnapshot(active, now, orgAgents);
            _Cache[tenantId] = snapshot;
            return snapshot;
        }

        private async Task<HashSet<string>> OrgAgentsAsync(Freeze freeze, CancellationToken token)
        {
            if (Chain == null) return new HashSet<string>(StringComparer.Ordinal);
            if (freeze.TargetKind == FreezeTargetKindEnum.OrgUnit) return await Chain.SubtreeAgentIdsAsync(freeze.TenantId, freeze.TargetId, token).ConfigureAwait(false);
            OrgTree? tree = await Chain.LiveTreeAsync(freeze.TenantId, freeze.TargetId, token).ConfigureAwait(false);
            return tree == null ? new HashSet<string>(StringComparer.Ordinal) : tree.AgentIds();
        }

        private async Task SetOrganizationStatusAsync(string tenantId, string organizationId, OrganizationStatusEnum from, OrganizationStatusEnum to, CancellationToken token)
        {
            Organization? organization = await _Database.Organizations.ReadAsync(tenantId, organizationId, token).ConfigureAwait(false);
            if (organization == null || organization.Status != from) return;
            organization.Status = to;
            await _Database.Organizations.UpdateAsync(organization, token).ConfigureAwait(false);
        }

        private void Changed(string tenantId)
        {
            Invalidate(tenantId);
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.FreezesChanged, tenantId));
        }

        private async Task ResolveTargetAsync(string tenantId, string? target, Freeze freeze, CancellationToken token)
        {
            string value = (target ?? String.Empty).Trim();
            if (freeze.TargetKind == FreezeTargetKindEnum.TenantAutonomy)
            {
                if (value.Length > 0 && !String.Equals(value, tenantId, StringComparison.Ordinal)) throw Invalid("targetId", "InvalidValue", "A TenantAutonomy freeze targets the tenant itself; leave targetId empty or use " + tenantId + ".");
                freeze.TargetId = tenantId;
                freeze.TargetName = null;
                return;
            }
            if (value.Length == 0) throw Invalid("targetId", "Required", "targetId is required: the identifier or name of the " + freeze.TargetKind.ToString().ToLowerInvariant() + " to freeze.");
            switch (freeze.TargetKind)
            {
                case FreezeTargetKindEnum.Agent:
                    Agent? agent = await _Database.Agents.ReadAsync(tenantId, value, token).ConfigureAwait(false) ?? await _Database.Agents.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
                    if (agent == null) throw new NotFoundException("Agent " + value + " not found.");
                    freeze.TargetId = agent.Id;
                    freeze.TargetName = agent.Name;
                    return;
                case FreezeTargetKindEnum.Deployment:
                    Deployment? deployment = await _Database.Deployments.ReadAsync(tenantId, value, token).ConfigureAwait(false) ?? await _Database.Deployments.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
                    if (deployment == null) throw new NotFoundException("Deployment " + value + " not found.");
                    freeze.TargetId = deployment.Id;
                    freeze.TargetName = deployment.Name;
                    return;
                case FreezeTargetKindEnum.Mandate:
                    Mandate? mandate = await _Database.Mandates.ReadAsync(tenantId, value, token).ConfigureAwait(false) ?? await _Database.Mandates.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
                    if (mandate == null) throw new NotFoundException("Mandate " + value + " not found.");
                    freeze.TargetId = mandate.Id;
                    freeze.TargetName = mandate.Name;
                    return;
                case FreezeTargetKindEnum.App:
                    AgenticApp? app = await _Database.Apps.ReadAsync(tenantId, value, token).ConfigureAwait(false) ?? await _Database.Apps.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
                    if (app == null) throw new NotFoundException("App " + value + " not found.");
                    freeze.TargetId = app.Id;
                    freeze.TargetName = app.Name;
                    return;
                case FreezeTargetKindEnum.Organization:
                    Organization? organization = await _Database.Organizations.ReadAsync(tenantId, value, token).ConfigureAwait(false) ?? await _Database.Organizations.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
                    if (organization == null) throw new NotFoundException("Organization " + value + " not found.");
                    freeze.TargetId = organization.Id;
                    freeze.TargetName = organization.Name;
                    return;
                case FreezeTargetKindEnum.OrgUnit:
                    OrgUnit? unit = await _Database.Organizations.ReadUnitAsync(tenantId, value, token).ConfigureAwait(false);
                    if (unit == null && Chain != null)
                    {
                        foreach (OrgTree tree in await Chain.LiveTreesAsync(tenantId, token).ConfigureAwait(false))
                        {
                            unit = tree.Unit(value) ?? tree.UnitByName(value);
                            if (unit != null) break;
                        }
                    }
                    if (unit == null) throw new NotFoundException("Unit " + value + " not found.");
                    freeze.TargetId = unit.Id;
                    freeze.TargetName = unit.Name;
                    return;
                default:
                    throw Invalid("targetKind", "InvalidValue", "targetKind must be Agent, Deployment, Mandate, App, OrgUnit, Organization, or TenantAutonomy.");
            }
        }

        private async Task FreezeMandateAsync(string tenantId, string mandateId, CancellationToken token)
        {
            Mandate? mandate = await _Database.Mandates.ReadAsync(tenantId, mandateId, token).ConfigureAwait(false);
            if (mandate == null) return;
            if (mandate.Status != MandateStatusEnum.Active && mandate.Status != MandateStatusEnum.CapReached) return;
            // The next wake is kept so the mandate can resume where it was; a Frozen mandate is never due.
            await _Database.Mandates.TrySetStatusAsync(tenantId, mandateId, mandate.Status, MandateStatusEnum.Frozen, mandate.NextWakeUtc, token).ConfigureAwait(false);
        }

        private async Task ThawMandateAsync(string tenantId, string mandateId, CancellationToken token)
        {
            Mandate? mandate = await _Database.Mandates.ReadAsync(tenantId, mandateId, token).ConfigureAwait(false);
            if (mandate == null || mandate.Status != MandateStatusEnum.Frozen) return;
            DateTime now = DateTime.UtcNow;
            int spread = Math.Min(_ResumeSpreadSeconds, Math.Max(0, mandate.CurrentIntervalSeconds));
            DateTime earliest = now.AddSeconds(spread > 0 ? Random.Shared.Next(0, spread + 1) : 0);
            DateTime? next = mandate.NextWakeUtc.HasValue && mandate.NextWakeUtc.Value > earliest ? mandate.NextWakeUtc : earliest;
            if (String.IsNullOrEmpty(mandate.CurrentRevisionId)) next = null;
            await _Database.Mandates.TrySetStatusAsync(tenantId, mandateId, MandateStatusEnum.Frozen, MandateStatusEnum.Active, next, token).ConfigureAwait(false);
        }

        private async Task<int> CancelScopeAsync(Freeze freeze, CancellationToken token)
        {
            Func<Run, CancellationToken, Task>? cancel = CancelRunAsync;
            if (cancel == null) return 0;
            List<Run> runs = new List<Run>();
            if (freeze.TargetKind == FreezeTargetKindEnum.OrgUnit || freeze.TargetKind == FreezeTargetKindEnum.Organization)
            {
                foreach (string agentId in await OrgAgentsAsync(freeze, token).ConfigureAwait(false))
                {
                    if (runs.Count >= _MaxCancelledRuns) break;
                    runs.AddRange(await _Database.Runs.ListActiveInScopeAsync(freeze.TenantId, FreezeTargetKindEnum.Agent, agentId, _MaxCancelledRuns - runs.Count, token).ConfigureAwait(false));
                }
            }
            else
            {
                runs = await _Database.Runs.ListActiveInScopeAsync(freeze.TenantId, freeze.TargetKind, freeze.TargetId, _MaxCancelledRuns, token).ConfigureAwait(false);
            }
            int cancelled = 0;
            foreach (Run run in runs)
            {
                token.ThrowIfCancellationRequested();
                try
                {
                    await cancel(run, token).ConfigureAwait(false);
                    cancelled++;
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    // A run that finished or moved while the list was read is not an error.
                    _Logging.Debug(_Header + "freeze " + freeze.Id + " could not cancel run " + run.Id + ": " + e.Message);
                }
            }
            if (cancelled > 0)
            {
                GarrisonMetrics.Count(GarrisonMetricCatalog.Freezes, cancelled, GarrisonMetrics.Tags("target_kind", Label(freeze.TargetKind), "action", "cancelled"));
                await _Database.Freezes.SetCancelledRunCountAsync(freeze.TenantId, freeze.Id, cancelled, token).ConfigureAwait(false);
                _Logging.Info(_Header + "freeze " + freeze.Id + " cancelled " + cancelled + " run(s) " + GarrisonTracing.LogFields("tenant", freeze.TenantId));
            }
            return cancelled;
        }

        private static KillSwitchState State(string tenantId, Freeze? freeze)
        {
            KillSwitchState state = new KillSwitchState();
            state.TenantId = tenantId;
            state.Enabled = freeze != null && freeze.Active;
            if (state.Enabled)
            {
                state.FreezeId = freeze!.Id;
                state.Reason = freeze.Reason;
                state.ChangedByName = freeze.CreatedByName;
                state.ChangedUtc = freeze.CreatedUtc;
            }
            return state;
        }

        private static string? Reason(string? value, string field)
        {
            string? trimmed = String.IsNullOrWhiteSpace(value) ? null : value.Trim();
            if (trimmed != null && trimmed.Length > MaxReasonLength) throw Invalid(field, "TooLong", field + " holds at most " + MaxReasonLength + " characters.");
            return trimmed;
        }

        private static ValidationException Invalid(string field, string code, string message)
        {
            Dictionary<string, string> fields = new Dictionary<string, string>();
            fields[field] = message;
            Dictionary<string, string> codes = new Dictionary<string, string>();
            codes[field] = code;
            return new ValidationException("The freeze is invalid.", fields, codes);
        }

        private static bool Same(string target, string? value)
        {
            return !String.IsNullOrEmpty(value) && String.Equals(target, value, StringComparison.Ordinal);
        }

        private static string Label(FreezeTargetKindEnum kind)
        {
            return kind.ToString().ToLowerInvariant();
        }

        #endregion
    }
}
