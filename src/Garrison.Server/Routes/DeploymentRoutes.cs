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
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Deployment routes, including the compile preview.
    /// </summary>
    public class DeploymentRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly TenantConfigurationService _Mutations;
        private readonly InvocationCompiler _Compiler;
        private RouteRegistrar? _Routes = null;
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
            _Mutations = new TenantConfigurationService(_Server);
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
            _Routes = routes ?? throw new ArgumentNullException(nameof(routes));
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
            Deployment created = await _Mutations.CreateDeploymentAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.RequiredBody<Deployment>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            Deployment existing = await LoadAsync(http).ConfigureAwait(false);
            Deployment updated = await _Mutations.UpdateDeploymentAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, RouteHelpers.RequiredBody<Deployment>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            Deployment existing = await LoadAsync(http).ConfigureAwait(false);
            await _Mutations.DeleteDeploymentAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task PreviewAsync(HttpContextBase http)
        {
            Deployment deployment = await LoadAsync(http).ConfigureAwait(false);
            CompilePreviewRequest request = RouteHelpers.Body<CompilePreviewRequest>(http) ?? new CompilePreviewRequest();
            string tenantId = RouteHelpers.Tenant(http);
            if (!String.IsNullOrWhiteSpace(request.Environment) && !String.Equals(request.Environment, deployment.Environment, StringComparison.Ordinal))
            {
                List<Deployment> sameAgent = await ConfigurationSupport.DeploymentsAsync(_Server, tenantId, d => d.AgentId == deployment.AgentId && String.Equals(d.Environment, request.Environment, StringComparison.Ordinal), http.Token).ConfigureAwait(false);
                if (sameAgent.Count == 0)
                {
                    await RouteHelpers.ErrorAsync(http, 400, "NoDeploymentInEnvironment", "Agent " + deployment.AgentId + " has no deployment in environment " + request.Environment + ".").ConfigureAwait(false);
                    return;
                }
                deployment = sameAgent.OrderBy(d => d.Name, StringComparer.Ordinal).First();
            }
            if (!String.IsNullOrEmpty(request.AgentRevisionId))
            {
                // Read on revisions of this agent is needed to preview one of them (AD9.3).
                if (_Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.AgentRevision, OperationTypeEnum.Read, deployment.AgentId).ConfigureAwait(false)) return;
            }
            try
            {
                CompilationResult result = await _Compiler.PreviewAsync(tenantId, deployment.Id, request.Input, request.Parameters, null, request.AgentRevisionId, http.Token).ConfigureAwait(false);
                CompilePreviewResponse response = new CompilePreviewResponse();
                response.DeploymentId = deployment.Id;
                response.AgentRevisionId = result.AgentRevisionId;
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
