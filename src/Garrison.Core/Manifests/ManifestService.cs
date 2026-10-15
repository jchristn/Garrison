namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Templates;

    /// <summary>
    /// Applies and exports declarative manifests (plan section 8.5). Apply validates every document first, resolving
    /// name references against existing records and documents earlier in the same body, and writes nothing when any
    /// document fails; then it writes in dependency order (Secret, PromptTemplate, HarnessProfile, McpServer,
    /// WorkspaceTemplate, Agent, Deployment). Thread-safe.
    /// </summary>
    public class ManifestService
    {
        #region Public-Members

        /// <summary>
        /// Supported API version.
        /// </summary>
        public static readonly string ApiVersion = "garrison/v1";

        /// <summary>
        /// Supported kinds in apply order.
        /// </summary>
        public static readonly IReadOnlyList<string> Kinds = new List<string> { "Secret", "PromptTemplate", "HarnessProfile", "McpServer", "WorkspaceTemplate", "Agent", "Deployment", "Pipeline" };

        /// <summary>
        /// Most stages a Pipeline document may have (P12.9). Minimum 1, maximum 100, default 20. The control plane sets it
        /// from the cluster setting Runtime.PipelineMaxStages.
        /// </summary>
        public int MaxPipelineStages
        {
            get
            {
                return _MaxPipelineStages;
            }
            set
            {
                _MaxPipelineStages = Math.Clamp(value, 1, 100);
            }
        }

        #endregion

        #region Private-Members

        private static readonly HashSet<string> _StripKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "id", "tenantId", "createdUtc", "lastUpdateUtc", "warnings", "isProtected", "isBuiltIn", "builtInKey", "position", "harnessProfileId", "mcpServerId", "agentId", "deploymentId", "workspaceTemplateId", "lastRegisteredUtc", "configVersion"
        };

        private readonly DatabaseDriverBase _Database;
        private readonly SecretCipher _Cipher;
        private int _MaxPipelineStages = 20;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="cipher">Secret cipher.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public ManifestService(DatabaseDriverBase database, SecretCipher cipher)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Apply manifest text to a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="text">YAML or JSON manifest text.</param>
        /// <param name="options">Options.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Persisted apply record with per-document results.</returns>
        /// <exception cref="ValidationException">Thrown when the text cannot be parsed.</exception>
        public async Task<ManifestApply> ApplyAsync(string tenantId, string text, ManifestApplyOptions options, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            options ??= new ManifestApplyOptions();
            List<ManifestDocument> documents = ManifestParser.Parse(text);

            ManifestApply apply = new ManifestApply();
            apply.TenantId = tenantId;
            apply.DryRun = options.DryRun;
            apply.PrincipalName = options.PrincipalName;
            apply.DocumentCount = documents.Count;

            // One reference cache for the whole apply (I-06): each referenced record is read once for planning, diffing,
            // and the deployment validation at write time, instead of once per document that names it.
            ConfigurationReferenceCache cache = new ConfigurationReferenceCache(_Database, tenantId);
            Resolver resolver = new Resolver(_Database, tenantId, cache);
            List<Planned> plan = new List<Planned>();
            foreach (ManifestDocument document in documents.OrderBy(d => KindOrder(d.Kind)).ThenBy(d => d.Index))
            {
                Planned planned = new Planned();
                planned.Document = document;
                try
                {
                    await PlanAsync(tenantId, document, options, resolver, planned, token).ConfigureAwait(false);
                    if (options.SecretUse != null && (planned.Result == ManifestApplyResultEnum.Created || planned.Result == ManifestApplyResultEnum.Updated))
                    {
                        await options.SecretUse.RequireForModelAsync(tenantId, planned.Model, token).ConfigureAwait(false);
                    }
                }
                catch (ValidationException e)
                {
                    planned.Result = ManifestApplyResultEnum.Failed;
                    planned.Message = e.Code == ManifestSpecError.Code ? e.Message : e.Message + (e.Fields.Count > 0 ? " " + String.Join("; ", e.Fields.Select(f => f.Key + ": " + f.Value)) : String.Empty);
                    planned.ErrorField = e.Fields.Keys.FirstOrDefault();
                    // A secret the caller may not use reports its own code (SecretUseDenied); other plan errors keep theirs.
                    planned.ErrorCode = planned.ErrorField != null && e.Codes.TryGetValue(planned.ErrorField, out string? fieldCode) && fieldCode == SecretUseChecker.DeniedCode ? fieldCode : e.Code;
                }
                catch (CompilationException e)
                {
                    planned.Result = ManifestApplyResultEnum.Failed;
                    planned.Message = e.Message;
                    planned.ErrorCode = e.Code;
                }
                plan.Add(planned);
            }

            bool failed = plan.Any(p => p.Result == ManifestApplyResultEnum.Failed);
            if (!options.DryRun && !failed)
            {
                foreach (Planned planned in plan)
                {
                    if (planned.Result == ManifestApplyResultEnum.Unchanged) continue;
                    try
                    {
                        await WriteAsync(tenantId, planned, cache, token).ConfigureAwait(false);
                    }
                    catch (ValidationException e)
                    {
                        planned.Result = ManifestApplyResultEnum.Failed;
                        planned.Message = e.Message + (e.Fields.Count > 0 ? " " + String.Join("; ", e.Fields.Select(f => f.Key + ": " + f.Value)) : String.Empty);
                        planned.ErrorField = e.Fields.Keys.FirstOrDefault();
                        // A field with its own code (for example trustLevel TenantRequiresUntrusted) reports that code.
                        planned.ErrorCode = planned.ErrorField != null && e.Codes.ContainsKey(planned.ErrorField) ? e.CodeFor(planned.ErrorField) : e.Code;
                    }
                }
            }

            foreach (Planned planned in plan.OrderBy(p => p.Document.Index))
            {
                ManifestApplyItem item = new ManifestApplyItem();
                item.Kind = planned.Document.Kind;
                item.Name = planned.Document.Metadata.Name;
                item.ResourceId = planned.ResourceId;
                item.PlannedResult = planned.Result;
                if (planned.Result == ManifestApplyResultEnum.Updated) item.Changes = planned.Changes;
                item.Warnings = Warnings(planned.Model);
                if (planned.Result == ManifestApplyResultEnum.Failed)
                {
                    item.Result = ManifestApplyResultEnum.Failed;
                }
                else if (options.DryRun)
                {
                    item.Result = ManifestApplyResultEnum.Validated;
                    planned.Message = planned.Message ?? DryRunMessage(planned);

                    // Nothing was written, so a document that would be created has no resource yet.
                    if (planned.Result == ManifestApplyResultEnum.Created) item.ResourceId = null;
                }
                else if (failed)
                {
                    item.Result = ManifestApplyResultEnum.Validated;
                    planned.Message = "Not applied because another document failed validation.";
                }
                else
                {
                    item.Result = planned.Result;
                }
                item.Message = planned.Message;
                if (planned.Result == ManifestApplyResultEnum.Failed)
                {
                    item.ErrorCode = planned.ErrorCode;
                    item.ErrorField = planned.ErrorField;
                }
                apply.Items.Add(item);
            }

            // A dry run counts what would happen; a real apply counts what happened.
            Func<ManifestApplyItem, ManifestApplyResultEnum?> outcome = i => options.DryRun && i.Result == ManifestApplyResultEnum.Validated ? i.PlannedResult : i.Result;
            apply.CreatedCount = apply.Items.Count(i => outcome(i) == ManifestApplyResultEnum.Created);
            apply.UpdatedCount = apply.Items.Count(i => outcome(i) == ManifestApplyResultEnum.Updated);
            apply.UnchangedCount = apply.Items.Count(i => outcome(i) == ManifestApplyResultEnum.Unchanged);
            apply.FailedCount = apply.Items.Count(i => i.Result == ManifestApplyResultEnum.Failed);
            return await _Database.ManifestApplies.CreateAsync(apply, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Export a tenant's configuration as multi-document YAML. Secrets are exported as metadata only.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>YAML text.</returns>
        public async Task<string> ExportAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            Resolver resolver = new Resolver(_Database, tenantId);
            List<Dictionary<string, object?>> documents = new List<Dictionary<string, object?>>();
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = 1000;
            query.IncludeBuiltIn = false;
            query.Ordering = EnumerationOrderEnum.NameAscending;

            foreach (Secret secret in (await _Database.Secrets.EnumerateAsync(tenantId, query, token).ConfigureAwait(false)).Objects) documents.Add(Wrap("Secret", secret.Name, SecretTree(secret)));
            foreach (PromptTemplate template in (await _Database.PromptTemplates.EnumerateAsync(tenantId, query, token).ConfigureAwait(false)).Objects.Where(t => t.TenantId == tenantId)) documents.Add(Wrap("PromptTemplate", template.Name, PromptTree(template)));
            foreach (HarnessProfile profile in (await _Database.HarnessProfiles.EnumerateAsync(tenantId, query, token).ConfigureAwait(false)).Objects.Where(p => p.TenantId == tenantId)) documents.Add(Wrap("HarnessProfile", profile.Name, Tree(profile)));
            foreach (McpServer server in (await _Database.McpServers.EnumerateAsync(tenantId, query, token).ConfigureAwait(false)).Objects) documents.Add(Wrap("McpServer", server.Name, Tree(server)));
            foreach (WorkspaceTemplate workspace in (await _Database.WorkspaceTemplates.EnumerateAsync(tenantId, query, token).ConfigureAwait(false)).Objects) documents.Add(Wrap("WorkspaceTemplate", workspace.Name, await WorkspaceTreeAsync(workspace, resolver, token).ConfigureAwait(false)));
            foreach (Agent agent in (await _Database.Agents.EnumerateAsync(tenantId, query, token).ConfigureAwait(false)).Objects) documents.Add(Wrap("Agent", agent.Name, await AgentTreeAsync(agent, resolver, token).ConfigureAwait(false)));
            foreach (Deployment deployment in (await _Database.Deployments.EnumerateAsync(tenantId, query, token).ConfigureAwait(false)).Objects) documents.Add(Wrap("Deployment", deployment.Name, await DeploymentTreeAsync(deployment, resolver, token).ConfigureAwait(false)));
            foreach (Pipeline pipeline in (await _Database.Pipelines.EnumerateAsync(tenantId, query, token).ConfigureAwait(false)).Objects) documents.Add(Wrap("Pipeline", pipeline.Name, await PipelineTreeAsync(pipeline, resolver, token).ConfigureAwait(false)));
            return ManifestParser.ToYaml(documents);
        }

        #endregion

        #region Private-Methods

        private static int KindOrder(string kind)
        {
            for (int i = 0; i < Kinds.Count; i++)
            {
                if (String.Equals(Kinds[i], kind, StringComparison.OrdinalIgnoreCase)) return i;
            }
            return Kinds.Count;
        }

        private async Task PlanAsync(string tenantId, ManifestDocument document, ManifestApplyOptions options, Resolver resolver, Planned planned, CancellationToken token)
        {
            if (document.ApiVersion != ApiVersion) throw new ValidationException("Document " + document.Index + " has apiVersion '" + document.ApiVersion + "'; expected " + ApiVersion + ".");
            if (KindOrder(document.Kind) >= Kinds.Count) throw new ValidationException("Document " + document.Index + " has unknown kind '" + document.Kind + "'. Supported: " + String.Join(", ", Kinds) + ".");
            string name = document.Metadata.Name;
            if (String.IsNullOrWhiteSpace(name)) throw new ValidationException("Document " + document.Index + " (" + document.Kind + ") needs metadata.name.");
            if (name.StartsWith(Constants.BuiltInPrefix, StringComparison.OrdinalIgnoreCase)) throw new ValidationException(document.Kind + " " + name + ": names starting with " + Constants.BuiltInPrefix + " are reserved for built-ins.");
            if (document.Metadata.Description != null) document.Spec["description"] = document.Metadata.Description;

            switch (document.Kind.ToLowerInvariant())
            {
                case "secret":
                    await PlanSecretAsync(tenantId, document, options, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "prompttemplate":
                    await PlanPromptAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "harnessprofile":
                    await PlanProfileAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "mcpserver":
                    await PlanMcpServerAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "workspacetemplate":
                    await PlanWorkspaceAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "agent":
                    await PlanAgentAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "deployment":
                    await PlanDeploymentAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "pipeline":
                    await PlanPipelineAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
            }
        }

        private async Task PlanSecretAsync(string tenantId, ManifestDocument document, ManifestApplyOptions options, Resolver resolver, Planned planned, CancellationToken token)
        {
            SecretSpec spec = Deserialize<SecretSpec>(document);
            Dictionary<string, string> expiryErrors = new Dictionary<string, string>();
            if (!ConfigurationValidator.SecretExpiry(spec.ExpiresUtc, DateTime.UtcNow, expiryErrors, "spec.expiresUtc"))
            {
                throw new ValidationException("Secret " + document.Metadata.Name + " has an invalid expiry.", expiryErrors, new Dictionary<string, string> { { "spec.expiresUtc", "ExpiryInPast" } });
            }
            Secret? existing = await _Database.Secrets.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            Dictionary<string, object?>? beforeTree = existing == null ? null : SecretTree(existing);
            Secret secret = existing ?? new Secret();
            secret.TenantId = tenantId;
            secret.Name = document.Metadata.Name;
            secret.Kind = spec.Kind;
            secret.Description = spec.Description;
            secret.ExpiresUtc = spec.ExpiresUtc;
            bool valueChanged = false;
            if (!String.IsNullOrEmpty(spec.Value))
            {
                if (!options.AllowSecretValues) throw new ValidationException("Secret " + secret.Name + " carries a value but this apply does not allow secret values.");
                string fingerprint = _Cipher.Fingerprint(spec.Value);
                valueChanged = existing == null || existing.Fingerprint != fingerprint;
                secret.ValueEncrypted = _Cipher.Encrypt(spec.Value, secret.Id);
                secret.ValueLast4 = SecretGenerator.Last4(spec.Value);
                secret.Fingerprint = fingerprint;
                secret.KeyVersion = _Cipher.KeyVersion;
                if (valueChanged)
                {
                    secret.RotatedUtc = DateTime.UtcNow;
                    SecretValueState.Reset(secret, spec.Value);
                }
            }
            Dictionary<string, string> errors = new Dictionary<string, string>();
            ConfigurationValidator.Name(secret.Name, errors);
            if (errors.Count > 0) throw new ValidationException("Secret " + secret.Name + " is invalid.", errors);

            planned.Model = secret;
            planned.ResourceId = secret.Id;
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (valueChanged || !Same(beforeTree!, SecretTree(secret)) ? ManifestApplyResultEnum.Updated : ManifestApplyResultEnum.Unchanged);
            if (planned.Result == ManifestApplyResultEnum.Updated)
            {
                planned.Changes = Diff(beforeTree!, SecretTree(secret));
                if (valueChanged) planned.Changes.Add(new ManifestFieldChange("value", "(hidden)", "(hidden, changed)"));
            }
            resolver.Add("Secret", secret.Name, secret.Id);
        }

        private async Task PlanPromptAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            PromptTemplateSpec spec = Deserialize<PromptTemplateSpec>(document);
            ConfigurationValidator.PromptTemplate(document.Metadata.Name, spec.Content);
            PromptTemplate? existing = await _Database.PromptTemplates.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            if (existing != null && existing.TenantId != tenantId) existing = null;
            PromptTemplate template = existing ?? new PromptTemplate();
            bool contentChanged = existing == null || existing.Content != spec.Content;
            PromptTemplate before = existing == null ? new PromptTemplate() : Copy(existing);
            template.TenantId = tenantId;
            template.Name = document.Metadata.Name;
            template.Kind = spec.Kind;
            template.Description = spec.Description;
            template.Content = spec.Content;
            if (existing == null) template.CurrentVersion = 1;
            else if (contentChanged) template.CurrentVersion = existing.CurrentVersion + 1;
            template.Variables = TemplateAnalyzer.Analyze(spec.Content, template.Name, false).Variables.Select(v => new PromptTemplateVariable { Name = v }).ToList();

            planned.Model = template;
            planned.ResourceId = template.Id;
            planned.ContentChanged = contentChanged;
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (!Same(PromptTree(before), PromptTree(template)) ? ManifestApplyResultEnum.Updated : ManifestApplyResultEnum.Unchanged);
            if (planned.Result == ManifestApplyResultEnum.Updated) planned.Changes = Diff(PromptTree(before), PromptTree(template));
            resolver.Add("PromptTemplate", template.Name, template.Id);
        }

        private async Task PlanProfileAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            HarnessProfile profile = Deserialize<HarnessProfile>(document);
            HarnessProfile? existing = await _Database.HarnessProfiles.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            if (existing != null && existing.TenantId != tenantId) existing = null;
            profile.Name = document.Metadata.Name;
            profile.TenantId = tenantId;
            profile.IsBuiltIn = false;
            if (existing != null)
            {
                profile.Id = existing.Id;
                profile.CreatedUtc = existing.CreatedUtc;
                profile.IsProtected = existing.IsProtected;
                profile.BuiltInKey = existing.BuiltInKey;
            }
            ConfigurationValidator.HarnessProfile(profile);
            planned.Model = profile;
            planned.ResourceId = profile.Id;
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (Same(Tree(existing), Tree(profile)) ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (planned.Result == ManifestApplyResultEnum.Updated) planned.Changes = Diff(Tree(existing!), Tree(profile));
            resolver.Add("HarnessProfile", profile.Name, profile.Id);
        }

        private async Task PlanMcpServerAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            McpServer server = Deserialize<McpServer>(document);
            McpServer? existing = await _Database.McpServers.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            server.Name = document.Metadata.Name;
            server.TenantId = tenantId;
            if (existing != null)
            {
                server.Id = existing.Id;
                server.CreatedUtc = existing.CreatedUtc;
            }
            ConfigurationValidator.McpServer(server);
            planned.Model = server;
            planned.ResourceId = server.Id;
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (Same(Tree(existing), Tree(server)) ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (planned.Result == ManifestApplyResultEnum.Updated) planned.Changes = Diff(Tree(existing!), Tree(server));
            resolver.Add("McpServer", server.Name, server.Id);
        }

        private async Task PlanWorkspaceAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            string? secretName = Take(document.Spec, "gitCredentialSecret");
            WorkspaceTemplate workspace = Deserialize<WorkspaceTemplate>(document);
            WorkspaceTemplate? existing = await _Database.WorkspaceTemplates.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            workspace.Name = document.Metadata.Name;
            workspace.TenantId = tenantId;
            if (!String.IsNullOrEmpty(secretName)) workspace.GitCredentialSecretId = await resolver.RequireAsync("Secret", secretName, "gitCredentialSecret", token).ConfigureAwait(false);
            if (existing != null)
            {
                workspace.Id = existing.Id;
                workspace.CreatedUtc = existing.CreatedUtc;
            }
            ConfigurationValidator.Workspace(workspace);
            planned.Model = workspace;
            planned.ResourceId = workspace.Id;
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (Same(Tree(existing), Tree(workspace)) ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (planned.Result == ManifestApplyResultEnum.Updated) planned.Changes = Diff(Tree(existing!), Tree(workspace));
            resolver.Add("WorkspaceTemplate", workspace.Name, workspace.Id);
        }

        private async Task PlanAgentAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            Dictionary<string, object?> spec = document.Spec;
            if (spec.TryGetValue("exposure", out object? exposureValue) && exposureValue is Dictionary<string, object?> exposure)
            {
                if (exposure.TryGetValue("a2a", out object? a2a)) spec["exposeA2A"] = a2a;
                if (exposure.TryGetValue("mcpTool", out object? mcpTool)) spec["exposeMcpTool"] = mcpTool;
                if (exposure.TryGetValue("toolName", out object? toolName)) spec["mcpToolName"] = toolName;
                spec.Remove("exposure");
            }
            if (spec.TryGetValue("delegation", out object? delegationValue) && delegationValue is Dictionary<string, object?> delegation)
            {
                if (delegation.TryGetValue("maxDepth", out object? maxDepth)) spec["delegationMaxDepth"] = maxDepth;
                if (delegation.TryGetValue("allowRecursion", out object? recursion)) spec["delegationAllowRecursion"] = recursion;
                if (delegation.TryGetValue("allow", out object? allow)) spec["delegationAllowList"] = allow;
                if (delegation.TryGetValue("mode", out object? mode)) spec["delegationMode"] = mode;
                else spec["delegationMode"] = allow is List<object?> list && list.Count > 0 ? "AllowList" : "None";
                spec.Remove("delegation");
            }
            if (spec.TryGetValue("inputSchema", out object? input) && input is Dictionary<string, object?>)
            {
                spec["inputSchemaJson"] = TemplateValues.ToJson(input);
                spec.Remove("inputSchema");
            }
            if (spec.TryGetValue("outputSchema", out object? output) && output is Dictionary<string, object?>)
            {
                spec["outputSchemaJson"] = TemplateValues.ToJson(output);
                spec.Remove("outputSchema");
            }
            string? toolTemplate = Take(spec, "toolDescriptionTemplate");
            string? skillTemplate = Take(spec, "skillDescriptionTemplate");

            Agent agent = Deserialize<Agent>(document);
            Agent? existing = await _Database.Agents.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            agent.Name = document.Metadata.Name;
            agent.TenantId = tenantId;
            if (!String.IsNullOrEmpty(toolTemplate)) agent.ToolDescriptionTemplateId = await resolver.RequireAsync("PromptTemplate", toolTemplate, "toolDescriptionTemplate", token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(skillTemplate)) agent.SkillDescriptionTemplateId = await resolver.RequireAsync("PromptTemplate", skillTemplate, "skillDescriptionTemplate", token).ConfigureAwait(false);
            if (existing != null)
            {
                agent.Id = existing.Id;
                agent.CreatedUtc = existing.CreatedUtc;
                agent.LastRegisteredUtc = existing.LastRegisteredUtc;
            }
            ConfigurationValidator.Agent(agent);
            planned.Model = agent;
            planned.ResourceId = agent.Id;
            if (existing == null)
            {
                planned.Result = ManifestApplyResultEnum.Created;
            }
            else
            {
                Dictionary<string, object?> agentBefore = await AgentTreeAsync(existing, resolver, token).ConfigureAwait(false);
                Dictionary<string, object?> agentAfter = await AgentTreeAsync(agent, resolver, token).ConfigureAwait(false);
                planned.Result = Same(agentBefore, agentAfter) ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated;
                if (planned.Result == ManifestApplyResultEnum.Updated) planned.Changes = Diff(agentBefore, agentAfter);
            }
            resolver.Add("Agent", agent.Name, agent.Id);
        }

        private async Task PlanDeploymentAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            foreach (string mapKey in new string[] { "parameters", "nodeSelector", "prompts" })
            {
                if (document.Spec.TryGetValue(mapKey, out object? mapValue) && mapValue is Dictionary<string, object?> stringMap)
                {
                    foreach (string key in stringMap.Keys.ToList()) stringMap[key] = TemplateValues.ToText(stringMap[key]);
                }
            }
            DeploymentSpec spec = Deserialize<DeploymentSpec>(document);
            Deployment deployment = new Deployment();
            deployment.TenantId = tenantId;
            deployment.Name = document.Metadata.Name;
            deployment.Description = spec.Description;
            deployment.AgentId = await resolver.RequireAsync("Agent", spec.Agent, "agent", token).ConfigureAwait(false);
            deployment.HarnessProfileId = await resolver.RequireAsync("HarnessProfile", spec.HarnessProfile, "harnessProfile", token).ConfigureAwait(false);
            deployment.Model = spec.Model;
            deployment.FallbackModel = spec.FallbackModel;
            deployment.Effort = spec.Effort;
            deployment.MaxTurns = spec.MaxTurns;
            deployment.MaxBudgetUsd = spec.MaxBudgetUsd;
            deployment.MaxConcurrentRuns = spec.MaxConcurrentRuns;
            deployment.TimeoutSeconds = spec.TimeoutSeconds;
            deployment.RepetitionGuard = spec.RepetitionGuard;
            deployment.MaxAssistantChars = spec.MaxAssistantChars;
            deployment.NoProgressSeconds = spec.NoProgressSeconds;
            deployment.MaxAttempts = spec.MaxAttempts;
            if (spec.RetryOnNodeLoss.HasValue) deployment.RetryOnNodeLoss = spec.RetryOnNodeLoss.Value;
            if (spec.EffectPolicy.HasValue) deployment.EffectPolicy = spec.EffectPolicy.Value;
            deployment.Executor = spec.Executor;
            deployment.TrustLevel = spec.TrustLevel ?? DeploymentTrustLevelEnum.Trusted;
            deployment.RequiredCapabilities = spec.RequiredCapabilities?.Clone() ?? new ExecutorRequirements();
            deployment.PodResources = spec.PodResources == null ? new RunPodResources() : spec.PodResources.Clone();
            deployment.Weight = spec.Weight;
            if (!String.IsNullOrEmpty(spec.Workspace)) deployment.WorkspaceTemplateId = await resolver.RequireAsync("WorkspaceTemplate", spec.Workspace, "workspace", token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(spec.ArtifactStore))
            {
                ArtifactStore? store = await _Database.ArtifactStores.ReadByNameAsync(tenantId, spec.ArtifactStore, token).ConfigureAwait(false);
                if (store == null) throw new ValidationException("Deployment " + deployment.Name + ": artifact store '" + spec.ArtifactStore + "' was not found.");
                deployment.ArtifactStoreId = store.Id;
            }

            deployment.ArtifactGlobs = spec.ArtifactGlobs == null ? new List<string>() : new List<string>(spec.ArtifactGlobs);
            deployment.EgressRules = spec.EgressRules == null ? new List<DeploymentEgressRule>() : spec.EgressRules.Select(r => r == null ? new DeploymentEgressRule() : r.Clone()).ToList();

            foreach (KeyValuePair<string, string> prompt in spec.Prompts)
            {
                string templateName = prompt.Value;
                int? version = null;
                int at = templateName.LastIndexOf('@');
                if (at > 0 && Int32.TryParse(templateName.Substring(at + 1), out int parsed))
                {
                    version = parsed;
                    templateName = templateName.Substring(0, at);
                }
                DeploymentPromptBinding binding = new DeploymentPromptBinding();
                binding.Role = prompt.Key;
                binding.TemplateId = await resolver.RequireAsync("PromptTemplate", templateName, "prompts." + prompt.Key, token).ConfigureAwait(false);
                binding.PinnedVersion = version;
                deployment.PromptBindings.Add(binding);
            }
            DefaultPromptBindings.Apply(deployment);
            foreach (AliasReferenceSpec reference in spec.Resources.Secrets)
            {
                DeploymentResourceBinding binding = new DeploymentResourceBinding();
                binding.Kind = ResourceBindingKindEnum.Secret;
                binding.Alias = reference.Alias;
                binding.ResourceId = await resolver.RequireAsync("Secret", reference.Secret ?? String.Empty, "resources.secrets." + reference.Alias, token).ConfigureAwait(false);
                deployment.ResourceBindings.Add(binding);
            }
            foreach (AliasReferenceSpec reference in spec.Resources.McpServers)
            {
                DeploymentResourceBinding binding = new DeploymentResourceBinding();
                binding.Kind = ResourceBindingKindEnum.McpServer;
                binding.Alias = String.IsNullOrEmpty(reference.Alias) ? reference.Server ?? String.Empty : reference.Alias;
                binding.ResourceId = await resolver.RequireAsync("McpServer", reference.Server ?? String.Empty, "resources.mcpServers." + binding.Alias, token).ConfigureAwait(false);
                deployment.ResourceBindings.Add(binding);
            }
            foreach (KeyValuePair<string, string> parameter in spec.Parameters) deployment.Parameters.Add(new DeploymentParameter { Name = parameter.Key, Value = parameter.Value });
            foreach (KeyValuePair<string, string> selector in spec.NodeSelector) deployment.NodeSelector.Add(new DeploymentNodeSelector { Key = selector.Key, Value = selector.Value });
            deployment.AllowedRunOverrides = spec.AllowedRunOverrides;
            deployment.ApprovalsEnabled = spec.ApprovalsEnabled;
            deployment.ApprovalDefaultAction = spec.ApprovalDefaultAction;
            deployment.ApprovalTimeoutSeconds = spec.ApprovalTimeoutSeconds;
            deployment.ApprovalTimeoutDecision = spec.ApprovalTimeoutDecision;
            deployment.ApprovalRules = spec.ApprovalRules;
            deployment.ArgumentOverrides = spec.ArgumentOverrides;
            deployment.EnvironmentOverrides = spec.EnvironmentOverrides;
            deployment.FileOverrides = spec.FileOverrides;

            Deployment? existing = await _Database.Deployments.ReadByNameAsync(tenantId, deployment.Name, token).ConfigureAwait(false);
            if (existing != null)
            {
                deployment.Id = existing.Id;
                deployment.CreatedUtc = existing.CreatedUtc;
                deployment.ConfigVersion = existing.ConfigVersion;
                // Keep approval rule identifiers for unchanged rules: approvals record the rule that decided them.
                foreach (DeploymentApprovalRule rule in deployment.ApprovalRules)
                {
                    DeploymentApprovalRule? same = existing.ApprovalRules.FirstOrDefault(r => r.Action == rule.Action && r.Pattern == rule.Pattern && r.InputPattern == rule.InputPattern);
                    if (same != null && !deployment.ApprovalRules.Any(r => r.Id == same.Id)) rule.Id = same.Id;
                }
            }
            Dictionary<string, string> errors = new Dictionary<string, string>();
            ConfigurationValidator.Name(deployment.Name, errors);
            if (errors.Count > 0) throw new ValidationException("Deployment " + deployment.Name + " is invalid.", errors);
            if (deployment.EffectPolicyConflict)
            {
                // P12.29: reported at plan time, so a dry run shows it too, with the conflict as the item's error code.
                Dictionary<string, string> conflict = new Dictionary<string, string>();
                conflict["effectPolicy"] = "effectPolicy " + deployment.EffectPolicy + " disagrees with the deprecated retryOnNodeLoss value. Keep only effectPolicy (retryOnNodeLoss true means AtLeastOnce, false means AtMostOnce).";
                Dictionary<string, string> codes = new Dictionary<string, string>();
                codes["effectPolicy"] = "EffectPolicyConflict";
                ValidationException rejected = new ValidationException("Deployment " + deployment.Name + " is invalid.", conflict, codes);
                rejected.Code = "EffectPolicyConflict";
                throw rejected;
            }

            planned.Model = deployment;
            planned.ResourceId = deployment.Id;
            bool unchanged = false;
            if (existing != null)
            {
                Dictionary<string, object?> deploymentBefore = await DeploymentTreeAsync(existing, resolver, token).ConfigureAwait(false);
                Dictionary<string, object?> deploymentAfter = await DeploymentTreeAsync(deployment, resolver, token).ConfigureAwait(false);
                unchanged = Same(deploymentBefore, deploymentAfter);
                if (!unchanged) planned.Changes = Diff(deploymentBefore, deploymentAfter);
            }
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (unchanged ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (existing != null && !unchanged) deployment.ConfigVersion = existing.ConfigVersion + 1;
            resolver.Add("Deployment", deployment.Name, deployment.Id);
        }

        private async Task PlanPipelineAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            if (document.Spec.TryGetValue("stages", out object? stagesValue) && stagesValue is List<object?> stageList)
            {
                foreach (object? item in stageList)
                {
                    if (item is Dictionary<string, object?> stageMap && stageMap.TryGetValue("parameters", out object? mapValue) && mapValue is Dictionary<string, object?> stringMap)
                    {
                        foreach (string key in stringMap.Keys.ToList()) stringMap[key] = TemplateValues.ToText(stringMap[key]);
                    }
                }
            }
            PipelineSpec spec = Deserialize<PipelineSpec>(document);
            Pipeline pipeline = new Pipeline();
            pipeline.TenantId = tenantId;
            pipeline.Name = document.Metadata.Name;
            pipeline.Description = spec.Description;
            pipeline.MaxDurationSeconds = spec.MaxDurationSeconds ?? 0;
            pipeline.Active = spec.Active ?? true;
            for (int i = 0; i < spec.Stages.Count; i++)
            {
                PipelineStageSpec stageSpec = spec.Stages[i];
                string field = "stages[" + i + "]";
                PipelineStage stage = new PipelineStage();
                stage.Name = stageSpec.Name;
                stage.Description = stageSpec.Description;
                stage.AgentId = await resolver.RequireAsync("Agent", stageSpec.Agent, field + ".agent", token).ConfigureAwait(false);
                if (!String.IsNullOrWhiteSpace(stageSpec.Deployment)) stage.DeploymentId = await resolver.RequireAsync("Deployment", stageSpec.Deployment, field + ".deployment", token).ConfigureAwait(false);
                if (!String.IsNullOrWhiteSpace(stageSpec.HandoffTemplate))
                {
                    string templateName = stageSpec.HandoffTemplate.Trim();
                    int at = templateName.LastIndexOf('@');
                    if (at > 0 && Int32.TryParse(templateName.Substring(at + 1), System.Globalization.NumberStyles.Integer, System.Globalization.CultureInfo.InvariantCulture, out int pinned))
                    {
                        stage.HandoffTemplateVersion = pinned;
                        templateName = templateName.Substring(0, at);
                    }
                    stage.HandoffTemplateId = await resolver.RequireAsync("PromptTemplate", templateName, field + ".handoffTemplate", token).ConfigureAwait(false);
                }
                stage.OutputCharLimit = stageSpec.OutputCharLimit ?? 16000;
                stage.MaxAttempts = stageSpec.MaxAttempts ?? 1;
                stage.ContinueOnFailure = stageSpec.ContinueOnFailure ?? false;
                stage.RequiresReview = stageSpec.RequiresReview ?? false;
                stage.ReviewTimeoutSeconds = stageSpec.ReviewTimeoutSeconds ?? 0;
                stage.ReviewTimeoutAction = stageSpec.ReviewTimeoutAction ?? PipelineReviewDecisionEnum.Reject;
                stage.MaxRevisions = stageSpec.MaxRevisions ?? 3;
                foreach (KeyValuePair<string, string> parameter in stageSpec.Parameters.OrderBy(p => p.Key, StringComparer.Ordinal))
                {
                    stage.Parameters.Add(new PipelineStageParameter { Name = parameter.Key, Value = parameter.Value ?? String.Empty });
                }
                pipeline.Stages.Add(stage);
            }

            Pipeline? existing = await _Database.Pipelines.ReadByNameAsync(tenantId, pipeline.Name, token).ConfigureAwait(false);
            if (existing != null)
            {
                if (existing.IsProtected) throw new ValidationException("Pipeline " + existing.Name + " is protected and cannot be changed by a manifest.");
                pipeline.Id = existing.Id;
                pipeline.CreatedUtc = existing.CreatedUtc;
                pipeline.Version = existing.Version;
            }
            planned.Model = pipeline;
            planned.ResourceId = pipeline.Id;
            bool unchanged = false;
            if (existing != null)
            {
                Dictionary<string, object?> before = await PipelineTreeAsync(existing, resolver, token).ConfigureAwait(false);
                Dictionary<string, object?> after = await PipelineTreeAsync(pipeline, resolver, token).ConfigureAwait(false);
                unchanged = Same(before, after);
                if (!unchanged) planned.Changes = Diff(before, after);
            }
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (unchanged ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (existing != null && !unchanged) pipeline.Version = existing.Version + 1;
            resolver.Add("Pipeline", pipeline.Name, pipeline.Id);
        }

        private async Task<Dictionary<string, object?>> PipelineTreeAsync(Pipeline pipeline, Resolver resolver, CancellationToken token)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>();
            if (pipeline.Description != null) tree["description"] = pipeline.Description;
            if (pipeline.MaxDurationSeconds > 0) tree["maxDurationSeconds"] = (long)pipeline.MaxDurationSeconds;
            if (!pipeline.Active) tree["active"] = false;
            List<object?> stages = new List<object?>();
            foreach (PipelineStage stage in pipeline.Stages)
            {
                Dictionary<string, object?> item = new Dictionary<string, object?>();
                item["name"] = stage.Name;
                if (stage.Description != null) item["description"] = stage.Description;
                item["agent"] = await resolver.NameAsync("Agent", stage.AgentId, token).ConfigureAwait(false) ?? stage.AgentId;
                if (!String.IsNullOrEmpty(stage.DeploymentId)) item["deployment"] = await resolver.NameAsync("Deployment", stage.DeploymentId, token).ConfigureAwait(false) ?? stage.DeploymentId;
                if (!String.IsNullOrEmpty(stage.HandoffTemplateId))
                {
                    string name = await resolver.NameAsync("PromptTemplate", stage.HandoffTemplateId, token).ConfigureAwait(false) ?? stage.HandoffTemplateId;
                    item["handoffTemplate"] = stage.HandoffTemplateVersion.HasValue ? name + "@" + stage.HandoffTemplateVersion.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) : name;
                }
                if (stage.OutputCharLimit != 16000) item["outputCharLimit"] = (long)stage.OutputCharLimit;
                if (stage.MaxAttempts != 1) item["maxAttempts"] = (long)stage.MaxAttempts;
                if (stage.ContinueOnFailure) item["continueOnFailure"] = true;
                if (stage.RequiresReview) item["requiresReview"] = true;
                if (stage.ReviewTimeoutSeconds > 0) item["reviewTimeoutSeconds"] = (long)stage.ReviewTimeoutSeconds;
                if (stage.ReviewTimeoutAction != PipelineReviewDecisionEnum.Reject) item["reviewTimeoutAction"] = stage.ReviewTimeoutAction.ToString();
                if (stage.MaxRevisions != 3) item["maxRevisions"] = (long)stage.MaxRevisions;
                if (stage.Parameters.Count > 0)
                {
                    Dictionary<string, object?> parameters = new Dictionary<string, object?>();
                    foreach (PipelineStageParameter parameter in stage.Parameters.OrderBy(p => p.Name, StringComparer.Ordinal)) parameters[parameter.Name] = parameter.Value;
                    item["parameters"] = parameters;
                }
                stages.Add(item);
            }
            tree["stages"] = stages;
            return tree;
        }

        private async Task WriteAsync(string tenantId, Planned planned, ConfigurationReferenceCache cache, CancellationToken token)
        {
            bool create = planned.Result == ManifestApplyResultEnum.Created;

            // A written record must be read fresh by later documents in the same apply.
            string? kind = Kinds.FirstOrDefault(k => k.Equals(planned.Document.Kind, StringComparison.OrdinalIgnoreCase));
            if (kind != null && kind != "Pipeline") cache.Forget(kind);
            switch (planned.Model)
            {
                case Secret secret:
                    if (create) await _Database.Secrets.CreateAsync(secret, token).ConfigureAwait(false);
                    else await _Database.Secrets.UpdateAsync(secret, token).ConfigureAwait(false);
                    break;
                case PromptTemplate template:
                    if (create) await _Database.PromptTemplates.CreateAsync(template, token).ConfigureAwait(false);
                    else await _Database.PromptTemplates.UpdateAsync(template, token).ConfigureAwait(false);
                    if (planned.ContentChanged)
                    {
                        PromptTemplateVersion version = new PromptTemplateVersion();
                        version.TenantId = tenantId;
                        version.TemplateId = template.Id;
                        version.Version = template.CurrentVersion;
                        version.Content = template.Content;
                        version.ChangeNote = "Applied from a manifest.";
                        await _Database.PromptTemplateVersions.CreateAsync(version, token).ConfigureAwait(false);
                    }
                    break;
                case HarnessProfile profile:
                    if (create) await _Database.HarnessProfiles.CreateAsync(profile, token).ConfigureAwait(false);
                    else await _Database.HarnessProfiles.UpdateAsync(profile, token).ConfigureAwait(false);
                    break;
                case McpServer server:
                    if (create) await _Database.McpServers.CreateAsync(server, token).ConfigureAwait(false);
                    else await _Database.McpServers.UpdateAsync(server, token).ConfigureAwait(false);
                    break;
                case WorkspaceTemplate workspace:
                    if (create) await _Database.WorkspaceTemplates.CreateAsync(workspace, token).ConfigureAwait(false);
                    else await _Database.WorkspaceTemplates.UpdateAsync(workspace, token).ConfigureAwait(false);
                    break;
                case Agent agent:
                    if (create) await _Database.Agents.CreateAsync(agent, token).ConfigureAwait(false);
                    else await _Database.Agents.UpdateAsync(agent, token).ConfigureAwait(false);
                    break;
                case Deployment deployment:
                    await ConfigurationValidator.DeploymentAsync(_Database, tenantId, deployment, cache, token).ConfigureAwait(false);
                    if (create) await _Database.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
                    else await _Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                    break;
                case Pipeline pipeline:
                    await ConfigurationValidator.PipelineAsync(_Database, tenantId, pipeline, _MaxPipelineStages, token).ConfigureAwait(false);
                    if (create) await _Database.Pipelines.CreateAsync(pipeline, token).ConfigureAwait(false);
                    else await _Database.Pipelines.UpdateAsync(pipeline, token).ConfigureAwait(false);
                    break;
            }
        }

        private static List<FieldWarning> Warnings(object? model)
        {
            // I-08: values the model clamped while the document was read (for example maxAttempts 99 stored as 10).
            List<FieldWarning>? warnings = model switch
            {
                Deployment deployment => deployment.Warnings,
                Agent agent => agent.Warnings,
                HarnessProfile profile => profile.Warnings,
                McpServer server => server.Warnings,
                WorkspaceTemplate workspace => workspace.Warnings,
                _ => null
            };
            return warnings == null ? new List<FieldWarning>() : new List<FieldWarning>(warnings);
        }

        private static T Deserialize<T>(ManifestDocument document) where T : class
        {
            try
            {
                return Serializer.Deserialize<T>(TemplateValues.ToJson(document.Spec)) ?? throw new ValidationException(document.Kind + " " + document.Metadata.Name + " has an empty spec.");
            }
            catch (System.Text.Json.JsonException e)
            {
                // Name the field and what it accepts; never pass the serializer's type names and positions through (G-26).
                throw ManifestSpecError.From(document, typeof(T), e);
            }
        }

        private static string? Take(Dictionary<string, object?> map, string key)
        {
            if (!map.TryGetValue(key, out object? value)) return null;
            map.Remove(key);
            return value == null ? null : TemplateValues.ToText(value);
        }

        private static T Copy<T>(T value) where T : class
        {
            return Serializer.Copy(value) ?? throw new InvalidOperationException("Copy failed.");
        }

        private static Dictionary<string, object?> Wrap(string kind, string name, Dictionary<string, object?> spec)
        {
            Dictionary<string, object?> metadata = new Dictionary<string, object?>();
            metadata["name"] = name;
            Dictionary<string, object?> document = new Dictionary<string, object?>();
            document["apiVersion"] = ApiVersion;
            document["kind"] = kind;
            document["metadata"] = metadata;
            document["spec"] = spec;
            return document;
        }

        private static Dictionary<string, object?> Tree(object model)
        {
            object? tree = TemplateSampleContext.FromJson(System.Text.Json.JsonDocument.Parse(Serializer.Serialize(model)).RootElement);
            Dictionary<string, object?> stripped = Strip(tree) as Dictionary<string, object?> ?? new Dictionary<string, object?>();
            stripped.Remove("name");
            return stripped;
        }

        private static object? Strip(object? value)
        {
            if (value is Dictionary<string, object?> map)
            {
                Dictionary<string, object?> result = new Dictionary<string, object?>(StringComparer.Ordinal);
                foreach (KeyValuePair<string, object?> entry in map.OrderBy(e => e.Key, StringComparer.Ordinal))
                {
                    if (_StripKeys.Contains(entry.Key) || entry.Value == null) continue;
                    if (entry.Key == "active" && entry.Value is bool active && active) continue;
                    result[entry.Key] = Strip(entry.Value);
                }
                return result;
            }
            if (value is List<object?> list) return list.Select(Strip).ToList();
            return value;
        }

        private static bool Same(Dictionary<string, object?> a, Dictionary<string, object?> b)
        {
            return TemplateValues.ToJson(a) == TemplateValues.ToJson(b);
        }

        private static string DryRunMessage(Planned planned)
        {
            switch (planned.Result)
            {
                case ManifestApplyResultEnum.Created:
                    return "Would be created.";
                case ManifestApplyResultEnum.Unchanged:
                    return "Already up to date; would be left unchanged.";
                case ManifestApplyResultEnum.Updated:
                    return "Would be updated: " + (planned.Changes.Count == 0 ? "no field differences recorded." : String.Join(", ", planned.Changes.Select(c => c.Field)) + ".");
                default:
                    return "Would be " + planned.Result.ToString().ToLowerInvariant() + ".";
            }
        }

        private static List<ManifestFieldChange> Diff(Dictionary<string, object?> before, Dictionary<string, object?> after)
        {
            Dictionary<string, string?> left = new Dictionary<string, string?>(StringComparer.Ordinal);
            Dictionary<string, string?> right = new Dictionary<string, string?>(StringComparer.Ordinal);
            Flatten(before, String.Empty, left);
            Flatten(after, String.Empty, right);
            List<ManifestFieldChange> changes = new List<ManifestFieldChange>();
            foreach (string field in left.Keys.Union(right.Keys).OrderBy(k => k, StringComparer.Ordinal))
            {
                left.TryGetValue(field, out string? was);
                right.TryGetValue(field, out string? now);
                if (!String.Equals(was, now, StringComparison.Ordinal)) changes.Add(new ManifestFieldChange(field, was, now));
            }
            return changes;
        }

        private static void Flatten(object? value, string path, Dictionary<string, string?> output)
        {
            if (value is Dictionary<string, object?> map)
            {
                foreach (KeyValuePair<string, object?> entry in map) Flatten(entry.Value, path.Length == 0 ? entry.Key : path + "." + entry.Key, output);
                return;
            }
            if (value is List<object?> list)
            {
                if (list.Count == 0 && path.Length > 0) output[path] = "[]";
                for (int i = 0; i < list.Count; i++) Flatten(list[i], path + "[" + i + "]", output);
                return;
            }
            if (path.Length == 0) return;
            output[path] = value == null ? null : TemplateValues.ToText(value);
        }

        private static Dictionary<string, object?> SecretTree(Secret secret)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>();
            tree["kind"] = secret.Kind.ToString();
            if (secret.Description != null) tree["description"] = secret.Description;
            if (secret.ExpiresUtc.HasValue) tree["expiresUtc"] = secret.ExpiresUtc.Value;
            return tree;
        }

        private static Dictionary<string, object?> PromptTree(PromptTemplate template)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>();
            tree["kind"] = template.Kind.ToString();
            if (template.Description != null) tree["description"] = template.Description;
            tree["content"] = template.Content;
            return tree;
        }

        private async Task<Dictionary<string, object?>> WorkspaceTreeAsync(WorkspaceTemplate workspace, Resolver resolver, CancellationToken token)
        {
            Dictionary<string, object?> tree = Tree(workspace);
            tree.Remove("gitCredentialSecretId");
            if (!String.IsNullOrEmpty(workspace.GitCredentialSecretId)) tree["gitCredentialSecret"] = await resolver.NameAsync("Secret", workspace.GitCredentialSecretId, token).ConfigureAwait(false);
            return tree;
        }

        private async Task<Dictionary<string, object?>> AgentTreeAsync(Agent agent, Resolver resolver, CancellationToken token)
        {
            Dictionary<string, object?> tree = Tree(agent);
            tree.Remove("toolDescriptionTemplateId");
            tree.Remove("skillDescriptionTemplateId");
            if (!String.IsNullOrEmpty(agent.ToolDescriptionTemplateId)) tree["toolDescriptionTemplate"] = await resolver.NameAsync("PromptTemplate", agent.ToolDescriptionTemplateId, token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(agent.SkillDescriptionTemplateId)) tree["skillDescriptionTemplate"] = await resolver.NameAsync("PromptTemplate", agent.SkillDescriptionTemplateId, token).ConfigureAwait(false);
            return tree;
        }

        private async Task<Dictionary<string, object?>> DeploymentTreeAsync(Deployment deployment, Resolver resolver, CancellationToken token)
        {
            DeploymentSpec spec = new DeploymentSpec();
            spec.Agent = await resolver.NameAsync("Agent", deployment.AgentId, token).ConfigureAwait(false) ?? deployment.AgentId;
            spec.HarnessProfile = await resolver.NameAsync("HarnessProfile", deployment.HarnessProfileId, token).ConfigureAwait(false) ?? deployment.HarnessProfileId;
            spec.Description = deployment.Description;
            spec.Model = deployment.Model;
            spec.FallbackModel = deployment.FallbackModel;
            spec.Effort = deployment.Effort;
            spec.MaxTurns = deployment.MaxTurns;
            spec.MaxBudgetUsd = deployment.MaxBudgetUsd;
            spec.MaxConcurrentRuns = deployment.MaxConcurrentRuns;
            spec.TimeoutSeconds = deployment.TimeoutSeconds;
            spec.RepetitionGuard = deployment.RepetitionGuard;
            spec.MaxAssistantChars = deployment.MaxAssistantChars;
            spec.NoProgressSeconds = deployment.NoProgressSeconds;
            spec.MaxAttempts = deployment.MaxAttempts;
            spec.EffectPolicy = deployment.EffectPolicy;
            spec.Executor = deployment.Executor;
            spec.TrustLevel = deployment.TrustLevel == DeploymentTrustLevelEnum.Trusted ? null : deployment.TrustLevel;
            spec.RequiredCapabilities = ExecutorCapabilityRules.RequiresReport(deployment.RequiredCapabilities) ? deployment.RequiredCapabilities.Clone() : null;
            spec.PodResources = deployment.PodResources.IsEmpty ? null : deployment.PodResources.Clone();
            spec.Weight = deployment.Weight;
            if (!String.IsNullOrEmpty(deployment.WorkspaceTemplateId)) spec.Workspace = await resolver.NameAsync("WorkspaceTemplate", deployment.WorkspaceTemplateId, token).ConfigureAwait(false);
            spec.ArtifactGlobs = deployment.ArtifactGlobs.Count == 0 ? null : new List<string>(deployment.ArtifactGlobs);
            spec.EgressRules = deployment.EgressRules.Count == 0 ? null : deployment.EgressRules.Select(r => r.Clone()).ToList();
            if (!String.IsNullOrEmpty(deployment.ArtifactStoreId))
            {
                ArtifactStore? store = await _Database.ArtifactStores.ReadAsync(deployment.ArtifactStoreId, token).ConfigureAwait(false);
                spec.ArtifactStore = store?.Name;
            }
            foreach (DeploymentPromptBinding binding in deployment.PromptBindings.OrderBy(b => b.Role, StringComparer.Ordinal))
            {
                string name = await resolver.NameAsync("PromptTemplate", binding.TemplateId, token).ConfigureAwait(false) ?? binding.TemplateId;
                spec.Prompts[binding.Role] = binding.PinnedVersion.HasValue ? name + "@" + binding.PinnedVersion.Value : name;
            }
            foreach (DeploymentResourceBinding binding in deployment.ResourceBindings.OrderBy(b => b.Alias, StringComparer.Ordinal))
            {
                AliasReferenceSpec reference = new AliasReferenceSpec();
                reference.Alias = binding.Alias;
                if (binding.Kind == ResourceBindingKindEnum.Secret)
                {
                    reference.Secret = await resolver.NameAsync("Secret", binding.ResourceId, token).ConfigureAwait(false) ?? binding.ResourceId;
                    spec.Resources.Secrets.Add(reference);
                }
                else
                {
                    reference.Server = await resolver.NameAsync("McpServer", binding.ResourceId, token).ConfigureAwait(false) ?? binding.ResourceId;
                    spec.Resources.McpServers.Add(reference);
                }
            }
            foreach (DeploymentParameter parameter in deployment.Parameters) spec.Parameters[parameter.Name] = parameter.Value;
            foreach (DeploymentNodeSelector selector in deployment.NodeSelector) spec.NodeSelector[selector.Key] = selector.Value;
            spec.AllowedRunOverrides = deployment.AllowedRunOverrides;
            spec.ApprovalsEnabled = deployment.ApprovalsEnabled;
            spec.ApprovalDefaultAction = deployment.ApprovalDefaultAction;
            spec.ApprovalTimeoutSeconds = deployment.ApprovalTimeoutSeconds;
            spec.ApprovalTimeoutDecision = deployment.ApprovalTimeoutDecision;
            spec.ApprovalRules = deployment.ApprovalRules;
            spec.ArgumentOverrides = deployment.ArgumentOverrides;
            spec.EnvironmentOverrides = deployment.EnvironmentOverrides;
            spec.FileOverrides = deployment.FileOverrides;
            return Tree(spec);
        }

        #endregion
    }
}
