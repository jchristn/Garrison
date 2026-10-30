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

        /// <summary>
        /// Alias under which an architect's credential secret is bound to its deployment.
        /// </summary>
        public static readonly string CredentialAlias = "credential";

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
        /// The architect prompt catalog (AD7.12), one page at a time: built-in architect prompts first, then the tenant's
        /// clones of them, then the tenant's other System templates, each with the architect deployments that bind it. The
        /// order is fixed, so the query's ordering does not apply; search matches part of the template name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="query">Enumeration query (maxResults, skip, search).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of entries.</returns>
        public async Task<EnumerationResult<ArchitectPromptEntry>> EnumeratePromptsAsync(string tenantId, EnumerationQuery query, CancellationToken token)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<PromptTemplate> templates = new List<PromptTemplate>();
            foreach (string key in PromptKeys)
            {
                PromptTemplate? template = await _Server.Database.PromptTemplates.ReadAsync(BuiltInSeeder.PromptId(key), token).ConfigureAwait(false);
                if (template != null) templates.Add(template);
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
            templates.AddRange(tenant.Where(t => t.BuiltInKey != null && PromptKeys.Contains(t.BuiltInKey)).OrderBy(t => t.Name, StringComparer.Ordinal));
            templates.AddRange(tenant.Where(t => t.BuiltInKey == null || !PromptKeys.Contains(t.BuiltInKey)).OrderBy(t => t.Name, StringComparer.Ordinal));
            if (!String.IsNullOrEmpty(query.Search)) templates = templates.Where(t => t.Name.Contains(query.Search, StringComparison.OrdinalIgnoreCase)).ToList();
            List<PromptTemplate> pageTemplates = templates.Skip(query.Skip).Take(query.MaxResults).ToList();
            List<Deployment> architects = pageTemplates.Count > 0 ? await ArchitectDeploymentsAsync(tenantId, token).ConfigureAwait(false) : new List<Deployment>();
            return EnumerationResult<ArchitectPromptEntry>.Build(query, templates.Count, pageTemplates.Select(t => Entry(t, architects)).ToList());
        }

        /// <summary>
        /// Enumerate the tenant's architects: deployments with managementAccess Drafts and deployments of the built-in
        /// architect agent.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="query">Enumeration query (maxResults, skip, ordering, search on the name, activeOnly).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of architects.</returns>
        public async Task<EnumerationResult<Architect>> EnumerateAsync(string tenantId, EnumerationQuery query, CancellationToken token)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));
            Agent? agent = await _Server.Database.Agents.ReadByNameAsync(tenantId, AgentName, token).ConfigureAwait(false);
            string? agentId = IsBuiltInArchitect(agent) ? agent!.Id : null;
            EnumerationResult<Deployment> page = await _Server.Database.Deployments.EnumerateArchitectsAsync(tenantId, agentId, query, token).ConfigureAwait(false);
            Dictionary<string, PromptTemplate?> prompts = new Dictionary<string, PromptTemplate?>(StringComparer.Ordinal);
            List<Architect> objects = new List<Architect>();
            foreach (Deployment deployment in page.Objects)
            {
                objects.Add(await ToArchitectAsync(deployment, agentId != null && deployment.AgentId == agentId ? agent : null, prompts, token).ConfigureAwait(false));
            }
            return EnumerationResult<Architect>.Build(query, page.TotalRecords, objects);
        }

        /// <summary>
        /// Read an architect by deployment identifier or name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="idOrName">Deployment identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The architect.</returns>
        /// <exception cref="NotFoundException">Thrown when no architect deployment matches.</exception>
        public async Task<Architect> ReadAsync(string tenantId, string idOrName, CancellationToken token)
        {
            Deployment deployment = await ResolveAsync(tenantId, idOrName, token).ConfigureAwait(false);
            return await ToArchitectAsync(deployment, null, new Dictionary<string, PromptTemplate?>(StringComparer.Ordinal), token).ConfigureAwait(false);
        }

        /// <summary>
        /// Resolve an architect deployment by identifier or name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="idOrName">Deployment identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The deployment.</returns>
        /// <exception cref="NotFoundException">Thrown when no deployment matches or the deployment is not an architect.</exception>
        public async Task<Deployment> ResolveAsync(string tenantId, string idOrName, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(idOrName)) throw new NotFoundException("Architect not found.");
            Deployment? deployment = await _Server.Database.Deployments.ReadAsync(tenantId, idOrName, token).ConfigureAwait(false)
                ?? await _Server.Database.Deployments.ReadByNameAsync(tenantId, idOrName, token).ConfigureAwait(false);
            if (deployment == null || !await IsArchitectAsync(tenantId, deployment, token).ConfigureAwait(false)) throw new NotFoundException("Architect " + idOrName + " not found.");
            return deployment;
        }

        /// <summary>
        /// Create an architect: a deployment of the tenant's built-in agent-architect with managementAccess Drafts, bound to
        /// the requested architect prompt or builtin/agent-architect.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">Name, harness profile, model, active, and prompt.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The architect.</returns>
        /// <exception cref="ValidationException">Thrown when a field is missing or invalid, or with InvalidArchitectPrompt or InvalidCredentialSecret.</exception>
        /// <exception cref="ConflictException">Thrown with NameConflict, or ArchitectAgentMissing when the tenant has no agent-architect.</exception>
        public async Task<Architect> CreateAsync(RequestContext ctx, string tenantId, ArchitectRequest request, CancellationToken token)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            ValidateRequest(request);
            Agent? agent = await _Server.Database.Agents.ReadByNameAsync(tenantId, AgentName, token).ConfigureAwait(false);
            if (!IsBuiltInArchitect(agent)) throw new ConflictException("ArchitectAgentMissing", "This tenant has no built-in agent named " + AgentName + ", so no architect can be created. Restart the server to seed it.");
            Deployment deployment = new Deployment();
            deployment.Name = request.Name.Trim();
            deployment.Description = request.Description;
            deployment.AgentId = agent!.Id;
            deployment.HarnessProfileId = request.HarnessProfileId;
            deployment.Model = String.IsNullOrWhiteSpace(request.Model) ? null : request.Model.Trim();
            deployment.Active = request.Active;
            deployment.ManagementAccess = ManagementAccessEnum.Drafts;
            deployment.ArchitectPromptTemplateId = String.IsNullOrWhiteSpace(request.ArchitectPromptTemplateId) ? null : request.ArchitectPromptTemplateId;
            deployment.ArchitectPromptVersion = request.ArchitectPromptVersion;
            if (!String.IsNullOrWhiteSpace(request.CredentialSecretId)) BindCredential(deployment, await ResolveCredentialAsync(tenantId, request.CredentialSecretId, token).ConfigureAwait(false));
            Deployment created = await new TenantConfigurationService(_Server).CreateDeploymentAsync(ctx, tenantId, deployment, token).ConfigureAwait(false);
            return await ToArchitectAsync(created, agent, new Dictionary<string, PromptTemplate?>(StringComparer.Ordinal), token).ConfigureAwait(false);
        }

        /// <summary>
        /// Change an architect's name, description, harness profile, model, active flag, and (when given) prompt. Other
        /// deployment settings are kept. A prompt change takes effect on the architect's next turn.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="existing">The architect deployment.</param>
        /// <param name="request">New fields.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The architect.</returns>
        /// <exception cref="ValidationException">Thrown when a field is missing or invalid, or with InvalidArchitectPrompt or InvalidCredentialSecret.</exception>
        /// <exception cref="ConflictException">Thrown with NameConflict or Protected.</exception>
        public async Task<Architect> UpdateAsync(RequestContext ctx, string tenantId, Deployment existing, ArchitectRequest request, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (request == null) throw new ArgumentNullException(nameof(request));
            ValidateRequest(request);
            // A second read gives an independent copy to change, so the audit can compare it with the original.
            Deployment changed = await _Server.Database.Deployments.ReadAsync(tenantId, existing.Id, token).ConfigureAwait(false) ?? throw new NotFoundException("Architect " + existing.Name + " not found.");
            changed.Name = request.Name.Trim();
            changed.Description = request.Description;
            changed.HarnessProfileId = request.HarnessProfileId;
            changed.Model = String.IsNullOrWhiteSpace(request.Model) ? null : request.Model.Trim();
            changed.Active = request.Active;
            if (!String.IsNullOrWhiteSpace(request.ArchitectPromptTemplateId))
            {
                PromptTemplate template = await ResolvePromptAsync(tenantId, request.ArchitectPromptTemplateId, request.ArchitectPromptVersion, token).ConfigureAwait(false);
                Bind(changed, template, request.ArchitectPromptVersion);
            }
            if (request.CredentialSecretId != null)
            {
                if (request.CredentialSecretId.Trim().Length == 0) changed.ResourceBindings.RemoveAll(b => b.Kind == ResourceBindingKindEnum.Secret && String.Equals(b.Alias, CredentialAlias, StringComparison.OrdinalIgnoreCase));
                else BindCredential(changed, await ResolveCredentialAsync(tenantId, request.CredentialSecretId, token).ConfigureAwait(false));
            }
            changed.LastUpdateUtc = DateTime.UtcNow;
            Deployment updated = await new TenantConfigurationService(_Server).UpdateDeploymentAsync(ctx, tenantId, existing, changed, token).ConfigureAwait(false);
            return await ToArchitectAsync(updated, null, new Dictionary<string, PromptTemplate?>(StringComparer.Ordinal), token).ConfigureAwait(false);
        }

        /// <summary>
        /// Delete an architect deployment. Drafts are not affected; their conversations with it end.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="existing">The architect deployment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ConflictException">Thrown with Protected, ReferencedByTrigger, ReferencedByNotificationEndpoint, or ReferencedByPipeline.</exception>
        public async Task DeleteAsync(RequestContext ctx, string tenantId, Deployment existing, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            await new TenantConfigurationService(_Server).DeleteDeploymentAsync(ctx, tenantId, existing, token).ConfigureAwait(false);
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
            Agent? agent = await _Server.Database.Agents.ReadByNameAsync(tenantId, AgentName, token).ConfigureAwait(false);
            string? agentId = IsBuiltInArchitect(agent) ? agent!.Id : null;
            List<Deployment> architects = new List<Deployment>();
            int skip = 0;
            while (true)
            {
                EnumerationResult<Deployment> page = await _Server.Database.Deployments.EnumerateArchitectsAsync(tenantId, agentId, new EnumerationQuery { Skip = skip, MaxResults = 1000 }, token).ConfigureAwait(false);
                architects.AddRange(page.Objects);
                skip += page.Objects.Count;
                if (page.Objects.Count == 0 || skip >= page.TotalRecords) break;
            }
            return architects;
        }

        private async Task<Secret> ResolveCredentialAsync(string tenantId, string idOrName, CancellationToken token)
        {
            Secret? secret = await _Server.Database.Secrets.ReadAsync(tenantId, idOrName, token).ConfigureAwait(false)
                ?? await _Server.Database.Secrets.ReadByNameAsync(tenantId, idOrName, token).ConfigureAwait(false);
            string? problem = null;
            if (secret == null) problem = "Secret " + idOrName + " was not found in this tenant.";
            else if (!secret.Active) problem = "Secret " + secret.Name + " is inactive; activate it or choose another.";
            if (problem != null)
            {
                ValidationException error = new ValidationException(problem, new Dictionary<string, string> { ["credentialSecretId"] = problem }, new Dictionary<string, string> { ["credentialSecretId"] = "InvalidCredentialSecret" });
                error.Code = "InvalidCredentialSecret";
                throw error;
            }
            return secret!;
        }

        private static void BindCredential(Deployment deployment, Secret secret)
        {
            DeploymentResourceBinding? binding = deployment.ResourceBindings.FirstOrDefault(b => b.Kind == ResourceBindingKindEnum.Secret && String.Equals(b.Alias, CredentialAlias, StringComparison.OrdinalIgnoreCase));
            if (binding == null)
            {
                binding = new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = CredentialAlias, DeploymentId = deployment.Id };
                deployment.ResourceBindings.Add(binding);
            }
            binding.ResourceId = secret.Id;
        }

        private static void ValidateRequest(ArchitectRequest request)
        {
            Dictionary<string, string> fields = new Dictionary<string, string>();
            if (String.IsNullOrWhiteSpace(request.Name)) fields["name"] = "Required.";
            if (String.IsNullOrWhiteSpace(request.HarnessProfileId)) fields["harnessProfileId"] = "Required.";
            if (request.ArchitectPromptVersion.HasValue && String.IsNullOrWhiteSpace(request.ArchitectPromptTemplateId)) fields["architectPromptVersion"] = "Give architectPromptTemplateId with a pinned version.";
            if (fields.Count > 0) throw new ValidationException("The architect is not valid: " + String.Join(", ", fields.Keys) + ".", fields);
        }

        private async Task<Architect> ToArchitectAsync(Deployment deployment, Agent? agent, Dictionary<string, PromptTemplate?> prompts, CancellationToken token)
        {
            if (agent == null || agent.Id != deployment.AgentId) agent = await _Server.Database.Agents.ReadAsync(deployment.TenantId, deployment.AgentId, token).ConfigureAwait(false);
            DeploymentPromptBinding? binding = deployment.PromptBindings.FirstOrDefault(b => b.Role == "System");
            string templateId = binding?.TemplateId ?? BuiltInSeeder.PromptId(DefaultPromptKey);
            if (!prompts.TryGetValue(templateId, out PromptTemplate? template))
            {
                template = await _Server.Database.PromptTemplates.ReadAsync(templateId, token).ConfigureAwait(false);
                prompts[templateId] = template;
            }
            Architect architect = new Architect();
            architect.Id = deployment.Id;
            architect.TenantId = deployment.TenantId;
            architect.Name = deployment.Name;
            architect.Description = deployment.Description;
            architect.AgentId = deployment.AgentId;
            architect.AgentName = agent?.Name;
            architect.HarnessProfileId = deployment.HarnessProfileId;
            architect.Model = deployment.Model;
            architect.Active = deployment.Active;
            architect.ArchitectPromptTemplateId = templateId;
            architect.ArchitectPromptName = template?.Name ?? templateId;
            architect.ArchitectPromptVersion = binding?.PinnedVersion;
            architect.ArchitectPromptCurrentVersion = template?.CurrentVersion ?? 1;
            // The credential is the secret bound as "credential", else the first bound secret.
            DeploymentResourceBinding? credential = deployment.ResourceBindings.FirstOrDefault(b => b.Kind == ResourceBindingKindEnum.Secret && String.Equals(b.Alias, CredentialAlias, StringComparison.OrdinalIgnoreCase))
                ?? deployment.ResourceBindings.FirstOrDefault(b => b.Kind == ResourceBindingKindEnum.Secret);
            if (credential != null)
            {
                Secret? secret = await _Server.Database.Secrets.ReadAsync(deployment.TenantId, credential.ResourceId, token).ConfigureAwait(false);
                architect.CredentialSecretId = credential.ResourceId;
                architect.CredentialSecretName = secret?.Name;
                architect.CredentialSecretKind = secret?.Kind.ToString();
            }
            architect.ConfigVersion = deployment.ConfigVersion;
            architect.IsProtected = deployment.IsProtected;
            architect.CreatedUtc = deployment.CreatedUtc;
            architect.LastUpdateUtc = deployment.LastUpdateUtc;
            return architect;
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
