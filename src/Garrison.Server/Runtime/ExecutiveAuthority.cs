namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Security;
    using Garrison.Core.Services;

    /// <summary>
    /// Executive authority (AA8.1, AA8.2): resolves the unit a run's OrgSubtree deployment leads in the live chart and
    /// computes what that executive may change. Authority follows the live chart, so an agent that stops leading a unit
    /// loses it at once. Thread-safe.
    /// </summary>
    public class ExecutiveAuthority
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly ChainOfCommand _Chain;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="chain">Chain of command.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public ExecutiveAuthority(ServerContext server, ChainOfCommand chain)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Chain = chain ?? throw new ArgumentNullException(nameof(chain));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The executive position of a run principal, or null when the caller is not a run, its deployment does not grant
        /// OrgSubtree, or its agent leads no live unit (or several, which deployment validation prevents).
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Position or null.</returns>
        public async Task<ExecutivePosition?> ResolveRunAsync(RequestContext ctx, CancellationToken token = default)
        {
            if (ctx == null || ctx.PrincipalType != PrincipalTypeEnum.Run || String.IsNullOrEmpty(ctx.TenantId) || String.IsNullOrEmpty(ctx.RunId)) return null;
            Run? run = await _Server.Database.Runs.ReadAsync(ctx.TenantId, ctx.RunId, token).ConfigureAwait(false);
            if (run == null) return null;
            Deployment? deployment = await _Server.Database.Deployments.ReadAsync(ctx.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            return deployment == null ? null : await ResolveAsync(ctx.TenantId, deployment, token).ConfigureAwait(false);
        }

        /// <summary>
        /// The executive position of a deployment, or null when it does not grant OrgSubtree or its agent leads no single
        /// live unit.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Position or null.</returns>
        public async Task<ExecutivePosition?> ResolveAsync(string tenantId, Deployment deployment, CancellationToken token = default)
        {
            if (deployment == null || deployment.ManagementAccess != ManagementAccessEnum.OrgSubtree) return null;
            List<OrgPosition> leads = (await _Chain.PositionsAsync(tenantId, deployment.AgentId, token).ConfigureAwait(false)).Where(p => p.IsLead).ToList();
            if (leads.Count != 1) return null;
            OrgPosition lead = leads[0];
            return new ExecutivePosition
            {
                OrganizationId = lead.OrganizationId, OrganizationName = lead.OrganizationName, UnitId = lead.UnitId, UnitName = lead.UnitName,
                AgentId = deployment.AgentId, DeploymentId = deployment.Id
            };
        }

        /// <summary>
        /// Compute what the executive leading a unit may change, from the live chart and the tenant's records.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="organizationId">Organization identifier.</param>
        /// <param name="unitId">Unit the executive leads.</param>
        /// <param name="agentId">Executive's agent.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The scope, or null when the organization is not live or the agent no longer leads the unit.</returns>
        public async Task<ExecutiveScope?> ScopeAsync(string tenantId, string organizationId, string unitId, string agentId, CancellationToken token = default)
        {
            OrgTree? tree = await _Chain.LiveTreeAsync(tenantId, organizationId, token).ConfigureAwait(false);
            OrgUnit? unit = tree?.Unit(unitId);
            if (tree == null || unit == null || !String.Equals(unit.LeadAgentId, agentId, StringComparison.Ordinal)) return null;
            SubtreeInventory inventory = await InventoryAsync(tenantId, token).ConfigureAwait(false);
            return SubtreeAuthority.Compute(tree, unitId, agentId, inventory);
        }

        /// <summary>
        /// Read an executive's draft against the executive's current scope, with every item's live record.
        /// </summary>
        /// <param name="draft">Draft with ExecutiveUnitId set.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The context, or null when the executive no longer leads the unit in a live organization.</returns>
        /// <exception cref="ArgumentNullException">Thrown when draft is null.</exception>
        public async Task<ExecutiveDraftContext?> ContextAsync(StudioDraft draft, CancellationToken token = default)
        {
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            if (String.IsNullOrEmpty(draft.ExecutiveUnitId) || String.IsNullOrEmpty(draft.OrganizationId) || String.IsNullOrEmpty(draft.ExecutiveAgentId)) return null;
            ExecutiveScope? scope = await ScopeAsync(draft.TenantId, draft.OrganizationId, draft.ExecutiveUnitId, draft.ExecutiveAgentId, token).ConfigureAwait(false);
            if (scope == null) return null;
            List<ExecutiveDraftItem> items = new List<ExecutiveDraftItem>();
            foreach (StudioDraftItem item in draft.Items)
            {
                ExecutiveDraftItem entry = new ExecutiveDraftItem { Kind = item.Kind, Name = item.Name, Operation = item.Operation };
                if (item.Operation == StudioDraftOperationEnum.Upsert) entry.Document = ManifestParser.Parse(item.Document).FirstOrDefault();
                entry.Live = await LiveDocumentAsync(draft.TenantId, item.Kind, item.Name, token).ConfigureAwait(false);
                items.Add(entry);
            }
            return new ExecutiveDraftContext(scope, items);
        }

        /// <summary>
        /// The tenant's live records as the subtree computation needs them.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Inventory.</returns>
        public async Task<SubtreeInventory> InventoryAsync(string tenantId, CancellationToken token = default)
        {
            SubtreeInventory inventory = new SubtreeInventory();
            Dictionary<string, InventoryResource> agentsByName = new Dictionary<string, InventoryResource>(StringComparer.OrdinalIgnoreCase);
            foreach (Agent agent in await AllAsync(q => _Server.Database.Agents.EnumerateAsync(tenantId, q, token)).ConfigureAwait(false))
            {
                InventoryResource resource = new InventoryResource { Kind = "Agent", Id = agent.Id, Name = agent.Name };
                if (!String.IsNullOrEmpty(agent.ToolDescriptionTemplateId)) resource.TemplateIds.Add(agent.ToolDescriptionTemplateId);
                if (!String.IsNullOrEmpty(agent.SkillDescriptionTemplateId)) resource.TemplateIds.Add(agent.SkillDescriptionTemplateId);
                inventory.Resources.Add(resource);
                agentsByName[agent.Name] = resource;
            }
            foreach (Deployment deployment in await AllAsync(q => _Server.Database.Deployments.EnumerateAsync(tenantId, q, token)).ConfigureAwait(false))
            {
                if (!String.Equals(deployment.TenantId, tenantId, StringComparison.Ordinal)) continue;
                InventoryResource resource = new InventoryResource { Kind = "Deployment", Id = deployment.Id, Name = deployment.Name, AgentId = deployment.AgentId };
                resource.TemplateIds.AddRange(deployment.PromptBindings.Select(b => b.TemplateId).Where(t => !String.IsNullOrEmpty(t)));
                inventory.Resources.Add(resource);
            }
            foreach (Mandate mandate in await AllAsync(q => _Server.Database.Mandates.EnumerateAsync(tenantId, null, null, null, q, token)).ConfigureAwait(false))
            {
                inventory.Resources.Add(new InventoryResource { Kind = "Mandate", Id = mandate.Id, Name = mandate.Name, AgentId = mandate.AgentId, DeploymentId = mandate.DeploymentId });
            }
            foreach (PromptTemplate template in await AllAsync(q => _Server.Database.PromptTemplates.EnumerateAsync(tenantId, q, token)).ConfigureAwait(false))
            {
                if (!String.Equals(template.TenantId, tenantId, StringComparison.Ordinal)) continue;
                inventory.Resources.Add(new InventoryResource { Kind = "PromptTemplate", Id = template.Id, Name = template.Name });
            }
            foreach (AgentAsset asset in await AllAsync(q => _Server.Database.AgentAssets.EnumerateAsync(tenantId, null, q, token)).ConfigureAwait(false))
            {
                inventory.Resources.Add(new InventoryResource { Kind = "AgentAsset", Id = asset.Id, Name = asset.Name });
                foreach (string agentName in await _Server.Database.AgentAssets.AgentsPinningAsync(tenantId, asset.Id, token).ConfigureAwait(false))
                {
                    if (agentsByName.TryGetValue(agentName, out InventoryResource? agent)) agent.AssetIds.Add(asset.Id);
                }
            }
            return inventory;
        }

        #endregion

        #region Private-Methods

        private static async Task<List<T>> AllAsync<T>(Func<EnumerationQuery, Task<EnumerationResult<T>>> page)
        {
            List<T> all = new List<T>();
            EnumerationQuery query = new EnumerationQuery { MaxResults = 1000, IncludeBuiltIn = false, Ordering = EnumerationOrderEnum.CreatedAscending };
            while (true)
            {
                EnumerationResult<T> result = await page(query).ConfigureAwait(false);
                all.AddRange(result.Objects);
                if (result.Objects.Count == 0 || result.EndOfResults || all.Count >= 50000) return all;
                query.Skip += result.Objects.Count;
            }
        }

        private async Task<ManifestDocument?> LiveDocumentAsync(string tenantId, string kind, string name, CancellationToken token)
        {
            ManifestExportOptions options = new ManifestExportOptions();
            options.Resources.Add(new ManifestResourceReference { Kind = kind, Name = name });
            try
            {
                ManifestExportResult export = await _Server.Get<ManifestService>().ExportAsync(tenantId, options, token).ConfigureAwait(false);
                return ManifestParser.Parse(export.Yaml).FirstOrDefault(d => d.Kind == kind && String.Equals(d.Metadata.Name, name, StringComparison.Ordinal));
            }
            catch (NotFoundException)
            {
                return null;
            }
        }

        #endregion
    }
}
