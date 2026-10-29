namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Works out what a manifest bundle export contains (P12.21): the tenant's records, the selection, the references
    /// followed from it, and the requirements (secrets, artifact stores, built-ins) the target tenant must provide.
    /// Not thread-safe; one per export.
    /// </summary>
    public class ManifestExportPlan
    {
        #region Public-Members

        /// <summary>
        /// Whether referenced built-in prompt templates and harness profiles are exported as documents. Default false.
        /// </summary>
        public bool IncludeBuiltIn { get; set; } = false;

        /// <summary>
        /// Whether what the selection depends on is selected too. Default false.
        /// </summary>
        public bool FollowReferences { get; set; } = false;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly Dictionary<string, PromptTemplate> _Templates = new Dictionary<string, PromptTemplate>(StringComparer.Ordinal);
        private readonly Dictionary<string, HarnessProfile> _Profiles = new Dictionary<string, HarnessProfile>(StringComparer.Ordinal);
        private readonly Dictionary<string, McpServer> _Servers = new Dictionary<string, McpServer>(StringComparer.Ordinal);
        private readonly Dictionary<string, WorkspaceTemplate> _Workspaces = new Dictionary<string, WorkspaceTemplate>(StringComparer.Ordinal);
        private readonly Dictionary<string, Agent> _Agents = new Dictionary<string, Agent>(StringComparer.Ordinal);
        private readonly Dictionary<string, AgentAsset> _Assets = new Dictionary<string, AgentAsset>(StringComparer.Ordinal);
        private readonly Dictionary<string, Deployment> _Deployments = new Dictionary<string, Deployment>(StringComparer.Ordinal);
        private readonly Dictionary<string, Pipeline> _Pipelines = new Dictionary<string, Pipeline>(StringComparer.Ordinal);
        private readonly Dictionary<string, AgenticApp> _Apps = new Dictionary<string, AgenticApp>(StringComparer.Ordinal);
        private readonly Dictionary<string, Trigger> _Triggers = new Dictionary<string, Trigger>(StringComparer.Ordinal);
        private readonly Dictionary<string, NotificationEndpoint> _Endpoints = new Dictionary<string, NotificationEndpoint>(StringComparer.Ordinal);
        private readonly Dictionary<string, Secret> _Secrets = new Dictionary<string, Secret>(StringComparer.Ordinal);
        private readonly Dictionary<string, ArtifactStore> _Stores = new Dictionary<string, ArtifactStore>(StringComparer.Ordinal);
        private readonly Dictionary<string, PromptTemplate?> _BuiltInTemplates = new Dictionary<string, PromptTemplate?>(StringComparer.Ordinal);
        private readonly Dictionary<string, HarnessProfile?> _BuiltInProfiles = new Dictionary<string, HarnessProfile?>(StringComparer.Ordinal);
        private readonly Dictionary<string, object> _Selected = new Dictionary<string, object>(StringComparer.Ordinal);
        private readonly Queue<string> _Pending = new Queue<string>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate an empty plan; use <see cref="LoadAsync"/> to read the tenant's records.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public ManifestExportPlan(DatabaseDriverBase database, string tenantId)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            TenantId = tenantId ?? throw new ArgumentNullException(nameof(tenantId));
        }

        /// <summary>
        /// Read every tenant-owned record an export may contain.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Plan with nothing selected.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static async Task<ManifestExportPlan> LoadAsync(DatabaseDriverBase database, string tenantId, CancellationToken token = default)
        {
            ManifestExportPlan plan = new ManifestExportPlan(database, tenantId);
            foreach (PromptTemplate item in await AllAsync(q => database.PromptTemplates.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false))
            {
                if (item.TenantId == tenantId && !item.IsBuiltIn) plan._Templates[item.Id] = item;
            }
            foreach (HarnessProfile item in await AllAsync(q => database.HarnessProfiles.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false))
            {
                if (item.TenantId == tenantId && !item.IsBuiltIn) plan._Profiles[item.Id] = item;
            }
            foreach (McpServer item in await AllAsync(q => database.McpServers.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false)) plan._Servers[item.Id] = item;
            foreach (WorkspaceTemplate item in await AllAsync(q => database.WorkspaceTemplates.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false)) plan._Workspaces[item.Id] = item;
            foreach (Agent item in await AllAsync(q => database.Agents.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false)) plan._Agents[item.Id] = item;
            foreach (AgentAsset item in await AllAsync(q => database.AgentAssets.EnumerateAsync(tenantId, null, q, token), token).ConfigureAwait(false)) plan._Assets[item.Id] = item;
            foreach (Deployment item in await AllAsync(q => database.Deployments.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false)) plan._Deployments[item.Id] = item;
            foreach (Pipeline item in await AllAsync(q => database.Pipelines.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false)) plan._Pipelines[item.Id] = item;
            foreach (AgenticApp item in await AllAsync(q => database.Apps.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false)) plan._Apps[item.Id] = item;
            foreach (Trigger item in await AllAsync(q => database.Triggers.EnumerateAsync(tenantId, null, q, token), token).ConfigureAwait(false)) plan._Triggers[item.Id] = item;
            foreach (NotificationEndpoint item in await AllAsync(q => database.NotificationEndpoints.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false)) plan._Endpoints[item.Id] = item;
            foreach (Secret item in await AllAsync(q => database.Secrets.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false)) plan._Secrets[item.Id] = item;
            foreach (ArtifactStore item in await AllAsync(q => database.ArtifactStores.EnumerateAsync(tenantId, q, token), token).ConfigureAwait(false)) plan._Stores[item.Id] = item;
            return plan;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Select every tenant-owned record of a kind.
        /// </summary>
        /// <param name="kind">Exportable kind (PromptTemplate, HarnessProfile, McpServer, WorkspaceTemplate, AgentAsset, Agent, Deployment, Pipeline, Trigger, NotificationEndpoint).</param>
        public void SelectKind(string kind)
        {
            foreach (string id in Ids(kind)) Include(kind, id);
        }

        /// <summary>
        /// Select one record by kind and name. Built-in prompt templates and harness profiles can be selected when
        /// <see cref="IncludeBuiltIn"/> is set.
        /// </summary>
        /// <param name="kind">Exportable kind.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the record exists and was selected.</returns>
        public async Task<bool> SelectAsync(string kind, string name, CancellationToken token = default)
        {
            string? id = IdByName(kind, name);
            if (id != null)
            {
                Include(kind, id);
                return true;
            }
            if (!IncludeBuiltIn || !name.StartsWith(Constants.BuiltInPrefix, StringComparison.OrdinalIgnoreCase)) return false;
            if (kind == "PromptTemplate")
            {
                PromptTemplate? template = await _Database.PromptTemplates.ReadByNameAsync(TenantId, name, token).ConfigureAwait(false);
                if (template == null || !template.IsBuiltIn) return false;
                _BuiltInTemplates[template.Id] = template;
                Include(kind, template.Id);
                return true;
            }
            if (kind == "HarnessProfile")
            {
                HarnessProfile? profile = await _Database.HarnessProfiles.ReadByNameAsync(TenantId, name, token).ConfigureAwait(false);
                if (profile == null || !profile.IsBuiltIn) return false;
                _BuiltInProfiles[profile.Id] = profile;
                Include(kind, profile.Id);
                return true;
            }
            return false;
        }

        /// <summary>
        /// Follow references from the selection when <see cref="FollowReferences"/> is set.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task ExpandAsync(CancellationToken token = default)
        {
            if (!FollowReferences) return;
            while (_Pending.Count > 0)
            {
                token.ThrowIfCancellationRequested();
                string key = _Pending.Dequeue();
                int slash = key.IndexOf('/');
                string kind = key.Substring(0, slash);
                string id = key.Substring(slash + 1);
                switch (kind)
                {
                    case "Agent":
                        Agent agent = _Agents[id];
                        await TemplateAsync(agent.ToolDescriptionTemplateId, token).ConfigureAwait(false);
                        await TemplateAsync(agent.SkillDescriptionTemplateId, token).ConfigureAwait(false);
                        foreach (Deployment deployment in _Deployments.Values.Where(d => d.AgentId == agent.Id)) Include("Deployment", deployment.Id);
                        foreach (Trigger trigger in _Triggers.Values.Where(t => t.TargetType == TriggerTargetTypeEnum.Agent && t.AgentId == agent.Id)) Include("Trigger", trigger.Id);
                        foreach (NotificationEndpoint endpoint in _Endpoints.Values.Where(e => e.AgentId == agent.Id)) Include("NotificationEndpoint", endpoint.Id);
                        foreach (string allowed in agent.DelegationAllowList)
                        {
                            string? delegated = IdByName("Agent", allowed);
                            if (delegated != null) Include("Agent", delegated);
                        }
                        foreach (AgentRevisionAssetPin pin in await PinnedAssetsAsync(agent, token).ConfigureAwait(false)) Include("AgentAsset", pin.AssetId);
                        break;
                    case "AgentAsset":
                        await TemplateAsync(_Assets[id].PromptTemplateId, token).ConfigureAwait(false);
                        break;
                    case "Deployment":
                        Deployment selected = _Deployments[id];
                        Include("Agent", selected.AgentId);
                        await ProfileAsync(selected.HarnessProfileId, token).ConfigureAwait(false);
                        foreach (DeploymentPromptBinding binding in selected.PromptBindings) await TemplateAsync(binding.TemplateId, token).ConfigureAwait(false);
                        Include("WorkspaceTemplate", selected.WorkspaceTemplateId);
                        foreach (DeploymentResourceBinding binding in selected.ResourceBindings.Where(b => b.Kind == ResourceBindingKindEnum.McpServer)) Include("McpServer", binding.ResourceId);
                        break;
                    case "Pipeline":
                        Pipeline pipeline = _Pipelines[id];
                        foreach (PipelineStage stage in pipeline.Stages)
                        {
                            Include("Agent", stage.AgentId);
                            Include("Deployment", stage.DeploymentId);
                            await TemplateAsync(stage.HandoffTemplateId, token).ConfigureAwait(false);
                        }
                        foreach (Trigger trigger in _Triggers.Values.Where(t => t.TargetType == TriggerTargetTypeEnum.Pipeline && t.PipelineId == pipeline.Id)) Include("Trigger", trigger.Id);
                        break;
                    case "AgenticApp":
                        AgenticApp app = _Apps[id];
                        foreach (AgenticAppMember member in app.Members) Include("Agent", member.AgentId);
                        foreach (AgenticAppEnvironment env in app.Environments) Include("Deployment", env.DeploymentId);
                        Include("AgentAsset", app.LogoAssetId);
                        break;
                    case "Trigger":
                        Trigger fired = _Triggers[id];
                        Include("Agent", fired.AgentId);
                        Include("Pipeline", fired.PipelineId);
                        Include("Deployment", fired.DeploymentId);
                        await TemplateAsync(fired.InputTemplateId, token).ConfigureAwait(false);
                        break;
                    case "NotificationEndpoint":
                        NotificationEndpoint notified = _Endpoints[id];
                        Include("Agent", notified.AgentId);
                        Include("Deployment", notified.DeploymentId);
                        break;
                }
            }
        }

        /// <summary>
        /// Selected records of a type, ordered by name.
        /// </summary>
        /// <typeparam name="T">Model type.</typeparam>
        /// <returns>Records.</returns>
        public List<T> Selected<T>() where T : class
        {
            return _Selected.Values.OfType<T>().OrderBy(NameOf, StringComparer.Ordinal).ToList();
        }

        /// <summary>
        /// What the selected records need from a target tenant: the secrets and artifact stores they reference (never
        /// exported as documents) and the built-ins they reference.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Bundle requirements, sorted by name.</returns>
        public async Task<BundleSpec> RequirementsAsync(CancellationToken token = default)
        {
            SortedDictionary<string, BundleSecretRequirement> secrets = new SortedDictionary<string, BundleSecretRequirement>(StringComparer.Ordinal);
            SortedSet<string> stores = new SortedSet<string>(StringComparer.Ordinal);
            SortedDictionary<string, ManifestResourceReference> builtIns = new SortedDictionary<string, ManifestResourceReference>(StringComparer.Ordinal);

            foreach (object item in _Selected.Values)
            {
                token.ThrowIfCancellationRequested();
                switch (item)
                {
                    case Agent agent:
                        Secret(agent.RemoteCredentialSecretId, secrets);
                        await BuiltInTemplateAsync(agent.ToolDescriptionTemplateId, builtIns, token).ConfigureAwait(false);
                        await BuiltInTemplateAsync(agent.SkillDescriptionTemplateId, builtIns, token).ConfigureAwait(false);
                        break;
                    case WorkspaceTemplate workspace:
                        Secret(workspace.GitCredentialSecretId, secrets);
                        break;
                    case Deployment deployment:
                        foreach (DeploymentResourceBinding binding in deployment.ResourceBindings.Where(b => b.Kind == ResourceBindingKindEnum.Secret)) Secret(binding.ResourceId, secrets);
                        if (!String.IsNullOrEmpty(deployment.ArtifactStoreId) && _Stores.TryGetValue(deployment.ArtifactStoreId, out ArtifactStore? store)) stores.Add(store.Name);
                        if (!_Profiles.ContainsKey(deployment.HarnessProfileId))
                        {
                            HarnessProfile? profile = await BuiltInProfileAsync(deployment.HarnessProfileId, token).ConfigureAwait(false);
                            if (profile != null) builtIns["HarnessProfile/" + profile.Name] = new ManifestResourceReference("HarnessProfile", profile.Name);
                        }
                        foreach (DeploymentPromptBinding binding in deployment.PromptBindings) await BuiltInTemplateAsync(binding.TemplateId, builtIns, token).ConfigureAwait(false);
                        break;
                    case Pipeline pipeline:
                        foreach (PipelineStage stage in pipeline.Stages) await BuiltInTemplateAsync(stage.HandoffTemplateId, builtIns, token).ConfigureAwait(false);
                        break;
                    case Trigger trigger:
                        await BuiltInTemplateAsync(trigger.InputTemplateId, builtIns, token).ConfigureAwait(false);
                        break;
                    case AgentAsset asset:
                        await BuiltInTemplateAsync(asset.PromptTemplateId, builtIns, token).ConfigureAwait(false);
                        if (!String.IsNullOrEmpty(asset.ArtifactStoreId) && _Stores.TryGetValue(asset.ArtifactStoreId, out ArtifactStore? assetStore)) stores.Add(assetStore.Name);
                        break;
                }
            }

            BundleSpec bundle = new BundleSpec();
            bundle.RequiredSecrets = secrets.Values.ToList();
            bundle.RequiredArtifactStores = stores.ToList();
            bundle.RequiredBuiltIns = builtIns.Values.ToList();
            return bundle;
        }

        #endregion

        #region Private-Methods

        private static async Task<List<T>> AllAsync<T>(Func<EnumerationQuery, Task<EnumerationResult<T>>> page, CancellationToken token)
        {
            List<T> all = new List<T>();
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = 1000;
            query.IncludeBuiltIn = false;
            query.Ordering = EnumerationOrderEnum.NameAscending;
            for (int i = 0; i < 100; i++)
            {
                token.ThrowIfCancellationRequested();
                query.Skip = i * query.MaxResults;
                EnumerationResult<T> result = await page(query).ConfigureAwait(false);
                all.AddRange(result.Objects);
                if (result.Objects.Count < query.MaxResults) break;
            }
            return all;
        }

        private List<string> Ids(string kind)
        {
            switch (kind)
            {
                case "PromptTemplate": return _Templates.Keys.ToList();
                case "HarnessProfile": return _Profiles.Keys.ToList();
                case "McpServer": return _Servers.Keys.ToList();
                case "WorkspaceTemplate": return _Workspaces.Keys.ToList();
                case "Agent": return _Agents.Keys.ToList();
                case "AgentAsset": return _Assets.Keys.ToList();
                case "Deployment": return _Deployments.Keys.ToList();
                case "Pipeline": return _Pipelines.Keys.ToList();
                case "AgenticApp": return _Apps.Keys.ToList();
                case "Trigger": return _Triggers.Keys.ToList();
                case "NotificationEndpoint": return _Endpoints.Keys.ToList();
                default: return new List<string>();
            }
        }

        private string? IdByName(string kind, string name)
        {
            switch (kind)
            {
                case "PromptTemplate": return _Templates.Values.FirstOrDefault(r => r.Name == name)?.Id;
                case "HarnessProfile": return _Profiles.Values.FirstOrDefault(r => r.Name == name)?.Id;
                case "McpServer": return _Servers.Values.FirstOrDefault(r => r.Name == name)?.Id;
                case "WorkspaceTemplate": return _Workspaces.Values.FirstOrDefault(r => r.Name == name)?.Id;
                case "Agent": return _Agents.Values.FirstOrDefault(r => r.Name == name)?.Id;
                case "AgentAsset": return _Assets.Values.FirstOrDefault(r => r.Name == name)?.Id;
                case "Deployment": return _Deployments.Values.FirstOrDefault(r => r.Name == name)?.Id;
                case "Pipeline": return _Pipelines.Values.FirstOrDefault(r => r.Name == name)?.Id;
                case "AgenticApp": return _Apps.Values.FirstOrDefault(r => r.Name == name)?.Id;
                case "Trigger": return _Triggers.Values.FirstOrDefault(r => r.Name == name)?.Id;
                case "NotificationEndpoint": return _Endpoints.Values.FirstOrDefault(r => r.Name == name)?.Id;
                default: return null;
            }
        }

        private object? Record(string kind, string id)
        {
            switch (kind)
            {
                case "PromptTemplate":
                    if (_Templates.TryGetValue(id, out PromptTemplate? template)) return template;
                    return _BuiltInTemplates.TryGetValue(id, out PromptTemplate? builtInTemplate) ? builtInTemplate : null;
                case "HarnessProfile":
                    if (_Profiles.TryGetValue(id, out HarnessProfile? profile)) return profile;
                    return _BuiltInProfiles.TryGetValue(id, out HarnessProfile? builtInProfile) ? builtInProfile : null;
                case "McpServer": return _Servers.TryGetValue(id, out McpServer? server) ? server : null;
                case "WorkspaceTemplate": return _Workspaces.TryGetValue(id, out WorkspaceTemplate? workspace) ? workspace : null;
                case "Agent": return _Agents.TryGetValue(id, out Agent? agent) ? agent : null;
                case "AgentAsset": return _Assets.TryGetValue(id, out AgentAsset? asset) ? asset : null;
                case "Deployment": return _Deployments.TryGetValue(id, out Deployment? deployment) ? deployment : null;
                case "Pipeline": return _Pipelines.TryGetValue(id, out Pipeline? pipeline) ? pipeline : null;
                case "AgenticApp": return _Apps.TryGetValue(id, out AgenticApp? app) ? app : null;
                case "Trigger": return _Triggers.TryGetValue(id, out Trigger? trigger) ? trigger : null;
                case "NotificationEndpoint": return _Endpoints.TryGetValue(id, out NotificationEndpoint? endpoint) ? endpoint : null;
                default: return null;
            }
        }

        private async Task<List<AgentRevisionAssetPin>> PinnedAssetsAsync(Agent agent, CancellationToken token)
        {
            if (String.IsNullOrEmpty(agent.LatestPublishedRevisionId)) return new List<AgentRevisionAssetPin>();
            AgentRevision? revision = await _Database.AgentRevisions.ReadAsync(TenantId, agent.LatestPublishedRevisionId, token).ConfigureAwait(false);
            return revision?.AssetPins ?? new List<AgentRevisionAssetPin>();
        }

        private void Include(string kind, string? id)
        {
            if (String.IsNullOrEmpty(id)) return;
            object? record = Record(kind, id);
            if (record == null) return;
            string key = kind + "/" + id;
            if (_Selected.ContainsKey(key)) return;
            _Selected[key] = record;
            _Pending.Enqueue(key);
        }

        private async Task TemplateAsync(string? id, CancellationToken token)
        {
            if (String.IsNullOrEmpty(id)) return;
            if (_Templates.ContainsKey(id))
            {
                Include("PromptTemplate", id);
                return;
            }
            if (!IncludeBuiltIn) return;
            if (await BuiltInTemplateAsync(id, token).ConfigureAwait(false) != null) Include("PromptTemplate", id);
        }

        private async Task ProfileAsync(string? id, CancellationToken token)
        {
            if (String.IsNullOrEmpty(id)) return;
            if (_Profiles.ContainsKey(id))
            {
                Include("HarnessProfile", id);
                return;
            }
            if (!IncludeBuiltIn) return;
            if (await BuiltInProfileAsync(id, token).ConfigureAwait(false) != null) Include("HarnessProfile", id);
        }

        private async Task<PromptTemplate?> BuiltInTemplateAsync(string id, CancellationToken token)
        {
            if (_BuiltInTemplates.TryGetValue(id, out PromptTemplate? known)) return known;
            PromptTemplate? template = await _Database.PromptTemplates.ReadAsync(id, token).ConfigureAwait(false);
            PromptTemplate? builtIn = template != null && template.IsBuiltIn ? template : null;
            _BuiltInTemplates[id] = builtIn;
            return builtIn;
        }

        private async Task<HarnessProfile?> BuiltInProfileAsync(string id, CancellationToken token)
        {
            if (String.IsNullOrEmpty(id)) return null;
            if (_BuiltInProfiles.TryGetValue(id, out HarnessProfile? known)) return known;
            HarnessProfile? profile = await _Database.HarnessProfiles.ReadAsync(id, token).ConfigureAwait(false);
            HarnessProfile? builtIn = profile != null && profile.IsBuiltIn ? profile : null;
            _BuiltInProfiles[id] = builtIn;
            return builtIn;
        }

        private async Task BuiltInTemplateAsync(string? id, SortedDictionary<string, ManifestResourceReference> builtIns, CancellationToken token)
        {
            if (String.IsNullOrEmpty(id) || _Templates.ContainsKey(id)) return;
            PromptTemplate? template = await BuiltInTemplateAsync(id, token).ConfigureAwait(false);
            if (template != null) builtIns["PromptTemplate/" + template.Name] = new ManifestResourceReference("PromptTemplate", template.Name);
        }

        private void Secret(string? id, SortedDictionary<string, BundleSecretRequirement> secrets)
        {
            if (String.IsNullOrEmpty(id) || !_Secrets.TryGetValue(id, out Secret? secret)) return;
            secrets[secret.Name] = new BundleSecretRequirement { Name = secret.Name, Kind = secret.Kind };
        }

        private static string NameOf(object record)
        {
            switch (record)
            {
                case PromptTemplate template: return template.Name;
                case HarnessProfile profile: return profile.Name;
                case McpServer server: return server.Name;
                case WorkspaceTemplate workspace: return workspace.Name;
                case Agent agent: return agent.Name;
                case AgentAsset asset: return asset.Name;
                case Deployment deployment: return deployment.Name;
                case Pipeline pipeline: return pipeline.Name;
                case AgenticApp app: return app.Name;
                case Trigger trigger: return trigger.Name;
                case NotificationEndpoint endpoint: return endpoint.Name;
                default: return String.Empty;
            }
        }

        #endregion
    }
}
