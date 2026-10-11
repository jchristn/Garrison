namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Deployment routes, including the compile preview.
    /// </summary>
    public class DeploymentRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly InvocationCompiler _Compiler;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/deployments";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="compiler">Invocation compiler.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public DeploymentRoutes(ServerContext server, InvocationCompiler compiler)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Compiler = compiler ?? throw new ArgumentNullException(nameof(compiler));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        public void Register(RouteRegistrar routes)
        {
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Deployment, OperationTypeEnum.Read, ListAsync, "List deployments", "Deployments", null, typeof(EnumerationResult<Deployment>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Deployment, OperationTypeEnum.Create, CreateAsync, "Create a deployment", "Deployments", typeof(Deployment), typeof(Deployment));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Deployment, OperationTypeEnum.Read, ReadAsync, "Read a deployment", "Deployments", null, typeof(Deployment));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.Deployment, OperationTypeEnum.Update, UpdateAsync, "Update a deployment (increments its configuration version)", "Deployments", typeof(Deployment), typeof(Deployment));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.Deployment, OperationTypeEnum.Delete, DeleteAsync, "Delete a deployment", "Deployments");
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/compile-preview", ResourceTypeEnum.Deployment, OperationTypeEnum.Read, PreviewAsync, "Compile the deployment with sample input; secret values are redacted", "Deployments", typeof(CompilePreviewRequest), typeof(CompilePreviewResponse));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.Deployments.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Deployment deployment = RouteHelpers.RequiredBody<Deployment>(http);
            deployment.Id = String.Empty;
            deployment.TenantId = tenantId;
            deployment.IsProtected = false;
            deployment.ConfigVersion = 1;
            DefaultPromptBindings.Apply(deployment);
            await ConfigurationValidator.DeploymentAsync(_Server.Database, tenantId, deployment, http.Token).ConfigureAwait(false);
            Deployment? existing = await _Server.Database.Deployments.ReadByNameAsync(tenantId, deployment.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing, existing?.Id, null, deployment.Name);
            Deployment created = await _Server.Database.Deployments.CreateAsync(deployment, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Deployment", created.Id, "Created deployment " + created.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Deployment existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Deployment " + existing.Name);
            Deployment deployment = RouteHelpers.RequiredBody<Deployment>(http);
            deployment.Id = existing.Id;
            deployment.TenantId = tenantId;
            deployment.CreatedUtc = existing.CreatedUtc;
            deployment.ConfigVersion = existing.ConfigVersion + 1;
            DefaultPromptBindings.Apply(deployment);
            await ConfigurationValidator.DeploymentAsync(_Server.Database, tenantId, deployment, http.Token).ConfigureAwait(false);
            Deployment? named = await _Server.Database.Deployments.ReadByNameAsync(tenantId, deployment.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, existing.Id, deployment.Name);
            Deployment updated = await _Server.Database.Deployments.UpdateAsync(deployment, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Deployment", updated.Id, "Updated deployment " + updated.Name + " to configuration version " + updated.ConfigVersion + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Deployment existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Deployment " + existing.Name);
            await _Server.Database.Deployments.DeleteAsync(existing.Id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Deployment", existing.Id, "Deleted deployment " + existing.Name + ".").ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task PreviewAsync(HttpContextBase http)
        {
            Deployment deployment = await LoadAsync(http).ConfigureAwait(false);
            CompilePreviewRequest request = RouteHelpers.Body<CompilePreviewRequest>(http) ?? new CompilePreviewRequest();
            try
            {
                CompilationResult result = await _Compiler.PreviewAsync(RouteHelpers.Tenant(http), deployment.Id, request.Input, request.Parameters, http.Token).ConfigureAwait(false);
                CompilePreviewResponse response = new CompilePreviewResponse();
                response.Spec = result.Spec;
                response.TemplateVersions = result.TemplateVersions;
                response.CommandLine = CommandLine(result.Spec);
                await RouteHelpers.JsonAsync(http, 200, response).ConfigureAwait(false);
            }
            catch (CompilationException e)
            {
                await RouteHelpers.ErrorAsync(http, 400, e.Code, e.Message).ConfigureAwait(false);
            }
        }

        private async Task<Deployment> LoadAsync(HttpContextBase http)
        {
            Deployment? deployment = await _Server.Database.Deployments.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            return deployment ?? throw new NotFoundException("Deployment not found.");
        }

        private static string CommandLine(ExecutionSpec spec)
        {
            StringBuilder sb = new StringBuilder(Quote(spec.Executable));
            foreach (string argument in spec.Arguments) sb.Append(' ').Append(Quote(argument));
            return sb.ToString();
        }

        private static string Quote(string value)
        {
            if (value.Length > 0 && value.All(c => Char.IsLetterOrDigit(c) || "-_./=:,@$".Contains(c))) return value;
            return "'" + value.Replace("'", "'\\''") + "'";
        }

        #endregion
    }
}
