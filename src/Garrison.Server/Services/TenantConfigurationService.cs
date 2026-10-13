namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Routes;

    /// <summary>Shared REST/MCP configuration mutations. Callers authorize the operation before entering this service.</summary>
    public class TenantConfigurationService
    {
        private readonly ServerContext _Server;
        /// <summary>Construct the tenant mutation service.</summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public TenantConfigurationService(ServerContext server) { _Server = server ?? throw new ArgumentNullException(nameof(server)); }

        /// <summary>Create an agent with the same validation and normalization on every API surface.</summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="agent">Configuration; supplied identity/protection is ignored.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Created agent.</returns>
        public async Task<Agent> CreateAgentAsync(RequestContext ctx, string tenantId, Agent agent, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            await RequireTenantAsync(tenantId, token).ConfigureAwait(false);
            agent.Id = String.Empty;
            agent.TenantId = tenantId;
            agent.IsProtected = false;
            ConfigurationValidator.Agent(agent);
            Agent? existing = await _Server.Database.Agents.ReadByNameAsync(tenantId, agent.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing, existing?.Id, null, agent.Name);
            Agent created = await _Server.Database.Agents.CreateAsync(agent, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Agent", created.Id, "Created agent " + created.Name + ".", token).ConfigureAwait(false);
            return created;
        }
        /// <summary>Replace an authorized agent configuration, preserving its identity and registration metadata.</summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized record.</param>
        /// <param name="agent">Replacement configuration.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Updated agent.</returns>
        public async Task<Agent> UpdateAgentAsync(RequestContext ctx, string tenantId, Agent existing, Agent agent, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Agent " + existing.Name);
            agent.Id = existing.Id;
            agent.TenantId = tenantId;
            agent.CreatedUtc = existing.CreatedUtc;
            agent.LastRegisteredUtc = existing.LastRegisteredUtc;
            ConfigurationValidator.Agent(agent);
            Agent? named = await _Server.Database.Agents.ReadByNameAsync(tenantId, agent.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, existing.Id, agent.Name);
            Agent updated = await _Server.Database.Agents.UpdateAsync(agent, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Agent", updated.Id, "Updated agent " + updated.Name + ".", token).ConfigureAwait(false);
            return updated;
        }
        /// <summary>Create a deployment after applying standard prompt bindings and reference checks.</summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="deployment">Configuration; identity/version/protection is assigned here.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Created deployment.</returns>
        public async Task<Deployment> CreateDeploymentAsync(RequestContext ctx, string tenantId, Deployment deployment, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            await RequireTenantAsync(tenantId, token).ConfigureAwait(false);
            deployment.Id = String.Empty;
            deployment.TenantId = tenantId;
            deployment.IsProtected = false;
            deployment.ConfigVersion = 1;
            DefaultPromptBindings.Apply(deployment);
            await ConfigurationValidator.DeploymentAsync(_Server.Database, tenantId, deployment, token).ConfigureAwait(false);
            Deployment? existing = await _Server.Database.Deployments.ReadByNameAsync(tenantId, deployment.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing, existing?.Id, null, deployment.Name);
            Deployment created = await _Server.Database.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Deployment", created.Id, "Created deployment " + created.Name + ".", token).ConfigureAwait(false);
            return created;
        }
        /// <summary>Replace an authorized deployment and advance its configuration version.</summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized deployment.</param>
        /// <param name="deployment">Replacement configuration.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Updated deployment.</returns>
        public async Task<Deployment> UpdateDeploymentAsync(RequestContext ctx, string tenantId, Deployment existing, Deployment deployment, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Deployment " + existing.Name);
            deployment.Id = existing.Id;
            deployment.TenantId = tenantId;
            deployment.CreatedUtc = existing.CreatedUtc;
            deployment.ConfigVersion = existing.ConfigVersion + 1;
            DefaultPromptBindings.Apply(deployment);
            await ConfigurationValidator.DeploymentAsync(_Server.Database, tenantId, deployment, token).ConfigureAwait(false);
            Deployment? named = await _Server.Database.Deployments.ReadByNameAsync(tenantId, deployment.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, existing.Id, deployment.Name);
            Deployment updated = await _Server.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Deployment", updated.Id, "Updated deployment " + updated.Name + " to configuration version " + updated.ConfigVersion + ".", token).ConfigureAwait(false);
            return updated;
        }
        /// <summary>Delete an authorized agent and its deployments, matching REST cascade behavior.</summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized agent.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Whether the agent row was deleted.</returns>
        public async Task<bool> DeleteAgentAsync(RequestContext ctx, string tenantId, Agent existing, CancellationToken token)
        {
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Agent " + existing.Name);
            int cascaded = 0;
            List<Deployment> deployments = await _Server.Database.Deployments.ListByAgentAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            foreach (Deployment deployment in deployments)
                if (await _Server.Database.Deployments.DeleteAsync(deployment.Id, token).ConfigureAwait(false)) cascaded++;
            bool deleted = await _Server.Database.Agents.DeleteAsync(existing.Id, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Agent", existing.Id, "Deleted agent " + existing.Name + " and " + cascaded + " deployment(s).", token).ConfigureAwait(false);
            return deleted;
        }
        /// <summary>Delete an authorized deployment.</summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized deployment.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Whether the row was deleted.</returns>
        public async Task<bool> DeleteDeploymentAsync(RequestContext ctx, string tenantId, Deployment existing, CancellationToken token)
        {
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Deployment " + existing.Name);
            bool deleted = await _Server.Database.Deployments.DeleteAsync(existing.Id, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Deployment", existing.Id, "Deleted deployment " + existing.Name + ".", token).ConfigureAwait(false);
            return deleted;
        }
        private async Task RequireTenantAsync(string tenantId, CancellationToken token)
        {
            if (await _Server.Database.Tenants.ReadAsync(tenantId, token).ConfigureAwait(false) == null) throw new NotFoundException("Tenant not found.");
        }
        private Task AuditAsync(RequestContext ctx, string tenantId, string resourceType, string id, string description, CancellationToken token)
        {
            return _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, resourceType, id, description, tenantId, token);
        }
    }
}
