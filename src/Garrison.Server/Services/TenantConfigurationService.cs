namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Routes;
    using Garrison.Server.Runtime;

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
            List<string> pipelines = await _Server.Database.Pipelines.NamesByAgentAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            if (pipelines.Count > 0)
            {
                throw new ConflictException("ReferencedByPipeline", "Agent " + existing.Name + " runs a stage of pipeline" + (pipelines.Count == 1 ? " " : "s ") + String.Join(", ", pipelines) + ". Remove it from " + (pipelines.Count == 1 ? "that pipeline" : "those pipelines") + " first.");
            }
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
            List<string> pipelines = await _Server.Database.Pipelines.NamesByDeploymentAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            if (pipelines.Count > 0)
            {
                throw new ConflictException("ReferencedByPipeline", "Deployment " + existing.Name + " is pinned by a stage of pipeline" + (pipelines.Count == 1 ? " " : "s ") + String.Join(", ", pipelines) + ". Change " + (pipelines.Count == 1 ? "that pipeline" : "those pipelines") + " first.");
            }
            bool deleted = await _Server.Database.Deployments.DeleteAsync(existing.Id, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Deployment", existing.Id, "Deleted deployment " + existing.Name + ".", token).ConfigureAwait(false);
            return deleted;
        }
        /// <summary>Create a pipeline (P12.9) after validating its stages, references, and ranges.</summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="pipeline">Configuration; identity, version, protection, and child identifiers are assigned here.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Created pipeline.</returns>
        /// <exception cref="ValidationException">Thrown when the pipeline is invalid.</exception>
        /// <exception cref="ConflictException">Thrown when the name is taken.</exception>
        public async Task<Pipeline> CreatePipelineAsync(RequestContext ctx, string tenantId, Pipeline pipeline, CancellationToken token)
        {
            if (pipeline == null) throw new ValidationException("A pipeline is required.");
            token.ThrowIfCancellationRequested();
            await RequireTenantAsync(tenantId, token).ConfigureAwait(false);
            pipeline.Id = String.Empty;
            pipeline.TenantId = tenantId;
            pipeline.IsProtected = false;
            pipeline.Version = 1;
            Normalize(pipeline);
            await ConfigurationValidator.PipelineAsync(_Server.Database, tenantId, pipeline, MaxStages(), token).ConfigureAwait(false);
            Pipeline? existing = await _Server.Database.Pipelines.ReadByNameAsync(tenantId, pipeline.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing, existing?.Id, null, pipeline.Name);
            Pipeline created = await _Server.Database.Pipelines.CreateAsync(pipeline, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Pipeline", created.Id, "Created pipeline " + created.Name + " with " + created.Stages.Count + " stage(s).", token).ConfigureAwait(false);
            return created;
        }
        /// <summary>Replace a pipeline's configuration and stages (P12.9) and advance its version. Pipeline runs already started keep their snapshot.</summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized pipeline.</param>
        /// <param name="pipeline">Replacement configuration.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Updated pipeline.</returns>
        /// <exception cref="ValidationException">Thrown when the pipeline is invalid.</exception>
        /// <exception cref="ConflictException">Thrown when the pipeline is protected or the new name is taken.</exception>
        public async Task<Pipeline> UpdatePipelineAsync(RequestContext ctx, string tenantId, Pipeline existing, Pipeline pipeline, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (pipeline == null) throw new ValidationException("A pipeline is required.");
            token.ThrowIfCancellationRequested();
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Pipeline " + existing.Name);
            pipeline.Id = existing.Id;
            pipeline.TenantId = tenantId;
            pipeline.CreatedUtc = existing.CreatedUtc;
            pipeline.IsProtected = existing.IsProtected;
            pipeline.Version = existing.Version + 1;
            Normalize(pipeline);
            await ConfigurationValidator.PipelineAsync(_Server.Database, tenantId, pipeline, MaxStages(), token).ConfigureAwait(false);
            Pipeline? named = await _Server.Database.Pipelines.ReadByNameAsync(tenantId, pipeline.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, existing.Id, pipeline.Name);
            Pipeline updated = await _Server.Database.Pipelines.UpdateAsync(pipeline, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Pipeline", updated.Id, "Updated pipeline " + updated.Name + " to version " + updated.Version + ".", token).ConfigureAwait(false);
            return updated;
        }
        /// <summary>Delete a pipeline (P12.9). Its finished pipeline runs are kept; while any pipeline run is active the delete answers 409 PipelineInUse.</summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized pipeline.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Whether the row was deleted.</returns>
        /// <exception cref="ConflictException">Thrown with PipelineInUse while pipeline runs are active, or when the pipeline is protected.</exception>
        public async Task<bool> DeletePipelineAsync(RequestContext ctx, string tenantId, Pipeline existing, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Pipeline " + existing.Name);
            long active = await _Server.Database.PipelineRuns.CountActiveAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            if (active > 0) throw new ConflictException("PipelineInUse", "Pipeline " + existing.Name + " has " + active + " active pipeline run(s). Cancel them or wait for them to finish, then delete the pipeline.");
            bool deleted = await _Server.Database.Pipelines.DeleteAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Pipeline", existing.Id, "Deleted pipeline " + existing.Name + ".", token).ConfigureAwait(false);
            return deleted;
        }
        private int MaxStages()
        {
            RuntimeOptions? options = _Server.TryGet<RuntimeOptions>();
            return options?.PipelineMaxStages ?? 20;
        }
        private static void Normalize(Pipeline pipeline)
        {
            pipeline.Name = (pipeline.Name ?? String.Empty).Trim();
            for (int i = 0; i < pipeline.Stages.Count; i++)
            {
                PipelineStage stage = pipeline.Stages[i];
                // Child rows get fresh identifiers on every save; a definition change never rewrites another pipeline's rows.
                stage.Id = String.Empty;
                stage.PipelineId = pipeline.Id;
                stage.TenantId = pipeline.TenantId;
                stage.Position = i + 1;
                stage.Name = (stage.Name ?? String.Empty).Trim();
                if (String.IsNullOrWhiteSpace(stage.DeploymentId)) stage.DeploymentId = null;
                if (String.IsNullOrWhiteSpace(stage.HandoffTemplateId)) stage.HandoffTemplateId = null;
                foreach (PipelineStageParameter parameter in stage.Parameters)
                {
                    parameter.Id = String.Empty;
                    parameter.StageId = stage.Id;
                    parameter.TenantId = pipeline.TenantId;
                }
            }
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
