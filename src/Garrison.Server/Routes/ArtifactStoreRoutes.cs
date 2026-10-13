namespace Garrison.Server.Routes
{
    using System;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Artifact store routes.
    /// </summary>
    public class ArtifactStoreRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/artifact-stores";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public ArtifactStoreRoutes(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        public void Register(RouteRegistrar routes)
        {
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.ArtifactStore, OperationTypeEnum.Read, ListAsync, "List artifact stores", "Artifact Stores", null, typeof(EnumerationResult<ArtifactStore>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.ArtifactStore, OperationTypeEnum.Create, CreateAsync, "Create an artifact store", "Artifact Stores", typeof(ArtifactStore), typeof(ArtifactStore));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.ArtifactStore, OperationTypeEnum.Read, ReadAsync, "Read an artifact store", "Artifact Stores", null, typeof(ArtifactStore));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.ArtifactStore, OperationTypeEnum.Update, UpdateAsync, "Update an artifact store", "Artifact Stores", typeof(ArtifactStore), typeof(ArtifactStore));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.ArtifactStore, OperationTypeEnum.Delete, DeleteAsync, "Delete an artifact store", "Artifact Stores");
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.ArtifactStores.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ArtifactStore store = RouteHelpers.RequiredBody<ArtifactStore>(http);
            store.Id = String.Empty;
            store.TenantId = tenantId;
            store.IsProtected = false;
            await ValidateAsync(tenantId, store, null, http).ConfigureAwait(false);
            ArtifactStore created = await _Server.Database.ArtifactStores.CreateAsync(store, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "ArtifactStore", created.Id, "Created artifact store " + created.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ArtifactStore existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Artifact store " + existing.Name);
            ArtifactStore store = RouteHelpers.RequiredBody<ArtifactStore>(http);
            store.Id = existing.Id;
            store.TenantId = tenantId;
            store.CreatedUtc = existing.CreatedUtc;
            await ValidateAsync(tenantId, store, existing.Id, http).ConfigureAwait(false);
            ArtifactStore updated = await _Server.Database.ArtifactStores.UpdateAsync(store, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "ArtifactStore", updated.Id, "Updated artifact store " + updated.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ArtifactStore existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Artifact store " + existing.Name);
            await ConfigurationSupport.EnsureUnreferencedAsync(_Server, tenantId, d => d.ArtifactStoreId == existing.Id, "Artifact store " + existing.Name, http.Token).ConfigureAwait(false);
            if ((await _Server.Database.Artifacts.EnumerateAsync(tenantId, new EnumerationQuery { MaxResults = 1 }, storeId: existing.Id, token: http.Token).ConfigureAwait(false)).TotalRecords > 0) throw new ConflictException("ResourceInUse", "Delete the store artifacts before deleting the store.");
            await _Server.Database.ArtifactStores.DeleteAsync(existing.Id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "ArtifactStore", existing.Id, "Deleted artifact store " + existing.Name + ".").ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task ValidateAsync(string tenantId, ArtifactStore store, string? currentId, HttpContextBase http)
        {
            System.Collections.Generic.Dictionary<string, string> errors = new System.Collections.Generic.Dictionary<string, string>();
            ConfigurationValidator.Name(store.Name, errors);
            if (!Enum.IsDefined(store.Kind)) errors["kind"] = "Unknown artifact store kind.";
            if (!String.IsNullOrEmpty(store.PathPrefix) && !Garrison.Server.Storage.ArtifactStorage.ValidLocation(store.PathPrefix)) errors["pathPrefix"] = "Use a relative path prefix with letters, digits, dots, underscores, dashes, and slashes; no parent paths.";
            if (store.Kind == ArtifactStoreKindEnum.S3)
            {
                if (String.IsNullOrWhiteSpace(store.Bucket) || store.Bucket.Length > 255) errors["bucket"] = "An S3 bucket name is required.";
                if (!String.IsNullOrEmpty(store.Endpoint) && (!Uri.TryCreate(store.Endpoint, UriKind.Absolute, out Uri? endpoint) || (endpoint.Scheme != "http" && endpoint.Scheme != "https") || endpoint.UserInfo.Length > 0 || endpoint.Query.Length > 0 || endpoint.Fragment.Length > 0)) errors["endpoint"] = "Use an http or https S3 endpoint without embedded credentials or query parameters.";
                if (store.Region.Length > 128) errors["region"] = "The S3 region is too long.";
                if (!String.IsNullOrEmpty(store.SecretId) && await _Server.Database.Secrets.ReadAsync(tenantId, store.SecretId, http.Token).ConfigureAwait(false) == null) errors["secretId"] = "The S3 credential secret does not exist in this tenant.";
            }
            if (!String.IsNullOrEmpty(currentId))
            {
                ArtifactStore? previous = await _Server.Database.ArtifactStores.ReadAsync(tenantId, currentId, http.Token).ConfigureAwait(false);
                if (previous != null && (previous.Kind != store.Kind || previous.Bucket != store.Bucket || previous.Endpoint != store.Endpoint)
                    && (await _Server.Database.Artifacts.EnumerateAsync(tenantId, new EnumerationQuery { MaxResults = 1 }, storeId: currentId, token: http.Token).ConfigureAwait(false)).TotalRecords > 0)
                    errors["kind"] = "A store with artifacts cannot change its kind, bucket, or endpoint; create another store for a new location.";
            }
            if (errors.Count > 0) throw new ValidationException("The artifact store is invalid.", errors);
            ArtifactStore? named = await _Server.Database.ArtifactStores.ReadByNameAsync(tenantId, store.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, currentId, store.Name);
        }

        private async Task<ArtifactStore> LoadAsync(HttpContextBase http)
        {
            ArtifactStore? store = await _Server.Database.ArtifactStores.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            return store ?? throw new NotFoundException("Artifact store not found.");
        }

        #endregion
    }
}
