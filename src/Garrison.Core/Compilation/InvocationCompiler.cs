namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Codex;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Templates;

    /// <summary>
    /// Compiles a run into a fully resolved <see cref="ExecutionSpec"/> from its deployment, harness profile, prompt
    /// templates, and resource bindings (plan section 8.6). Every piece of text the compiler emits comes from a
    /// template or from caller input (D-021); templates resolve tenant first, then built-in (D-022); secrets are
    /// decrypted only here (D-010, D-023). Thread-safe.
    /// </summary>
    public class InvocationCompiler
    {
        #region Public-Members

        /// <summary>
        /// Name of the Garrison MCP tool that decides permission requests (P12.3): garrison_permission_prompt. Claude Code
        /// addresses it as mcp__garrison__garrison_permission_prompt.
        /// </summary>
        public static string PermissionPromptTool
        {
            get
            {
                return "garrison_permission_prompt";
            }
        }

        /// <summary>
        /// Text that replaces secret values in previews.
        /// </summary>
        public static readonly string Redacted = "[REDACTED]";

        /// <summary>
        /// Prepares bound secrets before a run or repair is compiled (for example, refreshing an expiring CodexAuthJson
        /// login, G-22), or null (the default) to use secrets as stored. Previews never call it.
        /// </summary>
        public ISecretPreparer? SecretPreparer { get; set; } = null;

        /// <summary>Epoch-aware provider credential resolver, invoked only for actual run and repair compiles.</summary>
        public ILeaseSecretPreparer? LeaseSecretPreparer { get; set; } = null;

        /// <summary>
        /// Deployment prompt role used for the structured output repair prompt.
        /// </summary>
        public static readonly string RepairRole = "Repair";

        /// <summary>
        /// Built-in template used for the Repair role when a deployment binds none.
        /// </summary>
        public static readonly string RepairTemplateName = Constants.BuiltInPrefix + "structured-output-repair";

        /// <summary>
        /// Deployment prompt role used for the task prompt of a conversation turn that falls back to a fresh harness
        /// session: it repeats the earlier turns (<c>conversation.turns</c>) before the current task
        /// (<c>conversation.task</c>).
        /// </summary>
        public static readonly string ConversationFallbackRole = "ConversationFallback";

        /// <summary>
        /// Built-in template used for the ConversationFallback role when a deployment binds none.
        /// </summary>
        public static readonly string ConversationFallbackTemplateName = Constants.BuiltInPrefix + "conversation-fallback";

        /// <summary>
        /// Deployment prompt role used for the task prompt of a pipeline stage run (P12.9): it renders around the stage
        /// run's own task prompt (<c>pipeline.task</c>) and hands the earlier stages' outputs to the stage. A stage's own
        /// handoff template takes precedence over the deployment's binding.
        /// </summary>
        public static readonly string PipelineStageRole = "PipelineStage";

        /// <summary>
        /// Built-in template used for the PipelineStage role when neither the stage nor the deployment binds one.
        /// </summary>
        public static readonly string PipelineStageTemplateName = Constants.BuiltInPrefix + "pipeline-stage";

        /// <summary>
        /// Built-in fragment included by the built-in pipeline stage template to carry review feedback wording.
        /// </summary>
        public static readonly string PipelineRevisionTemplateName = Constants.BuiltInPrefix + "pipeline-revision";

        /// <summary>
        /// Compiler options.
        /// </summary>
        public CompilerOptions Options
        {
            get
            {
                return _Options;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly SecretCipher _Cipher;
        private readonly CompilerOptions _Options;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="cipher">Secret cipher.</param>
        /// <param name="options">Options.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public InvocationCompiler(DatabaseDriverBase database, SecretCipher cipher, CompilerOptions options)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Compile a run for execution.
        /// </summary>
        /// <param name="run">Run (with parameters loaded).</param>
        /// <param name="runToken">Run token placed in the Garrison MCP configuration, or null when delegation is disabled.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Compilation result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        /// <exception cref="CompilationException">Thrown when the run cannot be compiled.</exception>
        public async Task<CompilationResult> CompileAsync(Run run, string? runToken, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            return await CompileAsync(run, runToken, null, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Compile a run for execution, with the conversation inputs of a conversation turn. A turn with a
        /// conversationFallbackReason renders its task prompt through the ConversationFallback prompt role (the
        /// deployment's binding, else <c>builtin/conversation-fallback</c>) so the fresh session sees the earlier turns.
        /// </summary>
        /// <param name="run">Run (with parameters loaded).</param>
        /// <param name="runToken">Run token placed in the Garrison MCP configuration, or null when delegation is disabled.</param>
        /// <param name="conversation">Conversation inputs, or null for runs outside a conversation or turns that resume.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Compilation result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        /// <exception cref="CompilationException">Thrown when the run cannot be compiled.</exception>
        public async Task<CompilationResult> CompileAsync(Run run, string? runToken, CompilationConversation? conversation, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            return await CompileAsync(run, runToken, conversation, null, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Compile a run for execution with the conversation inputs of a conversation turn and the pipeline inputs of a
        /// pipeline stage run (P12.9). A stage run renders its Task (or DelegatedTask) prompt as <c>pipeline.task</c>, then
        /// its task prompt through the PipelineStage role: the stage's handoff template (respecting a pinned version),
        /// else the deployment's PipelineStage binding, else <c>builtin/pipeline-stage</c>.
        /// </summary>
        /// <param name="run">Run (with parameters loaded).</param>
        /// <param name="runToken">Run token placed in the Garrison MCP configuration, or null when delegation is disabled.</param>
        /// <param name="conversation">Conversation inputs, or null for runs outside a conversation or turns that resume.</param>
        /// <param name="pipeline">Pipeline inputs, or null for runs outside a pipeline.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Compilation result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        /// <exception cref="CompilationException">Thrown when the run cannot be compiled.</exception>
        public async Task<CompilationResult> CompileAsync(Run run, string? runToken, CompilationConversation? conversation, CompilationPipeline? pipeline, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            return await CompileAsync(run, runToken, conversation, pipeline, null, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Compile a run for execution on a known node. The node decides <c>executor.containerized</c> (G-29) for a
        /// Process run; when it is null, the node holding the run's lease (<see cref="Run.LeaseNodeId"/>) is read, and a
        /// run with no lease node is treated as not containerized. A KubernetesJob run is always containerized.
        /// </summary>
        /// <param name="run">Run (with parameters loaded).</param>
        /// <param name="runToken">Run token placed in the Garrison MCP configuration, or null when delegation is disabled.</param>
        /// <param name="conversation">Conversation inputs, or null for runs outside a conversation or turns that resume.</param>
        /// <param name="pipeline">Pipeline inputs, or null for runs outside a pipeline.</param>
        /// <param name="node">Node the run is leased to, or null to read it from the lease.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Compilation result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        /// <exception cref="CompilationException">Thrown when the run cannot be compiled.</exception>
        public async Task<CompilationResult> CompileAsync(Run run, string? runToken, CompilationConversation? conversation, CompilationPipeline? pipeline, Node? node, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (run.Executor == RunExecutorEnum.RemoteA2A || run.Executor == RunExecutorEnum.RemoteMcp)
                return await CompileRemoteAsync(run, token).ConfigureAwait(false);
            bool fallback = run.ConversationFallbackReason.HasValue && conversation != null && conversation.Turns.Count > 0;
            CompilationInputs inputs = await LoadCoreAsync(run.TenantId, run.DeploymentId, false, true, token, fallback, pipeline, run.AgentRevisionId).ConfigureAwait(false);
            await PrepareLeaseSecretsAsync(inputs, run, token).ConfigureAwait(false);
            inputs.Containerized = await ContainerizedAsync(run, node, token).ConfigureAwait(false);
            await new UsageQuotaPolicy(_Database).ApplyBudgetAsync(inputs.Deployment, run, token).ConfigureAwait(false);
            return Compile(inputs, run, runToken, null, fallback ? conversation : null, pipeline);
        }

        /// <summary>
        /// Compile a structured output repair for a run. The task prompt comes from the deployment's Repair prompt
        /// binding, or from the built-in <c>builtin/structured-output-repair</c> template when the deployment binds
        /// none, and <c>run.resumeSessionId</c> is set so the harness profile's resume arguments apply.
        /// </summary>
        /// <param name="run">Run (with parameters loaded).</param>
        /// <param name="runToken">Run token placed in the Garrison MCP configuration, or null when delegation is disabled.</param>
        /// <param name="repair">Repair inputs.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Compilation result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or repair is null.</exception>
        /// <exception cref="CompilationException">Thrown when the run cannot be compiled.</exception>
        public async Task<CompilationResult> CompileRepairAsync(Run run, string? runToken, CompilationRepair repair, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (repair == null) throw new ArgumentNullException(nameof(repair));
            CompilationInputs inputs = await LoadCoreAsync(run.TenantId, run.DeploymentId, true, true, token, false, null, run.AgentRevisionId).ConfigureAwait(false);
            await PrepareLeaseSecretsAsync(inputs, run, token).ConfigureAwait(false);
            inputs.Containerized = await ContainerizedAsync(run, null, token).ConfigureAwait(false);
            await new UsageQuotaPolicy(_Database).ApplyBudgetAsync(inputs.Deployment, run, token).ConfigureAwait(false);
            return Compile(inputs, run, runToken, repair);
        }

        /// <summary>
        /// Compile a preview for a deployment with secret values redacted.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deploymentId">Deployment identifier.</param>
        /// <param name="input">Sample input message.</param>
        /// <param name="parameters">Sample run parameters.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Compilation result with redacted secrets.</returns>
        /// <exception cref="CompilationException">Thrown when the deployment cannot be compiled.</exception>
        public async Task<CompilationResult> PreviewAsync(string tenantId, string deploymentId, string input, Dictionary<string, string>? parameters, CancellationToken token = default)
        {
            return await PreviewAsync(tenantId, deploymentId, input, parameters, null, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Compile a preview for a deployment with secret values redacted, optionally as a pipeline stage run (P12.9).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deploymentId">Deployment identifier.</param>
        /// <param name="input">Sample input message.</param>
        /// <param name="parameters">Sample run parameters.</param>
        /// <param name="pipeline">Sample pipeline inputs, or null for a run outside a pipeline.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Compilation result with redacted secrets.</returns>
        /// <exception cref="CompilationException">Thrown when the deployment cannot be compiled.</exception>
        public async Task<CompilationResult> PreviewAsync(string tenantId, string deploymentId, string input, Dictionary<string, string>? parameters, CompilationPipeline? pipeline, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(deploymentId)) throw new ArgumentNullException(nameof(deploymentId));

            CompilationInputs inputs = await LoadCoreAsync(tenantId, deploymentId, false, false, token, false, pipeline).ConfigureAwait(false);
            Run run = new Run();
            run.Id = "run_preview";
            run.TenantId = tenantId;
            run.AgentId = inputs.Agent.Id;
            run.AgentName = inputs.Agent.Name;
            run.DeploymentId = deploymentId;
            run.DeploymentVersion = inputs.Deployment.ConfigVersion;
            run.InputText = input ?? String.Empty;
            run.CallerName = "preview";
            NodePool? pool = String.IsNullOrEmpty(inputs.Deployment.NodePoolId) ? null : await _Database.NodePools.ReadAsync(inputs.Deployment.NodePoolId, token).ConfigureAwait(false);
            ExecutorCapabilityRules.Admit(run, inputs.Deployment, pool);
            run.EffectPolicy = inputs.Deployment.EffectPolicy;
            inputs.Containerized = run.Executor == RunExecutorEnum.KubernetesJob;
            if (parameters != null)
            {
                foreach (KeyValuePair<string, string> entry in parameters)
                {
                    RunParameter parameter = new RunParameter();
                    parameter.Name = entry.Key;
                    parameter.Value = entry.Value;
                    run.Parameters.Add(parameter);
                }
            }

            if (pipeline != null)
            {
                run.Kind = RunKindEnum.Pipeline;
                run.PipelineRunId = String.IsNullOrEmpty(pipeline.PipelineRunId) ? "plr_preview" : pipeline.PipelineRunId;
                run.PipelinePosition = pipeline.Position;
                run.PipelineExecution = 1;
            }
            await new UsageQuotaPolicy(_Database).ApplyBudgetAsync(inputs.Deployment, run, token).ConfigureAwait(false);
            CompilationResult result = Compile(inputs, run, "preview-run-token", null, null, pipeline);
            Redact(result.Spec);
            return result;
        }

        /// <summary>
        /// Load and validate everything a deployment references.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deploymentId">Deployment identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Inputs.</returns>
        /// <exception cref="CompilationException">Thrown when a reference is missing or a template is invalid.</exception>
        public Task<CompilationInputs> LoadAsync(string tenantId, string deploymentId, CancellationToken token = default)
        {
            return LoadAsync(tenantId, deploymentId, false, token);
        }

        /// <summary>
        /// Load and validate everything a deployment references, optionally including the Repair prompt role.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deploymentId">Deployment identifier.</param>
        /// <param name="includeRepair">Whether to resolve the Repair role, falling back to the built-in repair template when the deployment binds none.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Inputs.</returns>
        /// <exception cref="CompilationException">Thrown when a reference is missing or a template is invalid.</exception>
        public Task<CompilationInputs> LoadAsync(string tenantId, string deploymentId, bool includeRepair, CancellationToken token = default)
        {
            return LoadCoreAsync(tenantId, deploymentId, includeRepair, false, token);
        }

        private async Task<bool> ContainerizedAsync(Run run, Node? node, CancellationToken token)
        {
            if (run.Executor == RunExecutorEnum.KubernetesJob) return true;
            if (node != null) return node.Containerized;
            if (String.IsNullOrEmpty(run.LeaseNodeId)) return false;
            token.ThrowIfCancellationRequested();
            Node? leased = await _Database.Nodes.ReadAsync(run.LeaseNodeId, token).ConfigureAwait(false);
            return leased?.Containerized == true;
        }

        private async Task<CompilationResult> CompileRemoteAsync(Run run, CancellationToken token)
        {
            Agent agent = await _Database.Agents.ReadAsync(run.TenantId, run.AgentId, token).ConfigureAwait(false)
                ?? throw new CompilationException("ReferenceNotFound", "Remote agent was deleted before claim.");
            try { RemoteAgentPolicy.Require(agent); }
            catch (ConflictException e) { throw new CompilationException(e.Code, e.Message, e); }
            RunExecutorEnum executor = agent.RemoteProtocol == RemoteProtocolEnum.A2A ? RunExecutorEnum.RemoteA2A : RunExecutorEnum.RemoteMcp;
            if (executor != run.Executor) throw new CompilationException("RemoteRegistrationChanged", "Remote agent protocol changed after admission.");
            ExecutionRemoteAgent remote = new ExecutionRemoteAgent
            {
                Protocol = agent.RemoteProtocol!.Value,
                EndpointUrl = agent.RemoteEndpointUrl!,
                ToolName = agent.McpToolName,
                Input = run.InputText ?? String.Empty,
                ExpiresUtc = agent.RegistrationTtlSeconds > 0 ? agent.LastRegisteredUtc!.Value.AddSeconds(agent.RegistrationTtlSeconds) : null
            };
            ExecutionSpec spec = new ExecutionSpec { RunId = run.Id, TenantId = run.TenantId, AgentName = run.AgentName, DeploymentId = run.DeploymentId, Executor = executor, RemoteAgent = remote };
            if (!String.IsNullOrEmpty(agent.RemoteCredentialSecretId))
            {
                Secret secret = await _Database.Secrets.ReadAsync(run.TenantId, agent.RemoteCredentialSecretId, token).ConfigureAwait(false)
                    ?? throw new CompilationException("ReferenceNotFound", "Remote credential secret was not found in the run's tenant.");
                if (!secret.Active) throw new CompilationException("SecretInactive", "Remote credential secret is inactive.");
                if (secret.Kind == SecretKindEnum.LeaseBroker) secret = await PrepareLeaseSecretAsync(secret, run, token).ConfigureAwait(false);
                remote.BearerToken = Decrypt(secret);
                if (!String.IsNullOrEmpty(remote.BearerToken)) spec.ScrubValues.Add(remote.BearerToken);
            }
            return new CompilationResult { Spec = spec, TaskPrompt = remote.Input };
        }

        private async Task PrepareLeaseSecretsAsync(CompilationInputs inputs, Run run, CancellationToken token)
        {
            foreach (string alias in inputs.Secrets.Keys.ToList())
                if (inputs.Secrets[alias].Kind == SecretKindEnum.LeaseBroker)
                    inputs.Secrets[alias] = await PrepareLeaseSecretAsync(inputs.Secrets[alias], run, token).ConfigureAwait(false);
            if (inputs.WorkspaceSecret?.Kind == SecretKindEnum.LeaseBroker)
                inputs.WorkspaceSecret = await PrepareLeaseSecretAsync(inputs.WorkspaceSecret, run, token).ConfigureAwait(false);
        }

        private Task<Secret> PrepareLeaseSecretAsync(Secret secret, Run run, CancellationToken token)
        {
            if (LeaseSecretPreparer == null) throw new CredentialUnavailableException("CredentialBrokerDisabled", secret.Id, secret.Name, "No operator credential broker is configured.");
            return LeaseSecretPreparer.PrepareAsync(secret, run, token);
        }

        private async Task<CompilationInputs> LoadCoreAsync(string tenantId, string deploymentId, bool includeRepair, bool prepareSecrets, CancellationToken token, bool includeConversationFallback = false, CompilationPipeline? pipeline = null, string? agentRevisionId = null)
        {
            CompilationInputs inputs = new CompilationInputs();
            inputs.Tenant = await _Database.Tenants.ReadAsync(tenantId, token).ConfigureAwait(false);
            inputs.Deployment = await _Database.Deployments.ReadAsync(tenantId, deploymentId, token).ConfigureAwait(false)
                ?? throw new CompilationException("ReferenceNotFound", "Deployment " + deploymentId + " was not found.");
            inputs.Agent = await _Database.Agents.ReadAsync(tenantId, inputs.Deployment.AgentId, token).ConfigureAwait(false)
                ?? throw new CompilationException("ReferenceNotFound", "Agent " + inputs.Deployment.AgentId + " referenced by deployment " + inputs.Deployment.Name + " was not found.");
            // The agent's definition comes from a revision (AD1.3, AD-012): the run's recorded revision, else the
            // deployment's pin, else the latest published revision.
            inputs.AgentRevision = await EffectiveAgent.RevisionAsync(_Database, tenantId, inputs.Agent, inputs.Deployment, agentRevisionId, token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(agentRevisionId) && inputs.AgentRevision == null)
            {
                throw new CompilationException("ReferenceNotFound", "Revision " + agentRevisionId + " of agent " + inputs.Agent.Name + " was not found.");
            }
            if (inputs.AgentRevision != null) AgentRevisionContent.ApplyTo(inputs.AgentRevision, inputs.Agent);
            inputs.Profile = await _Database.HarnessProfiles.ReadAsync(tenantId, inputs.Deployment.HarnessProfileId, token).ConfigureAwait(false)
                ?? throw new CompilationException("ReferenceNotFound", "Harness profile " + inputs.Deployment.HarnessProfileId + " referenced by deployment " + inputs.Deployment.Name + " was not found.");

            foreach (DeploymentPromptBinding binding in inputs.Deployment.PromptBindings)
            {
                PromptTemplate template = await _Database.PromptTemplates.ReadAsync(tenantId, binding.TemplateId, token).ConfigureAwait(false)
                    ?? throw new CompilationException("ReferenceNotFound", "Prompt template " + binding.TemplateId + " bound to role " + binding.Role + " was not found.");
                BoundPrompt bound = new BoundPrompt();
                bound.Role = binding.Role;
                bound.TemplateId = template.Id;
                bound.TemplateName = template.Name;
                bound.Version = template.CurrentVersion;
                bound.Content = template.Content;
                if (binding.PinnedVersion.HasValue && binding.PinnedVersion.Value != template.CurrentVersion)
                {
                    PromptTemplateVersion version = await _Database.PromptTemplateVersions.ReadByVersionAsync(template.Id, binding.PinnedVersion.Value, token).ConfigureAwait(false)
                        ?? throw new CompilationException("ReferenceNotFound", "Version " + binding.PinnedVersion.Value + " of prompt template " + template.Name + " was not found.");
                    bound.Version = version.Version;
                    bound.Content = version.Content;
                }
                inputs.Prompts[binding.Role] = bound;
            }

            if (inputs.AgentRevision != null) await LoadAssetsAsync(tenantId, inputs, token).ConfigureAwait(false);

            foreach (DeploymentResourceBinding binding in inputs.Deployment.ResourceBindings)
            {
                if (binding.Kind == ResourceBindingKindEnum.McpServer)
                {
                    McpServer server = await _Database.McpServers.ReadAsync(tenantId, binding.ResourceId, token).ConfigureAwait(false)
                        ?? throw new CompilationException("ReferenceNotFound", "MCP server " + binding.ResourceId + " bound as " + binding.Alias + " was not found.");
                    if (server.Active) inputs.McpServers.Add(server);
                }
                else
                {
                    Secret secret = await _Database.Secrets.ReadAsync(tenantId, binding.ResourceId, token).ConfigureAwait(false)
                        ?? throw new CompilationException("ReferenceNotFound", "Secret " + binding.ResourceId + " bound as " + binding.Alias + " was not found.");
                    if (!secret.Active) continue;
                    ISecretPreparer? preparer = SecretPreparer;
                    if (prepareSecrets && preparer != null) secret = await preparer.PrepareAsync(secret, token).ConfigureAwait(false);
                    inputs.Secrets[binding.Alias] = secret;
                }
            }

            if (!String.IsNullOrEmpty(inputs.Deployment.ArtifactStoreId) && (inputs.Deployment.ArtifactGlobs.Count > 0 || inputs.Deployment.SuspensionEnabled || !String.IsNullOrEmpty(inputs.Deployment.WorkspaceTemplateId)))
                inputs.ArtifactStore = await _Database.ArtifactStores.ReadAsync(tenantId, inputs.Deployment.ArtifactStoreId, token).ConfigureAwait(false)
                    ?? throw new CompilationException("ReferenceNotFound", "Artifact store was not found.");

            if (!String.IsNullOrEmpty(inputs.Deployment.WorkspaceTemplateId))
            {
                inputs.Workspace = await _Database.WorkspaceTemplates.ReadAsync(tenantId, inputs.Deployment.WorkspaceTemplateId, token).ConfigureAwait(false)
                    ?? throw new CompilationException("ReferenceNotFound", "Workspace template " + inputs.Deployment.WorkspaceTemplateId + " was not found.");
                if (!String.IsNullOrEmpty(inputs.Workspace.GitCredentialSecretId))
                {
                    inputs.WorkspaceSecret = await _Database.Secrets.ReadAsync(tenantId, inputs.Workspace.GitCredentialSecretId, token).ConfigureAwait(false);
                }
            }

            if (includeRepair && !inputs.Prompts.ContainsKey(RepairRole))
            {
                PromptTemplate repair = await _Database.PromptTemplates.ReadByNameAsync(tenantId, RepairTemplateName, token).ConfigureAwait(false)
                    ?? throw new CompilationException("ReferenceNotFound", "Prompt template " + RepairTemplateName + " for role " + RepairRole + " was not found.");
                BoundPrompt bound = new BoundPrompt();
                bound.Role = RepairRole;
                bound.TemplateId = repair.Id;
                bound.TemplateName = repair.Name;
                bound.Version = repair.CurrentVersion;
                bound.Content = repair.Content;
                inputs.Prompts[RepairRole] = bound;
            }

            if (includeConversationFallback && !inputs.Prompts.ContainsKey(ConversationFallbackRole))
            {
                PromptTemplate fallback = await _Database.PromptTemplates.ReadByNameAsync(tenantId, ConversationFallbackTemplateName, token).ConfigureAwait(false)
                    ?? throw new CompilationException("ReferenceNotFound", "Prompt template " + ConversationFallbackTemplateName + " for role " + ConversationFallbackRole + " was not found.");
                BoundPrompt bound = new BoundPrompt();
                bound.Role = ConversationFallbackRole;
                bound.TemplateId = fallback.Id;
                bound.TemplateName = fallback.Name;
                bound.Version = fallback.CurrentVersion;
                bound.Content = fallback.Content;
                inputs.Prompts[ConversationFallbackRole] = bound;
            }

            if (pipeline != null)
            {
                // Precedence (P12.9): the stage's own handoff template (respecting its pinned version), then the
                // deployment's PipelineStage binding, then the built-in template.
                if (!String.IsNullOrEmpty(pipeline.HandoffTemplateId))
                {
                    PromptTemplate handoff = await _Database.PromptTemplates.ReadAsync(tenantId, pipeline.HandoffTemplateId, token).ConfigureAwait(false)
                        ?? throw new CompilationException("ReferenceNotFound", "Prompt template " + pipeline.HandoffTemplateId + " for role " + PipelineStageRole + " of pipeline stage " + pipeline.StageName + " was not found.");
                    BoundPrompt bound = new BoundPrompt();
                    bound.Role = PipelineStageRole;
                    bound.TemplateId = handoff.Id;
                    bound.TemplateName = handoff.Name;
                    bound.Version = handoff.CurrentVersion;
                    bound.Content = handoff.Content;
                    if (pipeline.HandoffTemplateVersion.HasValue && pipeline.HandoffTemplateVersion.Value != handoff.CurrentVersion)
                    {
                        PromptTemplateVersion version = await _Database.PromptTemplateVersions.ReadByVersionAsync(handoff.Id, pipeline.HandoffTemplateVersion.Value, token).ConfigureAwait(false)
                            ?? throw new CompilationException("ReferenceNotFound", "Version " + pipeline.HandoffTemplateVersion.Value + " of prompt template " + handoff.Name + " was not found.");
                        bound.Version = version.Version;
                        bound.Content = version.Content;
                    }
                    inputs.Prompts[PipelineStageRole] = bound;
                }
                else if (!inputs.Prompts.ContainsKey(PipelineStageRole))
                {
                    PromptTemplate stage = await _Database.PromptTemplates.ReadByNameAsync(tenantId, PipelineStageTemplateName, token).ConfigureAwait(false)
                        ?? throw new CompilationException("ReferenceNotFound", "Prompt template " + PipelineStageTemplateName + " for role " + PipelineStageRole + " was not found.");
                    BoundPrompt bound = new BoundPrompt();
                    bound.Role = PipelineStageRole;
                    bound.TemplateId = stage.Id;
                    bound.TemplateName = stage.Name;
                    bound.Version = stage.CurrentVersion;
                    bound.Content = stage.Content;
                    inputs.Prompts[PipelineStageRole] = bound;
                }
            }

            await LoadIncludesAsync(tenantId, inputs, token).ConfigureAwait(false);
            return inputs;
        }

        /// <summary>
        /// Compile loaded inputs.
        /// </summary>
        /// <param name="inputs">Inputs.</param>
        /// <param name="run">Run.</param>
        /// <param name="runToken">Run token, or null.</param>
        /// <returns>Result.</returns>
        /// <exception cref="CompilationException">Thrown when compilation fails.</exception>
        public CompilationResult Compile(CompilationInputs inputs, Run run, string? runToken)
        {
            return Compile(inputs, run, runToken, null);
        }

        /// <summary>
        /// Compile loaded inputs, optionally as a structured output repair.
        /// </summary>
        /// <param name="inputs">Inputs (loaded with the Repair role when repair is set).</param>
        /// <param name="run">Run.</param>
        /// <param name="runToken">Run token, or null.</param>
        /// <param name="repair">Repair inputs, or null for the original execution.</param>
        /// <returns>Result.</returns>
        /// <exception cref="CompilationException">Thrown when compilation fails.</exception>
        public CompilationResult Compile(CompilationInputs inputs, Run run, string? runToken, CompilationRepair? repair)
        {
            return Compile(inputs, run, runToken, repair, null);
        }

        /// <summary>
        /// Compile loaded inputs, optionally as a structured output repair, with the conversation inputs of a turn that
        /// falls back to a fresh session.
        /// </summary>
        /// <param name="inputs">Inputs (loaded with the Repair role when repair is set, and with the ConversationFallback role when conversation is set).</param>
        /// <param name="run">Run.</param>
        /// <param name="runToken">Run token, or null.</param>
        /// <param name="repair">Repair inputs, or null for the original execution.</param>
        /// <param name="conversation">Transcript of the earlier turns for a fallback turn, or null.</param>
        /// <returns>Result.</returns>
        /// <exception cref="CompilationException">Thrown when compilation fails.</exception>
        public CompilationResult Compile(CompilationInputs inputs, Run run, string? runToken, CompilationRepair? repair, CompilationConversation? conversation)
        {
            return Compile(inputs, run, runToken, repair, conversation, null);
        }

        /// <summary>
        /// Compile loaded inputs, optionally as a structured output repair, with the conversation inputs of a fallback
        /// turn and the pipeline inputs of a pipeline stage run (P12.9).
        /// </summary>
        /// <param name="inputs">Inputs (loaded with the PipelineStage role when pipeline is set).</param>
        /// <param name="run">Run.</param>
        /// <param name="runToken">Run token, or null.</param>
        /// <param name="repair">Repair inputs, or null for the original execution.</param>
        /// <param name="conversation">Transcript of the earlier turns for a fallback turn, or null.</param>
        /// <param name="pipeline">Pipeline inputs of a stage run, or null.</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when inputs or run is null.</exception>
        /// <exception cref="CompilationException">Thrown when compilation fails.</exception>
        public CompilationResult Compile(CompilationInputs inputs, Run run, string? runToken, CompilationRepair? repair, CompilationConversation? conversation, CompilationPipeline? pipeline)
        {
            if (inputs == null) throw new ArgumentNullException(nameof(inputs));
            if (run == null) throw new ArgumentNullException(nameof(run));

            Deployment deployment = inputs.Deployment;
            Agent agent = inputs.Agent;
            HarnessProfile profile = inputs.Profile;
            HashSet<string> scrub = new HashSet<string>(StringComparer.Ordinal);
            ExecutionSpec spec = new ExecutionSpec();
            spec.RunId = run.Id;
            spec.TenantId = run.TenantId;
            spec.AgentName = agent.Name;
            spec.DeploymentId = deployment.Id;
            spec.DeploymentName = deployment.Name;
            spec.HarnessType = profile.HarnessType;
            if ((deployment.ArtifactGlobs.Count > 0 || deployment.SuspensionEnabled || inputs.Workspace?.Kind == WorkspaceKindEnum.GitRepository) && inputs.ArtifactStore?.Active == true)
            {
                spec.Artifacts = new ExecutionArtifacts
                {
                    ApiBaseUrl = _Options.ApiBaseUrl, McpUrl = _Options.McpBaseUrl.TrimEnd('/') + _Options.McpPath, BearerToken = runToken ?? String.Empty, StoreId = inputs.ArtifactStore.Id,
                    Globs = new List<string>(deployment.ArtifactGlobs), MaxFileBytes = _Options.ArtifactCollection.MaxFileBytes,
                    MaxTotalBytes = _Options.ArtifactCollection.MaxTotalBytes, MaxFiles = _Options.ArtifactCollection.MaxFiles,
                    MaxScanEntries = _Options.ArtifactCollection.MaxScanEntries, TimeoutSeconds = _Options.ArtifactCollection.TimeoutSeconds
                };
            }

            if (deployment.SuspensionEnabled)
            {
                if (run.Executor != RunExecutorEnum.Process || !profile.SupportsResume || !profile.IsolateHome || String.IsNullOrEmpty(profile.SessionFormat) || spec.Artifacts == null)
                    throw new CompilationException("ContinuationUnsupported", "Suspension requires a Process harness with isolated HOME, resume support, a pinned session format, and an active artifact store.");
                spec.Continuation = new ExecutionContinuation { SessionFormat = profile.SessionFormat };
            }

            Dictionary<string, string> parameters = RunOverrideValidator.Effective(deployment, run.Parameters);
            bool delegationEnabled = agent.DelegationMode != DelegationModeEnum.None && !String.IsNullOrEmpty(runToken);
            if (deployment.ApprovalsEnabled && !Garrison.Core.Services.ConfigurationValidator.SupportsApprovals(profile))
            {
                throw new CompilationException("ApprovalsUnsupported", "Deployment " + deployment.Name + " has approvals enabled, but harness profile " + profile.Name + " cannot relay permission requests (Claude Code, CodexAppServer, and ProviderApi support this hook).");
            }
            bool approvalsEnabled = deployment.ApprovalsEnabled && !String.IsNullOrEmpty(runToken);
            if (approvalsEnabled && profile.HarnessType == HarnessTypeEnum.ClaudeCode)
            {
                // With approvals, Claude Code must ask before every tool that needs permission, so the defaults move to
                // permission mode "default" and only Garrison's own tools pre-allowed. Deployment parameters still win, and
                // the profile's argument templates stay the same so existing argument overrides keep matching.
                if (!parameters.ContainsKey("permissionMode")) parameters["permissionMode"] = "default";
                if (!parameters.ContainsKey("allowedTools")) parameters["allowedTools"] = "mcp__" + Constants.McpServerName;
            }

            TemplateContext context = BaseContext(inputs, run, parameters, delegationEnabled, repair, conversation);
            context.Set("pipeline", PipelineContext(pipeline));
            context.Set("approval", ApprovalContext(deployment, approvalsEnabled));
            Dictionary<string, object?> secrets = SecretContext(inputs, scrub);
            context.Set("secret", secrets);

            List<McpServerEntry> servers = BuildMcpServers(inputs, context, runToken, delegationEnabled, approvalsEnabled, spec, scrub);
            context.Set("resources", ResourcesContext(inputs, servers));
            context.Set("assets", AssetsContext(inputs, spec));
            // AD3.3: the worker syncs the file space into this directory; the server adds the files at lease.
            if (run.Executor != RunExecutorEnum.RemoteA2A && run.Executor != RunExecutorEnum.RemoteMcp) spec.FileSpace = new ExecutionFileSpace { FileSpaceId = run.FileSpaceId, MountPath = deployment.FileSpaceMountPath };
            Dictionary<string, object?> filesContext = TemplateContext.NewMap();
            filesContext["enabled"] = spec.FileSpace != null && !String.IsNullOrEmpty(run.FileSpaceId);
            filesContext["mountPath"] = deployment.FileSpaceMountPath;
            context.Set("files", filesContext);
            if (spec.Artifacts != null) spec.Artifacts.ExcludedPaths = spec.AssetFiles.Select(a => a.Path).ToList();

            Func<string, string?> includes = name => inputs.Includes.TryGetValue(name, out BoundPrompt? include) ? include.Content : null;
            HashSet<string> usedIncludes = new HashSet<string>(StringComparer.Ordinal);

            string system = RenderPrompt(inputs, "System", context, includes, usedIncludes);
            string taskRole = (run.Depth > 0 || run.Kind == RunKindEnum.Delegated) && inputs.Prompts.ContainsKey("DelegatedTask") ? "DelegatedTask" : "Task";
            if (repair != null)
            {
                if (!inputs.Prompts.ContainsKey(RepairRole)) throw new CompilationException("ReferenceNotFound", "No template is bound to role " + RepairRole + " for the structured output repair.");
                taskRole = RepairRole;
            }
            string task = inputs.Prompts.ContainsKey(taskRole) ? RenderPrompt(inputs, taskRole, context, includes, usedIncludes) : (run.InputText ?? String.Empty);
            if (repair == null && conversation != null && conversation.Turns.Count > 0 && inputs.Prompts.ContainsKey(ConversationFallbackRole))
            {
                // A fresh session for a conversation that already had turns: the fallback prompt repeats them before the
                // task, so the harness answers with the conversation's context (P12.1).
                Dictionary<string, object?> conversationMap = context.Root.TryGetValue("conversation", out object? existing) && existing is Dictionary<string, object?> map ? map : TemplateContext.NewMap();
                conversationMap["task"] = task;
                context.Set("conversation", conversationMap);
                task = RenderPrompt(inputs, ConversationFallbackRole, context, includes, usedIncludes);
            }
            if (repair == null && pipeline != null && inputs.Prompts.ContainsKey(PipelineStageRole))
            {
                // A pipeline stage run (P12.9): the stage template renders around the run's own task prompt and hands the
                // earlier stages' outputs, review notes, and revision feedback to the harness.
                Dictionary<string, object?> pipelineMap = context.Root.TryGetValue("pipeline", out object? current) && current is Dictionary<string, object?> existingPipeline ? existingPipeline : TemplateContext.NewMap();
                pipelineMap["task"] = task;
                context.Set("pipeline", pipelineMap);
                task = RenderPrompt(inputs, PipelineStageRole, context, includes, usedIncludes);
            }
            if (repair == null && pipeline != null && !String.IsNullOrWhiteSpace(inputs.Agent.InputSchemaJson))
            {
                List<InputSchemaViolation> violations = new InputSchemaValidator().Validate(inputs.Agent.InputSchemaJson, task);
                if (violations.Count > 0)
                {
                    string code = violations.Any(violation => violation.Code == InputSchemaValidator.NotJsonCode)
                        ? InputSchemaValidator.NotJsonCode : InputSchemaValidator.ViolationCode;
                    throw new CompilationException(code, "Pipeline stage " + pipeline.Position + " (" + pipeline.StageName + ") input does not match the agent's input schema: "
                        + String.Join(" ", violations.Select(violation => violation.Field + ": " + violation.Message)));
                }
            }
            if (run.ContinuationPrompt != null) task = run.ContinuationPrompt;
            string taskPrompt = task;
            if (repair == null && profile.SystemPromptDelivery == SystemPromptDeliveryEnum.PrependToPrompt && system.Length > 0)
            {
                task = system + Environment.NewLine + Environment.NewLine + task;
            }
            Dictionary<string, object?> prompts = TemplateContext.NewMap();
            prompts["system"] = system;
            prompts["task"] = task;
            context.Set("prompts", prompts);

            spec.Executable = Render(profile.Executable, context, includes, usedIncludes, false, scrub, "executable");
            if (String.IsNullOrWhiteSpace(spec.Executable)) throw new CompilationException("ExecutableMissing", "Harness profile " + profile.Name + " rendered an empty executable.");

            foreach (HarnessArgument argument in ApplyArgumentOverrides(profile.Arguments, deployment.ArgumentOverrides))
            {
                RenderArgument(argument, context, includes, usedIncludes, scrub, spec.Arguments);
            }

            RenderEnvironment(inputs, context, includes, usedIncludes, scrub, spec);
            RenderFiles(inputs, context, includes, usedIncludes, scrub, spec);

            switch (profile.SystemPromptDelivery)
            {
                case SystemPromptDeliveryEnum.File:
                    string fileName = String.IsNullOrWhiteSpace(profile.SystemPromptTarget) ? "system-prompt.md" : profile.SystemPromptTarget!;
                    if (system.Length > 0 && !spec.Files.Any(f => f.BaseDirectory == FileBaseDirectoryEnum.Config && f.Path == fileName))
                    {
                        spec.Files.Add(File(FileBaseDirectoryEnum.Config, fileName, system, null, false));
                    }
                    break;
                case SystemPromptDeliveryEnum.Argument:
                    if (system.Length > 0 && !String.IsNullOrWhiteSpace(profile.SystemPromptTarget))
                    {
                        spec.Arguments.Add(profile.SystemPromptTarget!);
                        spec.Arguments.Add(system);
                    }
                    break;
                case SystemPromptDeliveryEnum.Environment:
                    if (system.Length > 0 && !String.IsNullOrWhiteSpace(profile.SystemPromptTarget))
                    {
                        spec.Environment.Add(Variable(profile.SystemPromptTarget!, system, false));
                    }
                    break;
            }

            switch (profile.PromptDelivery)
            {
                case PromptDeliveryEnum.Stdin:
                    spec.Stdin = task;
                    break;
                case PromptDeliveryEnum.Argument:
                    // The task is caller text. When it, or a template that starts with a variable, would be the start of the
                    // argument, "--" goes first so text that begins with "-" is never read as an option (SR-14). A template
                    // with a literal prefix, such as --prompt={{task}}, is one argument the CLI already reads as a value.
                    if (String.IsNullOrWhiteSpace(profile.PromptArgumentTemplate) || profile.PromptArgumentTemplate.TrimStart().StartsWith("{{", StringComparison.Ordinal))
                    {
                        spec.Arguments.Add("--");
                    }
                    spec.Arguments.Add(String.IsNullOrWhiteSpace(profile.PromptArgumentTemplate) ? task : Render(profile.PromptArgumentTemplate, context, includes, usedIncludes, false, scrub, "promptArgument"));
                    break;
                case PromptDeliveryEnum.File:
                    string promptFile = String.IsNullOrWhiteSpace(profile.PromptArgumentTemplate) ? "prompt.md" : Render(profile.PromptArgumentTemplate, context, includes, usedIncludes, false, scrub, "promptArgument");
                    spec.Files.Add(File(FileBaseDirectoryEnum.Config, promptFile, task, null, false));
                    break;
                case PromptDeliveryEnum.CodexAppServer:
                    // The worker sends the prompt as the input of one turn over JSON-RPC; the thread to resume and the
                    // output schema travel as typed settings because app-server takes them as request parameters.
                    spec.Stdin = task;
                    spec.AppServer = new ExecutionAppServer();
                    spec.AppServer.ResumeThreadId = repair?.SessionId ?? run.ResumeSessionId;
                    spec.AppServer.OutputSchemaJson = CompactJson(agent.OutputSchemaJson, "output schema of agent " + agent.Name);
                    if (approvalsEnabled)
                    {
                        // Codex asks before commands and file changes it does not trust; the worker relays each request to
                        // garrison_permission_prompt with the run token. codexApprovalPolicy (untrusted, on-request, or
                        // on-failure) overrides the policy.
                        spec.AppServer.ApprovalPolicy = parameters.TryGetValue("codexApprovalPolicy", out string? policy) && !String.IsNullOrWhiteSpace(policy) ? policy : "untrusted";
                        spec.ApprovalRelay = new ExecutionApprovalRelay();
                        spec.ApprovalRelay.McpUrl = _Options.McpBaseUrl.TrimEnd('/');
                        spec.ApprovalRelay.McpPath = String.IsNullOrEmpty(_Options.McpPath) ? "/mcp" : _Options.McpPath;
                        spec.ApprovalRelay.BearerToken = runToken!;
                        spec.ApprovalRelay.ToolName = PermissionPromptTool;
                        spec.ApprovalRelay.TimeoutSeconds = deployment.ApprovalTimeoutSeconds + 120;
                    }
                    break;
            }

            spec.Workspace = Workspace(inputs, scrub);
            spec.Parser = profile.OutputParser;
            spec.ParserOptions.TextField = profile.GenericTextField;
            spec.ParserOptions.FinalField = profile.GenericFinalField;
            spec.ParserOptions.SuccessField = profile.GenericSuccessField;
            spec.ParserOptions.SuccessValue = profile.GenericSuccessValue;
            spec.ParserOptions.ApprovalsRelayed = spec.ApprovalRelay != null;
            spec.ResultSource = profile.ResultSource;
            spec.ResultFileName = profile.ResultFileName;
            spec.SuccessPolicy = profile.SuccessPolicy;
            spec.SuccessExitCodes = profile.SuccessExitCodes.Count > 0 ? new List<int>(profile.SuccessExitCodes) : new List<int> { 0 };
            spec.TimeoutSeconds = EffectiveTimeoutSeconds(deployment, profile, run.Parameters, _Options.DefaultTimeoutSeconds, _Options.MaxRunSeconds);
            spec.RepetitionGuard = deployment.RepetitionGuard ?? _Options.RepetitionGuard;
            spec.MaxAssistantChars = deployment.MaxAssistantChars ?? _Options.MaxAssistantChars;
            spec.NoProgressSeconds = deployment.NoProgressSeconds ?? _Options.NoProgressSeconds;
            spec.KillGraceSeconds = profile.KillGraceSeconds;
            spec.MaxOutputBytes = profile.MaxOutputBytes;
            spec.StderrTailBytes = profile.StderrTailBytes;
            spec.IsolateHome = profile.IsolateHome;
            spec.TraceParent = Activity.Current?.Id;
            spec.RepairAttempt = repair?.Attempt ?? 0;
            if (!String.IsNullOrEmpty(run.ConversationId) && run.Executor == RunExecutorEnum.Process)
            {
                ExecutionConversation turn = new ExecutionConversation();
                turn.ConversationId = run.ConversationId!;
                turn.Turn = Math.Max(1, run.ConversationTurn);
                turn.Resume = !String.IsNullOrEmpty(run.ResumeSessionId);
                spec.Conversation = turn;
            }
            spec.Executor = run.Executor;
            spec.RequiredCapabilities = ExecutorCapabilityRules.RequiresReport(run.RequiredCapabilities) ? run.RequiredCapabilities.Clone() : null;
            spec.PodResources = run.Executor == RunExecutorEnum.KubernetesJob && !deployment.PodResources.IsEmpty ? deployment.PodResources.Clone() : null;
            spec.EgressRules = deployment.EgressRules.Select(r => r.Clone()).ToList();
            if (spec.EgressRules.Count > 0 && run.Executor != RunExecutorEnum.KubernetesJob)
            {
                // P11.15 (D-052): never run an allowlisted deployment where the allowlist cannot be enforced, for example
                // when the rules were added after this run was admitted for the Process executor.
                throw new CompilationException("ExecutorMismatch", "Deployment " + deployment.Name + " has an egress allowlist, which only KubernetesJob runs enforce; this run was admitted for the " + run.Executor + " executor. Submit the run again so it is admitted with the allowlist.");
            }
            if (spec.Workspace.Kind == WorkspaceKindEnum.PersistentVolume && run.Executor != RunExecutorEnum.KubernetesJob)
            {
                throw new CompilationException("ExecutorMismatch", "Workspace template " + (inputs.Workspace?.Name ?? String.Empty) + " is a PersistentVolume workspace, which needs the KubernetesJob executor; deployment " + deployment.Name + " runs with " + run.Executor + ".");
            }
            // A KubernetesJob run's home and workspace live on the run pod's emptyDir volumes and are gone when the pod
            // ends, so a structured output repair could not resume the session there; such runs are not retained.
            spec.RetainForRepair = repair == null && run.Executor == RunExecutorEnum.Process && profile.SupportsResume && !String.IsNullOrWhiteSpace(agent.OutputSchemaJson);

            foreach (McpServerEntry server in servers)
            {
                if (!server.IsHttp) continue;
                if (!server.Required && server.RequiredTools.Count == 0) continue;
                ExecutionMcpCheck check = new ExecutionMcpCheck();
                check.Name = server.Name;
                check.Url = server.Url;
                check.Path = server.Path;
                check.Required = server.Required;
                check.RequiredTools = new List<string>(server.RequiredTools);
                foreach (ExecutionEnvironmentVariable header in server.Headers) check.Headers.Add(Variable(header.Name, header.Value, true));
                spec.McpPreflight.Add(check);
            }

            if (!String.IsNullOrEmpty(runToken)) scrub.Add(runToken);
            spec.ScrubValues = scrub.Where(v => !String.IsNullOrEmpty(v) && v.Length >= 4).OrderByDescending(v => v.Length).ToList();

            CompilationResult result = new CompilationResult();
            result.Spec = spec;
            result.TemplateVersions = TemplateVersions(inputs, run, usedIncludes);
            result.TaskPrompt = taskPrompt;
            return result;
        }

        /// <summary>
        /// A run's timeout in seconds: the deployment's timeoutSeconds, else the harness profile's default, else the
        /// compiler default; replaced by the run's timeoutSeconds parameter when the deployment allows that override and
        /// the value passes its rule; finally bounded by the cluster cap Runtime.MaxRunSeconds. The result is at least 5.
        /// </summary>
        /// <param name="deployment">Deployment; null uses the profile and default only.</param>
        /// <param name="profile">Harness profile; null skips the profile default.</param>
        /// <param name="runParameters">The run's parameters; null for none.</param>
        /// <param name="defaultTimeoutSeconds">Default when neither the deployment nor the profile sets one.</param>
        /// <param name="maxRunSeconds">Cluster cap.</param>
        /// <returns>Timeout in seconds.</returns>
        public static int EffectiveTimeoutSeconds(Deployment? deployment, HarnessProfile? profile, IEnumerable<RunParameter>? runParameters, int defaultTimeoutSeconds, int maxRunSeconds)
        {
            int timeout = deployment?.TimeoutSeconds ?? (profile != null && profile.DefaultTimeoutSeconds > 0 ? profile.DefaultTimeoutSeconds : defaultTimeoutSeconds);
            if (deployment != null && runParameters != null && IsAllowed(deployment, "timeoutSeconds"))
            {
                RunParameter? requested = runParameters.FirstOrDefault(p => String.Equals(p.Name, "timeoutSeconds", StringComparison.OrdinalIgnoreCase));
                if (requested != null
                    && RunOverrideValidator.Effective(deployment, new List<RunParameter> { requested }).TryGetValue("timeoutSeconds", out string? value)
                    && value == requested.Value
                    && Int32.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out int overridden)
                    && overridden > 0)
                {
                    timeout = overridden;
                }
            }
            return Math.Clamp(timeout, 5, Math.Max(5, maxRunSeconds));
        }

        #endregion

        #region Private-Methods

        private static Dictionary<string, object?> PipelineContext(CompilationPipeline? pipeline)
        {
            // pipeline.* (P12.9): empty values for runs outside a pipeline, so shared templates can test pipeline.id.
            Dictionary<string, object?> map = TemplateContext.NewMap();
            map["id"] = pipeline?.PipelineId;
            map["name"] = pipeline?.PipelineName;
            map["runId"] = pipeline?.PipelineRunId;
            map["position"] = pipeline?.Position ?? 0;
            map["stageName"] = pipeline?.StageName;
            map["stageCount"] = pipeline?.StageCount ?? 0;
            map["task"] = null;
            map["hasPrevious"] = pipeline?.Previous != null;
            map["previous"] = pipeline?.Previous == null ? null : PipelineStageContext(pipeline.Previous);
            List<object?> stages = new List<object?>();
            if (pipeline != null)
            {
                foreach (CompilationPipelineStage stage in pipeline.Stages) stages.Add(PipelineStageContext(stage));
            }
            map["stages"] = stages;
            map["hasReviewNotes"] = !String.IsNullOrEmpty(pipeline?.ReviewNotes);
            map["reviewNotes"] = pipeline?.ReviewNotes;
            map["isRevision"] = pipeline?.Revision != null;
            Dictionary<string, object?>? revision = null;
            if (pipeline?.Revision != null)
            {
                revision = TemplateContext.NewMap();
                revision["number"] = pipeline.Revision.Number;
                revision["feedback"] = pipeline.Revision.Feedback;
                revision["reviewer"] = pipeline.Revision.Reviewer;
                revision["previousOutput"] = pipeline.Revision.PreviousOutput;
                revision["previousOutputTruncated"] = pipeline.Revision.PreviousOutputTruncated;
            }
            map["revision"] = revision;
            return map;
        }

        private static Dictionary<string, object?> PipelineStageContext(CompilationPipelineStage stage)
        {
            Dictionary<string, object?> item = TemplateContext.NewMap();
            item["position"] = stage.Position;
            item["stageName"] = stage.StageName;
            item["agentName"] = stage.AgentName;
            item["status"] = stage.Status;
            item["outcome"] = stage.Outcome;
            item["output"] = stage.Output;
            item["outputTruncated"] = stage.OutputTruncated;
            item["structured"] = stage.Structured;
            item["hasArtifacts"] = stage.Artifacts.Count > 0;
            List<object?> artifacts = new List<object?>();
            foreach (CompilationPipelineArtifact artifact in stage.Artifacts)
            {
                Dictionary<string, object?> entry = TemplateContext.NewMap();
                entry["id"] = artifact.Id;
                entry["name"] = artifact.Name;
                entry["mediaType"] = artifact.MediaType;
                entry["sizeBytes"] = artifact.SizeBytes;
                artifacts.Add(entry);
            }
            item["artifacts"] = artifacts;
            return item;
        }

        private async Task LoadIncludesAsync(string tenantId, CompilationInputs inputs, CancellationToken token)
        {
            Queue<string> pending = new Queue<string>();
            void Scan(string? text)
            {
                if (String.IsNullOrEmpty(text) || !text.Contains("{{>", StringComparison.Ordinal)) return;
                foreach (string name in TemplateAnalyzer.Analyze(text, null, true).Includes) pending.Enqueue(name);
            }

            foreach (BoundPrompt prompt in inputs.Prompts.Values) Scan(prompt.Content);
            HarnessProfile profile = inputs.Profile;
            Scan(profile.Executable);
            Scan(profile.PromptArgumentTemplate);
            foreach (HarnessArgument argument in profile.Arguments)
            {
                Scan(argument.Template);
                Scan(argument.Condition);
            }
            foreach (HarnessEnvironmentVariable variable in profile.Environment) Scan(variable.ValueTemplate);
            foreach (HarnessFile file in profile.Files)
            {
                Scan(file.PathTemplate);
                Scan(file.ContentTemplate);
            }
            foreach (DeploymentArgumentOverride argument in inputs.Deployment.ArgumentOverrides) Scan(argument.Template);
            foreach (DeploymentEnvironmentOverride variable in inputs.Deployment.EnvironmentOverrides) Scan(variable.ValueTemplate);
            foreach (DeploymentFileOverride file in inputs.Deployment.FileOverrides) Scan(file.ContentTemplate);

            while (pending.Count > 0)
            {
                string name = pending.Dequeue();
                if (inputs.Includes.ContainsKey(name)) continue;
                PromptTemplate? template = await _Database.PromptTemplates.ReadByNameAsync(tenantId, name, token).ConfigureAwait(false);
                if (template == null) throw new CompilationException("ReferenceNotFound", "Included template '" + name + "' was not found.");
                BoundPrompt include = new BoundPrompt();
                include.Role = "Include";
                include.TemplateId = template.Id;
                include.TemplateName = template.Name;
                include.Version = template.CurrentVersion;
                include.Content = template.Content;
                inputs.Includes[name] = include;
                Scan(template.Content);
            }
        }

        private async Task LoadAssetsAsync(string tenantId, CompilationInputs inputs, CancellationToken token)
        {
            // AD2.4: a SystemPrompt asset becomes the System prompt; the other kinds are placed into the workspace.
            foreach (AgentRevisionAssetPin pin in inputs.AgentRevision!.AssetPins)
            {
                AgentAsset asset = await _Database.AgentAssets.ReadAsync(tenantId, pin.AssetId, token).ConfigureAwait(false)
                    ?? throw new CompilationException("ReferenceNotFound", "Asset " + pin.AssetId + " pinned by agent " + inputs.Agent.Name + " was not found.");
                if (asset.Kind == AgentAssetKindEnum.SystemPrompt)
                {
                    PromptTemplate template = await _Database.PromptTemplates.ReadAsync(tenantId, asset.PromptTemplateId ?? String.Empty, token).ConfigureAwait(false)
                        ?? throw new CompilationException("ReferenceNotFound", "Prompt template of system prompt asset " + asset.Name + " was not found.");
                    BoundPrompt bound = new BoundPrompt();
                    bound.Role = "System";
                    bound.TemplateId = template.Id;
                    bound.TemplateName = template.Name;
                    bound.Version = template.CurrentVersion;
                    bound.Content = template.Content;
                    if (pin.Version.HasValue && pin.Version.Value != template.CurrentVersion)
                    {
                        PromptTemplateVersion version = await _Database.PromptTemplateVersions.ReadByVersionAsync(template.Id, pin.Version.Value, token).ConfigureAwait(false)
                            ?? throw new CompilationException("ReferenceNotFound", "Version " + pin.Version.Value + " of prompt template " + template.Name + " (asset " + asset.Name + ") was not found.");
                        bound.Version = version.Version;
                        bound.Content = version.Content;
                    }
                    inputs.Prompts["System"] = bound;
                    continue;
                }
                int number = pin.Version ?? asset.CurrentVersion;
                if (number < 1) throw new CompilationException("AssetHasNoVersions", "Asset " + asset.Name + " pinned by agent " + inputs.Agent.Name + " has no uploaded version.");
                AgentAssetVersion assetVersion = await _Database.AgentAssets.ReadVersionAsync(tenantId, asset.Id, number, token).ConfigureAwait(false)
                    ?? throw new CompilationException("ReferenceNotFound", "Version " + number + " of asset " + asset.Name + " was not found.");
                inputs.Assets.Add(new CompilationAsset { Asset = asset, Version = assetVersion });
            }
        }

        private static Dictionary<string, object?> AssetsContext(CompilationInputs inputs, ExecutionSpec spec)
        {
            List<object?> listed = new List<object?>();
            foreach (CompilationAsset placed in inputs.Assets)
            {
                HarnessAssetPlacement placement = inputs.Profile.AssetPlacements.FirstOrDefault(p => p.Kind == placed.Asset.Kind)
                    ?? new HarnessAssetPlacement { Kind = placed.Asset.Kind, PathTemplate = "assets/{{asset.name}}", ListInSystemPrompt = true };
                string directory = placement.PathTemplate.Replace("{{asset.name}}", placed.Asset.Name, StringComparison.Ordinal).Trim('/');
                if (directory.Length == 0 || directory.StartsWith("/", StringComparison.Ordinal) || directory.Contains('\\') || directory.Split('/').Any(segment => segment.Length == 0 || segment == "." || segment == ".."))
                {
                    throw new CompilationException("InvalidAssetPlacement", "Harness profile " + inputs.Profile.Name + " places " + placed.Asset.Kind + " assets at '" + placement.PathTemplate + "', which leaves the workspace.");
                }
                foreach (AgentAssetFile file in placed.Version.Files)
                {
                    ExecutionAssetFile target = new ExecutionAssetFile();
                    target.AssetId = placed.Asset.Id;
                    target.AssetName = placed.Asset.Name;
                    target.Kind = placed.Asset.Kind;
                    target.Version = placed.Version.Number;
                    target.Path = directory + "/" + file.Path;
                    target.MediaType = file.MediaType;
                    target.SizeBytes = file.SizeBytes;
                    target.Sha256 = file.Sha256;
                    spec.AssetFiles.Add(target);
                }
                if (!placement.ListInSystemPrompt) continue;
                Dictionary<string, object?> entry = TemplateContext.NewMap();
                entry["name"] = placed.Asset.Name;
                entry["path"] = directory;
                entry["description"] = placed.Asset.Description;
                entry["version"] = placed.Version.Number;
                entry["isSkill"] = placed.Asset.Kind == AgentAssetKindEnum.Skill;
                entry["isReferenceFile"] = placed.Asset.Kind == AgentAssetKindEnum.ReferenceFile;
                entry["isDocumentTemplate"] = placed.Asset.Kind == AgentAssetKindEnum.DocumentTemplate;
                entry["files"] = placed.Version.Files.Select(f => (object?)(directory + "/" + f.Path)).ToList();
                listed.Add(entry);
            }
            Dictionary<string, object?> assets = TemplateContext.NewMap();
            assets["listed"] = listed;
            assets["count"] = inputs.Assets.Count;
            return assets;
        }

        private static Dictionary<string, object?> ApprovalContext(Deployment deployment, bool enabled)
        {
            // approval.* lets harness profiles opt into permission approvals (P12.3). Disabled deployments see the values
            // the built-in profiles used before approvals existed, so their command lines do not change.
            Dictionary<string, object?> approval = TemplateContext.NewMap();
            approval["enabled"] = enabled;
            approval["promptTool"] = enabled ? "mcp__" + Constants.McpServerName + "__" + PermissionPromptTool : null;
            approval["timeoutSeconds"] = deployment.ApprovalTimeoutSeconds;
            long toolTimeoutMs = enabled ? Math.Max(600000L, (deployment.ApprovalTimeoutSeconds + 120L) * 1000L) : 600000L;
            approval["mcpToolTimeoutMs"] = toolTimeoutMs.ToString(System.Globalization.CultureInfo.InvariantCulture);
            return approval;
        }

        private TemplateContext BaseContext(CompilationInputs inputs, Run run, Dictionary<string, string> parameters, bool delegationEnabled, CompilationRepair? repair, CompilationConversation? conversation)
        {
            Deployment deployment = inputs.Deployment;
            Agent agent = inputs.Agent;
            TemplateContext context = new TemplateContext();

            Dictionary<string, object?> tenant = TemplateContext.NewMap();
            tenant["id"] = run.TenantId;
            tenant["name"] = inputs.Tenant?.Name;
            context.Set("tenant", tenant);

            Dictionary<string, object?> agentMap = TemplateContext.NewMap();
            agentMap["id"] = agent.Id;
            agentMap["name"] = agent.Name;
            agentMap["displayName"] = agent.DisplayName;
            agentMap["description"] = agent.Description;
            agentMap["version"] = agent.AgentVersion;
            agentMap["outputSchema"] = CompactJson(agent.OutputSchemaJson, "output schema of agent " + agent.Name);
            agentMap["inputSchema"] = CompactJson(agent.InputSchemaJson, "input schema of agent " + agent.Name);
            agentMap["tags"] = agent.Tags.Cast<object?>().ToList();
            List<object?> skills = new List<object?>();
            foreach (AgentSkillDefinition skill in agent.Skills)
            {
                Dictionary<string, object?> s = TemplateContext.NewMap();
                s["id"] = skill.SkillId;
                s["name"] = skill.Name;
                s["description"] = skill.Description;
                skills.Add(s);
            }
            agentMap["skills"] = skills;
            Dictionary<string, object?> delegation = TemplateContext.NewMap();
            delegation["mode"] = agent.DelegationMode.ToString();
            delegation["maxDepth"] = agent.DelegationMaxDepth;
            delegation["allowRecursion"] = agent.DelegationAllowRecursion;
            delegation["allowList"] = agent.DelegationMode == DelegationModeEnum.AllowList ? agent.DelegationAllowList.Cast<object?>().ToList() : new List<object?>();
            agentMap["delegation"] = delegation;
            context.Set("agent", agentMap);

            string? model = parameters.TryGetValue("model", out string? m) && IsAllowed(deployment, "model") ? m : deployment.Model;
            string? effort = parameters.TryGetValue("effort", out string? ef) && IsAllowed(deployment, "effort") ? ef : deployment.Effort;
            object? maxTurns = deployment.MaxTurns;
            if (parameters.TryGetValue("maxTurns", out string? mt) && IsAllowed(deployment, "maxTurns") && Int32.TryParse(mt, out int parsedTurns)) maxTurns = parsedTurns;

            Dictionary<string, object?> deploymentMap = TemplateContext.NewMap();
            deploymentMap["id"] = deployment.Id;
            deploymentMap["name"] = deployment.Name;
            deploymentMap["model"] = model;
            deploymentMap["fallbackModel"] = deployment.FallbackModel;
            deploymentMap["effort"] = effort;
            deploymentMap["maxTurns"] = maxTurns;
            deploymentMap["maxBudgetUsd"] = deployment.MaxBudgetUsd;
            deploymentMap["timeoutSeconds"] = deployment.TimeoutSeconds;
            deploymentMap["version"] = deployment.ConfigVersion;
            Dictionary<string, object?> parameterMap = TemplateContext.NewMap();
            foreach (KeyValuePair<string, string> entry in parameters) parameterMap[entry.Key] = entry.Value;
            deploymentMap["parameters"] = parameterMap;
            context.Set("deployment", deploymentMap);

            Dictionary<string, object?> runMap = TemplateContext.NewMap();
            runMap["id"] = run.Id;
            runMap["kind"] = run.Kind.ToString();
            runMap["depth"] = run.Depth;
            runMap["attempt"] = run.Attempt;
            runMap["parentRunId"] = run.ParentRunId;
            runMap["rootRunId"] = run.RootRunId ?? run.Id;
            runMap["deadlineUtc"] = run.DeadlineUtc;
            runMap["configDir"] = ExecutionPlaceholders.ConfigDir;
            runMap["workspaceDir"] = ExecutionPlaceholders.WorkspaceDir;
            runMap["homeDir"] = ExecutionPlaceholders.HomeDir;
            runMap["systemPromptPath"] = ExecutionPlaceholders.ConfigDir + "/system-prompt.md";
            List<string> chain = (run.CallChain ?? String.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
            runMap["callChain"] = chain.Cast<object?>().ToList();
            runMap["resumeSessionId"] = repair?.SessionId ?? run.ResumeSessionId;
            runMap["conversationId"] = run.ConversationId;
            // Harnesses that keep no session unless asked (Mux print mode) persist one when a later execution may resume
            // it: a structured output repair or the next conversation turn.
            runMap["persistSession"] = inputs.Deployment.SuspensionEnabled || !String.IsNullOrWhiteSpace(agent.OutputSchemaJson) || !String.IsNullOrEmpty(run.ConversationId);
            context.Set("run", runMap);

            Dictionary<string, object?> conversationMap = TemplateContext.NewMap();
            conversationMap["id"] = run.ConversationId;
            conversationMap["turn"] = run.ConversationTurn;
            conversationMap["resumed"] = !String.IsNullOrEmpty(run.ResumeSessionId);
            conversationMap["fallback"] = run.ConversationFallbackReason.HasValue;
            conversationMap["fallbackReason"] = run.ConversationFallbackReason?.ToString();
            List<object?> turns = new List<object?>();
            if (conversation != null)
            {
                foreach (ConversationTranscriptTurn earlier in conversation.Turns)
                {
                    Dictionary<string, object?> item = TemplateContext.NewMap();
                    item["turn"] = earlier.Turn;
                    item["input"] = earlier.Input;
                    item["output"] = earlier.Output;
                    item["inputTruncated"] = earlier.InputTruncated;
                    item["outputTruncated"] = earlier.OutputTruncated;
                    turns.Add(item);
                }
            }
            conversationMap["turns"] = turns;
            conversationMap["omittedTurns"] = conversation?.OmittedTurns ?? 0;
            conversationMap["task"] = null;
            context.Set("conversation", conversationMap);

            Dictionary<string, object?> repairMap = TemplateContext.NewMap();
            repairMap["error"] = repair?.Error;
            repairMap["schema"] = repair == null ? null : agentMap["outputSchema"];
            repairMap["attempt"] = repair?.Attempt ?? 0;
            repairMap["sessionId"] = repair?.SessionId;
            repairMap["previousOutput"] = repair?.PreviousOutput;
            context.Set("repair", repairMap);

            Dictionary<string, object?> inputMap = TemplateContext.NewMap();
            inputMap["message"] = run.InputText ?? String.Empty;
            inputMap["contentType"] = run.InputContentType ?? "text/plain";
            Dictionary<string, object?> runParameters = TemplateContext.NewMap();
            List<object?> parameterList = new List<object?>();
            foreach (RunParameter parameter in run.Parameters)
            {
                runParameters[parameter.Name] = parameter.Value;
                Dictionary<string, object?> item = TemplateContext.NewMap();
                item["name"] = parameter.Name;
                item["value"] = parameter.Value;
                parameterList.Add(item);
            }
            inputMap["parameters"] = runParameters;
            inputMap["parameterList"] = parameterList;
            context.Set("input", inputMap);

            Dictionary<string, object?> caller = TemplateContext.NewMap();
            caller["type"] = run.CallerType.ToString();
            caller["id"] = run.CallerId;
            caller["name"] = run.CallerName;
            caller["agentName"] = chain.Count > 1 ? chain[chain.Count - 2] : (chain.Count == 1 && run.Depth > 0 ? chain[0] : null);
            context.Set("caller", caller);

            Dictionary<string, object?> garrison = TemplateContext.NewMap();
            garrison["mcpUrl"] = McpEndpoint();
            garrison["apiUrl"] = _Options.ApiBaseUrl;
            garrison["version"] = Constants.ProductVersion;
            garrison["mcpServerName"] = Constants.McpServerName;
            garrison["delegationEnabled"] = delegationEnabled;
            context.Set("garrison", garrison);

            Dictionary<string, object?> harness = TemplateContext.NewMap();
            harness["type"] = inputs.Profile.HarnessType.ToString();
            harness["profile"] = inputs.Profile.Name;
            harness["model"] = model;
            harness["nativeSchema"] = inputs.Profile.HarnessType == HarnessTypeEnum.ClaudeCode || inputs.Profile.HarnessType == HarnessTypeEnum.Codex || inputs.Profile.HarnessType == HarnessTypeEnum.Mux;
            context.Set("harness", harness);

            Dictionary<string, object?> executor = TemplateContext.NewMap();
            executor["type"] = run.Executor.ToString();
            executor["containerized"] = run.Executor == RunExecutorEnum.KubernetesJob || inputs.Containerized;
            context.Set("executor", executor);

            context.Set("now", DateTime.UtcNow);
            return context;
        }

        private Dictionary<string, object?> SecretContext(CompilationInputs inputs, HashSet<string> scrub)
        {
            Dictionary<string, object?> secrets = TemplateContext.NewMap();
            Dictionary<string, object?> byKind = TemplateContext.NewMap();
            foreach (KeyValuePair<string, Secret> entry in inputs.Secrets)
            {
                string value = Decrypt(entry.Value);
                if (value.Length > 0) scrub.Add(value);
                if (entry.Value.Kind == SecretKindEnum.CodexAuthJson) AddCodexTokens(value, scrub);
                secrets[entry.Key] = value;
                string kind = entry.Value.Kind.ToString();
                if (!byKind.ContainsKey(kind)) byKind[kind] = value;
            }
            secrets["kind"] = byKind;
            return secrets;
        }

        private static void AddCodexTokens(string value, HashSet<string> scrub)
        {
            // The run copy of a Codex login is rewritten (codexRunAuth), so the whole value never appears in output;
            // scrub the individual tokens instead.
            CodexAuthFile? file = CodexAuthDocument.TryParse(value);
            if (file?.Tokens == null) return;
            foreach (string? item in new string?[] { file.Tokens.AccessToken, file.Tokens.RefreshToken, file.Tokens.IdToken, file.OpenAiApiKey })
            {
                if (!String.IsNullOrEmpty(item) && item.Length >= 8) scrub.Add(item);
            }
        }

        private string Decrypt(Secret secret)
        {
            if (String.IsNullOrEmpty(secret.ValueEncrypted)) return String.Empty;
            try
            {
                return _Cipher.Decrypt(secret.ValueEncrypted, secret.Id);
            }
            catch (Exception e) when (e is CryptographicException || e is FormatException)
            {
                throw new CompilationException("SecretUnreadable", "Secret " + secret.Name + " could not be decrypted with the current master key.", e);
            }
        }

        private List<McpServerEntry> BuildMcpServers(CompilationInputs inputs, TemplateContext context, string? runToken, bool delegationEnabled, bool approvalsEnabled, ExecutionSpec spec, HashSet<string> scrub)
        {
            List<McpServerEntry> servers = new List<McpServerEntry>();
            int index = 0;

            if (delegationEnabled || approvalsEnabled || (_Options.AgentMemoryEnabled && !String.IsNullOrEmpty(runToken)))
            {
                McpServerEntry garrison = new McpServerEntry();
                garrison.Name = Constants.McpServerName;
                garrison.IsHttp = true;
                garrison.Url = _Options.McpBaseUrl.TrimEnd('/');
                garrison.Path = String.IsNullOrEmpty(_Options.McpPath) ? "/mcp" : _Options.McpPath;
                garrison.Required = true;
                if (delegationEnabled) garrison.RequiredTools.Add("garrison_invoke_agent");
                if (approvalsEnabled) garrison.RequiredTools.Add(PermissionPromptTool);
                garrison.ToolTimeoutSeconds = approvalsEnabled ? Math.Max(600, inputs.Deployment.ApprovalTimeoutSeconds + 120) : 600;
                garrison.Headers.Add(Variable("Authorization", "Bearer " + runToken, true));
                garrison.BearerToken = runToken;
                servers.Add(garrison);
            }

            foreach (McpServer server in inputs.McpServers)
            {
                McpServerEntry entry = new McpServerEntry();
                entry.Name = server.Name;
                entry.IsHttp = server.Transport == McpTransportEnum.Http;
                entry.Url = (server.Url ?? String.Empty).TrimEnd('/');
                entry.Path = String.IsNullOrWhiteSpace(server.Path) ? "/mcp" : server.Path!;
                entry.Command = server.Command;
                entry.Args = new List<string>(server.Arguments);
                entry.Required = server.Required;
                entry.RequiredTools = new List<string>(server.RequiredTools);
                entry.ToolTimeoutSeconds = server.ToolTimeoutSeconds;
                foreach (McpServerHeader header in server.Headers)
                {
                    string value = RenderSecretAware(header.ValueTemplate, context, scrub, "mcp server " + server.Name + " header " + header.Name);
                    if (value.Length == 0) continue;
                    entry.Headers.Add(Variable(header.Name, value, true));
                    if (header.Name.Equals("Authorization", StringComparison.OrdinalIgnoreCase) && value.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) entry.BearerToken = value.Substring(7);
                }
                foreach (McpServerVariable variable in server.Environment)
                {
                    string value = RenderSecretAware(variable.ValueTemplate, context, scrub, "mcp server " + server.Name + " env " + variable.Name);
                    entry.Env.Add(Variable(variable.Name, value, true));
                }
                servers.Add(entry);
            }

            foreach (McpServerEntry server in servers)
            {
                server.Index = index;
                for (int h = 0; h < server.Headers.Count; h++)
                {
                    string envName = "GARRISON_MCP_" + index + "_H" + h;
                    server.HeaderEnvNames.Add(envName);
                    spec.Environment.Add(Variable(envName, server.Headers[h].Value, true));
                    scrub.Add(server.Headers[h].Value);
                }
                if (!String.IsNullOrEmpty(server.BearerToken))
                {
                    server.BearerEnvName = "GARRISON_MCP_" + index + "_BEARER";
                    spec.Environment.Add(Variable(server.BearerEnvName, server.BearerToken, true));
                    scrub.Add(server.BearerToken);
                }
                for (int e = 0; e < server.Env.Count; e++)
                {
                    string envName = "GARRISON_MCP_" + index + "_E" + e;
                    server.EnvEnvNames.Add(envName);
                    spec.Environment.Add(Variable(envName, server.Env[e].Value, true));
                }
                index++;
            }
            return servers;
        }

        private Dictionary<string, object?> ResourcesContext(CompilationInputs inputs, List<McpServerEntry> servers)
        {
            Dictionary<string, object?> resources = TemplateContext.NewMap();
            List<object?> all = new List<object?>();
            List<object?> http = new List<object?>();
            List<object?> stdio = new List<object?>();
            foreach (McpServerEntry server in servers)
            {
                Dictionary<string, object?> map = TemplateContext.NewMap();
                map["name"] = server.Name;
                map["isHttp"] = server.IsHttp;
                map["transport"] = server.IsHttp ? "http" : "stdio";
                map["url"] = server.Url;
                map["path"] = server.Path;
                map["endpoint"] = server.Url + server.Path;
                map["command"] = server.Command;
                map["args"] = server.Args.Cast<object?>().ToList();
                map["required"] = server.Required;
                map["requiredTools"] = server.RequiredTools.Cast<object?>().ToList();
                map["toolTimeoutSeconds"] = server.ToolTimeoutSeconds;
                map["toolTimeoutMs"] = (long)server.ToolTimeoutSeconds * 1000;
                map["headers"] = Pairs(server.Headers, server.HeaderEnvNames);
                map["env"] = Pairs(server.Env, server.EnvEnvNames);
                map["bearerToken"] = server.BearerToken;
                map["bearerEnvName"] = server.BearerEnvName;
                map["bearerEnvRef"] = server.BearerEnvName == null ? null : "${" + server.BearerEnvName + "}";
                all.Add(map);
                if (server.IsHttp) http.Add(map);
                else stdio.Add(map);
            }
            resources["mcpServers"] = all;
            resources["httpMcpServers"] = http;
            resources["stdioMcpServers"] = stdio;
            resources["hasMcpServers"] = all.Count > 0;
            resources["mcpServerNames"] = String.Join(",", servers.Select(s => s.Name));

            Dictionary<string, object?> workspace = TemplateContext.NewMap();
            workspace["kind"] = inputs.Workspace?.Kind.ToString() ?? WorkspaceKindEnum.Empty.ToString();
            workspace["gitUrl"] = inputs.Workspace?.GitUrl;
            workspace["gitRef"] = inputs.Workspace?.GitRef;
            resources["workspace"] = workspace;
            return resources;
        }

        private static List<object?> Pairs(List<ExecutionEnvironmentVariable> values, List<string> envNames)
        {
            List<object?> list = new List<object?>();
            for (int i = 0; i < values.Count; i++)
            {
                Dictionary<string, object?> pair = TemplateContext.NewMap();
                pair["name"] = values[i].Name;
                pair["value"] = values[i].Value;
                pair["envName"] = i < envNames.Count ? envNames[i] : null;
                pair["envRef"] = i < envNames.Count ? "${" + envNames[i] + "}" : null;
                list.Add(pair);
            }
            return list;
        }

        private string RenderPrompt(CompilationInputs inputs, string role, TemplateContext context, Func<string, string?> includes, HashSet<string> usedIncludes)
        {
            if (!inputs.Prompts.TryGetValue(role, out BoundPrompt? prompt)) return String.Empty;
            TemplateRenderOptions options = new TemplateRenderOptions();
            options.TemplateName = prompt.TemplateName;
            options.AllowSecrets = false;
            options.IncludeResolver = includes;
            try
            {
                string rendered = TemplateRenderer.Render(prompt.Content, context, options);
                foreach (string include in options.UsedIncludes) usedIncludes.Add(include);
                return rendered;
            }
            catch (TemplateException e)
            {
                throw new CompilationException("TemplateRenderFailed", "Prompt role " + role + ": " + e.Message, e);
            }
        }

        private static string Render(string? template, TemplateContext context, Func<string, string?> includes, HashSet<string> usedIncludes, bool allowSecrets, HashSet<string> scrub, string what, RenderScope? scope = null)
        {
            TemplateRenderOptions options = new TemplateRenderOptions();
            options.TemplateName = what;
            options.AllowSecrets = allowSecrets;
            options.IncludeResolver = includes;
            try
            {
                string rendered = TemplateRenderer.Render(template ?? String.Empty, context, options, scope);
                foreach (string include in options.UsedIncludes) usedIncludes.Add(include);
                foreach (string secret in options.UsedSecretValues) scrub.Add(secret);
                return rendered;
            }
            catch (TemplateException e)
            {
                throw new CompilationException("TemplateRenderFailed", e.Message, e);
            }
        }

        private static bool Condition(string? condition, TemplateContext context, Func<string, string?> includes, HashSet<string> usedIncludes, bool allowSecrets, HashSet<string> scrub, string what, RenderScope? scope = null)
        {
            if (String.IsNullOrWhiteSpace(condition)) return true;
            return TemplateValues.IsTruthy(Render(condition, context, includes, usedIncludes, allowSecrets, scrub, what + " condition", scope));
        }

        private static string RenderSecretAware(string? template, TemplateContext context, HashSet<string> scrub, string what)
        {
            return Render(template, context, name => null, new HashSet<string>(StringComparer.Ordinal), true, scrub, what);
        }

        private static List<HarnessArgument> ApplyArgumentOverrides(List<HarnessArgument> arguments, List<DeploymentArgumentOverride> overrides)
        {
            List<HarnessArgument> result = arguments.OrderBy(a => a.Position).ToList();
            foreach (DeploymentArgumentOverride item in overrides.OrderBy(o => o.Position))
            {
                switch (item.Operation)
                {
                    case ArgumentOverrideOperationEnum.Append:
                        result.Add(Argument(item.Template, item.Condition));
                        break;
                    case ArgumentOverrideOperationEnum.Prepend:
                        result.Insert(0, Argument(item.Template, item.Condition));
                        break;
                    case ArgumentOverrideOperationEnum.Remove:
                        result.RemoveAll(a => a.Template == (item.Match ?? String.Empty));
                        break;
                    case ArgumentOverrideOperationEnum.Replace:
                        for (int i = 0; i < result.Count; i++)
                        {
                            if (result[i].Template != (item.Match ?? String.Empty)) continue;
                            HarnessArgument replacement = Argument(item.Template, item.Condition ?? result[i].Condition);
                            replacement.RepeatOver = result[i].RepeatOver;
                            result[i] = replacement;
                        }
                        break;
                }
            }
            return result;
        }

        private static HarnessArgument Argument(string? template, string? condition)
        {
            HarnessArgument argument = new HarnessArgument();
            argument.Template = template ?? String.Empty;
            argument.Condition = condition;
            return argument;
        }

        private static void RenderArgument(HarnessArgument argument, TemplateContext context, Func<string, string?> includes, HashSet<string> usedIncludes, HashSet<string> scrub, List<string> output)
        {
            if (String.IsNullOrWhiteSpace(argument.RepeatOver))
            {
                if (!Condition(argument.Condition, context, includes, usedIncludes, false, scrub, "argument")) return;
                output.Add(Render(argument.Template, context, includes, usedIncludes, false, scrub, "argument"));
                return;
            }

            object? source = context.Get(argument.RepeatOver!);
            if (source is not List<object?> items) return;
            for (int i = 0; i < items.Count; i++)
            {
                RenderScope scope = new RenderScope();
                scope.Current = items[i];
                scope.Index = i;
                scope.Count = items.Count;
                if (!Condition(argument.Condition, context, includes, usedIncludes, false, scrub, "argument", scope)) continue;
                output.Add(Render(argument.Template, context, includes, usedIncludes, false, scrub, "argument", scope));
            }
        }

        private void RenderEnvironment(CompilationInputs inputs, TemplateContext context, Func<string, string?> includes, HashSet<string> usedIncludes, HashSet<string> scrub, ExecutionSpec spec)
        {
            HarnessProfile profile = inputs.Profile;
            List<HarnessEnvironmentVariable> variables = new List<HarnessEnvironmentVariable>(profile.Environment);
            foreach (DeploymentEnvironmentOverride item in inputs.Deployment.EnvironmentOverrides)
            {
                variables.RemoveAll(v => String.Equals(v.Name, item.Name, StringComparison.Ordinal));
                HarnessEnvironmentVariable variable = new HarnessEnvironmentVariable();
                variable.Name = item.Name;
                variable.ValueTemplate = item.ValueTemplate;
                variable.IsSecret = item.IsSecret;
                variables.Add(variable);
            }

            foreach (HarnessEnvironmentVariable variable in variables)
            {
                if (String.IsNullOrWhiteSpace(variable.Name)) continue;
                List<string> secretReferences = TemplateAnalyzer.Analyze(variable.ValueTemplate, variable.Name, true).SecretReferences;
                if (secretReferences.Count > 0 && profile.CredentialEnvironmentAllowlist.Count > 0 && !profile.CredentialEnvironmentAllowlist.Contains(variable.Name, StringComparer.Ordinal))
                {
                    throw new CompilationException("SecretNotAllowed", "Environment variable " + variable.Name + " references a secret but is not in the credential allowlist of harness profile " + profile.Name + ".");
                }
                if (!Condition(variable.Condition, context, includes, usedIncludes, true, scrub, "environment " + variable.Name)) continue;
                string value = Render(variable.ValueTemplate, context, includes, usedIncludes, true, scrub, "environment " + variable.Name);
                if (value.Length == 0) continue;
                spec.Environment.RemoveAll(v => v.Name == variable.Name);
                spec.Environment.Add(Variable(variable.Name, value, variable.IsSecret || secretReferences.Count > 0));
            }
        }

        private void RenderFiles(CompilationInputs inputs, TemplateContext context, Func<string, string?> includes, HashSet<string> usedIncludes, HashSet<string> scrub, ExecutionSpec spec)
        {
            List<HarnessFile> files = new List<HarnessFile>(inputs.Profile.Files);
            foreach (DeploymentFileOverride item in inputs.Deployment.FileOverrides)
            {
                files.RemoveAll(f => f.BaseDirectory == item.BaseDirectory && f.PathTemplate == item.PathTemplate);
                HarnessFile file = new HarnessFile();
                file.BaseDirectory = item.BaseDirectory;
                file.PathTemplate = item.PathTemplate;
                file.ContentTemplate = item.ContentTemplate;
                file.Mode = item.Mode;
                file.IsSecret = item.IsSecret;
                files.Add(file);
            }

            foreach (HarnessFile file in files)
            {
                if (!Condition(file.Condition, context, includes, usedIncludes, true, scrub, "file " + file.PathTemplate)) continue;
                string path = Render(file.PathTemplate, context, includes, usedIncludes, false, scrub, "file path").Trim();
                ValidateRelativePath(path);
                int before = scrub.Count;
                string content = Render(file.ContentTemplate, context, includes, usedIncludes, true, scrub, "file " + path);
                bool secret = file.IsSecret || scrub.Count > before || scrub.Any(s => s.Length >= 4 && content.Contains(s, StringComparison.Ordinal));
                spec.Files.RemoveAll(f => f.BaseDirectory == file.BaseDirectory && f.Path == path);
                spec.Files.Add(File(file.BaseDirectory, path, content, file.Mode, secret));
            }
        }

        private static void ValidateRelativePath(string path)
        {
            if (path.Length == 0) throw new CompilationException("InvalidFilePath", "A harness file rendered an empty path.");
            string normalized = path.Replace('\\', '/');
            if (normalized.StartsWith("/", StringComparison.Ordinal) || normalized.Contains(':') || normalized.Split('/').Any(s => s == ".."))
            {
                throw new CompilationException("InvalidFilePath", "Harness file path '" + path + "' must be relative and must not contain '..'.");
            }
        }

        private ExecutionWorkspace Workspace(CompilationInputs inputs, HashSet<string> scrub)
        {
            ExecutionWorkspace workspace = new ExecutionWorkspace();
            if (inputs.Workspace == null) return workspace;
            WorkspaceTemplate template = inputs.Workspace;
            workspace.Kind = template.Kind;
            if (inputs.ArtifactStore != null) workspace.CacheKey = WorkspaceCacheKey.For(inputs.Deployment.TenantId, template, inputs.WorkspaceSecret);
            workspace.GitUrl = template.GitUrl;
            workspace.GitRef = template.GitRef;
            workspace.GitDepth = template.GitDepth;
            workspace.Retention = template.Retention;
            if (template.Kind == WorkspaceKindEnum.PersistentVolume) workspace.PersistentVolumeClaim = template.PersistentVolumeClaim;
            foreach (WorkspaceFile file in template.Files)
            {
                ValidateRelativePath(file.Path);
                ExecutionWorkspaceFile seeded = new ExecutionWorkspaceFile();
                seeded.Path = file.Path;
                seeded.Content = file.Content;
                workspace.Files.Add(seeded);
            }
            if (inputs.WorkspaceSecret != null)
            {
                string value = Decrypt(inputs.WorkspaceSecret);
                if (value.Length > 0)
                {
                    int colon = value.IndexOf(':');
                    if (inputs.WorkspaceSecret.Kind == SecretKindEnum.BearerToken || colon < 0)
                    {
                        workspace.GitUsername = "x-access-token";
                        workspace.GitPassword = value;
                    }
                    else
                    {
                        workspace.GitUsername = value.Substring(0, colon);
                        workspace.GitPassword = value.Substring(colon + 1);
                    }
                    scrub.Add(workspace.GitPassword);
                }
            }
            return workspace;
        }

        private static List<RunTemplateVersion> TemplateVersions(CompilationInputs inputs, Run run, HashSet<string> usedIncludes)
        {
            List<RunTemplateVersion> versions = new List<RunTemplateVersion>();
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            IEnumerable<BoundPrompt> used = inputs.Prompts.Values.Concat(inputs.Includes.Where(i => usedIncludes.Contains(i.Key)).Select(i => i.Value));
            foreach (BoundPrompt prompt in used)
            {
                if (!seen.Add(prompt.TemplateId + ":" + prompt.Version)) continue;
                RunTemplateVersion version = new RunTemplateVersion();
                version.RunId = run.Id;
                version.TemplateId = prompt.TemplateId;
                version.TemplateName = prompt.TemplateName;
                version.Version = prompt.Version;
                versions.Add(version);
            }
            return versions;
        }

        private static bool IsAllowed(Deployment deployment, string name)
        {
            return deployment.AllowedRunOverrides.Any(r => String.Equals(r.Name, name, StringComparison.OrdinalIgnoreCase));
        }

        private string McpEndpoint()
        {
            return _Options.McpBaseUrl.TrimEnd('/') + (String.IsNullOrEmpty(_Options.McpPath) ? "/mcp" : _Options.McpPath);
        }

        private static string? CompactJson(string? json, string what)
        {
            if (String.IsNullOrWhiteSpace(json)) return null;
            try
            {
                using (JsonDocument document = JsonDocument.Parse(json))
                {
                    return JsonSerializer.Serialize(document.RootElement);
                }
            }
            catch (JsonException e)
            {
                throw new CompilationException("InvalidSchema", "The " + what + " is not valid JSON: " + e.Message, e);
            }
        }

        private static ExecutionEnvironmentVariable Variable(string name, string value, bool secret)
        {
            ExecutionEnvironmentVariable variable = new ExecutionEnvironmentVariable();
            variable.Name = name;
            variable.Value = value ?? String.Empty;
            variable.IsSecret = secret;
            return variable;
        }

        private static ExecutionFile File(FileBaseDirectoryEnum baseDirectory, string path, string content, string? mode, bool secret)
        {
            ExecutionFile file = new ExecutionFile();
            file.BaseDirectory = baseDirectory;
            file.Path = path;
            file.Content = content ?? String.Empty;
            file.Mode = mode;
            file.IsSecret = secret;
            return file;
        }

        private static void Redact(ExecutionSpec spec)
        {
            List<string> secrets = spec.ScrubValues;
            string Clean(string? text)
            {
                if (String.IsNullOrEmpty(text)) return text ?? String.Empty;
                string result = text;
                foreach (string secret in secrets) result = result.Replace(secret, Redacted, StringComparison.Ordinal);
                return result;
            }

            for (int i = 0; i < spec.Arguments.Count; i++) spec.Arguments[i] = Clean(spec.Arguments[i]);
            foreach (ExecutionEnvironmentVariable variable in spec.Environment) variable.Value = variable.IsSecret ? Redacted : Clean(variable.Value);
            foreach (ExecutionFile file in spec.Files) file.Content = Clean(file.Content);
            foreach (ExecutionMcpCheck check in spec.McpPreflight)
            {
                foreach (ExecutionEnvironmentVariable header in check.Headers) header.Value = Redacted;
            }
            if (spec.Workspace.DownloadUrl != null) spec.Workspace.DownloadUrl = Redacted;
            if (spec.Workspace.GitPassword != null) spec.Workspace.GitPassword = Redacted;
            if (spec.ApprovalRelay != null) spec.ApprovalRelay.BearerToken = Redacted;
            if (spec.Artifacts != null) spec.Artifacts.BearerToken = Redacted;
            if (spec.Continuation != null && spec.Continuation.DownloadUrl != null) spec.Continuation.DownloadUrl = Redacted;
            spec.Stdin = Clean(spec.Stdin);
            spec.ScrubValues = secrets.Select(s => Redacted).ToList();
        }

        #endregion
    }
}
