namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.Json;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
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
        private static readonly Regex _ScpGitUrl = new Regex("^[A-Za-z0-9._~+-]+@[A-Za-z0-9][A-Za-z0-9.-]*:[^:\\s][^\\s]*$", RegexOptions.Compiled);

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
            Dictionary<string, string> codes = new Dictionary<string, string>();
            Schema(agent.InputSchemaJson, errors, codes, "inputSchemaJson");
            Schema(agent.OutputSchemaJson, errors, codes, "outputSchemaJson");
            if (agent.Kind == AgentKindEnum.Remote && String.IsNullOrWhiteSpace(agent.RemoteEndpointUrl)) errors["remoteEndpointUrl"] = "Remote agents need an endpoint URL.";
            else if (!String.IsNullOrWhiteSpace(agent.RemoteEndpointUrl))
            {
                // Remote invocation (P12.4) must also connect through OutboundAddressPolicy.CreateHandler; refusing metadata
                // and link-local literals here keeps such endpoints out of the configuration from the start (SR-26).
                if (!Uri.TryCreate(agent.RemoteEndpointUrl, UriKind.Absolute, out Uri? remote) || (remote.Scheme != "http" && remote.Scheme != "https") || remote.UserInfo.Length > 0) errors["remoteEndpointUrl"] = "Use an absolute http or https URL without embedded credentials.";
                else if (Garrison.Core.Security.OutboundAddressPolicy.LiteralBlockedReason(remote) is string blocked) errors["remoteEndpointUrl"] = blocked;
            }
            if (!String.IsNullOrWhiteSpace(agent.McpToolName) && !(agent.Kind == AgentKindEnum.Remote && !agent.ExposeMcpTool ? _McpToolName.IsMatch(agent.McpToolName.Trim()) : IsValidMcpToolName(agent.McpToolName.Trim()))) errors["mcpToolName"] = "MCP tool names are 1 to 64 letters, digits, underscores, dots, and hyphens, not starting with a dot or hyphen, and cannot start with the reserved prefix garrison_.";
            foreach (string name in agent.DelegationAllowList)
            {
                if (!_AgentName.IsMatch(name ?? String.Empty)) errors["delegationAllowList"] = "'" + name + "' is not a valid agent name.";
            }
            if (errors.Count > 0) throw new ValidationException("The agent is invalid.", errors, codes);
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
        /// Whether a git repository URL may be cloned (SR-22): https://, ssh://, or scp-like user@host:path (ssh). Local
        /// paths, file://, http://, git://, ext:: and other transports, a leading '-', whitespace, and control characters
        /// are refused. Workers re-check this before cloning and also restrict git to https and ssh with GIT_ALLOW_PROTOCOL.
        /// </summary>
        /// <param name="url">URL.</param>
        /// <returns>True when allowed.</returns>
        public static bool IsAllowedGitUrl(string? url)
        {
            if (String.IsNullOrWhiteSpace(url) || url.Length > 2048) return false;
            if (url.StartsWith("-", StringComparison.Ordinal) || url.Any(c => Char.IsWhiteSpace(c) || Char.IsControl(c))) return false;
            if (url.Contains("::", StringComparison.Ordinal)) return false;
            if (url.StartsWith("https://", StringComparison.OrdinalIgnoreCase) || url.StartsWith("ssh://", StringComparison.OrdinalIgnoreCase))
            {
                if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri)) return false;
                if (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != "ssh") return false;
                if (uri.Scheme == Uri.UriSchemeHttps && uri.UserInfo.Length > 0) return false;
                if (uri.Scheme == "ssh" && uri.UserInfo.Contains(':')) return false;
                return !String.IsNullOrEmpty(uri.Host) && !uri.Host.StartsWith("-", StringComparison.Ordinal);
            }
            if (url.Contains("://", StringComparison.Ordinal)) return false;
            return _ScpGitUrl.IsMatch(url);
        }

        /// <summary>
        /// Whether a git branch, tag, or commit may be passed to git (SR-22): no leading '-', no whitespace or control
        /// characters, no '..', at most 255 characters.
        /// </summary>
        /// <param name="gitRef">Reference.</param>
        /// <returns>True when allowed.</returns>
        public static bool IsAllowedGitRef(string? gitRef)
        {
            if (String.IsNullOrEmpty(gitRef) || gitRef.Length > 255) return false;
            if (gitRef.StartsWith("-", StringComparison.Ordinal) || gitRef.Contains("..", StringComparison.Ordinal)) return false;
            return !gitRef.Any(c => Char.IsWhiteSpace(c) || Char.IsControl(c));
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
            else if (!String.IsNullOrEmpty(workspace.GitUrl) && !IsAllowedGitUrl(workspace.GitUrl)) errors["gitUrl"] = "Repository URLs must be https://, ssh://, or user@host:path (scp-like ssh). Local paths, file://, http://, git://, and other transports are not allowed.";
            if (!String.IsNullOrEmpty(workspace.GitRef) && !IsAllowedGitRef(workspace.GitRef)) errors["gitRef"] = "A branch, tag, or commit must not start with '-' and must not contain whitespace, control characters, or '..'.";
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
        /// Validate deployment egress rules (P11.15): at most <see cref="Deployment.MaxEgressRules"/> rules (field
        /// egressRules, code TooManyEgressRules), each with a valid CIDR block (egressRules[i].cidr, code InvalidCidr),
        /// a port from 1 to 65535 or none (egressRules[i].port, code PortOutOfRange), and a known protocol
        /// (egressRules[i].protocol, code InvalidProtocol).
        /// </summary>
        /// <param name="rules">Rules, or null for none.</param>
        /// <param name="errors">Field errors to add to.</param>
        /// <param name="codes">Field codes to add to.</param>
        /// <exception cref="ArgumentNullException">Thrown when errors or codes is null.</exception>
        public static void EgressRules(List<DeploymentEgressRule>? rules, Dictionary<string, string> errors, Dictionary<string, string> codes)
        {
            if (errors == null) throw new ArgumentNullException(nameof(errors));
            if (codes == null) throw new ArgumentNullException(nameof(codes));
            if (rules == null) return;
            if (rules.Count > Deployment.MaxEgressRules)
            {
                errors["egressRules"] = "A deployment can have at most " + Deployment.MaxEgressRules + " egress rules; " + rules.Count + " were given. Combine adjacent blocks into wider CIDRs.";
                codes["egressRules"] = "TooManyEgressRules";
            }
            for (int i = 0; i < rules.Count; i++)
            {
                DeploymentEgressRule rule = rules[i];
                string field = "egressRules[" + i + "]";
                if (rule == null)
                {
                    errors[field] = "An egress rule is required.";
                    codes[field] = "InvalidCidr";
                    continue;
                }
                if (!CidrNotation.IsValid(rule.Cidr, out string? cidrError))
                {
                    errors[field + ".cidr"] = cidrError ?? "The CIDR block is invalid.";
                    codes[field + ".cidr"] = "InvalidCidr";
                }
                if (rule.Port.HasValue && (rule.Port.Value < 1 || rule.Port.Value > 65535))
                {
                    errors[field + ".port"] = "The port must be from 1 to 65535, or empty for every port; " + rule.Port.Value + " was given.";
                    codes[field + ".port"] = "PortOutOfRange";
                }
                if (!Enum.IsDefined(rule.Protocol))
                {
                    errors[field + ".protocol"] = "Unknown protocol; use TCP or UDP.";
                    codes[field + ".protocol"] = "InvalidProtocol";
                }
            }
        }

        /// <summary>
        /// Validate a pipeline definition (P12.9): name, duration, stage count, stage names, agent and deployment
        /// references (a stage's deployment must belong to its agent), handoff template kind (Task) and pinned version,
        /// stage ranges, and stage run parameters (only with a deployment, checked against its allowed run overrides).
        /// Fields are reported as stages[i].field.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="pipeline">Pipeline.</param>
        /// <param name="maxStages">Most stages allowed (the cluster setting Runtime.PipelineMaxStages, 1 to 100).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ValidationException">Thrown when the pipeline is invalid.</exception>
        public static async Task PipelineAsync(DatabaseDriverBase database, string tenantId, Pipeline pipeline, int maxStages, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (pipeline == null) throw new ValidationException("A pipeline is required.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            if (!_AgentName.IsMatch(pipeline.Name ?? String.Empty)) errors["name"] = "Pipeline names are 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.";
            if (pipeline.Description != null && pipeline.Description.Length > 4000) errors["description"] = "Descriptions are limited to 4000 characters.";
            if (pipeline.MaxDurationSeconds < 0 || pipeline.MaxDurationSeconds > 2592000) errors["maxDurationSeconds"] = "maxDurationSeconds is 0 (no limit) to 2592000 (30 days).";
            int limit = Math.Clamp(maxStages, 1, 100);
            if (pipeline.Stages.Count == 0)
            {
                errors["stages"] = "A pipeline needs at least one stage.";
                codes["stages"] = "PipelineEmpty";
            }
            else if (pipeline.Stages.Count > limit)
            {
                errors["stages"] = "A pipeline has at most " + limit + " stages (Runtime.PipelineMaxStages); this one has " + pipeline.Stages.Count + ".";
                codes["stages"] = "TooManyStages";
            }

            HashSet<string> names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < pipeline.Stages.Count; i++)
            {
                token.ThrowIfCancellationRequested();
                PipelineStage stage = pipeline.Stages[i];
                string field = "stages[" + i + "]";
                if (String.IsNullOrWhiteSpace(stage.Name)) errors[field + ".name"] = "A stage name is required.";
                else if (stage.Name.Length > 128) errors[field + ".name"] = "Stage names are limited to 128 characters.";
                else if (!names.Add(stage.Name.Trim())) errors[field + ".name"] = "Stage name " + stage.Name + " is used twice.";
                if (stage.Description != null && stage.Description.Length > 4000) errors[field + ".description"] = "Descriptions are limited to 4000 characters.";
                if (stage.OutputCharLimit < 1000 || stage.OutputCharLimit > 200000) errors[field + ".outputCharLimit"] = "outputCharLimit is 1000 to 200000.";
                if (stage.MaxAttempts < 1 || stage.MaxAttempts > 5) errors[field + ".maxAttempts"] = "maxAttempts is 1 to 5.";
                if (stage.ReviewTimeoutSeconds < 0 || stage.ReviewTimeoutSeconds > 2592000) errors[field + ".reviewTimeoutSeconds"] = "reviewTimeoutSeconds is 0 (wait indefinitely) to 2592000 (30 days).";
                if (stage.ReviewTimeoutAction == PipelineReviewDecisionEnum.RequestChanges) errors[field + ".reviewTimeoutAction"] = "The review timeout action is Approve or Reject.";
                if (stage.MaxRevisions < 0 || stage.MaxRevisions > 10) errors[field + ".maxRevisions"] = "maxRevisions is 0 to 10.";

                Agent? agent = String.IsNullOrEmpty(stage.AgentId) ? null : await database.Agents.ReadAsync(tenantId, stage.AgentId, token).ConfigureAwait(false);
                if (agent == null)
                {
                    errors[field + ".agentId"] = "The agent does not exist in this tenant.";
                    codes[field + ".agentId"] = "ReferenceNotFound";
                }

                Deployment? deployment = null;
                if (!String.IsNullOrEmpty(stage.DeploymentId))
                {
                    deployment = await database.Deployments.ReadAsync(tenantId, stage.DeploymentId, token).ConfigureAwait(false);
                    if (deployment == null)
                    {
                        errors[field + ".deploymentId"] = "The deployment does not exist in this tenant.";
                        codes[field + ".deploymentId"] = "ReferenceNotFound";
                    }
                    else if (agent != null && deployment.AgentId != agent.Id)
                    {
                        errors[field + ".deploymentId"] = "Deployment " + deployment.Name + " belongs to another agent, not " + agent.Name + ".";
                        codes[field + ".deploymentId"] = "DeploymentAgentMismatch";
                    }
                }

                if (!String.IsNullOrEmpty(stage.HandoffTemplateId))
                {
                    PromptTemplate? template = await database.PromptTemplates.ReadAsync(tenantId, stage.HandoffTemplateId, token).ConfigureAwait(false);
                    if (template == null)
                    {
                        errors[field + ".handoffTemplateId"] = "The prompt template does not exist or is not visible to this tenant.";
                        codes[field + ".handoffTemplateId"] = "ReferenceNotFound";
                    }
                    else if (template.Kind != PromptTemplateKindEnum.Task)
                    {
                        errors[field + ".handoffTemplateId"] = "Prompt template " + template.Name + " is a " + template.Kind + " template; a pipeline stage handoff template must be a Task template.";
                        codes[field + ".handoffTemplateId"] = "TemplateKindMismatch";
                    }
                    else if (stage.HandoffTemplateVersion.HasValue && stage.HandoffTemplateVersion.Value != template.CurrentVersion
                        && await database.PromptTemplateVersions.ReadByVersionAsync(template.Id, stage.HandoffTemplateVersion.Value, token).ConfigureAwait(false) == null)
                    {
                        errors[field + ".handoffTemplateVersion"] = "Version " + stage.HandoffTemplateVersion.Value + " of " + template.Name + " does not exist.";
                        codes[field + ".handoffTemplateVersion"] = "ReferenceNotFound";
                    }
                }
                else if (stage.HandoffTemplateVersion.HasValue)
                {
                    errors[field + ".handoffTemplateVersion"] = "A pinned version needs a handoffTemplateId.";
                }

                if (stage.Parameters.Count > 0)
                {
                    HashSet<string> parameterNames = new HashSet<string>(StringComparer.Ordinal);
                    foreach (PipelineStageParameter parameter in stage.Parameters)
                    {
                        if (String.IsNullOrWhiteSpace(parameter.Name) || !parameterNames.Add(parameter.Name)) errors[field + ".parameters"] = "Parameter names are required and unique.";
                    }
                    if (String.IsNullOrEmpty(stage.DeploymentId))
                    {
                        errors[field + ".parameters"] = "Stage run parameters need a deploymentId, because they are checked against that deployment's allowed run overrides.";
                    }
                    else if (deployment != null && !errors.ContainsKey(field + ".parameters"))
                    {
                        try
                        {
                            RunOverrideValidator.Validate(deployment, stage.Parameters.Select(p => new RunParameter { Name = p.Name, Value = p.Value }).ToList());
                        }
                        catch (ValidationException e)
                        {
                            foreach (KeyValuePair<string, string> error in e.Fields) errors[field + "." + error.Key] = error.Value;
                            foreach (KeyValuePair<string, string> code in e.Codes) codes[field + "." + code.Key] = code.Value;
                        }
                    }
                }
            }

            if (errors.Count > 0) throw new ValidationException("The pipeline is invalid: " + String.Join(" ", errors.Select(e => e.Key + ": " + e.Value)), errors, codes);
        }

        /// <summary>
        /// Validate a trigger (P12.5) and resolve its references: agentId, deploymentId, pipelineId, and inputTemplateId
        /// may be given as identifiers or names and are replaced with identifiers.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="trigger">Trigger; references are normalized in place.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        /// <exception cref="ValidationException">Thrown when the trigger is invalid, with field codes ReferenceNotFound,
        /// DeploymentAgentMismatch, TemplateKindMismatch, InvalidCron, InvalidTimeZone, and TargetMismatch.</exception>
        public static async Task TriggerAsync(DatabaseDriverBase database, string tenantId, Trigger trigger, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (trigger == null) throw new ValidationException("A trigger is required.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            if (!_AgentName.IsMatch(trigger.Name ?? String.Empty)) errors["name"] = "Trigger names are 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.";
            if (trigger.Description != null && trigger.Description.Length > 4000) errors["description"] = "Descriptions are limited to 4000 characters.";
            if (!Enum.IsDefined(trigger.Type)) errors["type"] = "type is Cron or Webhook.";
            if (!Enum.IsDefined(trigger.TargetType)) errors["targetType"] = "targetType is Agent or Pipeline.";

            if (trigger.TargetType == TriggerTargetTypeEnum.Agent)
            {
                if (!String.IsNullOrEmpty(trigger.PipelineId))
                {
                    errors["pipelineId"] = "A trigger that runs an agent has no pipelineId.";
                    codes["pipelineId"] = "TargetMismatch";
                }
                Agent? agent = null;
                if (String.IsNullOrWhiteSpace(trigger.AgentId))
                {
                    errors["agentId"] = "An agentId is required when targetType is Agent.";
                }
                else
                {
                    agent = await database.Agents.ReadAsync(tenantId, trigger.AgentId.Trim(), token).ConfigureAwait(false)
                        ?? await database.Agents.ReadByNameAsync(tenantId, trigger.AgentId.Trim(), token).ConfigureAwait(false);
                    if (agent == null)
                    {
                        errors["agentId"] = "The agent does not exist in this tenant.";
                        codes["agentId"] = "ReferenceNotFound";
                    }
                    else
                    {
                        trigger.AgentId = agent.Id;
                    }
                }
                if (!String.IsNullOrWhiteSpace(trigger.DeploymentId))
                {
                    Deployment? deployment = await database.Deployments.ReadAsync(tenantId, trigger.DeploymentId.Trim(), token).ConfigureAwait(false)
                        ?? await database.Deployments.ReadByNameAsync(tenantId, trigger.DeploymentId.Trim(), token).ConfigureAwait(false);
                    if (deployment == null)
                    {
                        errors["deploymentId"] = "The deployment does not exist in this tenant.";
                        codes["deploymentId"] = "ReferenceNotFound";
                    }
                    else if (agent != null && deployment.AgentId != agent.Id)
                    {
                        errors["deploymentId"] = "Deployment " + deployment.Name + " belongs to another agent, not " + agent.Name + ".";
                        codes["deploymentId"] = "DeploymentAgentMismatch";
                    }
                    else
                    {
                        trigger.DeploymentId = deployment.Id;
                    }
                }
                else
                {
                    trigger.DeploymentId = null;
                }
            }
            else if (trigger.TargetType == TriggerTargetTypeEnum.Pipeline)
            {
                if (!String.IsNullOrEmpty(trigger.AgentId) || !String.IsNullOrEmpty(trigger.DeploymentId))
                {
                    errors["agentId"] = "A trigger that starts a pipeline has no agentId or deploymentId.";
                    codes["agentId"] = "TargetMismatch";
                }
                if (String.IsNullOrWhiteSpace(trigger.PipelineId))
                {
                    errors["pipelineId"] = "A pipelineId is required when targetType is Pipeline.";
                }
                else
                {
                    Pipeline? pipeline = await database.Pipelines.ReadAsync(tenantId, trigger.PipelineId.Trim(), token).ConfigureAwait(false)
                        ?? await database.Pipelines.ReadByNameAsync(tenantId, trigger.PipelineId.Trim(), token).ConfigureAwait(false);
                    if (pipeline == null)
                    {
                        errors["pipelineId"] = "The pipeline does not exist in this tenant.";
                        codes["pipelineId"] = "ReferenceNotFound";
                    }
                    else
                    {
                        trigger.PipelineId = pipeline.Id;
                    }
                }
            }

            if (!String.IsNullOrWhiteSpace(trigger.InputTemplateId))
            {
                PromptTemplate? template = await database.PromptTemplates.ReadAsync(tenantId, trigger.InputTemplateId.Trim(), token).ConfigureAwait(false)
                    ?? await database.PromptTemplates.ReadByNameAsync(tenantId, trigger.InputTemplateId.Trim(), token).ConfigureAwait(false);
                if (template == null)
                {
                    errors["inputTemplateId"] = "The prompt template does not exist or is not visible to this tenant.";
                    codes["inputTemplateId"] = "ReferenceNotFound";
                }
                else if (template.Kind != PromptTemplateKindEnum.Task)
                {
                    errors["inputTemplateId"] = "Prompt template " + template.Name + " is a " + template.Kind + " template; a trigger input template must be a Task template.";
                    codes["inputTemplateId"] = "TemplateKindMismatch";
                }
                else
                {
                    trigger.InputTemplateId = template.Id;
                }
            }
            else
            {
                trigger.InputTemplateId = null;
            }

            if (trigger.Type == TriggerTypeEnum.Cron)
            {
                if (!CronSchedule.Validate(trigger.CronExpression, trigger.TimeZone, out string? cronError, out string? zoneError))
                {
                    if (cronError != null)
                    {
                        errors["cronExpression"] = cronError;
                        codes["cronExpression"] = "InvalidCron";
                    }
                    if (zoneError != null)
                    {
                        errors["timeZone"] = zoneError;
                        codes["timeZone"] = "InvalidTimeZone";
                    }
                }
                else
                {
                    trigger.CronExpression = trigger.CronExpression!.Trim();
                }
            }
            else if (!String.IsNullOrWhiteSpace(trigger.CronExpression))
            {
                errors["cronExpression"] = "Only Cron triggers have a cron expression.";
            }

            if (errors.Count > 0) throw new ValidationException("The trigger is invalid: " + String.Join(" ", errors.Select(e => e.Key + ": " + e.Value)), errors, codes);
        }

        /// <summary>
        /// Validate a notification endpoint (P12.14): name, URL against the SSRF rules (without resolving the host; the
        /// resolved address is checked again on every delivery), events, and filters. agentId and deploymentId may be
        /// identifiers or names and are replaced with identifiers; duplicate events are removed.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="endpoint">Endpoint; references and events are normalized in place.</param>
        /// <param name="allowPrivateDestinations">Whether loopback and private destinations are allowed (cluster setting
        /// Notifications.AllowPrivateDestinations).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        /// <exception cref="ValidationException">Thrown when the endpoint is invalid, with field codes InvalidUrl,
        /// DestinationBlocked, EventsRequired, InvalidEvent, ReferenceNotFound, and DeploymentAgentMismatch.</exception>
        public static async Task NotificationEndpointAsync(DatabaseDriverBase database, string tenantId, NotificationEndpoint endpoint, bool allowPrivateDestinations, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (endpoint == null) throw new ValidationException("A notification endpoint is required.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            if (!_AgentName.IsMatch(endpoint.Name ?? String.Empty)) errors["name"] = "Notification endpoint names are 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.";
            if (endpoint.Description != null && endpoint.Description.Length > 4000) errors["description"] = "Descriptions are limited to 4000 characters.";

            endpoint.Url = (endpoint.Url ?? String.Empty).Trim();
            DestinationBlockReasonEnum reason = DestinationGuard.CheckUrl(endpoint.Url, allowPrivateDestinations, out Uri? _);
            if (reason == DestinationBlockReasonEnum.InvalidUrl || reason == DestinationBlockReasonEnum.Scheme)
            {
                errors["url"] = reason == DestinationBlockReasonEnum.Scheme
                    ? "Notification URLs use http or https."
                    : "The URL must be an absolute http or https URL with a host, without user information, at most 2048 characters.";
                codes["url"] = "InvalidUrl";
            }
            else if (reason != DestinationBlockReasonEnum.None)
            {
                errors["url"] = "The destination is refused (" + reason + "). Loopback and private destinations need the cluster setting Notifications.AllowPrivateDestinations; link-local, multicast, and reserved addresses are always refused.";
                codes["url"] = "DestinationBlocked";
            }

            if (endpoint.Events.Count == 0)
            {
                errors["events"] = "Subscribe to at least one event.";
                codes["events"] = "EventsRequired";
            }
            else if (endpoint.Events.Any(e => e == NotificationEventEnum.Test || !Enum.IsDefined(e)))
            {
                errors["events"] = "Events are RunSucceeded, RunFailed, RunCancelled, RunTimedOut, PipelineCompleted, PipelineFailed, and ApprovalRequested.";
                codes["events"] = "InvalidEvent";
            }
            else
            {
                endpoint.Events = endpoint.Events.Distinct().ToList();
            }

            Agent? agent = null;
            if (!String.IsNullOrWhiteSpace(endpoint.AgentId))
            {
                agent = await database.Agents.ReadAsync(tenantId, endpoint.AgentId.Trim(), token).ConfigureAwait(false)
                    ?? await database.Agents.ReadByNameAsync(tenantId, endpoint.AgentId.Trim(), token).ConfigureAwait(false);
                if (agent == null)
                {
                    errors["agentId"] = "The agent does not exist in this tenant.";
                    codes["agentId"] = "ReferenceNotFound";
                }
                else
                {
                    endpoint.AgentId = agent.Id;
                }
            }
            else
            {
                endpoint.AgentId = null;
            }
            if (!String.IsNullOrWhiteSpace(endpoint.DeploymentId))
            {
                Deployment? deployment = await database.Deployments.ReadAsync(tenantId, endpoint.DeploymentId.Trim(), token).ConfigureAwait(false)
                    ?? await database.Deployments.ReadByNameAsync(tenantId, endpoint.DeploymentId.Trim(), token).ConfigureAwait(false);
                if (deployment == null)
                {
                    errors["deploymentId"] = "The deployment does not exist in this tenant.";
                    codes["deploymentId"] = "ReferenceNotFound";
                }
                else if (agent != null && deployment.AgentId != agent.Id)
                {
                    errors["deploymentId"] = "Deployment " + deployment.Name + " belongs to another agent, not " + agent.Name + ".";
                    codes["deploymentId"] = "DeploymentAgentMismatch";
                }
                else
                {
                    endpoint.DeploymentId = deployment.Id;
                }
            }
            else
            {
                endpoint.DeploymentId = null;
            }

            if (errors.Count > 0) throw new ValidationException("The notification endpoint is invalid: " + String.Join(" ", errors.Select(e => e.Key + ": " + e.Value)), errors, codes);
        }

        /// <summary>
        /// Check a deployment's environment label against the tenant's environment list (AD1.3, code UnknownEnvironment)
        /// and its revision pin against the agent's published revisions (code UnknownRevision).
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment.</param>
        /// <param name="errors">Field errors to add to.</param>
        /// <param name="codes">Field codes to add to.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static async Task EnvironmentAndRevisionAsync(DatabaseDriverBase database, string tenantId, Deployment deployment, Dictionary<string, string> errors, Dictionary<string, string> codes, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            if (errors == null) throw new ArgumentNullException(nameof(errors));
            if (codes == null) throw new ArgumentNullException(nameof(codes));
            List<TenantEnvironment> environments = await EnvironmentDefaults.ListAsync(database, tenantId, token).ConfigureAwait(false);
            if (!environments.Any(e => e.Name == deployment.Environment))
            {
                errors["environment"] = "Environment " + deployment.Environment + " is not one of this tenant's environments (" + String.Join(", ", environments.Select(e => e.Name)) + ").";
                codes["environment"] = "UnknownEnvironment";
            }
            if (!String.IsNullOrEmpty(deployment.AgentRevisionId))
            {
                AgentRevision? revision = await database.AgentRevisions.ReadAsync(tenantId, deployment.AgentRevisionId, token).ConfigureAwait(false);
                if (revision == null || revision.AgentId != deployment.AgentId || revision.State != AgentRevisionStateEnum.Published)
                {
                    errors["agentRevisionId"] = "Pin a published revision of the deployment's agent.";
                    codes["agentRevisionId"] = "UnknownRevision";
                }
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
            await DeploymentAsync(database, tenantId, deployment, null, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Validate a deployment and its references, reading the referenced agent, harness profile, prompt templates,
        /// MCP servers, secrets, and tenant through a reference cache shared by a batch of work such as one manifest
        /// apply (I-06). The result is the same as without the cache.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment.</param>
        /// <param name="cache">Reference cache for the same tenant, or null to read every reference from the database.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ValidationException">Thrown when invalid.</exception>
        public static async Task DeploymentAsync(DatabaseDriverBase database, string tenantId, Deployment deployment, ConfigurationReferenceCache? cache, CancellationToken token = default)
        {
            if (deployment == null) throw new ValidationException("A deployment is required.");
            if (cache != null && !String.Equals(cache.TenantId, tenantId, StringComparison.Ordinal)) cache = null;
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            try { ExecutorCapabilityRules.Validate(deployment.RequiredCapabilities); }
            catch (ArgumentException ex) { errors["requiredCapabilities"] = ex.Message; }
            await TrustLevelAsync(database, tenantId, deployment, errors, codes, cache, token).ConfigureAwait(false);
            EffectPolicy(deployment, errors, codes);
            EgressRules(deployment.EgressRules, errors, codes);
            if (deployment.EgressRules.Count > 0 && deployment.Executor == RunExecutorEnum.Process && !codes.ContainsKey("executor"))
            {
                // P11.15 (D-052): an allowlist is only enforced by KubernetesJob run pods with a NetworkPolicy.
                errors["executor"] = "Egress rules are enforced only for KubernetesJob runs, by a NetworkPolicy on the run pod. The Process executor shares the worker's network; set executor to KubernetesJob or leave it unset.";
                codes["executor"] = "EgressRulesNeedKubernetesJob";
            }
            if (deployment.EgressRules.Count > 0 && deployment.RequiredCapabilities.ColdStartClass == ExecutorColdStartEnum.Warm)
            {
                // Warm pods start before the run is known, under the default run egress; allowlisted runs start cold.
                errors["requiredCapabilities.coldStartClass"] = "Egress rules need a cold-started run pod, which is created with its NetworkPolicy; warm pods already run under the default run egress. Clear coldStartClass or set it to Cold.";
                codes["requiredCapabilities.coldStartClass"] = "EgressRulesNeedColdStart";
            }

            Name(deployment.Name, errors);

            Agent? agent = String.IsNullOrEmpty(deployment.AgentId) ? null
                : cache != null ? await cache.AgentAsync(deployment.AgentId, token).ConfigureAwait(false)
                : await database.Agents.ReadAsync(tenantId, deployment.AgentId, token).ConfigureAwait(false);
            if (agent == null) errors["agentId"] = "The agent does not exist in this tenant.";
            await EnvironmentAndRevisionAsync(database, tenantId, deployment, errors, codes, token).ConfigureAwait(false);
            if (!Garrison.Core.Helpers.RelativePaths.IsValid(deployment.FileSpaceMountPath, 128))
            {
                errors["fileSpaceMountPath"] = "Use a workspace-relative directory with forward slashes, without \".\" or \"..\" segments, at most 128 characters.";
                codes["fileSpaceMountPath"] = "InvalidFilePath";
            }
            HarnessProfile? profile = String.IsNullOrEmpty(deployment.HarnessProfileId) ? null
                : cache != null ? await cache.HarnessProfileAsync(deployment.HarnessProfileId, token).ConfigureAwait(false)
                : await database.HarnessProfiles.ReadAsync(tenantId, deployment.HarnessProfileId, token).ConfigureAwait(false);
            if (profile == null) errors["harnessProfileId"] = "The harness profile does not exist or is not visible to this tenant.";
            if (profile != null && deployment.RequiredCapabilities.SessionContinuation && !profile.SupportsResume)
                errors["requiredCapabilities.sessionContinuation"] = "Session continuation requires a harness profile with supportsResume enabled.";


            HashSet<string> roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < deployment.PromptBindings.Count; i++)
            {
                DeploymentPromptBinding binding = deployment.PromptBindings[i];
                if (String.IsNullOrWhiteSpace(binding.Role)) errors["promptBindings[" + i + "].role"] = "A role is required.";
                else if (!roles.Add(binding.Role)) errors["promptBindings[" + i + "].role"] = "Role " + binding.Role + " is bound twice.";
                PromptTemplate? template = String.IsNullOrEmpty(binding.TemplateId) ? null
                    : cache != null ? await cache.PromptTemplateAsync(binding.TemplateId, token).ConfigureAwait(false)
                    : await database.PromptTemplates.ReadAsync(tenantId, binding.TemplateId, token).ConfigureAwait(false);
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
                bool exists = cache != null
                    ? await cache.ReadAsync(binding.Kind == ResourceBindingKindEnum.McpServer ? "McpServer" : "Secret", binding.ResourceId, token).ConfigureAwait(false) != null
                    : binding.Kind == ResourceBindingKindEnum.McpServer
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

            if (deployment.SuspensionEnabled)
            {
                if ((deployment.Executor.HasValue && deployment.Executor != RunExecutorEnum.Process) || profile == null || !profile.SupportsResume || !profile.IsolateHome || String.IsNullOrEmpty(profile.SessionFormat))
                    errors["suspensionEnabled"] = "Suspension requires Process execution, isolated HOME, resume support, and a pinned session format.";
                if (String.IsNullOrEmpty(deployment.ArtifactStoreId)) errors["artifactStoreId"] = "Suspension requires an artifact store.";
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

            if (errors.Count > 0) throw new ValidationException("The deployment is invalid.", errors, codes);
        }

        #endregion

        #region Private-Methods

        private static async Task TrustLevelAsync(DatabaseDriverBase database, string tenantId, Deployment deployment, Dictionary<string, string> errors, Dictionary<string, string> codes, ConfigurationReferenceCache? cache, CancellationToken token)
        {
            // P11.14: an Untrusted deployment never runs on Process, and a tenant may require Untrusted for every
            // deployment. Both are rejected with field codes rather than coerced.
            if (!Enum.IsDefined(deployment.TrustLevel))
            {
                errors["trustLevel"] = "Unknown trust level; use Trusted or Untrusted.";
                return;
            }
            if (deployment.TrustLevel == DeploymentTrustLevelEnum.Untrusted && deployment.Executor == RunExecutorEnum.Process)
            {
                errors["executor"] = "An Untrusted deployment needs an executor with at least Container isolation. The Process executor shares the worker's filesystem, network, and user; set executor to KubernetesJob or leave it unset.";
                codes["executor"] = "UntrustedNeedsIsolation";
            }
            if (deployment.TrustLevel == DeploymentTrustLevelEnum.Trusted)
            {
                Tenant? tenant = cache != null ? await cache.TenantAsync(token).ConfigureAwait(false) : await database.Tenants.ReadAsync(tenantId, token).ConfigureAwait(false);
                if (tenant != null && tenant.RequireUntrustedDeployments)
                {
                    errors["trustLevel"] = "Tenant " + tenant.Name + " requires every deployment to be Untrusted; set trustLevel to Untrusted.";
                    codes["trustLevel"] = "TenantRequiresUntrusted";
                }
            }
        }

        private static void EffectPolicy(Deployment deployment, Dictionary<string, string> errors, Dictionary<string, string> codes)
        {
            // P12.29: retryOnNodeLoss is still accepted on input for one release. Alone it maps; together with an
            // effectPolicy it must agree, and a disagreement is rejected rather than resolved silently.
            if (!Enum.IsDefined(deployment.EffectPolicy))
            {
                errors["effectPolicy"] = "Unknown effect policy; use AtMostOnce, AtLeastOnce, or Journaled.";
                return;
            }
            if (deployment.EffectPolicyConflict)
            {
                errors["effectPolicy"] = "effectPolicy " + deployment.EffectPolicy + " disagrees with the deprecated retryOnNodeLoss value. Send only effectPolicy (retryOnNodeLoss true means AtLeastOnce, false means AtMostOnce).";
                codes["effectPolicy"] = "EffectPolicyConflict";
            }
        }

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

        private static void Schema(string? json, Dictionary<string, string> errors, Dictionary<string, string> codes, string field)
        {
            // P12.22: input and output schemas must be usable JSON Schema documents, not only JSON.
            if (String.IsNullOrWhiteSpace(json)) return;
            Json(json, errors, field);
            if (errors.ContainsKey(field))
            {
                codes[field] = InputSchemaValidator.InvalidSchemaCode;
                return;
            }
            string? problem = InputSchemaValidator.CheckSchema(json);
            if (problem == null) return;
            errors[field] = problem;
            codes[field] = InputSchemaValidator.InvalidSchemaCode;
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
