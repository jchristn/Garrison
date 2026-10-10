namespace Garrison.Server.Routes
{
    using System;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Health and token routes.
    /// </summary>
    public class CoreRoutes
    {
        #region Private-Members

        private readonly ServerContext _Context;
        private readonly AuthRateLimiter _RateLimiter;
        private readonly int _ExpectedSchemaVersion = Garrison.Core.Database.Ado.SchemaBuilder.LatestVersion;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public CoreRoutes(ServerContext context)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _RateLimiter = new AuthRateLimiter(_Context.Database, () => _Context.Settings.Auth.RateLimitPerMinute);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            routes.Anonymous(HttpMethod.GET, "/v1.0/api/health", HealthAsync, "Readiness: 200 when the database answers, the schema is current, and the replica is not draining; 503 otherwise", "Health", null, typeof(HealthResponse));
            routes.Anonymous(HttpMethod.GET, "/v1.0/api/health/ready", HealthAsync, "Readiness (same as /v1.0/api/health)", "Health", null, typeof(HealthResponse));
            routes.Anonymous(HttpMethod.GET, "/v1.0/api/health/live", LiveAsync, "Liveness: 200 while the process runs, including during startup migrations and draining", "Health", null, typeof(HealthResponse));
            routes.Anonymous(HttpMethod.GET, "/metrics", MetricsAsync, "Prometheus metrics in text exposition format, relayed from the metrics listener (404 when Telemetry.ServeMetricsOnServicePort is false, 503 when the listener is off)", "Health");
            routes.Anonymous(HttpMethod.POST, "/v1.0/token", IssueAsync, "Issue a session token from user login or credential keys", "Tokens", typeof(TokenRequest), typeof(TokenResponse));
            routes.Authenticated(HttpMethod.GET, "/v1.0/token", ValidateAsync, "Validate the presented token", "Tokens");
            routes.Authenticated(HttpMethod.GET, "/v1.0/token/details", DetailsAsync, "Describe the authenticated principal", "Tokens", null, typeof(TokenDetailsResponse));
            routes.Authenticated(HttpMethod.POST, "/v1.0/token/refresh", RefreshAsync, "Issue a fresh token for the authenticated principal", "Tokens", null, typeof(TokenResponse));
            routes.Authenticated(HttpMethod.DELETE, "/v1.0/token", RevokeAsync, "Revoke the presented token (logout)", "Tokens");
        }

        #endregion

        #region Private-Methods

        private async Task MetricsAsync(HttpContextBase context)
        {
            if (!_Context.Settings.Telemetry.ServeMetricsOnServicePort)
            {
                await RouteHelpers.ErrorAsync(context, 404, "NotFound", "Metrics are not served on this port; set Telemetry.ServeMetricsOnServicePort to true or scrape the metrics listener.").ConfigureAwait(false);
                return;
            }
            MetricsScrape? scrape = await _Context.Telemetry.ScrapeAsync(context.Token).ConfigureAwait(false);
            if (scrape == null)
            {
                await RouteHelpers.ErrorAsync(context, 503, "MetricsUnavailable", "The Prometheus metrics listener is not enabled or did not answer.").ConfigureAwait(false);
                return;
            }
            context.Response.StatusCode = 200;
            context.Response.ContentType = scrape.ContentType;
            await context.Response.Send(scrape.Body, context.Token).ConfigureAwait(false);
        }

        private async Task LiveAsync(HttpContextBase context)
        {
            HealthResponse health = new HealthResponse();
            health.Node = _Context.NodeId;
            health.Version = Constants.ProductVersion;
            health.Status = _Context.IsDraining ? "draining" : "alive";
            health.Database = "unchecked";
            health.ExpectedSchemaVersion = _ExpectedSchemaVersion;
            await RouteHelpers.JsonAsync(context, 200, health).ConfigureAwait(false);
        }

        private async Task HealthAsync(HttpContextBase context)
        {
            HealthResponse health = new HealthResponse();
            health.Node = _Context.NodeId;
            health.Version = Constants.ProductVersion;
            health.ExpectedSchemaVersion = _ExpectedSchemaVersion;
            health.Backplane = _Context.TryGet<Garrison.Server.Backplane.IEventBackplane>()?.Name;
            try
            {
                // Reading the applied version doubles as the connectivity check. A replica stays not-ready while the
                // schema is behind this build (P10.9); a newer schema is fine because migrations only add.
                // Operators who manage the schema themselves may not keep schema_migrations, so only connectivity counts.
                if (_Context.Settings.Database.ManageSchema)
                {
                    health.SchemaVersion = await _Context.Database.ReadSchemaVersionAsync(context.Token).ConfigureAwait(false);
                    health.Database = "ok";
                }
                else
                {
                    health.Database = await _Context.Database.PingAsync(context.Token).ConfigureAwait(false) ? "ok" : "unreachable";
                }
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                health.Database = "unreachable";
            }
            if (_Context.IsDraining) health.Status = "draining";
            else if (health.Database != "ok") health.Status = "degraded";
            else if (_Context.Settings.Database.ManageSchema && health.SchemaVersion < health.ExpectedSchemaVersion) health.Status = "migrating";
            else health.Status = "healthy";
            await RouteHelpers.JsonAsync(context, health.Status == "healthy" ? 200 : 503, health).ConfigureAwait(false);
        }

        private async Task IssueAsync(HttpContextBase context)
        {
            if (!await _RateLimiter.TryAcquireAsync(context.Request.Source.IpAddress, context.Token).ConfigureAwait(false))
            {
                await RouteHelpers.ErrorAsync(context, 429, "RateLimited", "Too many authentication attempts. Try again in a minute.").ConfigureAwait(false);
                return;
            }

            TokenRequest request = RouteHelpers.Body<TokenRequest>(context) ?? new TokenRequest();
            request.TenantId ??= context.Request.Headers[Constants.HeaderTenantId];
            request.Email ??= context.Request.Headers[Constants.HeaderEmail];
            request.Password ??= context.Request.Headers[Constants.HeaderPassword];
            request.AccessKey ??= context.Request.Headers[Constants.HeaderAccessKey];
            request.SecretKey ??= context.Request.Headers[Constants.HeaderSecretKey];
            string? userAgent = context.Request.Useragent;

            if (!String.IsNullOrEmpty(request.AccessKey))
            {
                Credential? credential = await _Context.Authentication.AuthenticateCredentialAsync(request.AccessKey, request.SecretKey, context.Token).ConfigureAwait(false);
                if (credential == null)
                {
                    await RouteHelpers.ErrorAsync(context, 401, "InvalidCredentials", "The access key or secret key is invalid.").ConfigureAwait(false);
                    return;
                }
                TokenResponse issued = await _Context.Authentication.IssueForCredentialAsync(credential, AuthSchemeEnum.AccessKeySecret, context.Request.Source.IpAddress, userAgent, context.Token).ConfigureAwait(false);
                await RouteHelpers.JsonAsync(context, 200, issued).ConfigureAwait(false);
                return;
            }

            string? tenantId = request.TenantId;
            if (String.IsNullOrEmpty(tenantId) && !String.IsNullOrEmpty(request.Email)) tenantId = _Context.DefaultTenantId;
            User? user = await _Context.Authentication.AuthenticateUserAsync(tenantId, request.Email, request.Password, context.Token).ConfigureAwait(false);
            if (user == null)
            {
                await RouteHelpers.ErrorAsync(context, 401, "InvalidCredentials", "The tenant, email, or password is invalid.").ConfigureAwait(false);
                return;
            }
            TokenResponse userToken = await _Context.Authentication.IssueForUserAsync(user, AuthSchemeEnum.PasswordHeaders, context.Request.Source.IpAddress, userAgent, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, userToken).ConfigureAwait(false);
        }

        private async Task ValidateAsync(HttpContextBase context)
        {
            RequestContext ctx = RouteHelpers.Context(context);
            await RouteHelpers.JsonAsync(context, 200, new TokenValidResponse { Valid = ctx.IsAuthenticated }).ConfigureAwait(false);
        }

        private async Task DetailsAsync(HttpContextBase context)
        {
            RequestContext ctx = RouteHelpers.Context(context);
            TokenDetailsResponse details = new TokenDetailsResponse();
            details.PrincipalType = ctx.PrincipalType;
            details.PrincipalId = ctx.PrincipalId;
            details.PrincipalName = ctx.PrincipalName;
            details.TenantId = ctx.TenantId;
            details.UserId = ctx.UserId;
            details.CredentialId = ctx.CredentialId;
            details.RunId = ctx.RunId;
            details.SessionId = ctx.SessionId;
            details.AuthScheme = ctx.AuthScheme;
            details.IsAdmin = ctx.IsAdmin;
            details.IsTenantAdmin = ctx.IsTenantAdmin;
            if (ctx.User != null)
            {
                details.Email = ctx.User.Email;
                details.FirstName = ctx.User.FirstName;
                details.LastName = ctx.User.LastName;
            }
            string? bearer = context.Request.Headers["Authorization"];
            string? raw = !String.IsNullOrEmpty(bearer) && bearer.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) ? bearer.Substring(7) : context.Request.Headers[Constants.HeaderToken];
            TokenPayload? payload = _Context.Authentication.Decode(raw);
            if (payload != null) details.ExpiresUtc = payload.ExpiresUtc;
            await RouteHelpers.JsonAsync(context, 200, details).ConfigureAwait(false);
        }

        private async Task RefreshAsync(HttpContextBase context)
        {
            RequestContext ctx = RouteHelpers.Context(context);
            if (ctx.PrincipalType == PrincipalTypeEnum.User && ctx.User != null)
            {
                TokenResponse issued = await _Context.Authentication.IssueForUserAsync(ctx.User, AuthSchemeEnum.BearerToken, context.Request.Source.IpAddress, context.Request.Useragent, context.Token).ConfigureAwait(false);
                await RouteHelpers.JsonAsync(context, 200, issued).ConfigureAwait(false);
                return;
            }
            if (ctx.PrincipalType == PrincipalTypeEnum.Credential && ctx.Credential != null)
            {
                TokenResponse issued = await _Context.Authentication.IssueForCredentialAsync(ctx.Credential, AuthSchemeEnum.BearerToken, context.Request.Source.IpAddress, context.Request.Useragent, context.Token).ConfigureAwait(false);
                await RouteHelpers.JsonAsync(context, 200, issued).ConfigureAwait(false);
                return;
            }
            await RouteHelpers.ErrorAsync(context, 400, "RefreshNotSupported", "Only user and credential sessions can be refreshed.").ConfigureAwait(false);
        }

        private async Task RevokeAsync(HttpContextBase context)
        {
            string? bearer = context.Request.Headers["Authorization"];
            string? raw = !String.IsNullOrEmpty(bearer) && bearer.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) ? bearer.Substring(7) : context.Request.Headers[Constants.HeaderToken];
            bool revoked = await _Context.Authentication.RevokeAsync(raw, "Logout.", context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, new TokenValidResponse { Valid = !revoked }).ConfigureAwait(false);
        }

        #endregion
    }
}
