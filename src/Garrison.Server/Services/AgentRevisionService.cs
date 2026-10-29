namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;

    /// <summary>
    /// Agent revisions (AD1.2): the single open draft per agent, publish, list, read, discard, and field-level diff.
    /// Callers authorize the operation before entering this service. A published revision cannot change through any
    /// method here: drafts are the only rows written, and publish freezes them. Thread-safe.
    /// </summary>
    public class AgentRevisionService
    {
        #region Private-Members

        private readonly ServerContext _Server;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public AgentRevisionService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Enumerate an agent's revisions, newest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent in the tenant.</param>
        /// <param name="query">Query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public Task<EnumerationResult<AgentRevision>> EnumerateAsync(string tenantId, Agent agent, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            return _Server.Database.AgentRevisions.EnumerateAsync(tenantId, agent.Id, query ?? new EnumerationQuery(), token);
        }

        /// <summary>
        /// Read one revision of an agent by identifier or by number.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent in the tenant.</param>
        /// <param name="idOrNumber">Revision identifier (arv_...) or number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the agent has no such revision.</exception>
        public async Task<AgentRevision> ReadAsync(string tenantId, Agent agent, string idOrNumber, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            AgentRevision? revision = null;
            if (!String.IsNullOrEmpty(idOrNumber))
            {
                if (Int32.TryParse(idOrNumber, out int number)) revision = await _Server.Database.AgentRevisions.ReadByNumberAsync(tenantId, agent.Id, number, token).ConfigureAwait(false);
                else revision = await _Server.Database.AgentRevisions.ReadAsync(tenantId, idOrNumber, token).ConfigureAwait(false);
            }
            if (revision == null || revision.AgentId != agent.Id) throw new NotFoundException("Revision " + idOrNumber + " of agent " + agent.Name + " not found.");
            return revision;
        }

        /// <summary>
        /// Create the agent's draft or replace its content. Content fields come from the request; identity, number, state,
        /// hash, and publication fields are assigned by the server. Prompt pins must name templates the tenant can read,
        /// and pinned versions must exist.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent in the tenant.</param>
        /// <param name="content">Draft content.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored draft.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the content is invalid.</exception>
        /// <exception cref="ConflictException">Thrown with Protected when the agent is a protected built-in.</exception>
        public async Task<AgentRevision> SaveDraftAsync(RequestContext ctx, string tenantId, Agent agent, AgentRevision content, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            if (content == null) throw new ArgumentNullException(nameof(content));
            if (agent.IsProtected) throw new ConflictException("Protected", "Agent " + agent.Name + " is protected; clone it to change its definition.");

            content.TenantId = tenantId;
            content.AgentId = agent.Id;
            content.AuthorUserId = ctx.UserId;
            content.AuthorName = ctx.PrincipalName;
            await ValidateAsync(tenantId, agent, content, token).ConfigureAwait(false);
            AgentRevision draft = await _Server.Database.AgentRevisions.SaveDraftAsync(content, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, draft.Id, "Saved draft revision " + draft.Number + " of agent " + agent.Name + ".", token).ConfigureAwait(false);
            return draft;
        }

        /// <summary>
        /// Publish a draft revision. Refused with RevisionPublished when the revision is already published, and with
        /// RevisionUnchanged when its content equals the agent's latest published revision.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent in the tenant.</param>
        /// <param name="idOrNumber">Revision identifier or number.</param>
        /// <param name="changeNote">Optional change note that replaces the draft's note.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The published revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the agent has no such revision.</exception>
        /// <exception cref="ConflictException">Thrown with RevisionPublished or RevisionUnchanged.</exception>
        public async Task<AgentRevision> PublishAsync(RequestContext ctx, string tenantId, Agent agent, string idOrNumber, string? changeNote, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            AgentRevision revision = await ReadAsync(tenantId, agent, idOrNumber, token).ConfigureAwait(false);
            if (revision.State != AgentRevisionStateEnum.Draft) throw new ConflictException("RevisionPublished", "Revision " + revision.Number + " of agent " + agent.Name + " is already published and cannot change.");

            if (!String.IsNullOrEmpty(agent.LatestPublishedRevisionId))
            {
                AgentRevision? latest = await _Server.Database.AgentRevisions.ReadAsync(tenantId, agent.LatestPublishedRevisionId, token).ConfigureAwait(false);
                if (latest != null && String.Equals(latest.ContentHash, AgentRevisionContent.ComputeHash(revision), StringComparison.Ordinal))
                {
                    throw new ConflictException("RevisionUnchanged", "Draft revision " + revision.Number + " of agent " + agent.Name + " is the same as published revision " + latest.Number + ". Change it before publishing, or discard it.");
                }
            }

            if (changeNote != null)
            {
                if (changeNote.Length > 2000) throw new ValidationException("The change note is too long.", new Dictionary<string, string> { ["changeNote"] = "At most 2000 characters." });
                revision.ChangeNote = changeNote;
                await _Server.Database.AgentRevisions.SaveDraftAsync(revision, token).ConfigureAwait(false);
            }

            AgentRevision? published = await _Server.Database.AgentRevisions.PublishAsync(tenantId, revision.Id, ctx.UserId, ctx.PrincipalName, token).ConfigureAwait(false);
            if (published == null) throw new ConflictException("RevisionPublished", "Revision " + revision.Number + " of agent " + agent.Name + " was published by someone else.");
            await AuditAsync(ctx, tenantId, published.Id, "Published revision " + published.Number + " of agent " + agent.Name + ".", token).ConfigureAwait(false);
            return published;
        }

        /// <summary>
        /// Discard the agent's open draft.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent in the tenant.</param>
        /// <param name="idOrNumber">Draft revision identifier or number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the agent has no such revision.</exception>
        /// <exception cref="ConflictException">Thrown with RevisionPublished when the revision is published.</exception>
        public async Task DiscardAsync(RequestContext ctx, string tenantId, Agent agent, string idOrNumber, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            AgentRevision revision = await ReadAsync(tenantId, agent, idOrNumber, token).ConfigureAwait(false);
            if (revision.State != AgentRevisionStateEnum.Draft) throw new ConflictException("RevisionPublished", "Revision " + revision.Number + " of agent " + agent.Name + " is published and cannot be deleted.");
            await _Server.Database.AgentRevisions.DiscardDraftAsync(tenantId, revision.Id, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, revision.Id, "Discarded draft revision " + revision.Number + " of agent " + agent.Name + ".", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Field-level diff between two revisions of an agent. With no from, the revision before to is used; with no to,
        /// the open draft, or else the latest published revision, is used.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent in the tenant.</param>
        /// <param name="from">Older revision identifier or number, or null.</param>
        /// <param name="to">Newer revision identifier or number, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Diff.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="NotFoundException">Thrown when a revision does not exist.</exception>
        public async Task<AgentRevisionDiff> DiffAsync(string tenantId, Agent agent, string? from, string? to, CancellationToken token = default)
        {
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            string toKey = !String.IsNullOrEmpty(to) ? to : (agent.DraftRevisionId ?? agent.LatestPublishedRevisionId ?? String.Empty);
            AgentRevision newer = await ReadAsync(tenantId, agent, toKey, token).ConfigureAwait(false);
            AgentRevision older;
            if (!String.IsNullOrEmpty(from))
            {
                older = await ReadAsync(tenantId, agent, from, token).ConfigureAwait(false);
            }
            else
            {
                AgentRevision? previous = null;
                foreach (AgentRevision candidate in await _Server.Database.AgentRevisions.ListAsync(tenantId, agent.Id, token).ConfigureAwait(false))
                {
                    if (candidate.Number < newer.Number && candidate.State == AgentRevisionStateEnum.Published) previous = candidate;
                }
                older = previous ?? newer;
            }
            return AgentRevisionContent.Diff(older, newer);
        }

        /// <summary>
        /// The revision a deployment runs: its pin, or the agent's latest published revision when unpinned.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revision, or null when none can be resolved.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public async Task<AgentRevision?> EffectiveAsync(string tenantId, Deployment deployment, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            if (!String.IsNullOrEmpty(deployment.AgentRevisionId)) return await _Server.Database.AgentRevisions.ReadAsync(tenantId, deployment.AgentRevisionId, token).ConfigureAwait(false);
            Agent? agent = await _Server.Database.Agents.ReadAsync(tenantId, deployment.AgentId, token).ConfigureAwait(false);
            if (agent == null || String.IsNullOrEmpty(agent.LatestPublishedRevisionId)) return null;
            return await _Server.Database.AgentRevisions.ReadAsync(tenantId, agent.LatestPublishedRevisionId, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task ValidateAsync(string tenantId, Agent agent, AgentRevision content, CancellationToken token)
        {
            // The agent validator covers schemas and allow list names; it runs on a copy carrying the draft content.
            Agent copy = new Agent();
            copy.Name = agent.Name;
            copy.Kind = agent.Kind;
            copy.RemoteEndpointUrl = agent.RemoteEndpointUrl;
            AgentRevisionContent.ApplyTo(content, copy);
            ConfigurationValidator.Agent(copy);

            Dictionary<string, string> errors = new Dictionary<string, string>();
            if (content.ChangeNote != null && content.ChangeNote.Length > 2000) errors["changeNote"] = "At most 2000 characters.";
            HashSet<string> roles = new HashSet<string>(StringComparer.Ordinal);
            for (int i = 0; i < content.PromptPins.Count; i++)
            {
                AgentRevisionPromptPin pin = content.PromptPins[i];
                string key = "promptPins[" + i + "]";
                if (pin.Role != AgentRevisionContent.ToolDescriptionRole && pin.Role != AgentRevisionContent.SkillDescriptionRole)
                {
                    errors[key + ".role"] = "Role must be " + AgentRevisionContent.ToolDescriptionRole + " or " + AgentRevisionContent.SkillDescriptionRole + ".";
                    continue;
                }
                if (!roles.Add(pin.Role)) errors[key + ".role"] = "Each role can be pinned once.";
                PromptTemplate? template = String.IsNullOrEmpty(pin.TemplateId) ? null : await _Server.Database.PromptTemplates.ReadAsync(tenantId, pin.TemplateId, token).ConfigureAwait(false);
                if (template == null)
                {
                    errors[key + ".templateId"] = "Prompt template " + pin.TemplateId + " was not found.";
                    continue;
                }
                if (pin.PinnedVersion.HasValue && await _Server.Database.PromptTemplateVersions.ReadByVersionAsync(template.Id, pin.PinnedVersion.Value, token).ConfigureAwait(false) == null)
                {
                    errors[key + ".pinnedVersion"] = "Version " + pin.PinnedVersion.Value + " of prompt template " + template.Name + " does not exist.";
                }
            }
            HashSet<string> assets = new HashSet<string>(StringComparer.Ordinal);
            for (int i = 0; i < content.AssetPins.Count; i++)
            {
                AgentRevisionAssetPin pin = content.AssetPins[i];
                string key = "assetPins[" + i + "]";
                AgentAsset? asset = String.IsNullOrEmpty(pin.AssetId) ? null : await _Server.Database.AgentAssets.ReadAsync(tenantId, pin.AssetId, token).ConfigureAwait(false);
                if (asset == null && !String.IsNullOrEmpty(pin.AssetId)) asset = await _Server.Database.AgentAssets.ReadByNameAsync(tenantId, pin.AssetId, token).ConfigureAwait(false);
                if (asset == null)
                {
                    errors[key + ".assetId"] = "Asset " + pin.AssetId + " was not found.";
                    continue;
                }
                pin.AssetId = asset.Id;
                if (!assets.Add(asset.Id)) errors[key + ".assetId"] = "Asset " + asset.Name + " is pinned twice.";
                if (asset.Kind == AgentAssetKindEnum.SystemPrompt)
                {
                    if (pin.Version.HasValue && await _Server.Database.PromptTemplateVersions.ReadByVersionAsync(asset.PromptTemplateId ?? String.Empty, pin.Version.Value, token).ConfigureAwait(false) == null)
                    {
                        errors[key + ".version"] = "Version " + pin.Version.Value + " of the prompt template of asset " + asset.Name + " does not exist.";
                    }
                    continue;
                }
                if (pin.Version.HasValue && await _Server.Database.AgentAssets.ReadVersionAsync(tenantId, asset.Id, pin.Version.Value, token).ConfigureAwait(false) == null)
                {
                    errors[key + ".version"] = "Asset " + asset.Name + " has no version " + pin.Version.Value + ".";
                }
                else if (!pin.Version.HasValue && asset.CurrentVersion == 0)
                {
                    errors[key + ".version"] = "Asset " + asset.Name + " has no uploaded version yet.";
                }
            }
            if (content.AssetPins.Count > 1)
            {
                int systemPrompts = 0;
                foreach (AgentRevisionAssetPin pin in content.AssetPins)
                {
                    AgentAsset? asset = await _Server.Database.AgentAssets.ReadAsync(tenantId, pin.AssetId, token).ConfigureAwait(false);
                    if (asset != null && asset.Kind == AgentAssetKindEnum.SystemPrompt) systemPrompts++;
                }
                if (systemPrompts > 1) errors["assetPins"] = "A revision can pin at most one SystemPrompt asset.";
            }
            for (int i = 0; i < content.Capabilities.Count; i++)
            {
                if (String.IsNullOrWhiteSpace(content.Capabilities[i]) || content.Capabilities[i].Length > 256) errors["capabilities[" + i + "]"] = "Capability names are 1 to 256 characters.";
            }
            for (int i = 0; i < content.Tags.Count; i++)
            {
                if (String.IsNullOrWhiteSpace(content.Tags[i]) || content.Tags[i].Length > 128) errors["tags[" + i + "]"] = "Tags are 1 to 128 characters.";
            }
            if (errors.Count > 0) throw new ValidationException("The revision is invalid.", errors);
        }

        private Task AuditAsync(RequestContext ctx, string tenantId, string id, string description, CancellationToken token)
        {
            return _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "AgentRevision", id, description, tenantId, token);
        }

        #endregion
    }
}
