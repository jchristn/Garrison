namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using System.Text.RegularExpressions;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Services;
    using SyslogLogging;
    using WatsonWebserver;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.OpenApi;

    /// <summary>
    /// Registers routes on Watson with OpenAPI metadata, records each route's permission in the operation scope map,
    /// authorizes scoped routes before the handler runs (tenant from the {tenantId} parameter, resource from the
    /// resource parameter), and maps domain exceptions to HTTP responses. Thread-safe after registration.
    /// </summary>
    public class RouteRegistrar
    {
        #region Public-Members

        /// <summary>
        /// Operation scope map populated by this registrar.
        /// </summary>
        public OperationScopeMap Scopes
        {
            get
            {
                return _Scopes;
            }
        }

        #endregion

        #region Private-Members

        private static readonly Regex _ParameterPattern = new Regex(@"\{([A-Za-z0-9_]+)\}", RegexOptions.Compiled);

        private readonly Webserver _Server;
        private readonly AuthorizationService _Authorization;
        private readonly DatabaseDriverBase _Database;
        private readonly OperationScopeMap _Scopes;
        private readonly LoggingModule _Logging;
        private readonly string _Header = "[Routes] ";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Watson server.</param>
        /// <param name="authorization">Authorization service.</param>
        /// <param name="database">Database, used to check that the tenant in a tenant-scoped path exists.</param>
        /// <param name="scopes">Operation scope map.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public RouteRegistrar(Webserver server, AuthorizationService authorization, DatabaseDriverBase database, OperationScopeMap scopes, LoggingModule logging)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Authorization = authorization ?? throw new ArgumentNullException(nameof(authorization));
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Scopes = scopes ?? throw new ArgumentNullException(nameof(scopes));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register an anonymous route.
        /// </summary>
        /// <param name="method">Method.</param>
        /// <param name="path">Path template.</param>
        /// <param name="handler">Handler.</param>
        /// <param name="summary">OpenAPI summary.</param>
        /// <param name="tag">OpenAPI tag.</param>
        /// <param name="requestBody">Optional request body type.</param>
        /// <param name="response">Optional response type.</param>
        public void Anonymous(HttpMethod method, string path, Func<HttpContextBase, Task> handler, string summary, string tag, Type? requestBody = null, Type? response = null)
        {
            Record(method, path, null, null, RouteAuthorizationEnum.Anonymous, summary, tag);
            Func<HttpContextBase, Task> wrapped = context => InvokeAsync(context, handler);
            OpenApiRouteMetadata metadata = Metadata(method, path, summary, tag, requestBody, response, false);
            if (path.Contains('{')) _Server.Routes.PreAuthentication.Parameter.Add(method, path, wrapped, null, openApiMetadata: metadata);
            else _Server.Routes.PreAuthentication.Static.Add(method, path, wrapped, null, openApiMetadata: metadata);
        }

        /// <summary>
        /// Register an authenticated route authorized against a resource type and operation.
        /// </summary>
        /// <param name="method">Method.</param>
        /// <param name="path">Path template.</param>
        /// <param name="resourceType">Resource type.</param>
        /// <param name="operation">Operation.</param>
        /// <param name="handler">Handler.</param>
        /// <param name="summary">OpenAPI summary.</param>
        /// <param name="tag">OpenAPI tag.</param>
        /// <param name="requestBody">Optional request body type.</param>
        /// <param name="response">Optional response type.</param>
        /// <param name="resourceParameter">Path parameter holding the target resource identifier. Default id.</param>
        /// <param name="queryParameters">Optional query parameters described in OpenAPI; when present, a 400 response is documented too.</param>
        public void Scoped(HttpMethod method, string path, ResourceTypeEnum resourceType, OperationTypeEnum operation, Func<HttpContextBase, Task> handler, string summary, string tag, Type? requestBody = null, Type? response = null, string resourceParameter = "id", List<OpenApiParameterMetadata>? queryParameters = null)
        {
            Record(method, path, resourceType, operation, RouteAuthorizationEnum.Scoped, summary, tag);
            Func<HttpContextBase, Task> wrapped = async context =>
            {
                RequestContext ctx = RouteHelpers.Context(context);
                string? tenantId = RouteHelpers.Param(context, "tenantId");
                string? resourceId = RouteHelpers.Param(context, resourceParameter);
                AuthorizationDecision decision = await _Authorization.AuthorizeAsync(ctx, tenantId, resourceType, operation, resourceId, context.Token).ConfigureAwait(false);
                if (!decision.Permitted)
                {
                    await DenyAsync(context, ctx, decision, resourceType, operation, tenantId).ConfigureAwait(false);
                    return;
                }
                await InvokeAsync(context, handler).ConfigureAwait(false);
            };
            OpenApiRouteMetadata metadata = Metadata(method, path, summary, tag, requestBody, response, true);
            if (queryParameters != null && queryParameters.Count > 0)
            {
                foreach (OpenApiParameterMetadata parameter in queryParameters) metadata.WithParameter(parameter);
                metadata.WithResponse(400, OpenApiResponseMetadata.Json("Invalid query parameters.", OpenApiSchemaFactory.For(typeof(ErrorResponse))));
            }
            Add(method, path, wrapped, metadata);
        }

        /// <summary>
        /// Register an authenticated route whose handler performs its own authorization.
        /// </summary>
        /// <param name="method">Method.</param>
        /// <param name="path">Path template.</param>
        /// <param name="handler">Handler.</param>
        /// <param name="summary">OpenAPI summary.</param>
        /// <param name="tag">OpenAPI tag.</param>
        /// <param name="requestBody">Optional request body type.</param>
        /// <param name="response">Optional response type.</param>
        public void Authenticated(HttpMethod method, string path, Func<HttpContextBase, Task> handler, string summary, string tag, Type? requestBody = null, Type? response = null)
        {
            Record(method, path, null, null, RouteAuthorizationEnum.Handler, summary, tag);
            Func<HttpContextBase, Task> wrapped = context => InvokeAsync(context, handler);
            Add(method, path, wrapped, Metadata(method, path, summary, tag, requestBody, response, true));
        }

        /// <summary>
        /// Authorize inside a handler-authorized route and send the denial when not permitted.
        /// </summary>
        /// <param name="context">HTTP context.</param>
        /// <param name="tenantId">Target tenant.</param>
        /// <param name="resourceType">Resource type.</param>
        /// <param name="operation">Operation.</param>
        /// <param name="resourceId">Resource identifier.</param>
        /// <returns>True when permitted; false when a denial was sent.</returns>
        public async Task<bool> RequireAsync(HttpContextBase context, string? tenantId, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId)
        {
            RequestContext ctx = RouteHelpers.Context(context);
            AuthorizationDecision decision = await _Authorization.AuthorizeAsync(ctx, tenantId, resourceType, operation, resourceId, context.Token).ConfigureAwait(false);
            if (decision.Permitted) return true;
            await DenyAsync(context, ctx, decision, resourceType, operation, tenantId).ConfigureAwait(false);
            return false;
        }

        #endregion

        #region Private-Methods

        private void Add(HttpMethod method, string path, Func<HttpContextBase, Task> handler, OpenApiRouteMetadata metadata)
        {
            // Every authenticated route under /tenants/{tenantId} checks here, once, that the tenant exists (M1-13).
            if (path.Contains("/tenants/{tenantId}", StringComparison.Ordinal))
            {
                Func<HttpContextBase, Task> inner = handler;
                handler = async context =>
                {
                    if (await TenantMissingAsync(context).ConfigureAwait(false)) return;
                    await inner(context).ConfigureAwait(false);
                };
            }
            if (path.Contains('{')) _Server.Routes.PostAuthentication.Parameter.Add(method, path, handler, null, openApiMetadata: metadata);
            else _Server.Routes.PostAuthentication.Static.Add(method, path, handler, null, openApiMetadata: metadata);
        }

        private void Record(HttpMethod method, string path, ResourceTypeEnum? resourceType, OperationTypeEnum? operation, RouteAuthorizationEnum authorization, string summary, string tag)
        {
            OperationScope scope = new OperationScope();
            scope.Method = method.ToString();
            scope.Path = path;
            scope.ResourceType = resourceType;
            scope.Operation = operation;
            scope.Authorization = authorization;
            scope.Summary = summary;
            scope.Tag = tag;
            _Scopes.Add(scope);
        }

        private static OpenApiRouteMetadata Metadata(HttpMethod method, string path, string summary, string tag, Type? requestBody, Type? response, bool secured)
        {
            OpenApiRouteMetadata metadata = OpenApiRouteMetadata.Create(summary, tag);
            foreach (Match match in _ParameterPattern.Matches(path))
            {
                metadata.WithParameter(OpenApiParameterMetadata.Path(match.Groups[1].Value, match.Groups[1].Value + " path parameter.", OpenApiSchemaMetadata.String()));
            }
            if (requestBody != null) metadata.WithRequestBody(OpenApiRequestBodyMetadata.Json(OpenApiSchemaFactory.For(requestBody), requestBody.Name, true));
            if (response != null) metadata.WithResponse(200, OpenApiResponseMetadata.Json("Success.", OpenApiSchemaFactory.For(response)));
            else if (method == HttpMethod.DELETE) metadata.WithResponse(204, OpenApiResponseMetadata.NoContent());
            if (secured)
            {
                metadata.WithResponse(401, OpenApiResponseMetadata.Unauthorized());
                metadata.WithResponse(403, OpenApiResponseMetadata.Forbidden());
            }
            return metadata;
        }

        private async Task<bool> TenantMissingAsync(HttpContextBase context)
        {
            // Only system administrators can address a tenant other than their own; everyone else already gets the
            // authorization layer's 404 for another tenant, which must not reveal whether that tenant exists.
            RequestContext ctx = RouteHelpers.Context(context);
            string? tenantId = RouteHelpers.Param(context, "tenantId");
            if (!ctx.IsAdmin || String.IsNullOrEmpty(tenantId)) return false;
            if (await _Database.Tenants.ExistsAsync(tenantId, context.Token).ConfigureAwait(false)) return false;
            await RouteHelpers.ErrorAsync(context, 404, "TenantNotFound", "Tenant " + tenantId + " not found.").ConfigureAwait(false);
            return true;
        }

        private async Task DenyAsync(HttpContextBase context, RequestContext ctx, AuthorizationDecision decision, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? tenantId)
        {
            int status = decision.Result == Garrison.Core.Enums.AuthorizationResultEnum.NotFound ? 404 : 403;
            ErrorResponse error = new ErrorResponse(status == 404 ? "NotFound" : "Forbidden", status == 404 ? "NotFound" : "AuthorizationDenied", status == 404 ? "Resource not found." : decision.Reason);
            error.RequestId = ctx.RequestId;
            if (status == 403)
            {
                error.RequiredPermission = operation.ToString();
                error.ResourceType = resourceType.ToString();
                error.TenantId = tenantId;
            }
            await RouteHelpers.JsonAsync(context, status, error).ConfigureAwait(false);
        }

        private async Task InvokeAsync(HttpContextBase context, Func<HttpContextBase, Task> handler)
        {
            RequestTelemetry.CaptureSpan(context);
            try
            {
                await handler(context).ConfigureAwait(false);
            }
            catch (RequestBodyException e)
            {
                await RouteHelpers.ErrorAsync(context, 400, "InvalidBody", e.Message).ConfigureAwait(false);
            }
            catch (ValidationException e)
            {
                await RouteHelpers.ValidationAsync(context, e.Message, e.Fields.Count > 0 ? e.Fields : null, e.Codes).ConfigureAwait(false);
            }
            catch (NotFoundException e)
            {
                await RouteHelpers.ErrorAsync(context, 404, "NotFound", e.Message).ConfigureAwait(false);
            }
            catch (ConflictException e)
            {
                await RouteHelpers.ErrorAsync(context, 409, e.Code, e.Message).ConfigureAwait(false);
            }
            catch (ArgumentException e)
            {
                await RouteHelpers.ErrorAsync(context, 400, "BadRequest", e.Message).ConfigureAwait(false);
            }
            catch (JsonException e)
            {
                await RouteHelpers.ErrorAsync(context, 400, "InvalidJson", e.Message).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                if (!context.Response.ResponseSent) await RouteHelpers.ErrorAsync(context, 503, "Cancelled", "The request was cancelled.").ConfigureAwait(false);
            }
            catch (Exception e)
            {
                _Logging.Warn(_Header + context.Request.Method + " " + context.Request.Url.RawWithoutQuery + " failed: " + e + " "
                    + GarrisonTracing.LogFields("route", RequestTelemetry.RouteTemplate(context), "tenant", RequestTelemetry.Tenant(context), "trace", System.Diagnostics.Activity.Current?.TraceId.ToHexString()));
                if (!context.Response.ResponseSent) await RouteHelpers.ErrorAsync(context, 500, "InternalError", "An internal error occurred. See server logs with the request identifier.").ConfigureAwait(false);
            }
        }

        #endregion
    }
}
