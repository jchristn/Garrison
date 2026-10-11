namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Codex;
    using WatsonWebserver;
    using WatsonWebserver.Core;

    /// <summary>
    /// In-process stand-in for the OpenAI OAuth token endpoint used by Codex login refreshes (G-22). Answers
    /// <c>POST /oauth/token</c> on 127.0.0.1. Refresh tokens are single use, like OpenAI's: presenting one twice answers
    /// 401 refresh_token_reused, so a double refresh shows up as a failure. Issued tokens are fake JWTs. Thread-safe.
    /// </summary>
    public sealed class FakeTokenEndpoint : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Token endpoint URL, for example http://127.0.0.1:12345/oauth/token.
        /// </summary>
        public string TokenUrl { get; }

        /// <summary>
        /// How the endpoint answers. Default <see cref="FakeTokenEndpointModeEnum.Rotate"/>.
        /// </summary>
        public FakeTokenEndpointModeEnum Mode { get; set; } = FakeTokenEndpointModeEnum.Rotate;

        /// <summary>
        /// Delay before answering, in milliseconds. Default 0.
        /// </summary>
        public int DelayMs { get; set; } = 0;

        /// <summary>
        /// Lifetime of issued access tokens. Default 10 days.
        /// </summary>
        public TimeSpan AccessLifetime { get; set; } = TimeSpan.FromDays(10);

        /// <summary>
        /// Refresh requests received.
        /// </summary>
        public int Requests
        {
            get
            {
                return Volatile.Read(ref _Requests);
            }
        }

        /// <summary>
        /// Body of the last request, or null.
        /// </summary>
        public CodexTokenRefreshRequest? LastRequest
        {
            get
            {
                lock (_Lock)
                {
                    return _LastRequest;
                }
            }
        }

        /// <summary>
        /// Content-Type of the last request, or null.
        /// </summary>
        public string? LastContentType
        {
            get
            {
                lock (_Lock)
                {
                    return _LastContentType;
                }
            }
        }

        /// <summary>
        /// Access token issued by the last successful refresh, or null.
        /// </summary>
        public string? LastIssuedAccessToken
        {
            get
            {
                lock (_Lock)
                {
                    return _LastIssuedAccessToken;
                }
            }
        }

        /// <summary>
        /// Refresh token issued by the last successful refresh, or null.
        /// </summary>
        public string? LastIssuedRefreshToken
        {
            get
            {
                lock (_Lock)
                {
                    return _LastIssuedRefreshToken;
                }
            }
        }

        #endregion

        #region Private-Members

        private readonly Webserver _Server;
        private readonly object _Lock = new object();
        private readonly HashSet<string> _Used = new HashSet<string>(StringComparer.Ordinal);
        private int _Requests = 0;
        private int _Issued = 0;
        private CodexTokenRefreshRequest? _LastRequest = null;
        private string? _LastContentType = null;
        private string? _LastIssuedAccessToken = null;
        private string? _LastIssuedRefreshToken = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Start the endpoint on a free 127.0.0.1 port.
        /// </summary>
        public FakeTokenEndpoint()
        {
            int port = TestServerHost.FreePort();
            TokenUrl = "http://127.0.0.1:" + port + "/oauth/token";
            WebserverSettings settings = new WebserverSettings();
            settings.Hostname = "127.0.0.1";
            settings.Port = port;
            _Server = new Webserver(settings, NotFoundAsync);
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.POST, "/oauth/token", TokenAsync);
            _Server.Start();
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build an unsigned JWT with the given expiry and issue times.
        /// </summary>
        /// <param name="expiresUtc">Expiry (UTC).</param>
        /// <param name="issuedUtc">Issue time (UTC), or null to omit the iat claim.</param>
        /// <param name="subject">Subject claim, which makes tokens distinct.</param>
        /// <returns>Token.</returns>
        public static string Jwt(DateTime expiresUtc, DateTime? issuedUtc, string subject)
        {
            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["sub"] = subject;
            payload["exp"] = new DateTimeOffset(expiresUtc).ToUnixTimeSeconds();
            if (issuedUtc.HasValue) payload["iat"] = new DateTimeOffset(issuedUtc.Value).ToUnixTimeSeconds();
            return Base64Url("{\"alg\":\"none\",\"typ\":\"JWT\"}") + "." + Base64Url(JsonSerializer.Serialize(payload)) + ".signature";
        }

        /// <summary>
        /// Build a Codex auth.json ChatGPT login whose access token expires at the given time. Includes an unknown
        /// top-level field and an unknown token field, which a refresh must keep.
        /// </summary>
        /// <param name="accessExpiresUtc">Access token expiry (UTC).</param>
        /// <param name="refreshToken">Refresh token.</param>
        /// <param name="lifetime">Access token lifetime used for the iat claim. Default 10 days.</param>
        /// <returns>Document text.</returns>
        public static string AuthJson(DateTime accessExpiresUtc, string refreshToken, TimeSpan? lifetime = null)
        {
            DateTime issued = accessExpiresUtc - (lifetime ?? TimeSpan.FromDays(10));
            StringBuilder builder = new StringBuilder();
            builder.Append("{\n");
            builder.Append("  \"OPENAI_API_KEY\": null,\n");
            builder.Append("  \"tokens\": {\n");
            builder.Append("    \"id_token\": \"" + Jwt(accessExpiresUtc, issued, "id-initial") + "\",\n");
            builder.Append("    \"access_token\": \"" + Jwt(accessExpiresUtc, issued, "access-initial-" + refreshToken) + "\",\n");
            builder.Append("    \"refresh_token\": \"" + refreshToken + "\",\n");
            builder.Append("    \"account_id\": \"acct-test\",\n");
            builder.Append("    \"future_token_field\": \"keep-me\"\n");
            builder.Append("  },\n");
            builder.Append("  \"last_refresh\": \"" + CodexAuthDocument.FormatTimestamp(issued) + "\",\n");
            builder.Append("  \"auth_mode\": \"chatgpt\",\n");
            builder.Append("  \"future_field\": { \"nested\": [1, 2, 3] }\n");
            builder.Append("}\n");
            return builder.ToString();
        }

        /// <summary>
        /// Stop the endpoint.
        /// </summary>
        public void Dispose()
        {
            _Server.Stop();
            if (_Server is IDisposable disposable) disposable.Dispose();
        }

        #endregion

        #region Private-Methods

        private async Task TokenAsync(HttpContextBase context)
        {
            Interlocked.Increment(ref _Requests);
            if (DelayMs > 0) await Task.Delay(DelayMs).ConfigureAwait(false);

            CodexTokenRefreshRequest? request = null;
            try
            {
                request = JsonSerializer.Deserialize<CodexTokenRefreshRequest>(context.Request.DataAsString);
            }
            catch (JsonException)
            {
                request = null;
            }
            lock (_Lock)
            {
                _LastRequest = request;
                _LastContentType = context.Request.ContentType;
            }

            switch (Mode)
            {
                case FakeTokenEndpointModeEnum.Reused:
                    await SendAsync(context, 401, "{\"error\":{\"code\":\"refresh_token_reused\",\"message\":\"Your refresh token has already been used to generate a new access token.\"}}").ConfigureAwait(false);
                    return;
                case FakeTokenEndpointModeEnum.InvalidGrant:
                    await SendAsync(context, 400, "{\"error\":\"invalid_grant\",\"error_description\":\"The refresh token is invalid.\"}").ConfigureAwait(false);
                    return;
                case FakeTokenEndpointModeEnum.ServerError:
                    await SendAsync(context, 503, "{\"error\":\"temporarily_unavailable\"}").ConfigureAwait(false);
                    return;
            }

            if (request == null || request.GrantType != "refresh_token" || String.IsNullOrEmpty(request.RefreshToken) || String.IsNullOrEmpty(request.ClientId))
            {
                await SendAsync(context, 400, "{\"error\":\"invalid_request\",\"error_description\":\"client_id, grant_type=refresh_token, and refresh_token are required.\"}").ConfigureAwait(false);
                return;
            }

            string accessToken;
            string refreshToken;
            string idToken;
            lock (_Lock)
            {
                if (!_Used.Add(request.RefreshToken))
                {
                    accessToken = String.Empty;
                    refreshToken = String.Empty;
                    idToken = String.Empty;
                }
                else
                {
                    int issued = ++_Issued;
                    DateTime now = DateTime.UtcNow;
                    accessToken = Jwt(now + AccessLifetime, now, "access-" + issued);
                    idToken = Jwt(now + AccessLifetime, now, "id-" + issued);
                    refreshToken = "rt-rotated-" + issued;
                    _LastIssuedAccessToken = accessToken;
                    _LastIssuedRefreshToken = refreshToken;
                }
            }
            if (accessToken.Length == 0)
            {
                await SendAsync(context, 401, "{\"error\":{\"code\":\"refresh_token_reused\",\"message\":\"Your refresh token has already been used to generate a new access token.\"}}").ConfigureAwait(false);
                return;
            }
            await SendAsync(context, 200, "{\"id_token\":\"" + idToken + "\",\"access_token\":\"" + accessToken + "\",\"refresh_token\":\"" + refreshToken + "\"}").ConfigureAwait(false);
        }

        private static async Task SendAsync(HttpContextBase context, int status, string body)
        {
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            await context.Response.Send(body).ConfigureAwait(false);
        }

        private static async Task NotFoundAsync(HttpContextBase context)
        {
            context.Response.StatusCode = 404;
            await context.Response.Send().ConfigureAwait(false);
        }

        private static string Base64Url(string text)
        {
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(text)).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }

        #endregion
    }
}
