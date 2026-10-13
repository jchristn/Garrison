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
    /// Usage quota routes.
    /// </summary>
    public class UsageQuotaRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/usage-quotas";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public UsageQuotaRoutes(ServerContext server)
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
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.UsageQuota, OperationTypeEnum.Read, ListAsync, "List usage quotas", "Usage Quotas", null, typeof(EnumerationResult<UsageQuota>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.UsageQuota, OperationTypeEnum.Create, CreateAsync, "Create a usage quota", "Usage Quotas", typeof(UsageQuota), typeof(UsageQuota));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.UsageQuota, OperationTypeEnum.Read, ReadAsync, "Read a usage quota", "Usage Quotas", null, typeof(UsageQuota));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.UsageQuota, OperationTypeEnum.Update, UpdateAsync, "Update a usage quota", "Usage Quotas", typeof(UsageQuota), typeof(UsageQuota));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/usage", ResourceTypeEnum.UsageQuota, OperationTypeEnum.Read, UsageAsync, "Read daily quota usage", "Usage Quotas", null, typeof(UsageQuotaUsage));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.UsageQuota, OperationTypeEnum.Delete, DeleteAsync, "Delete a usage quota", "Usage Quotas");
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.UsageQuotas.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            UsageQuota store = RouteHelpers.RequiredBody<UsageQuota>(http);
            store.Id = String.Empty;
            store.TenantId = tenantId;
            store.IsProtected = false;
            await ValidateAsync(tenantId, store, null, http).ConfigureAwait(false);
            UsageQuota created;
            try
            {
                created = await _Server.Database.UsageQuotas.CreateAsync(store, http.Token).ConfigureAwait(false);
            }
            catch (Exception e) when (Garrison.Core.Database.DatabaseFailures.IsUniqueViolation(e))
            {
                throw new ConflictException("UsageQuotaExists", "A usage quota with this name or scope/resource pair already exists.");
            }
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "UsageQuota", created.Id, "Created usage quota " + created.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            UsageQuota existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Usage quota " + existing.Name);
            UsageQuota store = RouteHelpers.RequiredBody<UsageQuota>(http);
            store.Id = existing.Id;
            store.TenantId = tenantId;
            store.CreatedUtc = existing.CreatedUtc;
            await ValidateAsync(tenantId, store, existing.Id, http).ConfigureAwait(false);
            UsageQuota updated;
            try
            {
                updated = await _Server.Database.UsageQuotas.UpdateAsync(store, http.Token).ConfigureAwait(false);
            }
            catch (Exception e) when (Garrison.Core.Database.DatabaseFailures.IsUniqueViolation(e))
            {
                throw new ConflictException("UsageQuotaExists", "A usage quota with this name or scope/resource pair already exists.");
            }
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "UsageQuota", updated.Id, "Updated usage quota " + updated.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            UsageQuota existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Usage quota " + existing.Name);
            await _Server.Database.UsageQuotas.DeleteAsync(existing.Id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "UsageQuota", existing.Id, "Deleted usage quota " + existing.Name + ".").ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task ValidateAsync(string tenantId, UsageQuota store, string? currentId, HttpContextBase http)
        {
            System.Collections.Generic.Dictionary<string, string> errors = new System.Collections.Generic.Dictionary<string, string>();
            ConfigurationValidator.Name(store.Name, errors);
            if (!Enum.IsDefined(store.Scope)) errors["scope"] = "Use Tenant, Agent, or Deployment.";
            if (store.Scope == UsageQuotaScopeEnum.Tenant && String.IsNullOrEmpty(store.ResourceId)) store.ResourceId = tenantId;
            if (String.IsNullOrEmpty(store.ResourceId)) errors["resourceId"] = "A target resource ID is required.";
            if (errors.Count > 0) throw new ValidationException("The usage quota is invalid.", errors);
            UsageQuota? named = await _Server.Database.UsageQuotas.ReadByNameAsync(tenantId, store.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, currentId, store.Name);
            bool targetExists = store.Scope switch
            {
                UsageQuotaScopeEnum.Tenant => store.ResourceId == tenantId,
                UsageQuotaScopeEnum.Agent => await _Server.Database.Agents.ReadAsync(tenantId, store.ResourceId, http.Token).ConfigureAwait(false) != null,
                UsageQuotaScopeEnum.Deployment => await _Server.Database.Deployments.ReadAsync(tenantId, store.ResourceId, http.Token).ConfigureAwait(false) != null,
                _ => false
            };
            if (!targetExists) throw new NotFoundException("Quota target not found in this tenant.");
            UsageQuota? duplicate = await _Server.Database.UsageQuotas.ReadByResourceAsync(tenantId, store.Scope, store.ResourceId, http.Token).ConfigureAwait(false);
            if (duplicate != null && duplicate.Id != currentId) throw new ConflictException("UsageQuotaExists", "A quota for this scope and resource already exists; update that entry.");
        }

        private async Task UsageAsync(HttpContextBase http)
        {
            UsageQuota quota = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.UsageQuotas.ReadUsageAsync(quota, DateTime.UtcNow, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task<UsageQuota> LoadAsync(HttpContextBase http)
        {
            UsageQuota? store = await _Server.Database.UsageQuotas.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            return store ?? throw new NotFoundException("Usage quota not found.");
        }

        #endregion
    }
}
