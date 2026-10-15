namespace Garrison.Server.Routes
{
    using System;
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
            routes.Scoped(HttpMethod.POST, _Base + "/export", ResourceTypeEnum.Manifest, OperationTypeEnum.Read, ExportAsync, "Export the tenant configuration as YAML manifests (secrets as metadata only)", "Manifests");
            routes.Scoped(HttpMethod.GET, _Base + "/applies", ResourceTypeEnum.Manifest, OperationTypeEnum.Read, AppliesAsync, "List manifest applies", "Manifests", null, typeof(EnumerationResult<ManifestApply>));
            routes.Scoped(HttpMethod.GET, _Base + "/applies/{id}", ResourceTypeEnum.Manifest, OperationTypeEnum.Read, ApplyDetailAsync, "Read a manifest apply with per-document results", "Manifests", null, typeof(ManifestApply));
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
            string yaml = await _Manifests.ExportAsync(RouteHelpers.Tenant(http), http.Token).ConfigureAwait(false);
            http.Response.StatusCode = 200;
            http.Response.ContentType = "application/yaml";
            await http.Response.Send(yaml).ConfigureAwait(false);
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
