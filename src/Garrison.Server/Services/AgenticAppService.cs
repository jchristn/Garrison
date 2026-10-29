namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;

    /// <summary>
    /// Agentic apps (AD6): validation of members, edges, and entry deployments; delegation policies derived from the
    /// app graph (AD6.3); and app revisions (AD6.4). Members, edges, and the entry agent may be given by agent name or
    /// identifier; they are stored by identifier. Thread-safe.
    /// </summary>
    public class AgenticAppService
    {
        #region Private-Members

        private static readonly Regex _NamePattern = new Regex("^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$", RegexOptions.CultureInvariant);
        private static readonly Regex _SlugPattern = new Regex("^[a-z0-9][a-z0-9-]{1,62}$", RegexOptions.CultureInvariant);
        private static readonly Regex _ColorPattern = new Regex("^#[0-9A-Fa-f]{6}$", RegexOptions.CultureInvariant);
        private readonly ServerContext _Server;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public AgenticAppService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Resolve a tenant's app by identifier or name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="idOrName">Identifier (app_) or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>App.</returns>
        /// <exception cref="NotFoundException">Thrown when the tenant has no such app.</exception>
        public async Task<AgenticApp> ResolveAsync(string tenantId, string? idOrName, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            AgenticApp? app = null;
            if (!String.IsNullOrWhiteSpace(idOrName))
            {
                app = idOrName.StartsWith(Garrison.Core.Constants.AgenticAppIdPrefix, StringComparison.Ordinal)
                    ? await _Server.Database.Apps.ReadAsync(tenantId, idOrName, token).ConfigureAwait(false)
                    : null;
                app ??= await _Server.Database.Apps.ReadByNameAsync(tenantId, idOrName, token).ConfigureAwait(false);
            }
            return app ?? throw new NotFoundException("App " + idOrName + " not found.");
        }

        /// <summary>
        /// Create an app after validating it.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">App content.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Stored app.</returns>
        /// <exception cref="ValidationException">Thrown when the app is not valid (field codes name the problem).</exception>
        /// <exception cref="ConflictException">Thrown with NameConflict or AppSlugTaken.</exception>
        public async Task<AgenticApp> CreateAsync(RequestContext ctx, string tenantId, AgenticApp request, CancellationToken token)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            AgenticApp app = new AgenticApp();
            app.TenantId = tenantId;
            Copy(request, app);
            await ValidateAsync(tenantId, app, null, token).ConfigureAwait(false);
            if (await _Server.Database.Apps.ReadByNameAsync(tenantId, app.Name, token).ConfigureAwait(false) != null) throw new ConflictException("NameConflict", "An app named " + app.Name + " already exists.");
            if (await _Server.Database.Apps.SlugTakenAsync(app.Slug, null, token).ConfigureAwait(false)) throw new ConflictException("AppSlugTaken", "The URL slug " + app.Slug + " is taken. Slugs are unique across the cluster; choose another.");
            AgenticApp created = await _Server.Database.Apps.CreateAsync(app, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, created.Id, "Created app " + created.Name + ".", token).ConfigureAwait(false);
            return await _Server.Database.Apps.ReadAsync(tenantId, created.Id, token).ConfigureAwait(false) ?? created;
        }

        /// <summary>
        /// Replace an app's content after validating it. The published revision pointer is kept.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="existing">Stored app.</param>
        /// <param name="request">New content.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Stored app.</returns>
        /// <exception cref="ValidationException">Thrown when the app is not valid.</exception>
        /// <exception cref="ConflictException">Thrown with NameConflict or AppSlugTaken.</exception>
        public async Task<AgenticApp> UpdateAsync(RequestContext ctx, string tenantId, AgenticApp existing, AgenticApp request, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (request == null) throw new ArgumentNullException(nameof(request));
            Copy(request, existing);
            await ValidateAsync(tenantId, existing, existing.Id, token).ConfigureAwait(false);
            AgenticApp? byName = await _Server.Database.Apps.ReadByNameAsync(tenantId, existing.Name, token).ConfigureAwait(false);
            if (byName != null && byName.Id != existing.Id) throw new ConflictException("NameConflict", "An app named " + existing.Name + " already exists.");
            if (await _Server.Database.Apps.SlugTakenAsync(existing.Slug, existing.Id, token).ConfigureAwait(false)) throw new ConflictException("AppSlugTaken", "The URL slug " + existing.Slug + " is taken. Slugs are unique across the cluster; choose another.");
            await _Server.Database.Apps.UpdateAsync(existing, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, existing.Id, "Updated app " + existing.Name + ".", token).ConfigureAwait(false);
            return await _Server.Database.Apps.ReadAsync(tenantId, existing.Id, token).ConfigureAwait(false) ?? existing;
        }

        /// <summary>
        /// Delete an app with its revisions. Its members, deployments, and conversations stay.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="existing">Stored app.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(RequestContext ctx, string tenantId, AgenticApp existing, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            await _Server.Database.Apps.DeleteAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, existing.Id, "Deleted app " + existing.Name + ".", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Derive every member's delegation policy from the app graph (AD6.3): AllowList with the members it has edges to
        /// and the longest path below it as its maximum depth, or None for a member with no edges. With apply, write the
        /// policy into a draft revision of each member whose published policy differs; an open draft that already changes
        /// the member's delegation another way is left alone and reported as DraftConflict. Nothing is published.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="app">App.</param>
        /// <param name="apply">Whether to write drafts.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The plan, with drift and the drafts written.</returns>
        public async Task<AppDelegationPlan> DelegationAsync(RequestContext ctx, string tenantId, AgenticApp app, bool apply, CancellationToken token)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            AppDelegationPlan plan = new AppDelegationPlan { AppId = app.Id, Applied = apply };
            Dictionary<string, Agent> agents = new Dictionary<string, Agent>(StringComparer.Ordinal);
            foreach (AgenticAppMember member in app.Members)
            {
                Agent? agent = await _Server.Database.Agents.ReadAsync(tenantId, member.AgentId, token).ConfigureAwait(false);
                if (agent != null) agents[agent.Id] = agent;
            }
            AgentRevisionService revisions = _Server.Get<AgentRevisionService>();
            foreach (AgenticAppMember member in app.Members)
            {
                if (!agents.TryGetValue(member.AgentId, out Agent? agent)) continue;
                List<string> callees = app.Edges.Where(e => e.CallerAgentId == agent.Id).Select(e => e.CalleeAgentId).Distinct(StringComparer.Ordinal)
                    .Where(agents.ContainsKey).Select(id => agents[id].Name).OrderBy(n => n, StringComparer.Ordinal).ToList();
                AppDelegationMember item = new AppDelegationMember
                {
                    AgentId = agent.Id, AgentName = agent.Name, DesiredAllowList = callees,
                    DesiredMode = callees.Count > 0 ? DelegationModeEnum.AllowList : DelegationModeEnum.None,
                    DesiredMaxDepth = Depth(app, agent.Id, new HashSet<string>(StringComparer.Ordinal))
                };
                AgentRevision? published = String.IsNullOrEmpty(agent.LatestPublishedRevisionId) ? null : await _Server.Database.AgentRevisions.ReadAsync(tenantId, agent.LatestPublishedRevisionId, token).ConfigureAwait(false);
                if (published != null)
                {
                    item.PublishedMode = published.DelegationMode;
                    item.PublishedAllowList = published.DelegationAllowList.OrderBy(n => n, StringComparer.Ordinal).ToList();
                    item.PublishedMaxDepth = published.DelegationMaxDepth;
                }
                item.Drift = published == null || !Matches(published, item);
                if (apply && item.Drift && published != null)
                {
                    AgentRevision? draft = String.IsNullOrEmpty(agent.DraftRevisionId) ? null : await _Server.Database.AgentRevisions.ReadAsync(tenantId, agent.DraftRevisionId, token).ConfigureAwait(false);
                    AgentRevision content;
                    if (draft == null)
                    {
                        content = published;
                        content.ChangeNote = "Delegation derived from app " + app.Name + ".";
                    }
                    else if (Matches(draft, item))
                    {
                        item.DraftRevisionNumber = draft.Number;
                        plan.Members.Add(item);
                        continue;
                    }
                    else if (SameDelegation(draft, published))
                    {
                        content = draft;
                    }
                    else
                    {
                        item.SkippedReason = "DraftConflict";
                        plan.Members.Add(item);
                        continue;
                    }
                    content.Id = String.Empty;
                    content.DelegationMode = item.DesiredMode;
                    content.DelegationAllowList = new List<string>(item.DesiredAllowList);
                    content.DelegationMaxDepth = Math.Max(item.DesiredMaxDepth, item.DesiredMode == DelegationModeEnum.None ? 0 : 1);
                    AgentRevision saved = await revisions.SaveDraftAsync(ctx, tenantId, agent, content, token).ConfigureAwait(false);
                    item.DraftRevisionNumber = saved.Number;
                }
                plan.Members.Add(item);
            }
            return plan;
        }

        /// <summary>
        /// Take an app revision (AD6.4): pin every member's latest published agent revision and copy the edges. The
        /// revision is a draft until published.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="app">App.</param>
        /// <param name="changeNote">Change note, up to 2000 characters, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft revision.</returns>
        /// <exception cref="ConflictException">Thrown with NoPublishedRevision naming a member without one.</exception>
        public async Task<AppRevision> CreateRevisionAsync(RequestContext ctx, string tenantId, AgenticApp app, string? changeNote, CancellationToken token)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            if (changeNote != null && changeNote.Length > 2000) throw new ValidationException("The change note is too long.", new Dictionary<string, string> { ["changeNote"] = "At most 2000 characters." });
            AppRevision revision = new AppRevision { TenantId = tenantId, AppId = app.Id, AuthorName = ctx?.PrincipalName, ChangeNote = String.IsNullOrWhiteSpace(changeNote) ? null : changeNote.Trim() };
            foreach (AgenticAppMember member in app.Members)
            {
                Agent agent = await _Server.Database.Agents.ReadAsync(tenantId, member.AgentId, token).ConfigureAwait(false) ?? throw new NotFoundException("Member " + member.AgentId + " no longer exists.");
                if (String.IsNullOrEmpty(agent.LatestPublishedRevisionId)) throw new ConflictException("NoPublishedRevision", "Member " + agent.Name + " has no published revision to pin.");
                revision.Members.Add(new AppRevisionMember { AgentId = agent.Id, AgentName = agent.Name, AgentRevisionId = agent.LatestPublishedRevisionId });
            }
            revision.Edges = app.Edges.Select(e => new AgenticAppEdge { CallerAgentId = e.CallerAgentId, CalleeAgentId = e.CalleeAgentId, FanOutAllowed = e.FanOutAllowed }).ToList();
            AppRevision created = await _Server.Database.Apps.CreateRevisionAsync(revision, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, app.Id, "Created revision " + created.Number + " of app " + app.Name + ".", token).ConfigureAwait(false);
            return await _Server.Database.Apps.ReadRevisionAsync(tenantId, created.Id, token).ConfigureAwait(false) ?? created;
        }

        /// <summary>
        /// Resolve an app revision by identifier or number.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="app">App.</param>
        /// <param name="idOrNumber">Identifier (apv_) or number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revision.</returns>
        /// <exception cref="NotFoundException">Thrown when the app has no such revision.</exception>
        public async Task<AppRevision> ResolveRevisionAsync(string tenantId, AgenticApp app, string? idOrNumber, CancellationToken token)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            List<AppRevision> all = await _Server.Database.Apps.ListRevisionsAsync(tenantId, app.Id, token).ConfigureAwait(false);
            AppRevision? found = all.FirstOrDefault(r => r.Id == idOrNumber)
                ?? (Int32.TryParse(idOrNumber, out int number) ? all.FirstOrDefault(r => r.Number == number) : null);
            return found ?? throw new NotFoundException("App " + app.Name + " has no revision " + idOrNumber + ".");
        }

        /// <summary>
        /// Publish a draft app revision; it becomes the app's latest.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="app">App.</param>
        /// <param name="revision">Draft revision.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The published revision.</returns>
        /// <exception cref="ConflictException">Thrown with RevisionPublished when it is already published.</exception>
        public async Task<AppRevision> PublishRevisionAsync(RequestContext ctx, string tenantId, AgenticApp app, AppRevision revision, CancellationToken token)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            if (!await _Server.Database.Apps.PublishRevisionAsync(tenantId, revision.Id, ctx?.PrincipalName, token).ConfigureAwait(false))
                throw new ConflictException("RevisionPublished", "Revision " + revision.Number + " of app " + app.Name + " is already published.");
            await AuditAsync(ctx, tenantId, app.Id, "Published revision " + revision.Number + " of app " + app.Name + ".", token).ConfigureAwait(false);
            return await _Server.Database.Apps.ReadRevisionAsync(tenantId, revision.Id, token).ConfigureAwait(false) ?? revision;
        }

        /// <summary>
        /// The entry deployment the app uses in its live environment: the one named for that environment, or the entry
        /// agent's deployment in it (the first by name), or null when there is none.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Deployment or null.</returns>
        public async Task<Deployment?> LiveDeploymentAsync(AgenticApp app, CancellationToken token)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            AgenticAppEnvironment? selected = app.Environments.FirstOrDefault(e => e.Environment == app.LiveEnvironment);
            if (selected != null && !String.IsNullOrEmpty(selected.DeploymentId))
            {
                Deployment? named = await _Server.Database.Deployments.ReadAsync(app.TenantId, selected.DeploymentId, token).ConfigureAwait(false);
                if (named != null && named.Active) return named;
            }
            List<Deployment> deployments = await _Server.Database.Deployments.ListByAgentAsync(app.TenantId, app.EntryAgentId, token).ConfigureAwait(false);
            return deployments.Where(d => d.Active && d.Environment == app.LiveEnvironment).OrderBy(d => d.Name, StringComparer.Ordinal).FirstOrDefault();
        }

        #endregion

        #region Private-Methods

        private static void Copy(AgenticApp from, AgenticApp to)
        {
            to.Name = (from.Name ?? String.Empty).Trim();
            to.Slug = String.IsNullOrWhiteSpace(from.Slug) ? to.Name : from.Slug.Trim();
            to.Description = String.IsNullOrWhiteSpace(from.Description) ? null : from.Description;
            to.EntryAgentId = (from.EntryAgentId ?? String.Empty).Trim();
            to.LiveEnvironment = String.IsNullOrWhiteSpace(from.LiveEnvironment) ? "dev" : from.LiveEnvironment.Trim();
            to.AuthMode = from.AuthMode;
            to.AnonymousEnabled = from.AnonymousEnabled;
            to.ShowOperatorDetail = from.ShowOperatorDetail;
            to.DisplayName = String.IsNullOrWhiteSpace(from.DisplayName) ? null : from.DisplayName.Trim();
            to.LogoAssetId = String.IsNullOrWhiteSpace(from.LogoAssetId) ? null : from.LogoAssetId.Trim();
            to.PrimaryColor = String.IsNullOrWhiteSpace(from.PrimaryColor) ? null : from.PrimaryColor.Trim();
            to.AccentColor = String.IsNullOrWhiteSpace(from.AccentColor) ? null : from.AccentColor.Trim();
            to.WelcomeText = String.IsNullOrWhiteSpace(from.WelcomeText) ? null : from.WelcomeText;
            to.Members = from.Members.Select(m => new AgenticAppMember { AgentId = (m.AgentId ?? String.Empty).Trim(), Role = String.IsNullOrWhiteSpace(m.Role) ? null : m.Role.Trim() }).ToList();
            to.Edges = from.Edges.Select(e => new AgenticAppEdge { CallerAgentId = (e.CallerAgentId ?? String.Empty).Trim(), CalleeAgentId = (e.CalleeAgentId ?? String.Empty).Trim(), FanOutAllowed = e.FanOutAllowed }).ToList();
            to.Environments = from.Environments.Select(e => new AgenticAppEnvironment { Environment = (e.Environment ?? String.Empty).Trim(), DeploymentId = String.IsNullOrWhiteSpace(e.DeploymentId) ? null : e.DeploymentId.Trim() }).ToList();
            to.Active = from.Active;
        }

        private async Task ValidateAsync(string tenantId, AgenticApp app, string? appId, CancellationToken token)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>(StringComparer.Ordinal);
            Dictionary<string, string> codes = new Dictionary<string, string>(StringComparer.Ordinal);
            void Fail(string field, string code, string message)
            {
                if (errors.ContainsKey(field)) return;
                errors[field] = message;
                codes[field] = code;
            }
            if (!_NamePattern.IsMatch(app.Name)) Fail("name", "InvalidName", "1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.");
            if (!_SlugPattern.IsMatch(app.Slug)) Fail("slug", "InvalidSlug", "2 to 63 lowercase letters, digits, and hyphens, starting with a letter or digit.");
            if (app.Description != null && app.Description.Length > 4000) Fail("description", "TooLong", "At most 4000 characters.");
            if (app.DisplayName != null && app.DisplayName.Length > 128) Fail("displayName", "TooLong", "At most 128 characters.");
            if (app.WelcomeText != null && app.WelcomeText.Length > 4000) Fail("welcomeText", "TooLong", "At most 4000 characters.");
            if (app.PrimaryColor != null && !_ColorPattern.IsMatch(app.PrimaryColor)) Fail("primaryColor", "InvalidColor", "A color is #RRGGBB.");
            if (app.AccentColor != null && !_ColorPattern.IsMatch(app.AccentColor)) Fail("accentColor", "InvalidColor", "A color is #RRGGBB.");
            if (app.LogoAssetId != null)
            {
                AgentAsset? logo = await _Server.Database.AgentAssets.ReadAsync(tenantId, app.LogoAssetId, token).ConfigureAwait(false)
                    ?? await _Server.Database.AgentAssets.ReadByNameAsync(tenantId, app.LogoAssetId, token).ConfigureAwait(false);
                if (logo == null) Fail("logoAssetId", "UnknownAsset", "No agent asset " + app.LogoAssetId + " in this tenant.");
                else app.LogoAssetId = logo.Id;
            }

            // Members, entry, and edges may name agents; store identifiers.
            Dictionary<string, string> ids = new Dictionary<string, string>(StringComparer.Ordinal);
            async Task<string?> Resolve(string reference)
            {
                if (String.IsNullOrEmpty(reference)) return null;
                if (ids.TryGetValue(reference, out string? known)) return known;
                Agent? agent = reference.StartsWith("agt_", StringComparison.Ordinal) ? await _Server.Database.Agents.ReadAsync(tenantId, reference, token).ConfigureAwait(false) : null;
                agent ??= await _Server.Database.Agents.ReadByNameAsync(tenantId, reference, token).ConfigureAwait(false);
                if (agent == null) return null;
                ids[reference] = agent.Id;
                ids[agent.Id] = agent.Id;
                return agent.Id;
            }
            if (app.Members.Count == 0) Fail("members", "Required", "An app has at least one member.");
            if (app.Members.Count > 100) Fail("members", "TooMany", "An app has at most 100 members.");
            for (int i = 0; i < app.Members.Count; i++)
            {
                string? id = await Resolve(app.Members[i].AgentId).ConfigureAwait(false);
                if (id == null) Fail("members[" + i + "].agentId", "UnknownAgent", "No agent " + app.Members[i].AgentId + " in this tenant.");
                else app.Members[i].AgentId = id;
                if (app.Members[i].Role != null && app.Members[i].Role!.Length > 256) Fail("members[" + i + "].role", "TooLong", "At most 256 characters.");
            }
            if (app.Members.Select(m => m.AgentId).Distinct(StringComparer.Ordinal).Count() != app.Members.Count) Fail("members", "DuplicateMember", "Each agent is a member once.");
            HashSet<string> memberIds = new HashSet<string>(app.Members.Select(m => m.AgentId), StringComparer.Ordinal);
            string? entry = await Resolve(app.EntryAgentId).ConfigureAwait(false);
            if (entry == null || !memberIds.Contains(entry)) Fail("entryAgentId", "EntryNotMember", "The entry agent must be one of the members.");
            else app.EntryAgentId = entry;
            for (int i = 0; i < app.Edges.Count; i++)
            {
                string? caller = await Resolve(app.Edges[i].CallerAgentId).ConfigureAwait(false);
                string? callee = await Resolve(app.Edges[i].CalleeAgentId).ConfigureAwait(false);
                if (caller == null || !memberIds.Contains(caller)) Fail("edges[" + i + "].callerAgentId", "EdgeNotMember", "Edges connect members.");
                else app.Edges[i].CallerAgentId = caller;
                if (callee == null || !memberIds.Contains(callee)) Fail("edges[" + i + "].calleeAgentId", "EdgeNotMember", "Edges connect members.");
                else app.Edges[i].CalleeAgentId = callee;
                if (caller != null && caller == callee) Fail("edges[" + i + "]", "SelfEdge", "A member does not call itself.");
            }
            if (errors.Count == 0)
            {
                if (HasCycle(app)) Fail("edges", "AppGraphCycle", "The calls between members form a cycle.");
                List<string> unreachable = Unreachable(app);
                if (unreachable.Count > 0)
                {
                    List<string> names = new List<string>();
                    foreach (string id in unreachable) names.Add((await _Server.Database.Agents.ReadAsync(tenantId, id, token).ConfigureAwait(false))?.Name ?? id);
                    Fail("edges", "UnreachableMember", "Members the entry agent cannot reach through edges: " + String.Join(", ", names) + ".");
                }
            }

            List<TenantEnvironment> environments = (await _Server.Get<PromotionService>().ListEnvironmentsAsync(tenantId, token).ConfigureAwait(false)).Environments;
            HashSet<string> known = new HashSet<string>(environments.Select(e => e.Name), StringComparer.Ordinal);
            if (!known.Contains(app.LiveEnvironment)) Fail("liveEnvironment", "UnknownEnvironment", "Environments are " + String.Join(", ", known) + ".");
            for (int i = 0; i < app.Environments.Count; i++)
            {
                AgenticAppEnvironment env = app.Environments[i];
                if (!known.Contains(env.Environment)) Fail("environments[" + i + "].environment", "UnknownEnvironment", "Environments are " + String.Join(", ", known) + ".");
                if (env.DeploymentId != null)
                {
                    Deployment? deployment = await _Server.Database.Deployments.ReadAsync(tenantId, env.DeploymentId, token).ConfigureAwait(false);
                    if (deployment == null || deployment.AgentId != app.EntryAgentId || deployment.Environment != env.Environment)
                        Fail("environments[" + i + "].deploymentId", "InvalidEntryDeployment", "The deployment must be the entry agent's, in environment " + env.Environment + ".");
                }
            }
            if (app.Environments.Select(e => e.Environment).Distinct(StringComparer.Ordinal).Count() != app.Environments.Count) Fail("environments", "DuplicateEnvironment", "List each environment once.");
            if (errors.Count > 0) throw new ValidationException("The app is not valid: " + String.Join(" ", errors.Select(e => e.Key + ": " + e.Value)), errors, codes);
        }

        private static bool HasCycle(AgenticApp app)
        {
            Dictionary<string, int> state = new Dictionary<string, int>(StringComparer.Ordinal);
            bool Visit(string id)
            {
                if (state.TryGetValue(id, out int s)) return s == 1;
                state[id] = 1;
                foreach (AgenticAppEdge edge in app.Edges.Where(e => e.CallerAgentId == id))
                {
                    if (Visit(edge.CalleeAgentId)) return true;
                }
                state[id] = 2;
                return false;
            }
            return app.Members.Any(m => Visit(m.AgentId));
        }

        private static List<string> Unreachable(AgenticApp app)
        {
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal) { app.EntryAgentId };
            Queue<string> queue = new Queue<string>();
            queue.Enqueue(app.EntryAgentId);
            while (queue.Count > 0)
            {
                string id = queue.Dequeue();
                foreach (AgenticAppEdge edge in app.Edges.Where(e => e.CallerAgentId == id))
                {
                    if (seen.Add(edge.CalleeAgentId)) queue.Enqueue(edge.CalleeAgentId);
                }
            }
            return app.Members.Select(m => m.AgentId).Where(id => !seen.Contains(id)).ToList();
        }

        private static int Depth(AgenticApp app, string id, HashSet<string> path)
        {
            if (!path.Add(id)) return 0;
            int depth = 0;
            foreach (AgenticAppEdge edge in app.Edges.Where(e => e.CallerAgentId == id)) depth = Math.Max(depth, 1 + Depth(app, edge.CalleeAgentId, path));
            path.Remove(id);
            return depth;
        }

        private static bool Matches(AgentRevision revision, AppDelegationMember desired)
        {
            if (revision.DelegationMode != desired.DesiredMode) return false;
            if (desired.DesiredMode == DelegationModeEnum.None) return true;
            return revision.DelegationAllowList.OrderBy(n => n, StringComparer.Ordinal).SequenceEqual(desired.DesiredAllowList, StringComparer.Ordinal)
                && revision.DelegationMaxDepth == Math.Max(desired.DesiredMaxDepth, 1);
        }

        private static bool SameDelegation(AgentRevision a, AgentRevision b)
        {
            return a.DelegationMode == b.DelegationMode && a.DelegationMaxDepth == b.DelegationMaxDepth && a.DelegationAllowRecursion == b.DelegationAllowRecursion
                && a.DelegationAllowList.OrderBy(n => n, StringComparer.Ordinal).SequenceEqual(b.DelegationAllowList.OrderBy(n => n, StringComparer.Ordinal), StringComparer.Ordinal);
        }

        private async Task AuditAsync(RequestContext? ctx, string tenantId, string appId, string message, CancellationToken token)
        {
            if (ctx == null) return;
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "AgenticApp", appId, message, tenantId, token).ConfigureAwait(false);
        }

        #endregion
    }
}
