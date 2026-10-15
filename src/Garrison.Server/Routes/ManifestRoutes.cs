namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Manifest routes: apply (with dry run), export, and the apply history.
    /// </summary>
    public class ManifestRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly ManifestService _Manifests;
        private RouteRegistrar? _Routes = null;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/manifests";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="manifests">Manifest service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public ManifestRoutes(ServerContext server, ManifestService manifests)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Manifests = manifests ?? throw new ArgumentNullException(nameof(manifests));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        public void Register(RouteRegistrar routes)
        {
            _Routes = routes ?? throw new ArgumentNullException(nameof(routes));
            routes.Scoped(HttpMethod.POST, _Base + "/apply", ResourceTypeEnum.Manifest, OperationTypeEnum.Create, ApplyAsync, "Apply YAML or JSON manifests (query: dryRun, allowSecretValues)", "Manifests", typeof(string), typeof(ManifestApply));
            routes.Scoped(HttpMethod.GET, _Base + "/export", ResourceTypeEnum.Manifest, OperationTypeEnum.Read, ExportAsync, "Export a manifest bundle as YAML (query: kinds, resources, followReferences, includeBuiltIn); secrets are listed as requirements, never exported", "Manifests");
            routes.Scoped(HttpMethod.GET, _Base + "/applies", ResourceTypeEnum.Manifest, OperationTypeEnum.Read, AppliesAsync, "List manifest applies", "Manifests", null, typeof(EnumerationResult<ManifestApply>));
            routes.Scoped(HttpMethod.GET, _Base + "/applies/{id}", ResourceTypeEnum.Manifest, OperationTypeEnum.Read, ApplyDetailAsync, "Read a manifest apply with per-document results", "Manifests", null, typeof(ManifestApply));
        }

        /// <summary>
        /// Build export options from comma-separated kinds and Kind/name resource selectors.
        /// </summary>
        /// <param name="kinds">Comma-separated kinds, or null.</param>
        /// <param name="resources">Comma-separated Kind/name selectors, or null.</param>
        /// <returns>Options.</returns>
        /// <exception cref="ValidationException">Thrown with the field code InvalidSelector when a resource selector is malformed.</exception>
        public static ManifestExportOptions Options(string? kinds, string? resources)
        {
            ManifestExportOptions options = new ManifestExportOptions();
            foreach (string kind in Split(kinds)) options.Kinds.Add(kind);
            foreach (string selector in Split(resources)) options.Resources.Add(Selector(selector));
            return options;
        }

        /// <summary>
        /// Parse one Kind/name selector.
        /// </summary>
        /// <param name="selector">Selector text.</param>
        /// <returns>Reference.</returns>
        /// <exception cref="ValidationException">Thrown with the field code InvalidSelector when the selector is malformed.</exception>
        public static ManifestResourceReference Selector(string? selector)
        {
            ManifestResourceReference? reference = ManifestResourceReference.TryParse(selector);
            if (reference != null) return reference;
            string message = "'" + selector + "' is not a Kind/name selector (for example Agent/triage).";
            throw new ValidationException(message, new Dictionary<string, string> { { "resources", message } }, new Dictionary<string, string> { { "resources", "InvalidSelector" } });
        }

        /// <summary>
        /// Download file name of a tenant's bundle.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <returns>File name such as garrison-bundle-default.yaml.</returns>
        public static string FileName(string tenantId)
        {
            StringBuilder safe = new StringBuilder();
            foreach (char c in tenantId ?? String.Empty) safe.Append(Char.IsLetterOrDigit(c) || c == '_' || c == '-' ? c : '_');
            return "garrison-bundle-" + safe + ".yaml";
        }

        #endregion

        #region Private-Methods

        private async Task ApplyAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ManifestApplyOptions options = new ManifestApplyOptions();
            options.DryRun = RouteHelpers.QueryBool(http, "dryRun") ?? false;
            options.AllowSecretValues = RouteHelpers.QueryBool(http, "allowSecretValues") ?? false;
            options.PrincipalName = RouteHelpers.Context(http).PrincipalName;
            options.PrincipalType = RouteHelpers.Context(http).PrincipalType;
            options.PrincipalId = RouteHelpers.Context(http).PrincipalType == PrincipalTypeEnum.Administrator ? null : RouteHelpers.Context(http).PrincipalId;
            options.SecretUse = _Server.Authorization.SecretUse(RouteHelpers.Context(http), tenantId);
            if (options.AllowSecretValues && !await _Routes!.RequireAsync(http, tenantId, ResourceTypeEnum.Secret, OperationTypeEnum.Create, null).ConfigureAwait(false)) return;

            ManifestApply result = await _Manifests.ApplyAsync(tenantId, http.Request.DataAsString, options, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ManifestApplied, "Manifest", result.Id,
                (options.DryRun ? "Dry-run manifest apply: " : "Manifest apply: ") + result.CreatedCount + " created, " + result.UpdatedCount + " updated, " + result.UnchangedCount + " unchanged, " + result.FailedCount + " failed.").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, result.FailedCount > 0 ? 400 : 200, result).ConfigureAwait(false);
        }

        private async Task ExportAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ManifestExportOptions options = Options(RouteHelpers.Query(http, "kinds"), RouteHelpers.Query(http, "resources"));
            options.FollowReferences = RouteHelpers.QueryBool(http, "followReferences") ?? false;
            options.IncludeBuiltIn = RouteHelpers.QueryBool(http, "includeBuiltIn") ?? false;
            ManifestExportResult export = await _Manifests.ExportAsync(tenantId, options, http.Token).ConfigureAwait(false);
            http.Response.StatusCode = 200;
            http.Response.ContentType = "application/yaml; charset=utf-8";
            http.Response.Headers["Content-Disposition"] = "attachment; filename=\"" + FileName(tenantId) + "\"";
            http.Response.Headers["Cache-Control"] = "private, no-store";
            await http.Response.Send(export.Yaml, http.Token).ConfigureAwait(false);
        }

        private static List<string> Split(string? value)
        {
            if (String.IsNullOrWhiteSpace(value)) return new List<string>();
            return value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
        }

        private async Task AppliesAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.ManifestApplies.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ApplyDetailAsync(HttpContextBase http)
        {
            ManifestApply? apply = await _Server.Database.ManifestApplies.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            if (apply == null) throw new NotFoundException("Manifest apply not found.");
            await RouteHelpers.JsonAsync(http, 200, apply).ConfigureAwait(false);
        }

        #endregion
    }
}
