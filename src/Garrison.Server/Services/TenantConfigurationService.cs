namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
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
            await _Server.Authorization.SecretUse(ctx, tenantId).RequireForModelAsync(tenantId, agent, token).ConfigureAwait(false);
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
            await _Server.Authorization.SecretUse(ctx, tenantId).RequireForModelAsync(tenantId, agent, token).ConfigureAwait(false);
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
            ArchitectService? architect = _Server.TryGet<ArchitectService>();
            if (architect != null) await architect.PrepareCreateAsync(tenantId, deployment, token).ConfigureAwait(false);
            DefaultPromptBindings.Apply(deployment);
            await ConfigurationValidator.DeploymentAsync(_Server.Database, tenantId, deployment, token).ConfigureAwait(false);
            await _Server.Authorization.SecretUse(ctx, tenantId).RequireForDeploymentAsync(tenantId, deployment, token).ConfigureAwait(false);
            Deployment? existing = await _Server.Database.Deployments.ReadByNameAsync(tenantId, deployment.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing, existing?.Id, null, deployment.Name);
            Deployment created = await _Server.Database.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Deployment", created.Id, "Created deployment " + created.Name + " (trust level " + created.TrustLevel + ", effect policy " + created.EffectPolicy + ", egress allowlist " + EgressSummary(created) + ", management access " + created.ManagementAccess + ").", token).ConfigureAwait(false);
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
            await _Server.Authorization.SecretUse(ctx, tenantId).RequireForDeploymentAsync(tenantId, deployment, token).ConfigureAwait(false);
            Deployment? named = await _Server.Database.Deployments.ReadByNameAsync(tenantId, deployment.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, existing.Id, deployment.Name);
            Deployment updated = await _Server.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
            string trust = existing.TrustLevel != updated.TrustLevel ? " Trust level changed from " + existing.TrustLevel + " to " + updated.TrustLevel + "." : String.Empty;
            string effect = existing.EffectPolicy != updated.EffectPolicy ? " Effect policy changed from " + existing.EffectPolicy + " to " + updated.EffectPolicy + "." : String.Empty;
            string egress = EgressSummary(existing) != EgressSummary(updated) ? " Egress allowlist changed from " + EgressSummary(existing) + " to " + EgressSummary(updated) + "." : String.Empty;
            string management = existing.ManagementAccess != updated.ManagementAccess ? " Management access changed from " + existing.ManagementAccess + " to " + updated.ManagementAccess + "." : String.Empty;
            await AuditAsync(ctx, tenantId, "Deployment", updated.Id, "Updated deployment " + updated.Name + " to configuration version " + updated.ConfigVersion + "." + trust + effect + egress + management, token).ConfigureAwait(false);
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
            await EnsureNotReferencedAsync(tenantId, "agentid", existing.Id, "Agent " + existing.Name, token).ConfigureAwait(false);
            foreach (Deployment owned in await _Server.Database.Deployments.ListByAgentAsync(tenantId, existing.Id, token).ConfigureAwait(false))
            {
                await EnsureNotReferencedAsync(tenantId, "deploymentid", owned.Id, "Deployment " + owned.Name + " of agent " + existing.Name, token).ConfigureAwait(false);
            }
            List<string> pipelines = await _Server.Database.Pipelines.NamesByAgentAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            if (pipelines.Count > 0)
            {
                throw new ConflictException("ReferencedByPipeline", "Agent " + existing.Name + " runs a stage of pipeline" + (pipelines.Count == 1 ? " " : "s ") + String.Join(", ", pipelines) + ". Remove it from " + (pipelines.Count == 1 ? "that pipeline" : "those pipelines") + " first.");
            }
            List<string> apps = await _Server.Database.Apps.AppsWithMemberAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            if (apps.Count > 0)
            {
                throw new ConflictException("AgentInUse", "Agent " + existing.Name + " is a member of app" + (apps.Count == 1 ? " " : "s ") + String.Join(", ", apps) + ". Remove it from " + (apps.Count == 1 ? "that app" : "those apps") + " first.");
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
            await EnsureNotReferencedAsync(tenantId, "deploymentid", existing.Id, "Deployment " + existing.Name, token).ConfigureAwait(false);
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
            await EnsureNotReferencedAsync(tenantId, "pipelineid", existing.Id, "Pipeline " + existing.Name, token).ConfigureAwait(false);
            long active = await _Server.Database.PipelineRuns.CountActiveAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            if (active > 0) throw new ConflictException("PipelineInUse", "Pipeline " + existing.Name + " has " + active + " active pipeline run(s). Cancel them or wait for them to finish, then delete the pipeline.");
            bool deleted = await _Server.Database.Pipelines.DeleteAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Pipeline", existing.Id, "Deleted pipeline " + existing.Name + ".", token).ConfigureAwait(false);
            return deleted;
        }
        /// <summary>Create a trigger (P12.5). The caller becomes its run-as principal and must be allowed to run its target.</summary>
        /// <param name="ctx">Authorized caller (Trigger Create).</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="trigger">Configuration; identity, run-as, schedule state, and secret fields are assigned here.</param>
        /// <param name="authorizeTarget">Checks that the caller may run a resource (Agent Execute or Pipeline Execute on the
        /// given identifier). Returns false after answering the caller with the denial (REST), or throws (MCP).</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Created trigger with signingSecret set once for Webhook triggers, or null when the target was denied.</returns>
        /// <exception cref="ValidationException">Thrown when the trigger is invalid.</exception>
        /// <exception cref="ConflictException">Thrown when the name is taken.</exception>
        public async Task<Trigger?> CreateTriggerAsync(RequestContext ctx, string tenantId, Trigger trigger, Func<ResourceTypeEnum, string, Task<bool>> authorizeTarget, CancellationToken token)
        {
            if (trigger == null) throw new ValidationException("A trigger is required.");
            if (authorizeTarget == null) throw new ArgumentNullException(nameof(authorizeTarget));
            token.ThrowIfCancellationRequested();
            await RequireTenantAsync(tenantId, token).ConfigureAwait(false);
            trigger.Id = String.Empty;
            trigger.TenantId = tenantId;
            trigger.Name = (trigger.Name ?? String.Empty).Trim();
            trigger.LastFireUtc = null;
            trigger.LastFireOutcome = null;
            trigger.FireCount = 0;
            await ConfigurationValidator.TriggerAsync(_Server.Database, tenantId, trigger, token).ConfigureAwait(false);
            Trigger? existing = await _Server.Database.Triggers.ReadByNameAsync(tenantId, trigger.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing, existing?.Id, null, trigger.Name);
            if (!await AuthorizeTargetAsync(tenantId, trigger, authorizeTarget, token).ConfigureAwait(false)) return null;
            RunAs(ctx, trigger);
            string? secret = null;
            trigger.SecretEncrypted = null;
            trigger.SigningSecretLast4 = null;
            trigger.SigningSecretRotatedUtc = null;
            if (trigger.Type == TriggerTypeEnum.Webhook)
            {
                secret = WebhookSigner.NewSecret();
                SigningSecrets.Apply(trigger, secret, _Server.Cipher);
            }
            trigger.NextFireUtc = CronSchedule.NextFireFor(trigger, null, DateTime.UtcNow);
            Trigger created = await _Server.Database.Triggers.CreateAsync(trigger, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Trigger", created.Id, "Created " + created.Type + " trigger " + created.Name + " (" + TargetSummary(created) + ", runs as " + (created.RunAsName ?? created.RunAsType.ToString()) + ").", token).ConfigureAwait(false);
            created.SigningSecret = secret;
            return created;
        }

        /// <summary>Replace a trigger's configuration (P12.5). The caller becomes its run-as principal and must be allowed to
        /// run its target. The type cannot change; the signing secret is kept (rotate it separately).</summary>
        /// <param name="ctx">Authorized caller (Trigger Update).</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized trigger.</param>
        /// <param name="trigger">Replacement configuration.</param>
        /// <param name="authorizeTarget">Target check (see <see cref="CreateTriggerAsync"/>).</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Updated trigger, or null when the target was denied.</returns>
        /// <exception cref="ValidationException">Thrown when the trigger is invalid or its type changes (field code TypeImmutable).</exception>
        /// <exception cref="ConflictException">Thrown when the new name is taken.</exception>
        public async Task<Trigger?> UpdateTriggerAsync(RequestContext ctx, string tenantId, Trigger existing, Trigger trigger, Func<ResourceTypeEnum, string, Task<bool>> authorizeTarget, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (trigger == null) throw new ValidationException("A trigger is required.");
            if (authorizeTarget == null) throw new ArgumentNullException(nameof(authorizeTarget));
            token.ThrowIfCancellationRequested();
            if (trigger.Type != existing.Type)
            {
                throw new ValidationException("The trigger type cannot change. Delete the trigger and create a new one.", new Dictionary<string, string> { { "type", "The type cannot change from " + existing.Type + "." } }, new Dictionary<string, string> { { "type", "TypeImmutable" } });
            }
            trigger.Id = existing.Id;
            trigger.TenantId = tenantId;
            trigger.Name = (trigger.Name ?? String.Empty).Trim();
            trigger.CreatedUtc = existing.CreatedUtc;
            trigger.SecretEncrypted = existing.SecretEncrypted;
            trigger.SecretKeyVersion = existing.SecretKeyVersion;
            trigger.SigningSecretLast4 = existing.SigningSecretLast4;
            trigger.SigningSecretRotatedUtc = existing.SigningSecretRotatedUtc;
            trigger.LastFireUtc = existing.LastFireUtc;
            trigger.LastFireOutcome = existing.LastFireOutcome;
            trigger.FireCount = existing.FireCount;
            await ConfigurationValidator.TriggerAsync(_Server.Database, tenantId, trigger, token).ConfigureAwait(false);
            Trigger? named = await _Server.Database.Triggers.ReadByNameAsync(tenantId, trigger.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, existing.Id, trigger.Name);
            if (!await AuthorizeTargetAsync(tenantId, trigger, authorizeTarget, token).ConfigureAwait(false)) return null;
            RunAs(ctx, trigger);
            trigger.NextFireUtc = CronSchedule.NextFireFor(trigger, existing, DateTime.UtcNow);
            Trigger updated = await _Server.Database.Triggers.UpdateAsync(trigger, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Trigger", updated.Id, "Updated trigger " + updated.Name + " (" + TargetSummary(updated) + ", " + (updated.Active ? "active" : "inactive") + ", runs as " + (updated.RunAsName ?? updated.RunAsType.ToString()) + ").", token).ConfigureAwait(false);
            updated.SigningSecret = null;
            return updated;
        }

        /// <summary>Delete a trigger and its fire history (P12.5). Runs it started are kept.</summary>
        /// <param name="ctx">Authorized caller (Trigger Delete).</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized trigger.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Whether the row was deleted.</returns>
        public async Task<bool> DeleteTriggerAsync(RequestContext ctx, string tenantId, Trigger existing, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            bool deleted = await _Server.Database.Triggers.DeleteAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "Trigger", existing.Id, "Deleted trigger " + existing.Name + ".", token).ConfigureAwait(false);
            return deleted;
        }

        /// <summary>Replace a webhook trigger's signing secret (P12.5). The old secret stops working at once.</summary>
        /// <param name="ctx">Authorized caller (Trigger Update).</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized trigger.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>The trigger with signingSecret set once.</returns>
        /// <exception cref="ConflictException">Thrown with NotAWebhookTrigger for a Cron trigger.</exception>
        public async Task<Trigger> RotateTriggerSecretAsync(RequestContext ctx, string tenantId, Trigger existing, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (existing.Type != TriggerTypeEnum.Webhook) throw new ConflictException("NotAWebhookTrigger", "Trigger " + existing.Name + " is a Cron trigger; only Webhook triggers have a signing secret.");
            string secret = WebhookSigner.NewSecret();
            SigningSecrets.Apply(existing, secret, _Server.Cipher);
            Trigger updated = await _Server.Database.Triggers.UpdateAsync(existing, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.SigningSecretRotated, "Trigger", updated.Id, "Rotated the signing secret of trigger " + updated.Name + " (now ending " + updated.SigningSecretLast4 + ").", tenantId, token).ConfigureAwait(false);
            updated.SigningSecret = secret;
            return updated;
        }

        /// <summary>Create a notification endpoint (P12.14) with a generated signing secret.</summary>
        /// <param name="ctx">Authorized caller (NotificationEndpoint Create).</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="endpoint">Configuration; identity and secret fields are assigned here.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Created endpoint with signingSecret set once.</returns>
        /// <exception cref="ValidationException">Thrown when the endpoint is invalid or its URL is refused.</exception>
        /// <exception cref="ConflictException">Thrown when the name is taken.</exception>
        public async Task<NotificationEndpoint> CreateNotificationEndpointAsync(RequestContext ctx, string tenantId, NotificationEndpoint endpoint, CancellationToken token)
        {
            if (endpoint == null) throw new ValidationException("A notification endpoint is required.");
            token.ThrowIfCancellationRequested();
            await RequireTenantAsync(tenantId, token).ConfigureAwait(false);
            endpoint.Id = String.Empty;
            endpoint.TenantId = tenantId;
            endpoint.Name = (endpoint.Name ?? String.Empty).Trim();
            await ConfigurationValidator.NotificationEndpointAsync(_Server.Database, tenantId, endpoint, AllowPrivateDestinations(), token).ConfigureAwait(false);
            NotificationEndpoint? existing = await _Server.Database.NotificationEndpoints.ReadByNameAsync(tenantId, endpoint.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing, existing?.Id, null, endpoint.Name);
            string secret = WebhookSigner.NewSecret();
            SigningSecrets.Apply(endpoint, secret, _Server.Cipher);
            NotificationEndpoint created = await _Server.Database.NotificationEndpoints.CreateAsync(endpoint, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "NotificationEndpoint", created.Id, "Created notification endpoint " + created.Name + " to " + created.Url + " for " + String.Join(", ", created.Events) + ".", token).ConfigureAwait(false);
            created.SigningSecret = secret;
            return created;
        }

        /// <summary>Replace a notification endpoint's configuration (P12.14). The signing secret is kept.</summary>
        /// <param name="ctx">Authorized caller (NotificationEndpoint Update).</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized endpoint.</param>
        /// <param name="endpoint">Replacement configuration.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Updated endpoint.</returns>
        /// <exception cref="ValidationException">Thrown when the endpoint is invalid or its URL is refused.</exception>
        /// <exception cref="ConflictException">Thrown when the new name is taken.</exception>
        public async Task<NotificationEndpoint> UpdateNotificationEndpointAsync(RequestContext ctx, string tenantId, NotificationEndpoint existing, NotificationEndpoint endpoint, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (endpoint == null) throw new ValidationException("A notification endpoint is required.");
            token.ThrowIfCancellationRequested();
            endpoint.Id = existing.Id;
            endpoint.TenantId = tenantId;
            endpoint.Name = (endpoint.Name ?? String.Empty).Trim();
            endpoint.CreatedUtc = existing.CreatedUtc;
            endpoint.SecretEncrypted = existing.SecretEncrypted;
            endpoint.SecretKeyVersion = existing.SecretKeyVersion;
            endpoint.SigningSecretLast4 = existing.SigningSecretLast4;
            endpoint.SigningSecretRotatedUtc = existing.SigningSecretRotatedUtc;
            await ConfigurationValidator.NotificationEndpointAsync(_Server.Database, tenantId, endpoint, AllowPrivateDestinations(), token).ConfigureAwait(false);
            NotificationEndpoint? named = await _Server.Database.NotificationEndpoints.ReadByNameAsync(tenantId, endpoint.Name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, existing.Id, endpoint.Name);
            NotificationEndpoint updated = await _Server.Database.NotificationEndpoints.UpdateAsync(endpoint, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "NotificationEndpoint", updated.Id, "Updated notification endpoint " + updated.Name + " (" + (updated.Active ? "active" : "inactive") + ", " + updated.Url + ").", token).ConfigureAwait(false);
            updated.SigningSecret = null;
            return updated;
        }

        /// <summary>Delete a notification endpoint with its delivery log; queued deliveries are never sent (P12.14).</summary>
        /// <param name="ctx">Authorized caller (NotificationEndpoint Delete).</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized endpoint.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Whether the row was deleted.</returns>
        public async Task<bool> DeleteNotificationEndpointAsync(RequestContext ctx, string tenantId, NotificationEndpoint existing, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            bool deleted = await _Server.Database.NotificationEndpoints.DeleteAsync(tenantId, existing.Id, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, "NotificationEndpoint", existing.Id, "Deleted notification endpoint " + existing.Name + ".", token).ConfigureAwait(false);
            return deleted;
        }

        /// <summary>Replace a notification endpoint's signing secret (P12.14). Retries of queued deliveries are signed with
        /// the new secret.</summary>
        /// <param name="ctx">Authorized caller (NotificationEndpoint Update).</param>
        /// <param name="tenantId">Resolved tenant.</param>
        /// <param name="existing">Existing authorized endpoint.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>The endpoint with signingSecret set once.</returns>
        public async Task<NotificationEndpoint> RotateNotificationEndpointSecretAsync(RequestContext ctx, string tenantId, NotificationEndpoint existing, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            string secret = WebhookSigner.NewSecret();
            SigningSecrets.Apply(existing, secret, _Server.Cipher);
            NotificationEndpoint updated = await _Server.Database.NotificationEndpoints.UpdateAsync(existing, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.SigningSecretRotated, "NotificationEndpoint", updated.Id, "Rotated the signing secret of notification endpoint " + updated.Name + " (now ending " + updated.SigningSecretLast4 + ").", tenantId, token).ConfigureAwait(false);
            updated.SigningSecret = secret;
            return updated;
        }

        private async Task<bool> AuthorizeTargetAsync(string tenantId, Trigger trigger, Func<ResourceTypeEnum, string, Task<bool>> authorizeTarget, CancellationToken token)
        {
            if (trigger.TargetType == TriggerTargetTypeEnum.Pipeline)
            {
                if (!await authorizeTarget(ResourceTypeEnum.Pipeline, trigger.PipelineId!).ConfigureAwait(false)) return false;
                Pipeline? pipeline = await _Server.Database.Pipelines.ReadAsync(tenantId, trigger.PipelineId!, token).ConfigureAwait(false);
                if (pipeline == null) return true;
                foreach (string agentId in pipeline.Stages.Select(s => s.AgentId).Distinct(StringComparer.Ordinal))
                {
                    if (!await authorizeTarget(ResourceTypeEnum.Agent, agentId).ConfigureAwait(false)) return false;
                }
                return true;
            }
            return await authorizeTarget(ResourceTypeEnum.Agent, trigger.AgentId!).ConfigureAwait(false);
        }

        private static void RunAs(RequestContext ctx, Trigger trigger)
        {
            // A run token never manages triggers (Trigger is not a run-token resource), so the caller is a user, a
            // credential, or a system administrator key.
            trigger.RunAsType = ctx.PrincipalType;
            trigger.RunAsId = ctx.PrincipalType == PrincipalTypeEnum.Administrator ? null : ctx.PrincipalId;
            trigger.RunAsName = ctx.PrincipalName;
        }

        private static string TargetSummary(Trigger trigger)
        {
            return trigger.TargetType == TriggerTargetTypeEnum.Pipeline ? "pipeline " + trigger.PipelineId : "agent " + trigger.AgentId + (String.IsNullOrEmpty(trigger.DeploymentId) ? String.Empty : " on deployment " + trigger.DeploymentId);
        }

        private bool AllowPrivateDestinations()
        {
            NotificationOptions? options = _Server.TryGet<NotificationOptions>();
            return options != null && options.AllowPrivateDestinations;
        }

        private async Task EnsureNotReferencedAsync(string tenantId, string column, string resourceId, string what, CancellationToken token)
        {
            List<string> triggers = column == "agentid" || column == "deploymentid" || column == "pipelineid"
                ? await _Server.Database.Triggers.NamesReferencingAsync(tenantId, column, resourceId, token).ConfigureAwait(false)
                : new List<string>();
            if (triggers.Count > 0)
            {
                throw new ConflictException("ReferencedByTrigger", what + " is used by trigger" + (triggers.Count == 1 ? " " : "s ") + String.Join(", ", triggers) + ". Change or delete " + (triggers.Count == 1 ? "that trigger" : "those triggers") + " first.");
            }
            List<string> endpoints = column == "agentid" || column == "deploymentid"
                ? await _Server.Database.NotificationEndpoints.NamesReferencingAsync(tenantId, column, resourceId, token).ConfigureAwait(false)
                : new List<string>();
            if (endpoints.Count > 0)
            {
                throw new ConflictException("ReferencedByNotificationEndpoint", what + " is the filter of notification endpoint" + (endpoints.Count == 1 ? " " : "s ") + String.Join(", ", endpoints) + ". Change or delete " + (endpoints.Count == 1 ? "that endpoint" : "those endpoints") + " first.");
            }
        }
        private int MaxStages()
        {
            RuntimeOptions? options = _Server.TryGet<RuntimeOptions>();
            return options?.PipelineMaxStages ?? 20;
        }
        private static string EgressSummary(Deployment deployment)
        {
            if (deployment.EgressRules.Count == 0) return "none";
            return String.Join(", ", deployment.EgressRules.Select(r => r.Cidr + (r.Port.HasValue ? ":" + r.Port.Value : String.Empty) + "/" + r.Protocol));
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
