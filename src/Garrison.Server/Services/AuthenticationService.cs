namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Security.Cryptography;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Settings;
    using WatsonWebserver.Core;

    /// <summary>
    /// Authenticates requests and issues session tokens. Supported schemes: system administrator API key
    /// (x-api-key), bearer session tokens (Authorization or x-token, which must agree), signed credential requests
    /// (x-access-key, x-date, x-nonce, x-signature), and direct credential headers (x-access-key, x-secret-key).
    /// Thread-safe.
    /// </summary>
    public class AuthenticationService
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly TokenService _Tokens;
        private readonly SecretCipher _Cipher;
        private readonly ServerSettings _Settings;
        private readonly AuditService _Audit;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tokens">Token service.</param>
        /// <param name="cipher">Secret cipher (credential secrets).</param>
        /// <param name="settings">Server settings.</param>
        /// <param name="audit">Audit service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public AuthenticationService(DatabaseDriverBase database, TokenService tokens, SecretCipher cipher, ServerSettings settings, AuditService audit)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Tokens = tokens ?? throw new ArgumentNullException(nameof(tokens));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Watson AuthenticateRequest hook. Rejects unauthenticated requests with 401 and stores the context in metadata.
        /// </summary>
        /// <param name="context">HTTP context.</param>
        /// <returns>Task.</returns>
        public async Task AuthenticateRequestAsync(HttpContextBase context)
        {
            RequestContext resolved = await ResolveAsync(
                context.Request.Headers,
                context.Request.Method.ToString(),
                context.Request.Url.RawWithoutQuery,
                QueryString(context.Request.Url.RawWithQuery),
                context.Request.DataAsBytes,
                context.Request.Source.IpAddress,
                context.Token).ConfigureAwait(false);

            context.Metadata = resolved;
            if (!resolved.IsAuthenticated)
            {
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                ErrorResponse error = new ErrorResponse("Unauthorized", "AuthenticationRequired", "Authentication is required or the supplied credentials are invalid.");
                error.RequestId = resolved.RequestId;
                await context.Response.Send(Serializer.Serialize(error)).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Resolve a request into an authenticated context from its headers and body.
        /// </summary>
        /// <param name="headers">Request headers.</param>
        /// <param name="method">HTTP method.</param>
        /// <param name="path">Path without query.</param>
        /// <param name="query">Raw query without the question mark.</param>
        /// <param name="body">Body bytes, used for signed requests.</param>
        /// <param name="sourceIp">Source IP.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Context; IsAuthenticated is false when authentication failed.</returns>
        public async Task<RequestContext> ResolveAsync(System.Collections.Specialized.NameValueCollection headers, string method, string path, string? query, byte[]? body, string? sourceIp, CancellationToken token = default)
        {
            RequestContext ctx = new RequestContext();
            ctx.SourceIp = sourceIp;
            string? requestId = headers[Constants.HeaderRequestId];
            if (!String.IsNullOrEmpty(requestId) && requestId.Length <= 64) ctx.RequestId = requestId;

            string? apiKey = headers[Constants.HeaderApiKey];
            if (!String.IsNullOrEmpty(apiKey))
            {
                if (PasswordHasher.FixedTimeEquals(apiKey, _Settings.Auth.AdminApiKey))
                {
                    ctx.IsAuthenticated = true;
                    ctx.AuthResult = AuthResultEnum.Success;
                    ctx.AuthScheme = AuthSchemeEnum.AdminApiKey;
                    ctx.PrincipalType = PrincipalTypeEnum.Administrator;
                    ctx.PrincipalName = "System Administrator (API key)";
                    ctx.IsAdmin = true;
                    ctx.TenantId = headers[Constants.HeaderTenantId];
                    return ctx;
                }
                return await FailAsync(ctx, AuthSchemeEnum.AdminApiKey, AuthResultEnum.Invalid, "Invalid administrator API key.", token).ConfigureAwait(false);
            }

            string? bearer = ExtractBearer(headers["Authorization"]);
            string? xToken = headers[Constants.HeaderToken];
            if (!String.IsNullOrEmpty(bearer) && !String.IsNullOrEmpty(xToken) && !PasswordHasher.FixedTimeEquals(bearer, xToken))
            {
                return await FailAsync(ctx, AuthSchemeEnum.BearerToken, AuthResultEnum.Invalid, "Authorization and x-token carry different tokens.", token).ConfigureAwait(false);
            }
            string? sessionToken = !String.IsNullOrEmpty(bearer) ? bearer : xToken;
            if (!String.IsNullOrEmpty(sessionToken))
            {
                return await ResolveSessionTokenAsync(ctx, sessionToken, String.IsNullOrEmpty(bearer) ? AuthSchemeEnum.XToken : AuthSchemeEnum.BearerToken, token).ConfigureAwait(false);
            }

            string? accessKey = headers[Constants.HeaderAccessKey];
            if (!String.IsNullOrEmpty(accessKey))
            {
                string? signature = headers[Constants.HeaderSignature];
                string? secret = headers[Constants.HeaderSecretKey];
                if (!String.IsNullOrEmpty(signature) && !String.IsNullOrEmpty(secret))
                {
                    return await FailAsync(ctx, AuthSchemeEnum.AccessKeySignature, AuthResultEnum.Invalid, "Supply either x-signature or x-secret-key, not both.", token).ConfigureAwait(false);
                }

                Credential? credential = await _Database.Credentials.ReadByAccessKeyAsync(accessKey, token).ConfigureAwait(false);
                if (credential == null) return await FailAsync(ctx, AuthSchemeEnum.AccessKeySecret, AuthResultEnum.NotFound, "Unknown access key.", token).ConfigureAwait(false);

                string? tenantHint = headers[Constants.HeaderTenantId];
                if (!String.IsNullOrEmpty(tenantHint) && tenantHint != credential.TenantId)
                {
                    return await FailAsync(ctx, AuthSchemeEnum.AccessKeySecret, AuthResultEnum.Invalid, "Tenant header does not match the credential tenant.", token).ConfigureAwait(false);
                }

                string storedSecret = DecryptCredentialSecret(credential);
                if (!String.IsNullOrEmpty(signature))
                {
                    string? date = headers[Constants.HeaderDate];
                    string? nonce = headers[Constants.HeaderNonce];
                    if (!RequestSigner.DateWithinSkew(date, _Settings.Auth.SignedRequestSkewSeconds) || String.IsNullOrEmpty(nonce))
                    {
                        return await FailAsync(ctx, AuthSchemeEnum.AccessKeySignature, AuthResultEnum.Invalid, "Signed request date is outside the allowed skew or the nonce is missing.", token).ConfigureAwait(false);
                    }
                    string canonical = RequestSigner.Canonicalize(method, path, query, credential.TenantId, date!, nonce, body);
                    string expected = RequestSigner.Sign(storedSecret, canonical);
                    if (!PasswordHasher.FixedTimeEquals(expected, signature.ToLowerInvariant()))
                    {
                        return await FailAsync(ctx, AuthSchemeEnum.AccessKeySignature, AuthResultEnum.Invalid, "Signature mismatch.", token).ConfigureAwait(false);
                    }
                    // Nonces are shared by every replica (P10.2), so a captured request cannot be replayed on another
                    // one. A request is accepted while its date is within the skew either side of now, so a nonce must
                    // be remembered for twice the skew after its first use.
                    DateTime nonceExpires = DateTime.UtcNow.AddSeconds(2 * _Settings.Auth.SignedRequestSkewSeconds + 5);
                    if (!await _Database.Nonces.TryUseAsync(accessKey + ":" + nonce, nonceExpires, token).ConfigureAwait(false))
                    {
                        return await FailAsync(ctx, AuthSchemeEnum.AccessKeySignature, AuthResultEnum.Invalid, "Nonce was already used.", token).ConfigureAwait(false);
                    }
                    return await BuildCredentialContextAsync(ctx, credential, AuthSchemeEnum.AccessKeySignature, token).ConfigureAwait(false);
                }

                if (String.IsNullOrEmpty(secret) || !PasswordHasher.FixedTimeEquals(secret, storedSecret))
                {
                    return await FailAsync(ctx, AuthSchemeEnum.AccessKeySecret, AuthResultEnum.Invalid, "Invalid secret key.", token).ConfigureAwait(false);
                }
                return await BuildCredentialContextAsync(ctx, credential, AuthSchemeEnum.AccessKeySecret, token).ConfigureAwait(false);
            }

            ctx.AuthResult = AuthResultEnum.NotFound;
            return ctx;
        }

        /// <summary>
        /// Authenticate a user by tenant, email, and password.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="email">Email.</param>
        /// <param name="password">Password.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>User or null.</returns>
        public async Task<User?> AuthenticateUserAsync(string? tenantId, string? email, string? password, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId) || String.IsNullOrEmpty(email) || String.IsNullOrEmpty(password)) return null;
            Tenant? tenant = await _Database.Tenants.ReadAsync(tenantId, token).ConfigureAwait(false);
            if (tenant == null || !tenant.Active) return null;
            User? user = await _Database.Users.ReadByEmailAsync(tenantId, email, token).ConfigureAwait(false);
            if (user == null || !user.Active) return null;
            if (!PasswordHasher.Verify(password, user.PasswordSha256)) return null;
            return user;
        }

        /// <summary>
        /// Authenticate a credential by access key and secret key.
        /// </summary>
        /// <param name="accessKey">Access key.</param>
        /// <param name="secretKey">Secret key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Credential or null.</returns>
        public async Task<Credential?> AuthenticateCredentialAsync(string? accessKey, string? secretKey, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(accessKey) || String.IsNullOrEmpty(secretKey)) return null;
            Credential? credential = await _Database.Credentials.ReadByAccessKeyAsync(accessKey, token).ConfigureAwait(false);
            if (credential == null || !await CredentialUsableAsync(credential, token).ConfigureAwait(false)) return null;
            if (!PasswordHasher.FixedTimeEquals(secretKey, DecryptCredentialSecret(credential))) return null;
            return credential;
        }

        /// <summary>
        /// Issue a session token for a user.
        /// </summary>
        /// <param name="user">User.</param>
        /// <param name="scheme">Scheme that authenticated the user.</param>
        /// <param name="sourceIp">Source IP.</param>
        /// <param name="userAgent">User agent.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Issued token response.</returns>
        /// <exception cref="ArgumentNullException">Thrown when user is null.</exception>
        public async Task<TokenResponse> IssueForUserAsync(User user, AuthSchemeEnum scheme, string? sourceIp, string? userAgent, CancellationToken token = default)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));
            AuthSession session = NewSession(user.TenantId, PrincipalTypeEnum.User, scheme, sourceIp, userAgent, DateTime.UtcNow.AddMinutes(_Tokens.LifetimeMinutes));
            session.UserId = user.Id;
            await _Database.Sessions.CreateAsync(session, token).ConfigureAwait(false);
            TokenPayload payload = Payload(session);
            payload.UserId = user.Id;
            await _Audit.WriteAsync(null, AuditEventTypeEnum.SessionIssued, "Session", session.Id, "Session issued to user " + user.Email + ".", user.TenantId, token).ConfigureAwait(false);
            return Response(session, payload, user.TenantId);
        }

        /// <summary>
        /// Issue a session token for a credential.
        /// </summary>
        /// <param name="credential">Credential.</param>
        /// <param name="scheme">Scheme that authenticated the credential.</param>
        /// <param name="sourceIp">Source IP.</param>
        /// <param name="userAgent">User agent.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Issued token response.</returns>
        /// <exception cref="ArgumentNullException">Thrown when credential is null.</exception>
        public async Task<TokenResponse> IssueForCredentialAsync(Credential credential, AuthSchemeEnum scheme, string? sourceIp, string? userAgent, CancellationToken token = default)
        {
            if (credential == null) throw new ArgumentNullException(nameof(credential));
            AuthSession session = NewSession(credential.TenantId, PrincipalTypeEnum.Credential, scheme, sourceIp, userAgent, DateTime.UtcNow.AddMinutes(_Tokens.LifetimeMinutes));
            session.CredentialId = credential.Id;
            await _Database.Sessions.CreateAsync(session, token).ConfigureAwait(false);
            TokenPayload payload = Payload(session);
            payload.CredentialId = credential.Id;
            return Response(session, payload, credential.TenantId);
        }

        /// <summary>
        /// Issue a run token used by a harness to call Garrison's MCP tools on behalf of the run's caller.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="expiresUtc">Expiry (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Opaque token.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task<string> IssueForRunAsync(Run run, DateTime expiresUtc, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            AuthSession session = NewSession(run.TenantId, PrincipalTypeEnum.Run, AuthSchemeEnum.RunToken, null, "garrison-run", expiresUtc);
            session.RunId = run.Id;
            session.OriginPrincipalType = run.CallerType;
            session.OriginPrincipalId = run.CallerId;
            await _Database.Sessions.CreateAsync(session, token).ConfigureAwait(false);
            TokenPayload payload = Payload(session);
            payload.RunId = run.Id;
            return _Tokens.Issue(payload);
        }

        /// <summary>
        /// Validate a token string and return its payload, without loading the principal.
        /// </summary>
        /// <param name="tokenString">Token.</param>
        /// <returns>Payload or null.</returns>
        public TokenPayload? Decode(string? tokenString)
        {
            return _Tokens.Validate(tokenString);
        }

        /// <summary>
        /// Revoke the session behind a token.
        /// </summary>
        /// <param name="tokenString">Token.</param>
        /// <param name="reason">Reason.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when revoked.</returns>
        public async Task<bool> RevokeAsync(string? tokenString, string reason, CancellationToken token = default)
        {
            TokenPayload? payload = _Tokens.Validate(tokenString);
            if (payload == null) return false;
            bool revoked = await _Database.Sessions.RevokeAsync(payload.SessionId, reason, token).ConfigureAwait(false);
            if (revoked) await _Audit.WriteAsync(null, AuditEventTypeEnum.SessionRevoked, "Session", payload.SessionId, reason, payload.TenantId, token).ConfigureAwait(false);
            return revoked;
        }

        /// <summary>
        /// Decrypt a credential's stored secret.
        /// </summary>
        /// <param name="credential">Credential.</param>
        /// <returns>Secret, or empty when it cannot be decrypted.</returns>
        public string DecryptCredentialSecret(Credential credential)
        {
            if (credential == null || String.IsNullOrEmpty(credential.SecretKeyEncrypted)) return String.Empty;
            try
            {
                return _Cipher.Decrypt(credential.SecretKeyEncrypted, credential.Id);
            }
            catch (CryptographicException)
            {
                return String.Empty;
            }
            catch (FormatException)
            {
                return String.Empty;
            }
        }

        #endregion

        #region Private-Methods

        private async Task<RequestContext> ResolveSessionTokenAsync(RequestContext ctx, string sessionToken, AuthSchemeEnum scheme, CancellationToken token)
        {
            TokenPayload? payload = _Tokens.Validate(sessionToken);
            if (payload == null) return await FailAsync(ctx, scheme, AuthResultEnum.Invalid, "Token is invalid or expired.", token).ConfigureAwait(false);

            AuthSession? session = await _Database.Sessions.ReadByTokenIdAsync(payload.TokenId, token).ConfigureAwait(false);
            if (session == null || session.Id != payload.SessionId) return await FailAsync(ctx, scheme, AuthResultEnum.NotFound, "Session not found.", token).ConfigureAwait(false);
            if (!session.Active || session.RevokedUtc.HasValue || session.ExpiresUtc < DateTime.UtcNow) return await FailAsync(ctx, scheme, AuthResultEnum.Inactive, "Session is revoked or expired.", token).ConfigureAwait(false);
            if (session.TenantId != payload.TenantId) return await FailAsync(ctx, scheme, AuthResultEnum.Invalid, "Session tenant mismatch.", token).ConfigureAwait(false);

            if (!String.IsNullOrEmpty(session.TenantId))
            {
                Tenant? tenant = await _Database.Tenants.ReadAsync(session.TenantId, token).ConfigureAwait(false);
                if (tenant == null || !tenant.Active) return await FailAsync(ctx, scheme, AuthResultEnum.Inactive, "Tenant is inactive.", token).ConfigureAwait(false);
            }

            ctx.SessionId = session.Id;

            if (payload.PrincipalType == PrincipalTypeEnum.User && !String.IsNullOrEmpty(payload.UserId) && !String.IsNullOrEmpty(payload.TenantId))
            {
                User? user = await _Database.Users.ReadAsync(payload.TenantId, payload.UserId, token).ConfigureAwait(false);
                if (user == null || !user.Active) return await FailAsync(ctx, scheme, AuthResultEnum.Inactive, "User is inactive.", token).ConfigureAwait(false);
                ctx.IsAuthenticated = true;
                ctx.AuthResult = AuthResultEnum.Success;
                ctx.AuthScheme = scheme;
                ctx.PrincipalType = PrincipalTypeEnum.User;
                ctx.TenantId = user.TenantId;
                ctx.UserId = user.Id;
                ctx.User = user;
                ctx.PrincipalName = user.Email;
                ctx.IsAdmin = user.IsAdmin;
                ctx.IsTenantAdmin = user.IsTenantAdmin;
                return ctx;
            }

            if (payload.PrincipalType == PrincipalTypeEnum.Credential && !String.IsNullOrEmpty(payload.CredentialId) && !String.IsNullOrEmpty(payload.TenantId))
            {
                Credential? credential = await _Database.Credentials.ReadAsync(payload.TenantId, payload.CredentialId, token).ConfigureAwait(false);
                if (credential == null) return await FailAsync(ctx, scheme, AuthResultEnum.NotFound, "Credential not found.", token).ConfigureAwait(false);
                return await BuildCredentialContextAsync(ctx, credential, scheme, token).ConfigureAwait(false);
            }

            if (payload.PrincipalType == PrincipalTypeEnum.Run && !String.IsNullOrEmpty(payload.RunId) && !String.IsNullOrEmpty(payload.TenantId))
            {
                ctx.IsAuthenticated = true;
                ctx.AuthResult = AuthResultEnum.Success;
                ctx.AuthScheme = AuthSchemeEnum.RunToken;
                ctx.PrincipalType = PrincipalTypeEnum.Run;
                ctx.TenantId = payload.TenantId;
                ctx.RunId = payload.RunId;
                ctx.OriginPrincipalType = session.OriginPrincipalType;
                ctx.OriginPrincipalId = session.OriginPrincipalId;
                ctx.PrincipalName = "run " + payload.RunId;
                return ctx;
            }

            return await FailAsync(ctx, scheme, AuthResultEnum.Invalid, "Token principal is not recognized.", token).ConfigureAwait(false);
        }

        private async Task<RequestContext> BuildCredentialContextAsync(RequestContext ctx, Credential credential, AuthSchemeEnum scheme, CancellationToken token)
        {
            if (!await CredentialUsableAsync(credential, token).ConfigureAwait(false))
            {
                return await FailAsync(ctx, scheme, AuthResultEnum.Inactive, "Credential, owner, or tenant is inactive or expired.", token).ConfigureAwait(false);
            }

            User? owner = await _Database.Users.ReadAsync(credential.TenantId, credential.UserId, token).ConfigureAwait(false);
            await _Database.Credentials.TouchLastUsedAsync(credential.Id, token).ConfigureAwait(false);

            ctx.IsAuthenticated = true;
            ctx.AuthResult = AuthResultEnum.Success;
            ctx.AuthScheme = scheme;
            ctx.PrincipalType = PrincipalTypeEnum.Credential;
            ctx.TenantId = credential.TenantId;
            ctx.CredentialId = credential.Id;
            ctx.UserId = credential.UserId;
            ctx.Credential = credential;
            ctx.User = owner;
            ctx.PrincipalName = credential.Name;
            ctx.IsAdmin = owner != null && owner.IsAdmin;
            ctx.IsTenantAdmin = owner != null && owner.IsTenantAdmin;
            return ctx;
        }

        private async Task<bool> CredentialUsableAsync(Credential credential, CancellationToken token)
        {
            if (!credential.Active) return false;
            if (credential.ExpiresUtc.HasValue && credential.ExpiresUtc.Value < DateTime.UtcNow) return false;
            Tenant? tenant = await _Database.Tenants.ReadAsync(credential.TenantId, token).ConfigureAwait(false);
            if (tenant == null || !tenant.Active) return false;
            User? owner = await _Database.Users.ReadAsync(credential.TenantId, credential.UserId, token).ConfigureAwait(false);
            return owner != null && owner.Active;
        }

        private async Task<RequestContext> FailAsync(RequestContext ctx, AuthSchemeEnum scheme, AuthResultEnum result, string reason, CancellationToken token)
        {
            ctx.IsAuthenticated = false;
            ctx.AuthResult = result;
            ctx.AuthScheme = scheme;
            AuditRecord record = new AuditRecord();
            record.EventType = AuditEventTypeEnum.AuthFailure;
            record.RequestId = ctx.RequestId;
            record.AuthScheme = scheme;
            record.AuthResult = result;
            record.SourceIp = ctx.SourceIp;
            record.Reason = reason;
            record.StatusCode = 401;
            await _Audit.WriteAsync(record, token).ConfigureAwait(false);
            return ctx;
        }

        private static AuthSession NewSession(string? tenantId, PrincipalTypeEnum principal, AuthSchemeEnum scheme, string? sourceIp, string? userAgent, DateTime expiresUtc)
        {
            AuthSession session = new AuthSession();
            session.TenantId = tenantId;
            session.PrincipalType = principal;
            session.AuthScheme = scheme;
            session.TokenId = SecretGenerator.Alphanumeric(40);
            session.SourceIp = sourceIp;
            session.UserAgent = userAgent != null && userAgent.Length > 500 ? userAgent.Substring(0, 500) : userAgent;
            session.ExpiresUtc = expiresUtc;
            return session;
        }

        private static TokenPayload Payload(AuthSession session)
        {
            TokenPayload payload = new TokenPayload();
            payload.SessionId = session.Id;
            payload.TokenId = session.TokenId;
            payload.PrincipalType = session.PrincipalType;
            payload.TenantId = session.TenantId;
            payload.IssuedUtc = DateTime.UtcNow;
            payload.ExpiresUtc = session.ExpiresUtc;
            return payload;
        }

        private TokenResponse Response(AuthSession session, TokenPayload payload, string? tenantId)
        {
            TokenResponse response = new TokenResponse();
            response.Token = _Tokens.Issue(payload);
            response.ExpiresUtc = session.ExpiresUtc;
            response.TenantId = tenantId;
            response.SessionId = session.Id;
            response.PrincipalType = session.PrincipalType;
            return response;
        }

        private static string? ExtractBearer(string? authorization)
        {
            if (String.IsNullOrEmpty(authorization)) return null;
            if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return authorization.Substring(7).Trim();
            return null;
        }

        private static string? QueryString(string? rawWithQuery)
        {
            if (String.IsNullOrEmpty(rawWithQuery)) return null;
            int index = rawWithQuery.IndexOf('?');
            return index < 0 ? null : rawWithQuery.Substring(index + 1);
        }

        #endregion
    }
}
