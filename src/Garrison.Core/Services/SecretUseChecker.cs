namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Enforces the permission to use a secret (Execute on Secret, SR-10), which is separate from configuring the resources
    /// that reference secrets. Using a secret means saving configuration that sends its value somewhere: a deployment that
    /// binds it, an MCP server or harness profile whose templates render the secrets of the deployments that use it, an
    /// artifact store, workspace template, or remote agent that names it, and an MCP server test that renders it. The caller
    /// supplies the authorization check, so the same rules apply to REST, MCP, and manifest applies. Thread-safe when the
    /// supplied check is.
    /// </summary>
    public class SecretUseChecker
    {
        #region Public-Members

        /// <summary>
        /// Field code reported when a secret may not be used.
        /// </summary>
        public static readonly string DeniedCode = "SecretUseDenied";

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly Func<string, CancellationToken, Task<bool>> _CanUse;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database, used to name secrets and find the deployments that use an MCP server or profile.</param>
        /// <param name="canUse">Returns whether the caller may use the secret with the given identifier.</param>
        /// <exception cref="ArgumentNullException">Thrown when database or canUse is null.</exception>
        public SecretUseChecker(DatabaseDriverBase database, Func<string, CancellationToken, Task<bool>> canUse)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _CanUse = canUse ?? throw new ArgumentNullException(nameof(canUse));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Require permission to use each of a set of secrets.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="secretIds">Secret identifiers; null and empty entries are ignored.</param>
        /// <param name="field">Field reported in the error.</param>
        /// <param name="subject">What uses the secrets, for the error message, for example "Deployment main".</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or secretIds is null.</exception>
        /// <exception cref="ValidationException">Thrown with field code SecretUseDenied when a secret may not be used.</exception>
        public async Task RequireAsync(string tenantId, IEnumerable<string?> secretIds, string field, string subject, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (secretIds == null) throw new ArgumentNullException(nameof(secretIds));
            foreach (string id in secretIds.Where(i => !String.IsNullOrEmpty(i)).Select(i => i!).Distinct(StringComparer.Ordinal))
            {
                token.ThrowIfCancellationRequested();
                if (await _CanUse(id, token).ConfigureAwait(false)) continue;
                Secret? secret = await _Database.Secrets.ReadAsync(tenantId, id, token).ConfigureAwait(false);
                string name = secret != null ? secret.Name : id;
                string message = subject + " uses secret " + name + ", and you do not have permission to use it (Execute on Secret, for example the SecretManager or SecretUser role).";
                throw new ValidationException(message, new Dictionary<string, string> { { field, message } }, new Dictionary<string, string> { { field, DeniedCode } });
            }
        }

        /// <summary>
        /// Require permission to use every secret a deployment binds. Any change to a deployment can change where its
        /// secrets go (its harness profile, MCP servers, overrides), so every bound secret is checked on every save.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment as it will be saved.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when deployment is null.</exception>
        /// <exception cref="ValidationException">Thrown with field code SecretUseDenied when a secret may not be used.</exception>
        public Task RequireForDeploymentAsync(string tenantId, Deployment deployment, CancellationToken token = default)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            return RequireAsync(tenantId, SecretBindings(deployment), "resourceBindings", "Deployment " + deployment.Name, token);
        }

        /// <summary>
        /// Require permission to use the secrets an MCP server's templates can render: when its command, arguments,
        /// environment, or headers reference secrets, every secret bound by a deployment that uses the server.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="server">MCP server as it will be saved.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        /// <exception cref="ValidationException">Thrown with field code SecretUseDenied when a secret may not be used.</exception>
        public async Task RequireForMcpServerAsync(string tenantId, McpServer server, CancellationToken token = default)
        {
            if (server == null) throw new ArgumentNullException(nameof(server));
            if (!ReferencesSecrets(McpServerTemplates(server))) return;
            if (String.IsNullOrEmpty(server.Id)) return;
            List<Deployment> users = (await _Database.Deployments.ListByTenantAsync(tenantId, token).ConfigureAwait(false))
                .Where(d => d.ResourceBindings.Any(b => b.Kind == ResourceBindingKindEnum.McpServer && b.ResourceId == server.Id))
                .ToList();
            await RequireAsync(tenantId, users.SelectMany(SecretBindings), "headers", "MCP server " + server.Name + " renders the secrets of deployment" + (users.Count == 1 ? " " : "s ") + String.Join(", ", users.Select(d => d.Name)) + ", so it", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Require permission to use the secrets a harness profile's environment and files can render: when they reference
        /// secrets, every secret bound by a deployment that uses the profile.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="profile">Harness profile as it will be saved.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when profile is null.</exception>
        /// <exception cref="ValidationException">Thrown with field code SecretUseDenied when a secret may not be used.</exception>
        public async Task RequireForHarnessProfileAsync(string tenantId, HarnessProfile profile, CancellationToken token = default)
        {
            if (profile == null) throw new ArgumentNullException(nameof(profile));
            List<string?> templates = profile.Environment.Select(e => (string?)e.ValueTemplate)
                .Concat(profile.Files.Select(f => (string?)f.ContentTemplate))
                .Concat(profile.Files.Select(f => (string?)f.PathTemplate))
                .ToList();
            if (!ReferencesSecrets(templates)) return;
            if (String.IsNullOrEmpty(profile.Id)) return;
            List<Deployment> users = (await _Database.Deployments.ListByTenantAsync(tenantId, token).ConfigureAwait(false))
                .Where(d => d.HarnessProfileId == profile.Id)
                .ToList();
            await RequireAsync(tenantId, users.SelectMany(SecretBindings), "environment", "Harness profile " + profile.Name + " renders the secrets of deployment" + (users.Count == 1 ? " " : "s ") + String.Join(", ", users.Select(d => d.Name)) + ", so it", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Require permission to use whatever secrets a configuration record references, by record type: deployments, MCP
        /// servers, harness profiles, artifact stores (secretId), workspace templates (gitCredentialSecretId), and agents
        /// (remoteCredentialSecretId). Other records reference no secrets.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="model">Record as it will be saved, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ValidationException">Thrown with field code SecretUseDenied when a secret may not be used.</exception>
        public Task RequireForModelAsync(string tenantId, object? model, CancellationToken token = default)
        {
            switch (model)
            {
                case Deployment deployment:
                    return RequireForDeploymentAsync(tenantId, deployment, token);
                case McpServer server:
                    return RequireForMcpServerAsync(tenantId, server, token);
                case HarnessProfile profile:
                    return RequireForHarnessProfileAsync(tenantId, profile, token);
                case ArtifactStore store:
                    return RequireAsync(tenantId, new List<string?> { store.SecretId }, "secretId", "Artifact store " + store.Name, token);
                case WorkspaceTemplate workspace:
                    return RequireAsync(tenantId, new List<string?> { workspace.GitCredentialSecretId }, "gitCredentialSecretId", "Workspace template " + workspace.Name, token);
                case Agent agent:
                    return RequireAsync(tenantId, new List<string?> { agent.RemoteCredentialSecretId }, "remoteCredentialSecretId", "Agent " + agent.Name, token);
                default:
                    return Task.CompletedTask;
            }
        }

        /// <summary>
        /// Whether any template references secrets. A template that does not parse counts as referencing them when its
        /// text mentions "secret", so an invalid template never skips the check.
        /// </summary>
        /// <param name="templates">Templates; null entries are ignored.</param>
        /// <returns>True when a template references secrets.</returns>
        public static bool ReferencesSecrets(IEnumerable<string?> templates)
        {
            if (templates == null) return false;
            foreach (string? template in templates)
            {
                if (String.IsNullOrEmpty(template)) continue;
                TemplateAnalysis analysis = TemplateAnalyzer.Analyze(template, null, true);
                if (analysis.SecretReferences.Count > 0) return true;
                if (!analysis.Valid && template.Contains("secret", StringComparison.OrdinalIgnoreCase)) return true;
            }
            return false;
        }

        /// <summary>
        /// Secret names referenced as secret.NAME by a set of templates, for rendering a template with only the secrets it
        /// uses. A reference to the whole secret map (for example {{#each secret}}) is returned as an empty string.
        /// </summary>
        /// <param name="templates">Templates; null entries are ignored.</param>
        /// <returns>Distinct names.</returns>
        public static List<string> ReferencedSecretNames(IEnumerable<string?> templates)
        {
            List<string> names = new List<string>();
            if (templates == null) return names;
            foreach (string? template in templates)
            {
                if (String.IsNullOrEmpty(template)) continue;
                foreach (string path in TemplateAnalyzer.Analyze(template, null, true).SecretReferences)
                {
                    string[] parts = path.Split('.');
                    string name = parts.Length > 1 ? parts[1] : String.Empty;
                    if (!names.Contains(name, StringComparer.Ordinal)) names.Add(name);
                }
            }
            return names;
        }

        /// <summary>
        /// Every template of an MCP server that may render secrets: URL, command, arguments, environment, and headers.
        /// </summary>
        /// <param name="server">MCP server.</param>
        /// <returns>Templates.</returns>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public static List<string?> McpServerTemplates(McpServer server)
        {
            if (server == null) throw new ArgumentNullException(nameof(server));
            List<string?> templates = new List<string?> { server.Url, server.Command };
            templates.AddRange(server.Arguments);
            templates.AddRange(server.Environment.Select(e => (string?)e.ValueTemplate));
            templates.AddRange(server.Headers.Select(h => (string?)h.ValueTemplate));
            return templates;
        }

        #endregion

        #region Private-Methods

        private static IEnumerable<string?> SecretBindings(Deployment deployment)
        {
            return deployment.ResourceBindings.Where(b => b.Kind == ResourceBindingKindEnum.Secret).Select(b => (string?)b.ResourceId);
        }

        #endregion
    }
}
