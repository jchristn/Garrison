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
    /// Model price routes.
    /// </summary>
    public class ModelPriceRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/model-prices";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public ModelPriceRoutes(ServerContext server)
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
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.ModelPrice, OperationTypeEnum.Read, ListAsync, "List model prices", "Model Prices", null, typeof(EnumerationResult<ModelPrice>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.ModelPrice, OperationTypeEnum.Create, CreateAsync, "Create a model price", "Model Prices", typeof(ModelPrice), typeof(ModelPrice));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.ModelPrice, OperationTypeEnum.Read, ReadAsync, "Read a model price", "Model Prices", null, typeof(ModelPrice));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.ModelPrice, OperationTypeEnum.Update, UpdateAsync, "Update a model price", "Model Prices", typeof(ModelPrice), typeof(ModelPrice));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.ModelPrice, OperationTypeEnum.Delete, DeleteAsync, "Delete a model price", "Model Prices");
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.ModelPrices.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ModelPrice store = RouteHelpers.RequiredBody<ModelPrice>(http);
            store.Id = String.Empty;
            store.TenantId = tenantId;
            store.IsProtected = false;
            await ValidateAsync(tenantId, store, null, http).ConfigureAwait(false);
            ModelPrice created;
            try
            {
                created = await _Server.Database.ModelPrices.CreateAsync(store, http.Token).ConfigureAwait(false);
            }
            catch (Exception e) when (Garrison.Core.Database.DatabaseFailures.IsUniqueViolation(e))
            {
                throw new ConflictException("ModelPriceExists", "A model price with this name or harness/model pair already exists.");
            }
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "ModelPrice", created.Id, "Created model price " + created.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ModelPrice existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Model price " + existing.Name);
            ModelPrice store = RouteHelpers.RequiredBody<ModelPrice>(http);
            store.Id = existing.Id;
            store.TenantId = tenantId;
            store.CreatedUtc = existing.CreatedUtc;
            await ValidateAsync(tenantId, store, existing.Id, http).ConfigureAwait(false);
            ModelPrice updated;
            try
            {
                updated = await _Server.Database.ModelPrices.UpdateAsync(store, http.Token).ConfigureAwait(false);
            }
            catch (Exception e) when (Garrison.Core.Database.DatabaseFailures.IsUniqueViolation(e))
            {
                throw new ConflictException("ModelPriceExists", "A model price with this name or harness/model pair already exists.");
            }
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "ModelPrice", updated.Id, "Updated model price " + updated.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ModelPrice existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Model price " + existing.Name);
            await _Server.Database.ModelPrices.DeleteAsync(existing.Id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "ModelPrice", existing.Id, "Deleted model price " + existing.Name + ".").ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task ValidateAsync(string tenantId, ModelPrice store, string? currentId, HttpContextBase http)
        {
            System.Collections.Generic.Dictionary<string, string> errors = new System.Collections.Generic.Dictionary<string, string>();
            ConfigurationValidator.Name(store.Name, errors);
            store.Model = store.Model.Trim();
            if (String.IsNullOrWhiteSpace(store.Model) || store.Model.Length > 256 || System.Linq.Enumerable.Any(store.Model, Char.IsControl)) errors["model"] = "Use an exact served model of 1 to 256 characters with no control characters.";
            if (!Enum.IsDefined(store.HarnessType)) errors["harnessType"] = "Use a supported harness type.";
            if (errors.Count > 0) throw new ValidationException("The model price is invalid.", errors);
            ModelPrice? named = await _Server.Database.ModelPrices.ReadByNameAsync(tenantId, store.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, currentId, store.Name);
            ModelPrice? duplicate = await _Server.Database.ModelPrices.ReadByModelAsync(tenantId, store.HarnessType, store.Model, http.Token).ConfigureAwait(false);
            if (duplicate != null && duplicate.Id != currentId) throw new ConflictException("ModelPriceExists", "A price for " + store.HarnessType + " model " + store.Model + " already exists; update that entry.");
        }

        private async Task<ModelPrice> LoadAsync(HttpContextBase http)
        {
            ModelPrice? store = await _Server.Database.ModelPrices.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            return store ?? throw new NotFoundException("Model price not found.");
        }

        #endregion
    }
}
