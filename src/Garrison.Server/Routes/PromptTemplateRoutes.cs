namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Core.Templates;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Prompt template routes: CRUD (updates create versions), versions, restore, clone, reset to the built-in default,
    /// and render previews.
    /// </summary>
    public class PromptTemplateRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/prompt-templates";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public PromptTemplateRoutes(ServerContext server)
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
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Read, ListAsync, "List prompt templates (tenant and built-in)", "Prompt Templates", null, typeof(EnumerationResult<PromptTemplate>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Create, CreateAsync, "Create a prompt template", "Prompt Templates", typeof(PromptTemplateRequest), typeof(PromptTemplate));
            routes.Scoped(HttpMethod.POST, _Base + "/render", ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Read, RenderAdHocAsync, "Render ad hoc template content with sample data", "Prompt Templates", typeof(PromptRenderRequest), typeof(PromptRenderResponse));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Read, ReadAsync, "Read a prompt template", "Prompt Templates", null, typeof(PromptTemplate));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Update, UpdateAsync, "Update a prompt template (content changes create a version)", "Prompt Templates", typeof(PromptTemplateRequest), typeof(PromptTemplate));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Delete, DeleteAsync, "Delete a prompt template and its versions", "Prompt Templates");
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/versions", ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Read, VersionsAsync, "List template versions, newest first", "Prompt Templates", null, typeof(List<PromptTemplateVersion>));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/versions/{version}", ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Read, VersionAsync, "Read one template version", "Prompt Templates", null, typeof(PromptTemplateVersion));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/restore/{version}", ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Update, RestoreAsync, "Restore a version as a new version", "Prompt Templates", null, typeof(PromptTemplate));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/clone", ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Create, CloneAsync, "Clone a template (built-in or tenant)", "Prompt Templates", typeof(CloneRequest), typeof(PromptTemplate));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/reset", ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Update, ResetAsync, "Reset a built-in template, or a clone of one, to the shipped content (a new version only when it differs)", "Prompt Templates", null, typeof(PromptTemplate));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/render", ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Read, RenderAsync, "Render a stored template with sample data", "Prompt Templates", typeof(PromptRenderRequest), typeof(PromptRenderResponse));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationResult<PromptTemplate> result = await _Server.Database.PromptTemplates.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, result).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            PromptTemplateRequest request = RouteHelpers.RequiredBody<PromptTemplateRequest>(http);
            ConfigurationValidator.PromptTemplate(request.Name, request.Content);
            await EnsureNameAsync(tenantId, request.Name, null, http).ConfigureAwait(false);

            PromptTemplate template = new PromptTemplate();
            template.TenantId = tenantId;
            Apply(template, request);
            template.CurrentVersion = 1;
            PromptTemplate created = await _Server.Database.PromptTemplates.CreateAsync(template, http.Token).ConfigureAwait(false);
            await AddVersionAsync(created, request.ChangeNote ?? "Created.", http).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "PromptTemplate", created.Id, "Created prompt template " + created.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            PromptTemplate existing = await LoadAsync(http).ConfigureAwait(false);
            PromptTemplateRequest request = RouteHelpers.RequiredBody<PromptTemplateRequest>(http);
            PromptTemplate updated = await _Server.Get<PromptTemplateService>().UpdateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            PromptTemplate existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, existing.IsBuiltIn, existing.IsProtected, tenantId, "Prompt template " + existing.Name);
            List<Deployment> users = await ConfigurationSupport.DeploymentsAsync(_Server, tenantId, d => d.PromptBindings.Any(b => b.TemplateId == existing.Id), http.Token).ConfigureAwait(false);
            if (users.Count > 0) throw new ConflictException("PromptTemplateInUse", "Prompt template " + existing.Name + " is bound by deployment(s) " + String.Join(", ", users.Select(d => d.Id + " (" + d.Name + ")")) + ". Unbind it or switch those deployments to another template first.");
            await _Server.Database.PromptTemplateVersions.DeleteByTemplateAsync(existing.Id, http.Token).ConfigureAwait(false);
            await _Server.Database.PromptTemplates.DeleteAsync(existing.Id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "PromptTemplate", existing.Id, "Deleted prompt template " + existing.Name + ".").ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task VersionsAsync(HttpContextBase http)
        {
            PromptTemplate template = await LoadAsync(http).ConfigureAwait(false);
            List<PromptTemplateVersion> versions = await _Server.Database.PromptTemplateVersions.ListByTemplateAsync(template.Id, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, versions).ConfigureAwait(false);
        }

        private async Task VersionAsync(HttpContextBase http)
        {
            PromptTemplate template = await LoadAsync(http).ConfigureAwait(false);
            PromptTemplateVersion version = await ReadVersionAsync(template, http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, version).ConfigureAwait(false);
        }

        private async Task RestoreAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            PromptTemplate template = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(template.TenantId, template.IsBuiltIn, template.IsProtected, tenantId, "Prompt template " + template.Name);
            PromptTemplateVersion version = await ReadVersionAsync(template, http).ConfigureAwait(false);
            template.Content = version.Content;
            template.CurrentVersion = template.CurrentVersion + 1;
            PromptTemplate updated = await _Server.Database.PromptTemplates.UpdateAsync(template, http.Token).ConfigureAwait(false);
            await AddVersionAsync(updated, "Restored version " + version.Version + ".", http).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "PromptTemplate", updated.Id, "Restored prompt template " + updated.Name + " from version " + version.Version + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task CloneAsync(HttpContextBase http)
        {
            PromptTemplate source = await LoadAsync(http).ConfigureAwait(false);
            CloneRequest request = RouteHelpers.RequiredBody<CloneRequest>(http);
            PromptTemplate created = await _Server.Get<PromptTemplateService>().CloneAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), source, request.Name, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ResetAsync(HttpContextBase http)
        {
            PromptTemplate template = await LoadAsync(http).ConfigureAwait(false);
            PromptTemplate reset = await _Server.Get<PromptTemplateService>().ResetAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), template, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, reset).ConfigureAwait(false);
        }

        private async Task RenderAsync(HttpContextBase http)
        {
            PromptTemplate template = await LoadAsync(http).ConfigureAwait(false);
            PromptRenderRequest request = RouteHelpers.Body<PromptRenderRequest>(http) ?? new PromptRenderRequest();
            await RouteHelpers.JsonAsync(http, 200, await RenderPreviewAsync(RouteHelpers.Tenant(http), template.Name, template.Content, request, http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task RenderAdHocAsync(HttpContextBase http)
        {
            PromptRenderRequest request = RouteHelpers.RequiredBody<PromptRenderRequest>(http);
            await RouteHelpers.JsonAsync(http, 200, await RenderPreviewAsync(RouteHelpers.Tenant(http), "ad hoc", request.Content ?? String.Empty, request, http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task<PromptRenderResponse> RenderPreviewAsync(string tenantId, string name, string content, PromptRenderRequest request, HttpContextBase http)
        {
            return await _Server.Get<PromptTemplateService>().RenderAsync(tenantId, name, content, request, http.Token).ConfigureAwait(false);
        }

        private async Task<PromptTemplate> LoadAsync(HttpContextBase http)
        {
            PromptTemplate? template = await _Server.Database.PromptTemplates.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            return template ?? throw new NotFoundException("Prompt template not found.");
        }

        private async Task<PromptTemplateVersion> ReadVersionAsync(PromptTemplate template, HttpContextBase http)
        {
            if (!Int32.TryParse(RouteHelpers.Param(http, "version"), out int number)) throw new ArgumentException("The version must be an integer.");
            PromptTemplateVersion? version = await _Server.Database.PromptTemplateVersions.ReadByVersionAsync(template.Id, number, http.Token).ConfigureAwait(false);
            return version ?? throw new NotFoundException("Version " + number + " of prompt template " + template.Name + " not found.");
        }

        private async Task EnsureNameAsync(string tenantId, string name, string? currentId, HttpContextBase http)
        {
            await _Server.Get<PromptTemplateService>().EnsureNameAsync(tenantId, name, currentId, http.Token).ConfigureAwait(false);
        }

        private async Task AddVersionAsync(PromptTemplate template, string note, HttpContextBase http)
        {
            await _Server.Get<PromptTemplateService>().AddVersionAsync(RouteHelpers.Context(http), template, note, http.Token).ConfigureAwait(false);
        }

        private static void Apply(PromptTemplate template, PromptTemplateRequest request)
        {
            PromptTemplateService.Apply(template, request);
        }

        #endregion
    }
}
