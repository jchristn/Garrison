namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;

    /// <summary>
    /// The built-in agent architect (AD7.6): a protected agent seeded in every tenant with a skill asset that teaches
    /// manifest authoring and Garrison conventions. Its prompts are the built-in System templates builtin/agent-architect
    /// and builtin/agent-architect-guided, bound on its deployment. It has no deployment until someone creates one.
    /// Thread-safe.
    /// </summary>
    public class ArchitectService
    {
        #region Public-Members

        /// <summary>
        /// Name of the architect agent in every tenant.
        /// </summary>
        public static readonly string AgentName = Garrison.Core.Constants.ArchitectAgentName;

        /// <summary>
        /// Name of the architect's skill asset in every tenant.
        /// </summary>
        public static readonly string SkillAssetName = Garrison.Core.Constants.ArchitectSkillAssetName;

        /// <summary>
        /// Built-in key of the default architect prompt.
        /// </summary>
        public static readonly string DefaultPromptKey = "agent-architect";

        /// <summary>
        /// Built-in keys of the architect System prompts, default first.
        /// </summary>
        public static readonly IReadOnlyList<string> PromptKeys = new List<string> { "agent-architect", "agent-architect-guided" };

        #endregion

        #region Private-Members

        private static readonly string _ResourcePrefix = "Garrison.Core.Seed.Architect.";
        private static readonly string[] _SkillFiles = new[] { "SKILL.md", "kinds.md", "conventions.md" };
        private readonly ServerContext _Server;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public ArchitectService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Seed the architect in every tenant, holding the startup lock so replicas starting together seed one at a time.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task SeedAllAsync(CancellationToken token)
        {
            await using (DatabaseLockHandle startupLock = await _Server.Database.AcquireStartupLockAsync(token).ConfigureAwait(false))
            {
                int skip = 0;
                while (true)
                {
                    EnumerationResult<Tenant> page = await _Server.Database.Tenants.EnumerateAsync(new EnumerationQuery { Skip = skip, MaxResults = 1000 }, token).ConfigureAwait(false);
                    foreach (Tenant tenant in page.Objects)
                    {
                        token.ThrowIfCancellationRequested();
                        await SeedTenantLockedAsync(tenant.Id, token).ConfigureAwait(false);
                    }
                    skip += page.Objects.Count;
                    if (page.Objects.Count == 0 || skip >= page.TotalRecords) break;
                }
            }
        }

        /// <summary>
        /// Seed the architect in one tenant (a new tenant). Idempotent.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task SeedTenantAsync(string tenantId, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            await using (DatabaseLockHandle startupLock = await _Server.Database.AcquireStartupLockAsync(token).ConfigureAwait(false))
            {
                await SeedTenantLockedAsync(tenantId, token).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Whether an agent is the built-in architect.
        /// </summary>
        /// <param name="agent">Agent.</param>
        /// <returns>True for the protected agent-architect.</returns>
        public static bool IsBuiltInArchitect(Agent? agent)
        {
            return agent != null && agent.IsProtected && agent.Name == AgentName;
        }

        /// <summary>
        /// Whether a deployment is an architect deployment: a deployment of the built-in architect, or any deployment granted
        /// managementAccess Drafts (a copy of the architect under another name works this way).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True for an architect deployment.</returns>
        public async Task<bool> IsArchitectAsync(string tenantId, Deployment deployment, CancellationToken token)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            if (deployment.ManagementAccess == ManagementAccessEnum.Drafts) return true;
            Agent? agent = await _Server.Database.Agents.ReadAsync(tenantId, deployment.AgentId, token).ConfigureAwait(false);
            return IsBuiltInArchitect(agent);
        }

        /// <summary>
        /// The architect prompt catalog (AD7.12): built-in architect prompts first, then the tenant's clones of them, then
        /// the tenant's other System templates, each with the architect deployments that bind it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Entries.</returns>
        public async Task<List<ArchitectPromptEntry>> ListPromptsAsync(string tenantId, CancellationToken token)
        {
            List<Deployment> architects = await ArchitectDeploymentsAsync(tenantId, token).ConfigureAwait(false);
            List<ArchitectPromptEntry> builtIns = new List<ArchitectPromptEntry>();
            foreach (string key in PromptKeys)
            {
                PromptTemplate? template = await _Server.Database.PromptTemplates.ReadAsync(BuiltInSeeder.PromptId(key), token).ConfigureAwait(false);
                if (template != null) builtIns.Add(Entry(template, architects));
            }
            List<PromptTemplate> tenant = new List<PromptTemplate>();
            int skip = 0;
            while (true)
            {
                EnumerationResult<PromptTemplate> page = await _Server.Database.PromptTemplates.EnumerateAsync(tenantId, new EnumerationQuery { Skip = skip, MaxResults = 1000 }, token).ConfigureAwait(false);
                tenant.AddRange(page.Objects.Where(t => t.TenantId == tenantId && t.Kind == PromptTemplateKindEnum.System));
                skip += page.Objects.Count;
                if (page.Objects.Count == 0 || skip >= page.TotalRecords) break;
            }
            List<ArchitectPromptEntry> clones = tenant.Where(t => t.BuiltInKey != null && PromptKeys.Contains(t.BuiltInKey)).OrderBy(t => t.Name, StringComparer.Ordinal).Select(t => Entry(t, architects)).ToList();
            List<ArchitectPromptEntry> others = tenant.Where(t => t.BuiltInKey == null || !PromptKeys.Contains(t.BuiltInKey)).OrderBy(t => t.Name, StringComparer.Ordinal).Select(t => Entry(t, architects)).ToList();
            return builtIns.Concat(clones).Concat(others).ToList();
        }

        /// <summary>
        /// The prompt an architect deployment uses (AD7.14).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Selection.</returns>
        /// <exception cref="ValidationException">Thrown with NotAnArchitectDeployment.</exception>
        public async Task<ArchitectPromptSelection> GetPromptAsync(string tenantId, Deployment deployment, CancellationToken token)
        {
            if (!await IsArchitectAsync(tenantId, deployment, token).ConfigureAwait(false)) throw NotArchitect(deployment);
            DeploymentPromptBinding? binding = deployment.PromptBindings.FirstOrDefault(b => b.Role == "System");
            string templateId = binding?.TemplateId ?? BuiltInSeeder.PromptId(DefaultPromptKey);
            PromptTemplate? template = await _Server.Database.PromptTemplates.ReadAsync(templateId, token).ConfigureAwait(false);
            return new ArchitectPromptSelection
            {
                DeploymentId = deployment.Id, ArchitectPromptTemplateId = templateId, ArchitectPromptName = template?.Name ?? templateId,
                ArchitectPromptVersion = binding?.PinnedVersion, CurrentVersion = template?.CurrentVersion ?? 1
            };
        }

        /// <summary>
        /// Choose an architect deployment's prompt (AD7.14, AD-026). Takes effect on the deployment's next turn; a running
        /// turn keeps the prompt it started with.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment.</param>
        /// <param name="request">Template and optional pinned version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new selection.</returns>
        /// <exception cref="ValidationException">Thrown with NotAnArchitectDeployment or InvalidArchitectPrompt.</exception>
        public async Task<ArchitectPromptSelection> SetPromptAsync(RequestContext ctx, string tenantId, Deployment deployment, ArchitectPromptRequest request, CancellationToken token)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (!await IsArchitectAsync(tenantId, deployment, token).ConfigureAwait(false)) throw NotArchitect(deployment);
            PromptTemplate template = await ResolvePromptAsync(tenantId, request.ArchitectPromptTemplateId, request.ArchitectPromptVersion, token).ConfigureAwait(false);
            Bind(deployment, template, request.ArchitectPromptVersion);
            deployment.ConfigVersion = deployment.ConfigVersion + 1;
            deployment.LastUpdateUtc = DateTime.UtcNow;
            Deployment saved = await _Server.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Deployment", saved.Id, "Architect deployment " + saved.Name + " now uses prompt " + template.Name + (request.ArchitectPromptVersion.HasValue ? " pinned to version " + request.ArchitectPromptVersion.Value : " (current version)") + " from its next turn.", tenantId, token).ConfigureAwait(false);
            return await GetPromptAsync(tenantId, saved, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Prepare a new deployment (AD7.14): a deployment of the built-in architect gets managementAccess Drafts, and an
        /// architect deployment binds the requested architect prompt, or builtin/agent-architect, as its System prompt.
        /// Call before the default prompt bindings are applied.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment being created.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ValidationException">Thrown with NotAnArchitectDeployment or InvalidArchitectPrompt.</exception>
        public async Task PrepareCreateAsync(string tenantId, Deployment deployment, CancellationToken token)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            Agent? agent = String.IsNullOrEmpty(deployment.AgentId) ? null
                : await _Server.Database.Agents.ReadAsync(tenantId, deployment.AgentId, token).ConfigureAwait(false) ?? await _Server.Database.Agents.ReadByNameAsync(tenantId, deployment.AgentId, token).ConfigureAwait(false);
            if (IsBuiltInArchitect(agent)) deployment.ManagementAccess = ManagementAccessEnum.Drafts;
            bool architect = deployment.ManagementAccess == ManagementAccessEnum.Drafts;
            string? requested = deployment.ArchitectPromptTemplateId;
            int? version = deployment.ArchitectPromptVersion;
            deployment.ArchitectPromptTemplateId = null;
            deployment.ArchitectPromptVersion = null;
            if (!String.IsNullOrWhiteSpace(requested))
            {
                if (!architect) throw NotArchitect(deployment);
                Bind(deployment, await ResolvePromptAsync(tenantId, requested, version, token).ConfigureAwait(false), version);
            }
            else if (architect && !deployment.PromptBindings.Any(b => b.Role == "System"))
            {
                PromptTemplate builtIn = await _Server.Database.PromptTemplates.ReadAsync(BuiltInSeeder.PromptId(DefaultPromptKey), token).ConfigureAwait(false)
                    ?? throw new InvalidOperationException("The built-in architect prompt is not seeded.");
                Bind(deployment, builtIn, null);
            }
        }

        #endregion

        #region Private-Methods

        private static ValidationException NotArchitect(Deployment deployment)
        {
            string message = "Deployment " + deployment.Name + " is not an architect deployment: only deployments of " + AgentName + ", or with managementAccess Drafts, choose an architect prompt.";
            ValidationException error = new ValidationException(message, new Dictionary<string, string> { ["deploymentId"] = message }, new Dictionary<string, string> { ["deploymentId"] = "NotAnArchitectDeployment" });
            error.Code = "NotAnArchitectDeployment";
            return error;
        }

        private async Task<PromptTemplate> ResolvePromptAsync(string tenantId, string? idOrName, int? version, CancellationToken token)
        {
            PromptTemplate? template = null;
            if (!String.IsNullOrWhiteSpace(idOrName))
            {
                template = await _Server.Database.PromptTemplates.ReadAsync(idOrName, token).ConfigureAwait(false)
                    ?? await _Server.Database.PromptTemplates.ReadByNameAsync(tenantId, idOrName, token).ConfigureAwait(false)
                    ?? await _Server.Database.PromptTemplates.ReadByNameAsync(null, idOrName, token).ConfigureAwait(false);
            }
            string? problem = null;
            if (template == null || (template.TenantId != null && template.TenantId != tenantId)) problem = "Prompt template " + idOrName + " was not found.";
            else if (template.Kind != PromptTemplateKindEnum.System) problem = "Prompt template " + template.Name + " is a " + template.Kind + " template; an architect prompt must be a System template.";
            else if (version.HasValue && (version.Value < 1 || version.Value > template.CurrentVersion)) problem = "Prompt template " + template.Name + " has versions 1 to " + template.CurrentVersion + ".";
            if (problem != null)
            {
                ValidationException error = new ValidationException(problem, new Dictionary<string, string> { ["architectPromptTemplateId"] = problem }, new Dictionary<string, string> { ["architectPromptTemplateId"] = "InvalidArchitectPrompt" });
                error.Code = "InvalidArchitectPrompt";
                throw error;
            }
            return template!;
        }

        private static void Bind(Deployment deployment, PromptTemplate template, int? version)
        {
            DeploymentPromptBinding? binding = deployment.PromptBindings.FirstOrDefault(b => b.Role == "System");
            if (binding == null)
            {
                binding = new DeploymentPromptBinding { Role = "System", DeploymentId = deployment.Id };
                deployment.PromptBindings.Add(binding);
            }
            binding.TemplateId = template.Id;
            binding.PinnedVersion = version;
        }

        private async Task<List<Deployment>> ArchitectDeploymentsAsync(string tenantId, CancellationToken token)
        {
            List<Deployment> all = await Garrison.Server.Routes.ConfigurationSupport.DeploymentsAsync(_Server, tenantId, d => true, token).ConfigureAwait(false);
            List<Deployment> architects = new List<Deployment>();
            foreach (Deployment deployment in all)
            {
                if (await IsArchitectAsync(tenantId, deployment, token).ConfigureAwait(false)) architects.Add(deployment);
            }
            return architects;
        }

        private static ArchitectPromptEntry Entry(PromptTemplate template, List<Deployment> architects)
        {
            return new ArchitectPromptEntry
            {
                Id = template.Id, Name = template.Name, Description = template.Description, IsBuiltIn = template.IsBuiltIn, BuiltInKey = template.BuiltInKey,
                CurrentVersion = template.CurrentVersion, IsDefault = template.Id == BuiltInSeeder.PromptId(DefaultPromptKey),
                Deployments = architects.Where(d => d.PromptBindings.Any(b => b.Role == "System" && b.TemplateId == template.Id)).Select(d => d.Id).ToList()
            };
        }

        private async Task SeedTenantLockedAsync(string tenantId, CancellationToken token)
        {
            RequestContext system = new RequestContext { IsAuthenticated = true, TenantId = tenantId, PrincipalType = PrincipalTypeEnum.Administrator, PrincipalName = "garrison" };
            AgentAssetService assets = _Server.Get<AgentAssetService>();
            AgentAsset? skill = await _Server.Database.AgentAssets.ReadByNameAsync(tenantId, SkillAssetName, token).ConfigureAwait(false);
            if (skill == null)
            {
                skill = await assets.CreateAsync(system, tenantId, new AgentAsset
                {
                    Name = SkillAssetName, Kind = AgentAssetKindEnum.Skill, Description = "How the agent architect writes Garrison manifests, and the conventions it follows.",
                    Tags = new List<string> { "builtin", "architect" }
                }, token).ConfigureAwait(false);
            }
            List<AgentAssetFile> files = new List<AgentAssetFile>();
            Dictionary<string, byte[]> contents = new Dictionary<string, byte[]>(StringComparer.Ordinal);
            foreach (string name in _SkillFiles)
            {
                byte[] bytes = Resource(name);
                string path = "garrison-manifests/" + name;
                files.Add(new AgentAssetFile { Path = path, MediaType = "text/markdown" });
                contents[path] = bytes;
            }
            // Uploading the same files returns the current version, so this only adds a version when the release changed them.
            AgentAssetUploadResult uploaded = await assets.UploadVersionAsync(system, tenantId, skill, files, contents, "Shipped with the release.", token).ConfigureAwait(false);

            Agent? agent = await _Server.Database.Agents.ReadByNameAsync(tenantId, AgentName, token).ConfigureAwait(false);
            if (agent == null)
            {
                agent = await _Server.Database.Agents.CreateAsync(new Agent
                {
                    TenantId = tenantId, Name = AgentName, DisplayName = "Agent architect", IsProtected = true, ExposeA2A = false,
                    Description = "Designs agents and agentic apps with you in a studio draft, then asks a person to approve applying it."
                }, token).ConfigureAwait(false);
                _Server.Logging.Info("[Garrison] seeded agent " + AgentName + " in tenant " + tenantId);
            }
            AgentRevision? latest = String.IsNullOrEmpty(agent.LatestPublishedRevisionId) ? null : await _Server.Database.AgentRevisions.ReadAsync(tenantId, agent.LatestPublishedRevisionId, token).ConfigureAwait(false);
            int version = uploaded.Version.Number;
            if (latest != null && latest.AssetPins.Any(p => p.AssetId == skill.Id && p.Version == version)) return;
            AgentRevision content = AgentRevisionContent.FromAgent(agent);
            content.AssetPins = new List<AgentRevisionAssetPin> { new AgentRevisionAssetPin { AssetId = skill.Id, Version = version } };
            content.ChangeNote = "Shipped with the release.";
            content.AuthorName = "garrison";
            AgentRevision draft = await _Server.Database.AgentRevisions.SaveDraftAsync(content, token).ConfigureAwait(false);
            await _Server.Database.AgentRevisions.PublishAsync(tenantId, draft.Id, null, "garrison", token).ConfigureAwait(false);
        }

        private static byte[] Resource(string name)
        {
            using (Stream? stream = typeof(BuiltInSeeder).Assembly.GetManifestResourceStream(_ResourcePrefix + name))
            {
                if (stream == null) throw new InvalidOperationException("Embedded architect resource " + name + " is missing.");
                using (MemoryStream copy = new MemoryStream())
                {
                    stream.CopyTo(copy);
                    return copy.ToArray();
                }
            }
        }

        #endregion
    }
}
