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
            foreach (string name in agent.DelegationAllowList)
            {
                if (!_AgentName.IsMatch(name ?? String.Empty)) errors["delegationAllowList"] = "'" + name + "' is not a valid agent name.";
            }
            if (errors.Count > 0) throw new ValidationException("The agent is invalid.", errors);
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
            for (int i = 0; i < workspace.Files.Count; i++)
            {
                string path = (workspace.Files[i].Path ?? String.Empty).Replace('\\', '/');
                if (path.Length == 0 || path.StartsWith("/", StringComparison.Ordinal) || path.Split('/').Any(s => s == "..")) errors["files[" + i + "].path"] = "Paths must be relative and must not contain '..'.";
            }
            if (errors.Count > 0) throw new ValidationException("The workspace template is invalid.", errors);
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
            Name(deployment.Name, errors);

            if (String.IsNullOrEmpty(deployment.AgentId) || await database.Agents.ReadAsync(tenantId, deployment.AgentId, token).ConfigureAwait(false) == null) errors["agentId"] = "The agent does not exist in this tenant.";
            HarnessProfile? profile = String.IsNullOrEmpty(deployment.HarnessProfileId) ? null : await database.HarnessProfiles.ReadAsync(tenantId, deployment.HarnessProfileId, token).ConfigureAwait(false);
            if (profile == null) errors["harnessProfileId"] = "The harness profile does not exist or is not visible to this tenant.";

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

            if (!String.IsNullOrEmpty(deployment.WorkspaceTemplateId) && await database.WorkspaceTemplates.ReadAsync(tenantId, deployment.WorkspaceTemplateId, token).ConfigureAwait(false) == null) errors["workspaceTemplateId"] = "The workspace template does not exist in this tenant.";
            if (!String.IsNullOrEmpty(deployment.ArtifactStoreId) && await database.ArtifactStores.ReadAsync(tenantId, deployment.ArtifactStoreId, token).ConfigureAwait(false) == null) errors["artifactStoreId"] = "The artifact store does not exist in this tenant.";
            if (!String.IsNullOrEmpty(deployment.NodePoolId) && await database.NodePools.ReadAsync(deployment.NodePoolId, token).ConfigureAwait(false) == null) errors["nodePoolId"] = "The node pool does not exist.";

            if (errors.Count > 0) throw new ValidationException("The deployment is invalid.", errors);
        }

        #endregion

        #region Private-Methods

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
