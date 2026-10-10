namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Security;

    /// <summary>
    /// Converts an authenticated request context to and from the string claims Voltaic carries for each MCP call.
    /// Thread-safe.
    /// </summary>
    public static class PrincipalClaims
    {
        /// <summary>
        /// Encode a context.
        /// </summary>
        /// <param name="ctx">Context.</param>
        /// <returns>Claims.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx is null.</exception>
        public static Dictionary<string, string> Encode(RequestContext ctx)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            Dictionary<string, string> claims = new Dictionary<string, string>(StringComparer.Ordinal);
            claims["principalType"] = ctx.PrincipalType.ToString();
            if (ctx.AuthScheme.HasValue) claims["authScheme"] = ctx.AuthScheme.Value.ToString();
            if (!String.IsNullOrEmpty(ctx.PrincipalName)) claims["principalName"] = ctx.PrincipalName;
            if (!String.IsNullOrEmpty(ctx.TenantId)) claims["tenantId"] = ctx.TenantId;
            if (!String.IsNullOrEmpty(ctx.UserId)) claims["userId"] = ctx.UserId;
            if (!String.IsNullOrEmpty(ctx.CredentialId)) claims["credentialId"] = ctx.CredentialId;
            if (!String.IsNullOrEmpty(ctx.RunId)) claims["runId"] = ctx.RunId;
            if (!String.IsNullOrEmpty(ctx.SessionId)) claims["sessionId"] = ctx.SessionId;
            if (ctx.OriginPrincipalType.HasValue) claims["originPrincipalType"] = ctx.OriginPrincipalType.Value.ToString();
            if (!String.IsNullOrEmpty(ctx.OriginPrincipalId)) claims["originPrincipalId"] = ctx.OriginPrincipalId;
            claims["isAdmin"] = ctx.IsAdmin ? "true" : "false";
            claims["isTenantAdmin"] = ctx.IsTenantAdmin ? "true" : "false";
            return claims;
        }

        /// <summary>
        /// Decode claims into an authenticated context.
        /// </summary>
        /// <param name="claims">Claims.</param>
        /// <returns>Context; unauthenticated when claims are missing.</returns>
        public static RequestContext Decode(IReadOnlyDictionary<string, string>? claims)
        {
            RequestContext ctx = new RequestContext();
            if (claims == null || !claims.TryGetValue("principalType", out string? type)) return ctx;

            ctx.IsAuthenticated = true;
            ctx.AuthResult = AuthResultEnum.Success;
            ctx.PrincipalType = Enum.TryParse<PrincipalTypeEnum>(type, out PrincipalTypeEnum parsedType) ? parsedType : PrincipalTypeEnum.User;
            if (claims.TryGetValue("authScheme", out string? scheme) && Enum.TryParse<AuthSchemeEnum>(scheme, out AuthSchemeEnum parsedScheme)) ctx.AuthScheme = parsedScheme;
            ctx.PrincipalName = Get(claims, "principalName");
            ctx.TenantId = Get(claims, "tenantId");
            ctx.UserId = Get(claims, "userId");
            ctx.CredentialId = Get(claims, "credentialId");
            ctx.RunId = Get(claims, "runId");
            ctx.SessionId = Get(claims, "sessionId");
            if (claims.TryGetValue("originPrincipalType", out string? origin) && Enum.TryParse<PrincipalTypeEnum>(origin, out PrincipalTypeEnum parsedOrigin)) ctx.OriginPrincipalType = parsedOrigin;
            ctx.OriginPrincipalId = Get(claims, "originPrincipalId");
            ctx.IsAdmin = Get(claims, "isAdmin") == "true";
            ctx.IsTenantAdmin = Get(claims, "isTenantAdmin") == "true";
            return ctx;
        }

        private static string? Get(IReadOnlyDictionary<string, string> claims, string key)
        {
            return claims.TryGetValue(key, out string? value) && !String.IsNullOrEmpty(value) ? value : null;
        }
    }
}
