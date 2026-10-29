namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;

    /// <summary>
    /// Environments and promotion (AD1.3, AD1.4, AD-013): the tenant's ordered environment list, environment
    /// validation for deployments, promoting a revision from one environment to the next by repinning the target
    /// environment's deployments, and rolling a promotion back by restoring the exact previous pins. Repinning and the
    /// promotion record are written in one transaction. Callers authorize before entering, except for the target
    /// environment check, which <see cref="PromoteAsync"/> receives as a delegate. Thread-safe.
    /// </summary>
    public class PromotionService
    {
        #region Public-Members

        /// <summary>
        /// Environment name used for playground runs (AD9.1). It can never be part of a tenant's list.
        /// </summary>
        public static readonly string DraftEnvironment = EnvironmentDefaults.Draft;

        /// <summary>
        /// Most environments in a tenant's list. Default 16.
        /// </summary>
        public static readonly int MaxEnvironments = 16;

        #endregion

        #region Private-Members

        private static readonly Regex _Name = new Regex("^[a-z][a-z0-9-]{0,31}$", RegexOptions.CultureInvariant);

        private readonly ServerContext _Server;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public PromotionService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The tenant's environments in promotion order, or the default list (dev, staging, prod) when none is stored.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>List.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<TenantEnvironmentList> ListEnvironmentsAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            TenantEnvironmentList list = new TenantEnvironmentList();
            list.IsDefault = (await _Server.Database.Environments.ListAsync(tenantId, token).ConfigureAwait(false)).Count == 0;
            list.Environments = await EnvironmentDefaults.ListAsync(_Server.Database, tenantId, token).ConfigureAwait(false);
            return list;
        }

        /// <summary>
        /// Replace the tenant's environment list. Names are 1 to 32 lowercase letters, digits, and hyphens, starting with
        /// a letter, unique, at most 16, and never draft. An environment still used by a deployment cannot be removed.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="list">New list.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Stored list.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the list is invalid.</exception>
        /// <exception cref="ConflictException">Thrown with EnvironmentInUse when a removed environment has deployments.</exception>
        public async Task<TenantEnvironmentList> ReplaceEnvironmentsAsync(RequestContext ctx, string tenantId, TenantEnvironmentList list, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (list == null) throw new ArgumentNullException(nameof(list));
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            if (list.Environments.Count == 0 || list.Environments.Count > MaxEnvironments)
            {
                errors["environments"] = "Give between 1 and " + MaxEnvironments + " environments.";
                codes["environments"] = "OutOfRange";
            }
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            for (int i = 0; i < list.Environments.Count; i++)
            {
                TenantEnvironment environment = list.Environments[i];
                string key = "environments[" + i + "]";
                if (!_Name.IsMatch(environment.Name)) errors[key + ".name"] = "Environment names are 1 to 32 lowercase letters, digits, and hyphens, starting with a letter.";
                else if (environment.Name == DraftEnvironment) errors[key + ".name"] = "The name draft is reserved for playground runs.";
                else if (!seen.Add(environment.Name)) errors[key + ".name"] = "Environment " + environment.Name + " is listed twice.";
                if (environment.Description != null && environment.Description.Length > 1000) errors[key + ".description"] = "At most 1000 characters.";
            }
            if (errors.Count > 0) throw new ValidationException("The environment list is invalid.", errors, codes);

            List<string> inUse = new List<string>();
            foreach (Deployment deployment in await AllDeploymentsAsync(tenantId, token).ConfigureAwait(false))
            {
                if (deployment.Environment != DraftEnvironment && !seen.Contains(deployment.Environment)) inUse.Add(deployment.Environment + " (deployment " + deployment.Name + ")");
            }
            if (inUse.Count > 0) throw new ConflictException("EnvironmentInUse", "These environments still have deployments: " + String.Join(", ", inUse.Distinct()) + ". Move or delete those deployments first.");

            await _Server.Database.Environments.ReplaceAsync(tenantId, list.Environments, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Environment", tenantId, "Set environments to " + String.Join(", ", list.Environments.Select(e => e.Name)) + ".", tenantId, token).ConfigureAwait(false);
            return await ListEnvironmentsAsync(tenantId, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Promote an agent revision. The target defaults to the next environment after the source. A target that skips
        /// environments needs allowSkip; the caller must hold Execute on Promotion for the target environment either way,
        /// which <paramref name="authorizeTarget"/> checks. Every deployment of the agent in the target environment is
        /// repinned to the revision in one transaction, and the record keeps their previous pins.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="authorizeTarget">Returns true when the caller may promote into the named environment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Promotion record, or null when authorizeTarget refused (it has already answered the request).</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the request is invalid (UnknownEnvironment, NoNextEnvironment).</exception>
        /// <exception cref="NotFoundException">Thrown when the agent or revision does not exist in the tenant.</exception>
        /// <exception cref="ConflictException">Thrown with PromotionOrderViolation, RevisionNotPublished, NoSourceRevision,
        /// AmbiguousSourceRevision, or NoTargetDeployments.</exception>
        public async Task<PromotionRecord?> PromoteAsync(RequestContext ctx, string tenantId, PromotionRequest request, Func<string, Task<bool>> authorizeTarget, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (authorizeTarget == null) throw new ArgumentNullException(nameof(authorizeTarget));
            if (request.Note != null && request.Note.Length > 2000) throw new ValidationException("The note is too long.", new Dictionary<string, string> { ["note"] = "At most 2000 characters." });

            Agent agent = await ResolveAgentAsync(tenantId, request.AgentId, token).ConfigureAwait(false);
            List<TenantEnvironment> order = (await ListEnvironmentsAsync(tenantId, token).ConfigureAwait(false)).Environments;
            int sourceIndex = IndexOf(order, request.SourceEnvironment, "sourceEnvironment");
            int targetIndex;
            if (String.IsNullOrEmpty(request.TargetEnvironment))
            {
                if (sourceIndex + 1 >= order.Count)
                {
                    ValidationException last = new ValidationException("Environment " + request.SourceEnvironment + " is the last one; there is nothing to promote to.", new Dictionary<string, string> { ["targetEnvironment"] = "No next environment." });
                    last.Code = "NoNextEnvironment";
                    throw last;
                }
                targetIndex = sourceIndex + 1;
            }
            else
            {
                targetIndex = IndexOf(order, request.TargetEnvironment, "targetEnvironment");
            }
            string target = order[targetIndex].Name;
            bool skipped = targetIndex != sourceIndex + 1;
            if (skipped && !request.AllowSkip)
            {
                throw new ConflictException("PromotionOrderViolation", "Promotion goes from " + order[sourceIndex].Name + " to the next environment, " + (sourceIndex + 1 < order.Count ? order[sourceIndex + 1].Name : "none") + ", not " + target + ". Set allowSkip to promote out of order.");
            }
            if (!await authorizeTarget(target).ConfigureAwait(false)) return null;

            List<Deployment> deployments = await _Server.Database.Deployments.ListByAgentAsync(tenantId, agent.Id, token).ConfigureAwait(false);
            AgentRevision revision = await SourceRevisionAsync(tenantId, agent, request, deployments, order[sourceIndex].Name, token).ConfigureAwait(false);
            List<Deployment> targets = deployments.Where(d => d.Environment == target).OrderBy(d => d.Name, StringComparer.Ordinal).ToList();
            if (targets.Count == 0) throw new ConflictException("NoTargetDeployments", "Agent " + agent.Name + " has no deployment in environment " + target + ". Create one there first.");

            PromotionRecord record = new PromotionRecord();
            record.TenantId = tenantId;
            record.Kind = PromotionKindEnum.Promote;
            record.AgentId = agent.Id;
            record.AgentRevisionId = revision.Id;
            record.SourceEnvironment = order[sourceIndex].Name;
            record.TargetEnvironment = target;
            record.SkippedEnvironments = skipped;
            record.Note = request.Note;
            SetActor(record, ctx);
            foreach (Deployment deployment in targets)
            {
                record.Items.Add(new PromotionRecordItem { DeploymentId = deployment.Id, DeploymentName = deployment.Name, AgentId = agent.Id, PreviousRevisionId = deployment.AgentRevisionId, NewRevisionId = revision.Id });
            }
            await ApplyAsync(record, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Promotion", record.Id, "Promoted revision " + revision.Number + " of agent " + agent.Name + " from " + record.SourceEnvironment + " to " + target + " (" + targets.Count + " deployment(s)).", tenantId, token).ConfigureAwait(false);
            return record;
        }

        /// <summary>
        /// Promote an app revision (AD6.4): every member's pinned agent revision goes to every deployment of that member in
        /// the target environment, in one transaction, under one promotion record, so the members move together or not at
        /// all. Environment order and authorization work as for an agent promotion.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="app">App.</param>
        /// <param name="revision">Published app revision to promote.</param>
        /// <param name="sourceEnvironment">Environment the revision comes from.</param>
        /// <param name="targetEnvironment">Target environment, or null for the next one.</param>
        /// <param name="allowSkip">Whether the target may skip environments.</param>
        /// <param name="note">Note, up to 2000 characters, or null.</param>
        /// <param name="authorizeTarget">Returns true when the caller may promote into the named environment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Promotion record, or null when authorizeTarget refused.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown for an unknown environment, NoNextEnvironment, or a long note.</exception>
        /// <exception cref="ConflictException">Thrown with RevisionNotPublished, PromotionOrderViolation, or NoTargetDeployments naming the member.</exception>
        public async Task<PromotionRecord?> PromoteAppAsync(RequestContext ctx, string tenantId, AgenticApp app, AppRevision revision, string sourceEnvironment, string? targetEnvironment, bool allowSkip, string? note, Func<string, Task<bool>> authorizeTarget, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (app == null) throw new ArgumentNullException(nameof(app));
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            if (authorizeTarget == null) throw new ArgumentNullException(nameof(authorizeTarget));
            if (note != null && note.Length > 2000) throw new ValidationException("The note is too long.", new Dictionary<string, string> { ["note"] = "At most 2000 characters." });
            if (revision.State != AgentRevisionStateEnum.Published) throw new ConflictException("RevisionNotPublished", "App revision " + revision.Number + " is a draft; publish it before promoting it.");
            List<TenantEnvironment> order = (await ListEnvironmentsAsync(tenantId, token).ConfigureAwait(false)).Environments;
            int sourceIndex = IndexOf(order, sourceEnvironment, "sourceEnvironment");
            int targetIndex;
            if (String.IsNullOrEmpty(targetEnvironment))
            {
                if (sourceIndex + 1 >= order.Count)
                {
                    ValidationException last = new ValidationException("Environment " + sourceEnvironment + " is the last one; there is nothing to promote to.", new Dictionary<string, string> { ["targetEnvironment"] = "No next environment." });
                    last.Code = "NoNextEnvironment";
                    throw last;
                }
                targetIndex = sourceIndex + 1;
            }
            else
            {
                targetIndex = IndexOf(order, targetEnvironment, "targetEnvironment");
            }
            string target = order[targetIndex].Name;
            bool skipped = targetIndex != sourceIndex + 1;
            if (skipped && !allowSkip)
            {
                throw new ConflictException("PromotionOrderViolation", "Promotion goes from " + order[sourceIndex].Name + " to the next environment, " + (sourceIndex + 1 < order.Count ? order[sourceIndex + 1].Name : "none") + ", not " + target + ". Set allowSkip to promote out of order.");
            }
            if (!await authorizeTarget(target).ConfigureAwait(false)) return null;

            PromotionRecord record = new PromotionRecord();
            record.TenantId = tenantId;
            record.Kind = PromotionKindEnum.Promote;
            record.AppId = app.Id;
            record.AppRevisionId = revision.Id;
            record.SourceEnvironment = order[sourceIndex].Name;
            record.TargetEnvironment = target;
            record.SkippedEnvironments = skipped;
            record.Note = note;
            SetActor(record, ctx);
            foreach (AppRevisionMember member in revision.Members)
            {
                List<Deployment> targets = (await _Server.Database.Deployments.ListByAgentAsync(tenantId, member.AgentId, token).ConfigureAwait(false))
                    .Where(d => d.Environment == target).OrderBy(d => d.Name, StringComparer.Ordinal).ToList();
                if (targets.Count == 0) throw new ConflictException("NoTargetDeployments", "Member " + (member.AgentName ?? member.AgentId) + " has no deployment in environment " + target + ". Create one there first; nothing was promoted.");
                foreach (Deployment deployment in targets)
                {
                    record.Items.Add(new PromotionRecordItem { DeploymentId = deployment.Id, DeploymentName = deployment.Name, AgentId = member.AgentId, PreviousRevisionId = deployment.AgentRevisionId, NewRevisionId = member.AgentRevisionId });
                }
            }
            await ApplyAsync(record, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Promotion", record.Id, "Promoted revision " + revision.Number + " of app " + app.Name + " from " + record.SourceEnvironment + " to " + target + " (" + record.Items.Count + " deployment(s) of " + revision.Members.Count + " member(s)).", tenantId, token).ConfigureAwait(false);
            return record;
        }

        /// <summary>
        /// Roll back a promotion: restore every deployment pin it replaced, in one transaction, and mark it RolledBack.
        /// The caller must hold Execute on Promotion for the promotion's target environment.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="promotionId">Promotion record identifier.</param>
        /// <param name="note">Optional note.</param>
        /// <param name="authorizeTarget">Returns true when the caller may change the named environment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rollback record, or null when authorizeTarget refused.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the promotion does not exist in the tenant.</exception>
        /// <exception cref="ConflictException">Thrown with NotAPromotion or AlreadyRolledBack.</exception>
        public async Task<PromotionRecord?> RollbackAsync(RequestContext ctx, string tenantId, string promotionId, string? note, Func<string, Task<bool>> authorizeTarget, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (authorizeTarget == null) throw new ArgumentNullException(nameof(authorizeTarget));
            if (note != null && note.Length > 2000) throw new ValidationException("The note is too long.", new Dictionary<string, string> { ["note"] = "At most 2000 characters." });
            PromotionRecord original = await _Server.Database.Promotions.ReadAsync(tenantId, promotionId ?? String.Empty, token).ConfigureAwait(false)
                ?? throw new NotFoundException("Promotion " + promotionId + " not found.");
            if (original.Kind != PromotionKindEnum.Promote) throw new ConflictException("NotAPromotion", "Record " + original.Id + " is a rollback; only promotions can be rolled back.");
            if (!String.IsNullOrEmpty(original.RolledBackById)) throw new ConflictException("AlreadyRolledBack", "Promotion " + original.Id + " was already rolled back by " + original.RolledBackById + ".");
            if (!await authorizeTarget(original.TargetEnvironment).ConfigureAwait(false)) return null;

            PromotionRecord rollback = new PromotionRecord();
            rollback.TenantId = tenantId;
            rollback.Kind = PromotionKindEnum.Rollback;
            rollback.AgentId = original.AgentId;
            rollback.AppId = original.AppId;
            rollback.AppRevisionId = original.AppRevisionId;
            rollback.AgentRevisionId = original.AgentRevisionId;
            rollback.SourceEnvironment = original.SourceEnvironment;
            rollback.TargetEnvironment = original.TargetEnvironment;
            rollback.RollbackOfId = original.Id;
            rollback.Note = note;
            SetActor(rollback, ctx);
            foreach (PromotionRecordItem item in original.Items)
            {
                rollback.Items.Add(new PromotionRecordItem { DeploymentId = item.DeploymentId, DeploymentName = item.DeploymentName, AgentId = item.AgentId, PreviousRevisionId = item.NewRevisionId, NewRevisionId = item.PreviousRevisionId });
            }
            await ApplyAsync(rollback, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Promotion", rollback.Id, "Rolled back promotion " + original.Id + " in " + original.TargetEnvironment + " (" + rollback.Items.Count + " deployment(s)).", tenantId, token).ConfigureAwait(false);
            return rollback;
        }

        /// <summary>
        /// Write a promotion or rollback record and its repinning in one transaction, mapping data-layer refusals to
        /// conflicts.
        /// </summary>
        /// <param name="record">Record with items.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ConflictException">Thrown with PromotionConflict when a deployment disappeared or the reverted
        /// promotion was rolled back concurrently.</exception>
        public async Task<PromotionRecord> ApplyAsync(PromotionRecord record, CancellationToken token = default)
        {
            try
            {
                return await _Server.Database.Promotions.ApplyAsync(record, token).ConfigureAwait(false);
            }
            catch (InvalidOperationException e)
            {
                throw new ConflictException("PromotionConflict", e.Message + " Nothing was changed.");
            }
        }

        #endregion

        #region Private-Methods

        private async Task<Agent> ResolveAgentAsync(string tenantId, string idOrName, CancellationToken token)
        {
            if (String.IsNullOrEmpty(idOrName)) throw new ValidationException("The agent is required.", new Dictionary<string, string> { ["agentId"] = "Required." });
            Agent? agent = await _Server.Database.Agents.ReadAsync(tenantId, idOrName, token).ConfigureAwait(false)
                ?? await _Server.Database.Agents.ReadByNameAsync(tenantId, idOrName, token).ConfigureAwait(false);
            return agent ?? throw new NotFoundException("Agent " + idOrName + " not found.");
        }

        private async Task<AgentRevision> SourceRevisionAsync(string tenantId, Agent agent, PromotionRequest request, List<Deployment> deployments, string source, CancellationToken token)
        {
            if (!String.IsNullOrEmpty(request.AgentRevisionId))
            {
                AgentRevision? named = await _Server.Database.AgentRevisions.ReadAsync(tenantId, request.AgentRevisionId, token).ConfigureAwait(false);
                if (named == null || named.AgentId != agent.Id) throw new NotFoundException("Revision " + request.AgentRevisionId + " of agent " + agent.Name + " not found.");
                if (named.State != AgentRevisionStateEnum.Published) throw new ConflictException("RevisionNotPublished", "Revision " + named.Number + " of agent " + agent.Name + " is a draft. Publish it before promoting it.");
                return named;
            }

            List<Deployment> sources = deployments.Where(d => d.Environment == source).ToList();
            if (sources.Count == 0) throw new ConflictException("NoSourceRevision", "Agent " + agent.Name + " has no deployment in environment " + source + ", so there is no revision to promote. Name one with agentRevisionId.");
            HashSet<string> revisions = new HashSet<string>(StringComparer.Ordinal);
            foreach (Deployment deployment in sources) revisions.Add(deployment.AgentRevisionId ?? agent.LatestPublishedRevisionId ?? String.Empty);
            if (revisions.Count > 1) throw new ConflictException("AmbiguousSourceRevision", "Deployments of agent " + agent.Name + " in " + source + " run different revisions. Name the one to promote with agentRevisionId.");
            string revisionId = revisions.First();
            AgentRevision? revision = String.IsNullOrEmpty(revisionId) ? null : await _Server.Database.AgentRevisions.ReadAsync(tenantId, revisionId, token).ConfigureAwait(false);
            return revision ?? throw new ConflictException("NoSourceRevision", "Agent " + agent.Name + " has no published revision.");
        }

        private static int IndexOf(List<TenantEnvironment> order, string? name, string field)
        {
            for (int i = 0; i < order.Count; i++)
            {
                if (order[i].Name == name) return i;
            }
            ValidationException error = new ValidationException(
                "Environment " + name + " is not one of this tenant's environments (" + String.Join(", ", order.Select(e => e.Name)) + ").",
                new Dictionary<string, string> { [field] = "Unknown environment." },
                new Dictionary<string, string> { [field] = "UnknownEnvironment" });
            error.Code = "UnknownEnvironment";
            throw error;
        }

        private static void SetActor(PromotionRecord record, RequestContext ctx)
        {
            record.ActorType = ctx.PrincipalType;
            record.ActorId = ctx.UserId ?? ctx.CredentialId;
            record.ActorName = ctx.PrincipalName;
        }

        private async Task<List<Deployment>> AllDeploymentsAsync(string tenantId, CancellationToken token)
        {
            List<Deployment> all = new List<Deployment>();
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = 1000;
            while (true)
            {
                EnumerationResult<Deployment> page = await _Server.Database.Deployments.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
                all.AddRange(page.Objects);
                if (page.EndOfResults || page.Objects.Count == 0) break;
                query.Skip += page.Objects.Count;
            }
            return all;
        }

        #endregion
    }
}
