namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Routes;
    using Garrison.Server.Runtime;

    /// <summary>
    /// The studio playground (AD9.1): runs an agent's draft revision before it is published, on an ephemeral deployment in
    /// the reserved draft environment that copies one of the agent's deployments. Playground runs are of kind Playground,
    /// keep conversations and file spaces like any run, are left out of capability hints, and never reach an app UI.
    /// Thread-safe.
    /// </summary>
    public class PlaygroundService
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly SemaphoreSlim _Lock = new SemaphoreSlim(1, 1);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public PlaygroundService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Run an agent revision in the playground.
        /// </summary>
        /// <param name="ctx">Caller (authorized to execute the agent).</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent.</param>
        /// <param name="request">Input, revision, source deployment, conversation, and wait.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The run.</returns>
        /// <exception cref="ValidationException">Thrown with NoDeployment when the agent has no deployment to copy, or UnknownRevision.</exception>
        public async Task<Run> InvokeAsync(RequestContext ctx, string tenantId, Agent agent, PlaygroundInvokeRequest request, CancellationToken token)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            if (request == null) throw new ArgumentNullException(nameof(request));
            string? revisionId = !String.IsNullOrEmpty(request.AgentRevisionId) ? request.AgentRevisionId : agent.DraftRevisionId ?? agent.LatestPublishedRevisionId;
            if (!String.IsNullOrEmpty(revisionId))
            {
                AgentRevision? revision = await _Server.Database.AgentRevisions.ReadAsync(tenantId, revisionId, token).ConfigureAwait(false);
                if (revision == null || revision.AgentId != agent.Id) throw Invalid("agentRevisionId", "UnknownRevision", "Revision " + revisionId + " does not belong to agent " + agent.Name + ".");
            }
            Deployment playground = await EphemeralAsync(tenantId, agent, request.SourceDeploymentId, revisionId, token).ConfigureAwait(false);
            InvocationOptions options = new InvocationOptions
            {
                Input = request.Input, DeploymentId = playground.Id, Kind = RunKindEnum.Playground, ConversationId = request.ConversationId,
                StartConversation = String.IsNullOrEmpty(request.ConversationId), Wait = request.Wait, WaitSeconds = request.WaitSeconds, Surface = "playground"
            };
            return await _Server.Get<AgentInvoker>().InvokeAsync(ctx, tenantId, agent, options, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Run a studio draft's agent in the playground: the draft's document for that agent becomes the agent's draft
        /// revision first (live configuration is not changed), then that revision runs.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draft">Studio draft.</param>
        /// <param name="request">Request; Agent defaults to the draft's target app entry agent.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The run.</returns>
        /// <exception cref="ValidationException">Thrown with AgentNotLive when the agent does not exist yet, or NoEntryAgent.</exception>
        public async Task<Run> InvokeDraftAsync(RequestContext ctx, string tenantId, StudioDraft draft, PlaygroundInvokeRequest request, CancellationToken token)
        {
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            if (request == null) throw new ArgumentNullException(nameof(request));
            string? agentName = request.Agent;
            if (String.IsNullOrWhiteSpace(agentName))
            {
                StudioGraphNodeEntry(draft, out agentName);
                if (String.IsNullOrEmpty(agentName)) throw Invalid("agent", "NoEntryAgent", "Name the agent to run; the draft has no target app with an entry agent.");
            }
            Agent agent = await _Server.Database.Agents.ReadByNameAsync(tenantId, agentName, token).ConfigureAwait(false)
                ?? await _Server.Database.Agents.ReadAsync(tenantId, agentName, token).ConfigureAwait(false)
                ?? throw Invalid("agent", "AgentNotLive", "Agent " + agentName + " does not exist yet. Apply the draft that creates it, then try its changes in the playground.");
            StudioDraftItem? item = draft.Items.FirstOrDefault(i => i.Kind == "Agent" && i.Name == agent.Name && i.Operation == StudioDraftOperationEnum.Upsert);
            if (item != null)
            {
                // Write the draft's document as the agent's draft revision (AD1.7 revision.publish false): live stays as is.
                ManifestDocument document = ManifestParser.Parse(item.Document)[0];
                document.Spec["revision"] = new Dictionary<string, object?> { ["publish"] = false, ["changeNote"] = "Playground: studio draft " + draft.Title };
                Dictionary<string, object?> metadata = new Dictionary<string, object?> { ["name"] = agent.Name };
                if (document.Metadata.Description != null) metadata["description"] = document.Metadata.Description;
                string bundle = ManifestParser.ToYaml(new[] { new Dictionary<string, object?> { ["apiVersion"] = "garrison/v1", ["kind"] = "Agent", ["metadata"] = metadata, ["spec"] = document.Spec } });
                ManifestApplyOptions options = new ManifestApplyOptions { PrincipalName = ctx.PrincipalName, PrincipalType = ctx.PrincipalType, PrincipalId = ctx.PrincipalId, SecretUse = _Server.Authorization.SecretUse(ctx, tenantId) };
                ManifestApply applied = await _Server.Get<ManifestService>().ApplyAsync(tenantId, bundle, options, token).ConfigureAwait(false);
                if (applied.FailedCount > 0) throw Invalid("agent", "DraftInvalid", "The draft's document for " + agent.Name + " does not validate: " + String.Join("; ", applied.Items.Where(i => i.Result == ManifestApplyResultEnum.Failed).Select(i => i.Message)));
                agent = await _Server.Database.Agents.ReadAsync(tenantId, agent.Id, token).ConfigureAwait(false) ?? agent;
                request.AgentRevisionId = agent.DraftRevisionId ?? request.AgentRevisionId;
            }
            return await InvokeAsync(ctx, tenantId, agent, request, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private static void StudioGraphNodeEntry(StudioDraft draft, out string? agentName)
        {
            agentName = null;
            if (String.IsNullOrEmpty(draft.TargetApp)) return;
            StudioDraftItem? app = draft.Items.FirstOrDefault(i => i.Kind == "AgenticApp" && i.Name == draft.TargetApp && i.Operation == StudioDraftOperationEnum.Upsert);
            if (app == null) return;
            List<ManifestDocument> parsed = ManifestParser.Parse(app.Document);
            if (parsed.Count == 1 && parsed[0].Spec.TryGetValue("entry", out object? entry) && entry != null) agentName = Garrison.Core.Templates.TemplateValues.ToText(entry);
        }

        private async Task<Deployment> EphemeralAsync(string tenantId, Agent agent, string? sourceDeploymentId, string? revisionId, CancellationToken token)
        {
            List<Deployment> deployments = await ConfigurationSupport.DeploymentsAsync(_Server, tenantId, d => d.AgentId == agent.Id, token).ConfigureAwait(false);
            Deployment? source = !String.IsNullOrEmpty(sourceDeploymentId)
                ? deployments.FirstOrDefault(d => d.Id == sourceDeploymentId || d.Name == sourceDeploymentId)
                : deployments.Where(d => d.Environment != Constants.PlaygroundEnvironment).OrderBy(d => d.Environment == "dev" ? 0 : 1).ThenBy(d => d.Name, StringComparer.Ordinal).FirstOrDefault();
            if (source == null || source.Environment == Constants.PlaygroundEnvironment)
                throw Invalid("sourceDeploymentId", "NoDeployment", "Agent " + agent.Name + " has no deployment for the playground to copy. Create one (for example in dev) first.");

            string name = "playground-" + agent.Name;
            if (name.Length > 64) name = name.Substring(0, 64).TrimEnd('-');
            await _Lock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                Deployment? existing = deployments.FirstOrDefault(d => d.Name == name && d.Environment == Constants.PlaygroundEnvironment);
                Deployment copy = Serializer.Deserialize<Deployment>(Serializer.Serialize(source)) ?? throw new InvalidOperationException("Could not copy deployment " + source.Name + ".");
                foreach (DeploymentApprovalRule rule in copy.ApprovalRules) rule.Id = String.Empty;
                copy.Id = existing?.Id ?? String.Empty;
                copy.Name = name;
                copy.Description = "Playground copy of " + source.Name + " (managed by the studio).";
                copy.Environment = Constants.PlaygroundEnvironment;
                copy.AgentRevisionId = revisionId;
                copy.IsProtected = true;
                copy.ConfigVersion = (existing?.ConfigVersion ?? 0) + 1;
                copy.LastUpdateUtc = DateTime.UtcNow;
                if (existing == null)
                {
                    copy.CreatedUtc = DateTime.UtcNow;
                    return await _Server.Database.Deployments.CreateAsync(copy, token).ConfigureAwait(false);
                }
                copy.CreatedUtc = existing.CreatedUtc;
                return await _Server.Database.Deployments.UpdateAsync(copy, token).ConfigureAwait(false);
            }
            finally
            {
                _Lock.Release();
            }
        }

        private static ValidationException Invalid(string field, string code, string message)
        {
            ValidationException error = new ValidationException(message, new Dictionary<string, string> { [field] = message }, new Dictionary<string, string> { [field] = code });
            error.Code = code;
            return error;
        }

        #endregion
    }
}
