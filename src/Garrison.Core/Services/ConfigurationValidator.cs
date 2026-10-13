namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.Json;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Validation shared by the configuration routes and manifest apply. Throws <see cref="ValidationException"/>
    /// with field-level errors. Thread-safe.
    /// </summary>
    public static class ConfigurationValidator
    {
        #region Private-Members

        private static readonly Regex _AgentName = new Regex("^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$", RegexOptions.Compiled);
        private static readonly Regex _McpToolName = new Regex("^[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}$", RegexOptions.Compiled);
        private static readonly Regex _ServerName = new Regex("^[A-Za-z0-9_-]{1,64}$", RegexOptions.Compiled);
        private static readonly Regex _EnvName = new Regex("^[A-Za-z_][A-Za-z0-9_]{0,255}$", RegexOptions.Compiled);

        #endregion

        #region Public-Methods

        /// <summary>
        /// Validate a record name; tenant names cannot use the built-in prefix.
        /// </summary>
        /// <param name="name">Name.</param>
        /// <param name="errors">Error collection.</param>
        /// <param name="field">Field name.</param>
        public static void Name(string? name, Dictionary<string, string> errors, string field = "name")
        {
            if (String.IsNullOrWhiteSpace(name)) errors[field] = "A name is required.";
            else if (name.StartsWith(Constants.BuiltInPrefix, StringComparison.OrdinalIgnoreCase)) errors[field] = "Names starting with " + Constants.BuiltInPrefix + " are reserved for built-ins.";
            else if (name.Length > 128) errors[field] = "Names are limited to 128 characters.";
        }

        /// <summary>
        /// Validate a secret expiry: when set, it must be in the future (an already expired secret would be unusable
        /// from the moment it is saved).
        /// </summary>
        /// <param name="expiresUtc">Expiry, or null for no expiry.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="errors">Error collection.</param>
        /// <param name="field">Field name.</param>
        /// <returns>True when valid.</returns>
        public static bool SecretExpiry(DateTime? expiresUtc, DateTime nowUtc, Dictionary<string, string> errors, string field = "expiresUtc")
        {
            if (!expiresUtc.HasValue) return true;
            DateTime expiry = expiresUtc.Value.Kind == DateTimeKind.Local ? expiresUtc.Value.ToUniversalTime() : expiresUtc.Value;
            if (expiry > nowUtc) return true;
            errors[field] = "The expiry " + expiry.ToString("yyyy-MM-ddTHH:mm:ssZ", System.Globalization.CultureInfo.InvariantCulture) + " is in the past. Use a future time, or omit expiresUtc for no expiry.";
            return false;
        }

        /// <summary>
        /// Validate a template and record errors.
        /// </summary>
        /// <param name="template">Template.</param>
        /// <param name="allowSecrets">Whether secret references are allowed.</param>
        /// <param name="errors">Error collection.</param>
        /// <param name="field">Field name.</param>
        /// <param name="loopScope">Whether the template renders inside a loop scope (RepeatOver), so this.* is valid.</param>
        public static void Template(string? template, bool allowSecrets, Dictionary<string, string> errors, string field, bool loopScope = false)
        {
            if (String.IsNullOrEmpty(template)) return;
            TemplateAnalysis analysis = TemplateAnalyzer.Analyze(template, field, allowSecrets, loopScope);
            if (!analysis.Valid) errors[field] = analysis.Errors[0];
        }

        /// <summary>
        /// Validate a harness profile.
        /// </summary>
        /// <param name="profile">Profile.</param>
        /// <exception cref="ValidationException">Thrown when invalid.</exception>
        public static void HarnessProfile(HarnessProfile profile)
        {
            if (profile == null) throw new ValidationException("A harness profile is required.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Name(profile.Name, errors);
            if (String.IsNullOrWhiteSpace(profile.Executable)) errors["executable"] = "An executable is required.";
            Template(profile.Executable, false, errors, "executable");
            Template(profile.PromptArgumentTemplate, false, errors, "promptArgumentTemplate");
            for (int i = 0; i < profile.Arguments.Count; i++)
            {
                bool repeat = !String.IsNullOrWhiteSpace(profile.Arguments[i].RepeatOver);
                Template(profile.Arguments[i].Template, false, errors, "arguments[" + i + "].template", repeat);
                Template(profile.Arguments[i].Condition, false, errors, "arguments[" + i + "].condition", repeat);
            }
            for (int i = 0; i < profile.Environment.Count; i++)
            {
                if (!_EnvName.IsMatch(profile.Environment[i].Name ?? String.Empty)) errors["environment[" + i + "].name"] = "Environment variable names must match [A-Za-z_][A-Za-z0-9_]*.";
                Template(profile.Environment[i].ValueTemplate, true, errors, "environment[" + i + "].valueTemplate");
                Template(profile.Environment[i].Condition, true, errors, "environment[" + i + "].condition");
            }
            for (int i = 0; i < profile.Files.Count; i++)
            {
                Template(profile.Files[i].PathTemplate, false, errors, "files[" + i + "].pathTemplate");
                Template(profile.Files[i].ContentTemplate, true, errors, "files[" + i + "].contentTemplate");
                Template(profile.Files[i].Condition, true, errors, "files[" + i + "].condition");
            }
            if (profile.ResultSource == ResultSourceEnum.LastMessageFile && String.IsNullOrWhiteSpace(profile.ResultFileName)) errors["resultFileName"] = "A result file name is required when the result source is LastMessageFile.";
            if (errors.Count > 0) throw new ValidationException("The harness profile is invalid.", errors);
        }

        /// <summary>
        /// Validate prompt template content.
        /// </summary>
        /// <param name="name">Name.</param>
        /// <param name="content">Content.</param>
        /// <exception cref="ValidationException">Thrown when invalid.</exception>
        public static void PromptTemplate(string? name, string? content)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Name(name, errors);
            if (content == null) errors["content"] = "Content is required.";
            else Template(content, false, errors, "content");
            if (errors.Count > 0) throw new ValidationException("The prompt template is invalid.", errors);
        }

        /// <summary>
        /// Validate an MCP server.
        /// </summary>
        /// <param name="server">Server.</param>
        /// <exception cref="ValidationException">Thrown when invalid.</exception>
        public static void McpServer(McpServer server)
        {
            if (server == null) throw new ValidationException("An MCP server is required.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            if (!_ServerName.IsMatch(server.Name ?? String.Empty)) errors["name"] = "MCP server names must be 1 to 64 characters of letters, digits, underscore, or hyphen.";
            else if (String.Equals(server.Name, Constants.McpServerName, StringComparison.OrdinalIgnoreCase)) errors["name"] = "The name '" + Constants.McpServerName + "' is reserved for Garrison's own MCP server.";
            if (server.Transport == McpTransportEnum.Http)
            {
                if (!Uri.TryCreate(server.Url, UriKind.Absolute, out Uri? uri) || (uri.Scheme != "http" && uri.Scheme != "https")) errors["url"] = "HTTP servers need an absolute http or https URL.";
            }
            else if (String.IsNullOrWhiteSpace(server.Command))
            {
                errors["command"] = "Stdio servers need a command.";
            }
            for (int i = 0; i < server.Headers.Count; i++) Template(server.Headers[i].ValueTemplate, true, errors, "headers[" + i + "].valueTemplate");
            for (int i = 0; i < server.Environment.Count; i++) Template(server.Environment[i].ValueTemplate, true, errors, "environment[" + i + "].valueTemplate");
            if (errors.Count > 0) throw new ValidationException("The MCP server is invalid.", errors);
        }

        /// <summary>
        /// Validate an agent.
        /// </summary>
        /// <param name="agent">Agent.</param>
        /// <exception cref="ValidationException">Thrown when invalid.</exception>
        public static void Agent(Agent agent)
        {
            if (agent == null) throw new ValidationException("An agent is required.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            if (!_AgentName.IsMatch(agent.Name ?? String.Empty)) errors["name"] = "Agent names are 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.";
            Json(agent.InputSchemaJson, errors, "inputSchemaJson");
            Json(agent.OutputSchemaJson, errors, "outputSchemaJson");
            if (agent.Kind == AgentKindEnum.Remote && String.IsNullOrWhiteSpace(agent.RemoteEndpointUrl)) errors["remoteEndpointUrl"] = "Remote agents need an endpoint URL.";
            if (!String.IsNullOrWhiteSpace(agent.McpToolName) && !IsValidMcpToolName(agent.McpToolName.Trim())) errors["mcpToolName"] = "MCP tool names are 1 to 64 letters, digits, underscores, dots, and hyphens, not starting with a dot or hyphen, and cannot start with the reserved prefix garrison_.";
            foreach (string name in agent.DelegationAllowList)
            {
                if (!_AgentName.IsMatch(name ?? String.Empty)) errors["delegationAllowList"] = "'" + name + "' is not a valid agent name.";
            }
            if (errors.Count > 0) throw new ValidationException("The agent is invalid.", errors);
        }

        /// <summary>
        /// Whether a name can be used for an agent offered as its own MCP tool: 1 to 64 letters, digits, underscores, dots,
        /// and hyphens, not starting with a dot or hyphen, and not starting with garrison_ (reserved for the built-in tools).
        /// </summary>
        /// <param name="name">Candidate tool name.</param>
        /// <returns>True when usable.</returns>
        public static bool IsValidMcpToolName(string? name)
        {
            if (String.IsNullOrEmpty(name) || !_McpToolName.IsMatch(name)) return false;
            return !name.StartsWith("garrison_", StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Validate a workspace template.
        /// </summary>
        /// <param name="workspace">Workspace template.</param>
        /// <exception cref="ValidationException">Thrown when invalid.</exception>
        public static void Workspace(WorkspaceTemplate workspace)
        {
            if (workspace == null) throw new ValidationException("A workspace template is required.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Name(workspace.Name, errors);
            if (workspace.Kind == WorkspaceKindEnum.GitRepository && String.IsNullOrWhiteSpace(workspace.GitUrl)) errors["gitUrl"] = "Git workspaces need a repository URL.";
            if (workspace.Kind == WorkspaceKindEnum.PersistentVolume)
            {
                if (String.IsNullOrWhiteSpace(workspace.PersistentVolumeClaim)) errors["persistentVolumeClaim"] = "PersistentVolume workspaces need the name of an existing PersistentVolumeClaim in the run namespace.";
                else if (!KubernetesNames.IsSubdomain(workspace.PersistentVolumeClaim)) errors["persistentVolumeClaim"] = "'" + workspace.PersistentVolumeClaim + "' is not a valid PersistentVolumeClaim name (lowercase letters, digits, '-' and '.').";
            }
            for (int i = 0; i < workspace.Files.Count; i++)
            {
                string path = (workspace.Files[i].Path ?? String.Empty).Replace('\\', '/');
                if (path.Length == 0 || path.StartsWith("/", StringComparison.Ordinal) || path.Split('/').Any(s => s == "..")) errors["files[" + i + "].path"] = "Paths must be relative and must not contain '..'.";
            }
            if (errors.Count > 0) throw new ValidationException("The workspace template is invalid.", errors);
        }

        /// <summary>
        /// Whether runs of a harness profile can relay permission approvals to Garrison (P12.3): Claude Code profiles
        /// (through --permission-prompt-tool) and profiles with CodexAppServer delivery (through app-server approval
        /// requests the worker relays).
        /// </summary>
        /// <param name="profile">Harness profile.</param>
        /// <returns>True when approvals can be relayed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when profile is null.</exception>
        public static bool SupportsApprovals(HarnessProfile profile)
        {
            if (profile == null) throw new ArgumentNullException(nameof(profile));
            return profile.HarnessType == HarnessTypeEnum.ClaudeCode || profile.HarnessType == HarnessTypeEnum.ProviderApi || profile.PromptDelivery == PromptDeliveryEnum.CodexAppServer;
        }

        /// <summary>
        /// Validate deployment approval rules (P12.3): every pattern parses, input patterns are valid regular expressions,
        /// and descriptions stay within 1000 characters. At most 500 rules.
        /// </summary>
        /// <param name="rules">Rules.</param>
        /// <param name="errors">Field errors to add to.</param>
        /// <exception cref="ArgumentNullException">Thrown when errors is null.</exception>
        public static void ApprovalRules(List<DeploymentApprovalRule>? rules, Dictionary<string, string> errors)
        {
            if (errors == null) throw new ArgumentNullException(nameof(errors));
            if (rules == null) return;
            if (rules.Count > 500) errors["approvalRules"] = "A deployment can have at most 500 approval rules.";
            for (int i = 0; i < rules.Count; i++)
            {
                DeploymentApprovalRule rule = rules[i];
                string field = "approvalRules[" + i + "]";
                if (rule == null)
                {
                    errors[field] = "A rule is required.";
                    continue;
                }
                if (!Garrison.Core.Approvals.ApprovalRuleParser.TryParse(rule.Pattern, out Garrison.Core.Approvals.ParsedApprovalRule? _, out string? error)) errors[field + ".pattern"] = error ?? "The pattern is invalid.";
                if (!String.IsNullOrWhiteSpace(rule.InputPattern))
                {
                    try
                    {
                        Regex.IsMatch(String.Empty, rule.InputPattern!, RegexOptions.None, TimeSpan.FromSeconds(1));
                    }
                    catch (ArgumentException)
                    {
                        errors[field + ".inputPattern"] = "The input pattern is not a valid regular expression.";
                    }
                }
                if (rule.Description != null && rule.Description.Length > 1000) errors[field + ".description"] = "The description is longer than 1000 characters.";
            }
        }

        /// <summary>
        /// Validate a deployment and its references (plan P2.6.2).
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ValidationException">Thrown when invalid.</exception>
        public static async Task DeploymentAsync(DatabaseDriverBase database, string tenantId, Deployment deployment, CancellationToken token = default)
        {
            if (deployment == null) throw new ValidationException("A deployment is required.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            try { ExecutorCapabilityRules.Validate(deployment.RequiredCapabilities); }
            catch (ArgumentException ex) { errors["requiredCapabilities"] = ex.Message; }

            Name(deployment.Name, errors);

            if (String.IsNullOrEmpty(deployment.AgentId) || await database.Agents.ReadAsync(tenantId, deployment.AgentId, token).ConfigureAwait(false) == null) errors["agentId"] = "The agent does not exist in this tenant.";
            HarnessProfile? profile = String.IsNullOrEmpty(deployment.HarnessProfileId) ? null : await database.HarnessProfiles.ReadAsync(tenantId, deployment.HarnessProfileId, token).ConfigureAwait(false);
            if (profile == null) errors["harnessProfileId"] = "The harness profile does not exist or is not visible to this tenant.";
            if (profile != null && deployment.RequiredCapabilities.SessionContinuation && !profile.SupportsResume)
                errors["requiredCapabilities.sessionContinuation"] = "Session continuation requires a harness profile with supportsResume enabled.";


            HashSet<string> roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < deployment.PromptBindings.Count; i++)
            {
                DeploymentPromptBinding binding = deployment.PromptBindings[i];
                if (String.IsNullOrWhiteSpace(binding.Role)) errors["promptBindings[" + i + "].role"] = "A role is required.";
                else if (!roles.Add(binding.Role)) errors["promptBindings[" + i + "].role"] = "Role " + binding.Role + " is bound twice.";
                PromptTemplate? template = String.IsNullOrEmpty(binding.TemplateId) ? null : await database.PromptTemplates.ReadAsync(tenantId, binding.TemplateId, token).ConfigureAwait(false);
                if (template == null) errors["promptBindings[" + i + "].templateId"] = "The prompt template does not exist or is not visible to this tenant.";
                else if (binding.PinnedVersion.HasValue && binding.PinnedVersion.Value != template.CurrentVersion && await database.PromptTemplateVersions.ReadByVersionAsync(template.Id, binding.PinnedVersion.Value, token).ConfigureAwait(false) == null)
                {
                    errors["promptBindings[" + i + "].pinnedVersion"] = "Version " + binding.PinnedVersion.Value + " of " + template.Name + " does not exist.";
                }
            }

            HashSet<string> aliases = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            List<string> secretAliases = new List<string>();
            for (int i = 0; i < deployment.ResourceBindings.Count; i++)
            {
                DeploymentResourceBinding binding = deployment.ResourceBindings[i];
                string field = "resourceBindings[" + i + "]";
                if (String.IsNullOrWhiteSpace(binding.Alias)) errors[field + ".alias"] = "An alias is required.";
                else if (binding.Alias.Equals("kind", StringComparison.OrdinalIgnoreCase)) errors[field + ".alias"] = "The alias 'kind' is reserved.";
                else if (!aliases.Add(binding.Kind + ":" + binding.Alias)) errors[field + ".alias"] = "Alias " + binding.Alias + " is used twice.";
                bool exists = binding.Kind == ResourceBindingKindEnum.McpServer
                    ? await database.McpServers.ReadAsync(tenantId, binding.ResourceId, token).ConfigureAwait(false) != null
                    : await database.Secrets.ReadAsync(tenantId, binding.ResourceId, token).ConfigureAwait(false) != null;
                if (!exists) errors[field + ".resourceId"] = "The bound " + binding.Kind + " does not exist in this tenant.";
                if (binding.Kind == ResourceBindingKindEnum.Secret) secretAliases.Add(binding.Alias);
            }

            if (profile != null && profile.CredentialEnvironmentAllowlist.Count > 0)
            {
                foreach (HarnessEnvironmentVariable variable in profile.Environment)
                {
                    foreach (string reference in TemplateAnalyzer.Analyze(variable.ValueTemplate, variable.Name, true).SecretReferences)
                    {
                        if (!profile.CredentialEnvironmentAllowlist.Contains(variable.Name, StringComparer.Ordinal)) errors["harnessProfileId"] = "Profile environment variable " + variable.Name + " references " + reference + " but is not in the profile's credential allowlist.";
                    }
                }
                for (int i = 0; i < deployment.EnvironmentOverrides.Count; i++)
                {
                    DeploymentEnvironmentOverride item = deployment.EnvironmentOverrides[i];
                    if (TemplateAnalyzer.Analyze(item.ValueTemplate, item.Name, true).SecretReferences.Count > 0 && !profile.CredentialEnvironmentAllowlist.Contains(item.Name, StringComparer.Ordinal))
                    {
                        errors["environmentOverrides[" + i + "].name"] = item.Name + " is not in the harness profile's credential allowlist, so it cannot carry a secret.";
                    }
                }
            }

            for (int i = 0; i < deployment.ArgumentOverrides.Count; i++)
            {
                DeploymentArgumentOverride item = deployment.ArgumentOverrides[i];
                bool replace = item.Operation == ArgumentOverrideOperationEnum.Replace;
                Template(item.Template, false, errors, "argumentOverrides[" + i + "].template", replace);
                Template(item.Condition, false, errors, "argumentOverrides[" + i + "].condition", replace);
                if ((item.Operation == ArgumentOverrideOperationEnum.Remove || item.Operation == ArgumentOverrideOperationEnum.Replace) && item.Match == null) errors["argumentOverrides[" + i + "].match"] = "Remove and Replace need the profile argument template to match.";
            }
            for (int i = 0; i < deployment.EnvironmentOverrides.Count; i++)
            {
                if (!_EnvName.IsMatch(deployment.EnvironmentOverrides[i].Name ?? String.Empty)) errors["environmentOverrides[" + i + "].name"] = "Invalid environment variable name.";
                Template(deployment.EnvironmentOverrides[i].ValueTemplate, true, errors, "environmentOverrides[" + i + "].valueTemplate");
            }
            for (int i = 0; i < deployment.FileOverrides.Count; i++)
            {
                Template(deployment.FileOverrides[i].PathTemplate, false, errors, "fileOverrides[" + i + "].pathTemplate");
                Template(deployment.FileOverrides[i].ContentTemplate, true, errors, "fileOverrides[" + i + "].contentTemplate");
            }
            for (int i = 0; i < deployment.AllowedRunOverrides.Count; i++)
            {
                DeploymentRunOverrideRule rule = deployment.AllowedRunOverrides[i];
                string field = "allowedRunOverrides[" + i + "]";
                if (String.IsNullOrWhiteSpace(rule.Name)) errors[field + ".name"] = "A parameter name is required.";
                if (rule.Validation == RunOverrideValidationEnum.Regex)
                {
                    try
                    {
                        Regex.IsMatch(String.Empty, rule.Pattern ?? String.Empty);
                    }
                    catch (ArgumentException)
                    {
                        errors[field + ".pattern"] = "The pattern is not a valid regular expression.";
                    }
                }
                if (rule.Validation == RunOverrideValidationEnum.IntegerRange)
                {
                    string[] bounds = (rule.Pattern ?? String.Empty).Split(',');
                    if (bounds.Length != 2 || !Int64.TryParse(bounds[0].Trim(), out long _) || !Int64.TryParse(bounds[1].Trim(), out long _)) errors[field + ".pattern"] = "Integer ranges use the form min,max.";
                }
                if (rule.Validation == RunOverrideValidationEnum.Enum && String.IsNullOrWhiteSpace(rule.Pattern)) errors[field + ".pattern"] = "Enum rules need comma-separated values.";
            }

            ApprovalRules(deployment.ApprovalRules, errors);
            if (deployment.ApprovalsEnabled && profile != null && !SupportsApprovals(profile))
            {
                errors["approvalsEnabled"] = "Harness profile " + profile.Name + " cannot relay permission approvals. Approvals need a Claude Code profile (--permission-prompt-tool), a Codex profile with CodexAppServer delivery, or ProviderApi; Codex exec, Mux, Gemini CLI, and generic profiles have no approval hook.";
            }

            if (!String.IsNullOrEmpty(deployment.WorkspaceTemplateId) && await database.WorkspaceTemplates.ReadAsync(tenantId, deployment.WorkspaceTemplateId, token).ConfigureAwait(false) == null) errors["workspaceTemplateId"] = "The workspace template does not exist in this tenant.";
            if (!String.IsNullOrEmpty(deployment.ArtifactStoreId) && await database.ArtifactStores.ReadAsync(tenantId, deployment.ArtifactStoreId, token).ConfigureAwait(false) == null) errors["artifactStoreId"] = "The artifact store does not exist in this tenant.";
            NodePool? pool = String.IsNullOrEmpty(deployment.NodePoolId) ? null : await database.NodePools.ReadAsync(deployment.NodePoolId, token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(deployment.NodePoolId) && pool == null) errors["nodePoolId"] = "The node pool does not exist.";

            if (deployment.ArtifactGlobs.Count > 64) errors["artifactGlobs"] = "At most 64 artifact globs are supported.";
            for (int i = 0; i < deployment.ArtifactGlobs.Count; i++)
                if (!ArtifactGlob.IsValid(deployment.ArtifactGlobs[i])) errors["artifactGlobs[" + i + "]"] = "Use a relative workspace glob with *, **, or ?; parent paths, absolute paths, and bracket/brace patterns are unsupported.";
            if (deployment.ArtifactGlobs.Count > 0 && String.IsNullOrEmpty(deployment.ArtifactStoreId)) errors["artifactStoreId"] = "Artifact globs require an artifact store.";
            PodResources(deployment.PodResources, errors);
            if (deployment.RequiredCapabilities.ColdStartClass == ExecutorColdStartEnum.Warm && !deployment.PodResources.IsEmpty)
                errors["podResources"] = "Warm startup uses the pool's default pod resources; per-deployment resources require cold startup.";
            if (!String.IsNullOrEmpty(deployment.WorkspaceTemplateId))
            {
                WorkspaceTemplate? workspace = await database.WorkspaceTemplates.ReadAsync(tenantId, deployment.WorkspaceTemplateId, token).ConfigureAwait(false);
                if (workspace != null && workspace.Kind == WorkspaceKindEnum.PersistentVolume && deployment.RequiredCapabilities.ColdStartClass == ExecutorColdStartEnum.Warm)
                    errors["requiredCapabilities.coldStartClass"] = "PersistentVolume workspaces require cold startup.";
                if (workspace != null && workspace.Kind == WorkspaceKindEnum.PersistentVolume && RunExecutors.Resolve(deployment, pool) != RunExecutorEnum.KubernetesJob)
                {
                    errors["executor"] = "Workspace template " + workspace.Name + " is a PersistentVolume workspace, which needs the KubernetesJob executor.";
                }
            }

            if (errors.Count > 0) throw new ValidationException("The deployment is invalid.", errors);
        }

        #endregion

        #region Private-Methods

        private static void PodResources(RunPodResources resources, Dictionary<string, string> errors)
        {
            if (resources == null) return;
            Quantity(resources.CpuRequest, "podResources.cpuRequest", errors);
            Quantity(resources.CpuLimit, "podResources.cpuLimit", errors);
            Quantity(resources.MemoryRequest, "podResources.memoryRequest", errors);
            Quantity(resources.MemoryLimit, "podResources.memoryLimit", errors);
            Quantity(resources.EphemeralStorageRequest, "podResources.ephemeralStorageRequest", errors);
            Quantity(resources.EphemeralStorageLimit, "podResources.ephemeralStorageLimit", errors);
            RequestWithinLimit(resources.CpuRequest, resources.CpuLimit, "podResources.cpuRequest", errors);
            RequestWithinLimit(resources.MemoryRequest, resources.MemoryLimit, "podResources.memoryRequest", errors);
            RequestWithinLimit(resources.EphemeralStorageRequest, resources.EphemeralStorageLimit, "podResources.ephemeralStorageRequest", errors);
        }

        private static void RequestWithinLimit(string? request, string? limit, string field, Dictionary<string, string> errors)
        {
            if (errors.ContainsKey(field)) return;
            if (!KubernetesNames.TryParseQuantity(request, out decimal requested) || !KubernetesNames.TryParseQuantity(limit, out decimal limited)) return;
            if (requested > limited) errors[field] = "The request " + request + " is above the limit " + limit + ".";
        }

        private static void Quantity(string? value, string field, Dictionary<string, string> errors)
        {
            if (value == null) return;
            if (!KubernetesNames.IsQuantity(value)) errors[field] = "'" + value + "' is not a Kubernetes quantity (for example 500m, 2, 512Mi, 4Gi).";
        }

        private static void Json(string? json, Dictionary<string, string> errors, string field)
        {
            if (String.IsNullOrWhiteSpace(json)) return;
            try
            {
                using (JsonDocument document = JsonDocument.Parse(json))
                {
                    if (document.RootElement.ValueKind != JsonValueKind.Object) errors[field] = "A JSON Schema must be a JSON object.";
                }
            }
            catch (JsonException e)
            {
                errors[field] = "Not valid JSON: " + e.Message;
            }
        }

        #endregion
    }
}
