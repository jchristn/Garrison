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
    /// Workspace template routes.
    /// </summary>
    public class WorkspaceTemplateRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/workspace-templates";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public WorkspaceTemplateRoutes(ServerContext server)
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
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Workspace, OperationTypeEnum.Read, ListAsync, "List workspace templates", "Workspaces", null, typeof(EnumerationResult<WorkspaceTemplate>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Workspace, OperationTypeEnum.Create, CreateAsync, "Create a workspace template", "Workspaces", typeof(WorkspaceTemplate), typeof(WorkspaceTemplate));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Workspace, OperationTypeEnum.Read, ReadAsync, "Read a workspace template", "Workspaces", null, typeof(WorkspaceTemplate));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.Workspace, OperationTypeEnum.Update, UpdateAsync, "Update a workspace template", "Workspaces", typeof(WorkspaceTemplate), typeof(WorkspaceTemplate));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.Workspace, OperationTypeEnum.Delete, DeleteAsync, "Delete a workspace template", "Workspaces");
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.WorkspaceTemplates.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            WorkspaceTemplate workspace = RouteHelpers.RequiredBody<WorkspaceTemplate>(http);
            workspace.Id = String.Empty;
            workspace.TenantId = tenantId;
            workspace.IsProtected = false;
            await ValidateAsync(tenantId, workspace, null, http).ConfigureAwait(false);
            await _Server.Authorization.SecretUse(RouteHelpers.Context(http), tenantId).RequireForModelAsync(tenantId, workspace, http.Token).ConfigureAwait(false);
            WorkspaceTemplate created = await _Server.Database.WorkspaceTemplates.CreateAsync(workspace, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Workspace", created.Id, "Created workspace template " + created.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            WorkspaceTemplate existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Workspace template " + existing.Name);
            WorkspaceTemplate workspace = RouteHelpers.RequiredBody<WorkspaceTemplate>(http);
            workspace.Id = existing.Id;
            workspace.TenantId = tenantId;
            workspace.CreatedUtc = existing.CreatedUtc;
            await ValidateAsync(tenantId, workspace, existing.Id, http).ConfigureAwait(false);
            await _Server.Authorization.SecretUse(RouteHelpers.Context(http), tenantId).RequireForModelAsync(tenantId, workspace, http.Token).ConfigureAwait(false);
            WorkspaceTemplate updated = await _Server.Database.WorkspaceTemplates.UpdateAsync(workspace, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Workspace", updated.Id, "Updated workspace template " + updated.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            WorkspaceTemplate existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Workspace template " + existing.Name);
            await ConfigurationSupport.EnsureUnreferencedAsync(_Server, tenantId, d => d.WorkspaceTemplateId == existing.Id, "Workspace template " + existing.Name, http.Token).ConfigureAwait(false);
            await _Server.Database.WorkspaceTemplates.DeleteAsync(existing.Id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Workspace", existing.Id, "Deleted workspace template " + existing.Name + ".").ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task ValidateAsync(string tenantId, WorkspaceTemplate workspace, string? currentId, HttpContextBase http)
        {
            ConfigurationValidator.Workspace(workspace);
            if (!String.IsNullOrEmpty(workspace.GitCredentialSecretId) && await _Server.Database.Secrets.ReadAsync(tenantId, workspace.GitCredentialSecretId, http.Token).ConfigureAwait(false) == null)
            {
                throw new ValidationException("The workspace template is invalid.", new System.Collections.Generic.Dictionary<string, string> { { "gitCredentialSecretId", "The secret does not exist in this tenant." } });
            }
            WorkspaceTemplate? named = await _Server.Database.WorkspaceTemplates.ReadByNameAsync(tenantId, workspace.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, currentId, workspace.Name);
        }

        private async Task<WorkspaceTemplate> LoadAsync(HttpContextBase http)
        {
            WorkspaceTemplate? workspace = await _Server.Database.WorkspaceTemplates.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            return workspace ?? throw new NotFoundException("Workspace template not found.");
        }

        #endregion
    }
}
