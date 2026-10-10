namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Harness profile routes.
    /// </summary>
    public class HarnessProfileRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/harness-profiles";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public HarnessProfileRoutes(ServerContext server)
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
            routes.Scoped(HttpMethod.GET, "/v1.0/api/harness-profiles/builtin", ResourceTypeEnum.HarnessProfile, OperationTypeEnum.Read, BuiltInAsync, "List built-in harness profiles", "Harness Profiles", null, typeof(List<HarnessProfile>));
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.HarnessProfile, OperationTypeEnum.Read, ListAsync, "List harness profiles (tenant and built-in)", "Harness Profiles", null, typeof(EnumerationResult<HarnessProfile>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.HarnessProfile, OperationTypeEnum.Create, CreateAsync, "Create a harness profile", "Harness Profiles", typeof(HarnessProfile), typeof(HarnessProfile));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.HarnessProfile, OperationTypeEnum.Read, ReadAsync, "Read a harness profile", "Harness Profiles", null, typeof(HarnessProfile));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.HarnessProfile, OperationTypeEnum.Update, UpdateAsync, "Update a harness profile", "Harness Profiles", typeof(HarnessProfile), typeof(HarnessProfile));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.HarnessProfile, OperationTypeEnum.Delete, DeleteAsync, "Delete a harness profile", "Harness Profiles", null, typeof(DeleteResponse));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/clone", ResourceTypeEnum.HarnessProfile, OperationTypeEnum.Create, CloneAsync, "Clone a harness profile (built-in or tenant) into a new tenant profile", "Harness Profiles", typeof(CloneRequest), typeof(HarnessProfile));
        }

        #endregion

        #region Private-Methods

        private async Task BuiltInAsync(HttpContextBase http)
        {
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = 1000;
            EnumerationResult<HarnessProfile> all = await _Server.Database.HarnessProfiles.EnumerateAsync(null, query, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, all.Objects.Where(p => p.TenantId == null).OrderBy(p => p.Name, StringComparer.Ordinal).ToList()).ConfigureAwait(false);
        }

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationResult<HarnessProfile> result = await _Server.Database.HarnessProfiles.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, result).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            HarnessProfile profile = RouteHelpers.RequiredBody<HarnessProfile>(http);
            profile.Id = String.Empty;
            profile.TenantId = tenantId;
            profile.IsBuiltIn = false;
            profile.IsProtected = false;
            ConfigurationValidator.HarnessProfile(profile);
            HarnessProfile? existing = await _Server.Database.HarnessProfiles.ReadByNameAsync(tenantId, profile.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing?.TenantId == tenantId ? existing : null, existing?.Id, null, profile.Name);
            HarnessProfile created = await _Server.Database.HarnessProfiles.CreateAsync(profile, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "HarnessProfile", created.Id, "Created harness profile " + created.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            HarnessProfile? profile = await _Server.Database.HarnessProfiles.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            if (profile == null) throw new NotFoundException("Harness profile not found.");
            await RouteHelpers.JsonAsync(http, 200, profile).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string id = RouteHelpers.Param(http, "id")!;
            HarnessProfile existing = await _Server.Database.HarnessProfiles.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false) ?? throw new NotFoundException("Harness profile not found.");
            ConfigurationSupport.EnsureEditable(existing.TenantId, existing.IsBuiltIn, existing.IsProtected, tenantId, "Harness profile " + existing.Name);
            HarnessProfile profile = RouteHelpers.RequiredBody<HarnessProfile>(http);
            profile.Id = existing.Id;
            profile.TenantId = tenantId;
            profile.IsBuiltIn = false;
            profile.IsProtected = existing.IsProtected;
            profile.BuiltInKey = existing.BuiltInKey;
            profile.CreatedUtc = existing.CreatedUtc;
            ConfigurationValidator.HarnessProfile(profile);
            HarnessProfile? named = await _Server.Database.HarnessProfiles.ReadByNameAsync(tenantId, profile.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named?.TenantId == tenantId ? named : null, named?.Id, id, profile.Name);
            HarnessProfile updated = await _Server.Database.HarnessProfiles.UpdateAsync(profile, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "HarnessProfile", id, "Updated harness profile " + updated.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string id = RouteHelpers.Param(http, "id")!;
            HarnessProfile existing = await _Server.Database.HarnessProfiles.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false) ?? throw new NotFoundException("Harness profile not found.");
            ConfigurationSupport.EnsureEditable(existing.TenantId, existing.IsBuiltIn, existing.IsProtected, tenantId, "Harness profile " + existing.Name);
            await ConfigurationSupport.EnsureUnreferencedAsync(_Server, tenantId, d => d.HarnessProfileId == id, "Harness profile " + existing.Name, http.Token).ConfigureAwait(false);
            DeleteResponse response = new DeleteResponse();
            response.Deleted = await _Server.Database.HarnessProfiles.DeleteAsync(id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "HarnessProfile", id, "Deleted harness profile " + existing.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, response).ConfigureAwait(false);
        }

        private async Task CloneAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            HarnessProfile source = await _Server.Database.HarnessProfiles.ReadAsync(tenantId, RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false) ?? throw new NotFoundException("Harness profile not found.");
            CloneRequest request = RouteHelpers.RequiredBody<CloneRequest>(http);
            HarnessProfile copy = Garrison.Core.Serialization.Serializer.Copy(source) ?? throw new InvalidOperationException("Clone failed.");
            copy.Id = String.Empty;
            copy.TenantId = tenantId;
            copy.Name = request.Name;
            copy.IsBuiltIn = false;
            copy.IsProtected = false;
            foreach (HarnessArgument argument in copy.Arguments) argument.Id = String.Empty;
            foreach (HarnessEnvironmentVariable variable in copy.Environment) variable.Id = String.Empty;
            foreach (HarnessFile file in copy.Files) file.Id = String.Empty;
            ConfigurationValidator.HarnessProfile(copy);
            HarnessProfile? existing = await _Server.Database.HarnessProfiles.ReadByNameAsync(tenantId, copy.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing?.TenantId == tenantId ? existing : null, existing?.Id, null, copy.Name);
            HarnessProfile created = await _Server.Database.HarnessProfiles.CreateAsync(copy, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "HarnessProfile", created.Id, "Cloned harness profile " + source.Name + " to " + created.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        #endregion
    }
}
