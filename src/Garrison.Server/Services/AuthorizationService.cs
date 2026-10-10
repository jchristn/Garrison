namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Backplane;

    /// <summary>
    /// Authorization per AUTHENTICATION.md: bypass order (system administrator, IsAdmin, IsTenantAdmin), expanded
    /// RBAC grants with explicit deny, resource scope and inheritance, credential owner ceiling, and the run principal
    /// ceiling used for delegation. Denials and privileged bypasses are audited. Grants are cached per principal and
    /// invalidated by <see cref="Invalidate"/> (on every replica, through the backplane) and a time-to-live. Thread-safe.
    /// </summary>
    public class AuthorizationService
    {
        #region Public-Members

        /// <summary>
        /// Grant cache time to live in seconds. Minimum 0 (no cache), maximum 3600, default 15.
        /// </summary>
        public int CacheSeconds
        {
            get
            {
                return _CacheSeconds;
            }
            set
            {
                _CacheSeconds = Math.Clamp(value, 0, 3600);
            }
        }

        /// <summary>
        /// Backplane used by <see cref="Invalidate"/> to drop the caches of other replicas. Null (the default) leaves
        /// them to expire after <see cref="CacheSeconds"/>.
        /// </summary>
        public IEventBackplane? Backplane { get; set; } = null;

        #endregion

        #region Private-Members

        private static readonly HashSet<ResourceTypeEnum> _PlatformResources = new HashSet<ResourceTypeEnum>
        {
            ResourceTypeEnum.NodePool,
            ResourceTypeEnum.Settings,
            ResourceTypeEnum.Admin
        };

        private readonly DatabaseDriverBase _Database;
        private readonly AuditService _Audit;
        private readonly ConcurrentDictionary<string, CachedGrants> _Cache = new ConcurrentDictionary<string, CachedGrants>(StringComparer.Ordinal);
        private int _CacheSeconds = 15;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="audit">Audit service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public AuthorizationService(DatabaseDriverBase database, AuditService audit)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Authorize an operation. Updates the context's authorization fields and audits denials.
        /// </summary>
        /// <param name="ctx">Request context.</param>
        /// <param name="tenantId">Tenant the operation targets, or null for platform-level operations.</param>
        /// <param name="resourceType">Resource type.</param>
        /// <param name="operation">Operation.</param>
        /// <param name="resourceId">Target resource identifier, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Decision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx is null.</exception>
        public async Task<AuthorizationDecision> AuthorizeAsync(RequestContext ctx, string? tenantId, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));

            AuthorizationDecision decision = await EvaluateAsync(ctx, tenantId, resourceType, operation, resourceId, token).ConfigureAwait(false);
            ctx.ResourceType = resourceType;
            ctx.Operation = operation;
            ctx.AuthorizationResult = decision.Result;

            if (!decision.Permitted)
            {
                AuditRecord record = new AuditRecord();
                record.EventType = AuditEventTypeEnum.AuthorizationDenied;
                record.TenantId = tenantId ?? ctx.TenantId;
                record.RequestId = ctx.RequestId;
                record.AuthScheme = ctx.AuthScheme;
                record.PrincipalType = ctx.PrincipalType;
                record.PrincipalId = ctx.PrincipalId;
                record.PrincipalName = ctx.PrincipalName;
                record.SessionId = ctx.SessionId;
                record.SourceIp = ctx.SourceIp;
                record.ResourceType = resourceType.ToString();
                record.ResourceId = resourceId;
                record.Operation = operation.ToString();
                record.AuthResult = ctx.AuthResult;
                record.AuthorizationResult = decision.Result;
                record.Reason = decision.Reason;
                record.StatusCode = decision.Result == AuthorizationResultEnum.NotFound ? 404 : 403;
                await _Audit.WriteAsync(record, token).ConfigureAwait(false);
            }
            else if (decision.BypassReason != null && operation != OperationTypeEnum.Read)
            {
                AuditRecord record = new AuditRecord();
                record.EventType = AuditEventTypeEnum.AuthorizationBypass;
                record.TenantId = tenantId ?? ctx.TenantId;
                record.RequestId = ctx.RequestId;
                record.PrincipalType = ctx.PrincipalType;
                record.PrincipalId = ctx.PrincipalId;
                record.PrincipalName = ctx.PrincipalName;
                record.ResourceType = resourceType.ToString();
                record.ResourceId = resourceId;
                record.Operation = operation.ToString();
                record.AuthorizationResult = decision.Result;
                record.BypassReason = decision.BypassReason;
                await _Audit.WriteAsync(record, token).ConfigureAwait(false);
            }

            return decision;
        }

        /// <summary>
        /// Evaluate without side effects.
        /// </summary>
        /// <param name="ctx">Request context.</param>
        /// <param name="tenantId">Target tenant, or null.</param>
        /// <param name="resourceType">Resource type.</param>
        /// <param name="operation">Operation.</param>
        /// <param name="resourceId">Resource identifier, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Decision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx is null.</exception>
        public async Task<AuthorizationDecision> EvaluateAsync(RequestContext ctx, string? tenantId, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (!ctx.IsAuthenticated) return AuthorizationDecision.Deny(AuthorizationResultEnum.DeniedImplicit, "Not authenticated.");

            if (ctx.PrincipalType == PrincipalTypeEnum.Administrator || ctx.IsAdmin)
            {
                AuthorizationDecision admin = AuthorizationDecision.Permit("System administrator.");
                admin.BypassReason = ctx.PrincipalType == PrincipalTypeEnum.Administrator ? "AdminApiKey" : "IsAdmin";
                return admin;
            }

            string? effectiveTenant = tenantId ?? ctx.TenantId;
            if (!String.IsNullOrEmpty(tenantId) && tenantId != ctx.TenantId)
            {
                return AuthorizationDecision.Deny(AuthorizationResultEnum.NotFound, "Resource is not visible to this principal.");
            }

            if (IsPlatformOnly(resourceType, operation))
            {
                return AuthorizationDecision.Deny(AuthorizationResultEnum.DeniedImplicit, operation + " on " + resourceType + " requires a system administrator.");
            }

            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                return await EvaluateRunAsync(ctx, effectiveTenant!, resourceType, operation, resourceId, token).ConfigureAwait(false);
            }

            if (ctx.IsTenantAdmin && !String.IsNullOrEmpty(effectiveTenant))
            {
                AuthorizationDecision tenantAdmin = AuthorizationDecision.Permit("Tenant administrator.");
                tenantAdmin.BypassReason = "IsTenantAdmin";
                if (ctx.PrincipalType == PrincipalTypeEnum.Credential)
                {
                    List<PermissionGrant> credentialGrants = await GrantsForCredentialAsync(effectiveTenant, ctx.CredentialId!, token).ConfigureAwait(false);
                    if (credentialGrants.Count > 0)
                    {
                        AuthorizationDecision scoped = PermissionEvaluator.Evaluate(credentialGrants, resourceType, operation, resourceId);
                        if (!scoped.Permitted) return scoped;
                    }
                }
                return tenantAdmin;
            }

            if (String.IsNullOrEmpty(effectiveTenant)) return AuthorizationDecision.Deny(AuthorizationResultEnum.DeniedImplicit, "No tenant could be resolved.");

            if (ctx.PrincipalType == PrincipalTypeEnum.Credential && !String.IsNullOrEmpty(ctx.CredentialId))
            {
                List<PermissionGrant> credentialGrants = await GrantsForCredentialAsync(effectiveTenant, ctx.CredentialId, token).ConfigureAwait(false);
                AuthorizationDecision credentialDecision = PermissionEvaluator.Evaluate(credentialGrants, resourceType, operation, resourceId);
                if (!credentialDecision.Permitted) return credentialDecision;
                if (String.IsNullOrEmpty(ctx.UserId)) return credentialDecision;

                List<PermissionGrant> ownerGrants = await GrantsForUserAsync(effectiveTenant, ctx.UserId, token).ConfigureAwait(false);
                AuthorizationDecision ownerDecision = PermissionEvaluator.Evaluate(ownerGrants, resourceType, operation, resourceId);
                if (!ownerDecision.Permitted)
                {
                    ownerDecision.Reason = "Owner ceiling: " + ownerDecision.Reason;
                    return ownerDecision;
                }
                return credentialDecision;
            }

            if (!String.IsNullOrEmpty(ctx.UserId))
            {
                List<PermissionGrant> userGrants = await GrantsForUserAsync(effectiveTenant, ctx.UserId, token).ConfigureAwait(false);
                return PermissionEvaluator.Evaluate(userGrants, resourceType, operation, resourceId);
            }

            return AuthorizationDecision.Deny(AuthorizationResultEnum.DeniedImplicit, "Principal has no grants.");
        }

        /// <summary>
        /// Expanded grants for a user.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="userId">User identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Grants.</returns>
        public async Task<List<PermissionGrant>> GrantsForUserAsync(string tenantId, string userId, CancellationToken token = default)
        {
            string key = "u:" + tenantId + ":" + userId;
            List<PermissionGrant>? cached = FromCache(key);
            if (cached != null) return cached;

            List<UserRoleAssignment> assignments = await _Database.UserRoleAssignments.ListByUserAsync(tenantId, userId, token).ConfigureAwait(false);
            List<PermissionGrant> grants = new List<PermissionGrant>();
            foreach (UserRoleAssignment assignment in assignments)
            {
                grants.AddRange(await ExpandAsync(assignment.RoleId, assignment.RoleName, assignment.ResourceScope, assignment.ResourceId, assignment.InheritsToChildren, tenantId, token).ConfigureAwait(false));
            }
            ToCache(key, grants);
            return grants;
        }

        /// <summary>
        /// Expanded grants for a credential.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="credentialId">Credential identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Grants.</returns>
        public async Task<List<PermissionGrant>> GrantsForCredentialAsync(string tenantId, string credentialId, CancellationToken token = default)
        {
            string key = "c:" + tenantId + ":" + credentialId;
            List<PermissionGrant>? cached = FromCache(key);
            if (cached != null) return cached;

            List<CredentialScopeAssignment> assignments = await _Database.CredentialScopeAssignments.ListByCredentialAsync(tenantId, credentialId, token).ConfigureAwait(false);
            List<PermissionGrant> grants = new List<PermissionGrant>();
            foreach (CredentialScopeAssignment assignment in assignments)
            {
                grants.AddRange(await ExpandAsync(assignment.RoleId, assignment.RoleName, assignment.ResourceScope, assignment.ResourceId, assignment.InheritsToChildren, tenantId, token).ConfigureAwait(false));
            }
            ToCache(key, grants);
            return grants;
        }

        /// <summary>
        /// Drop every cached grant set here and, through the backplane, on every other replica. Call after any change to
        /// roles, permissions, assignments, users, or credentials.
        /// </summary>
        public void Invalidate()
        {
            _Cache.Clear();
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.PermissionsChanged, null));
        }

        /// <summary>
        /// Drop every cached grant set on this replica only (a PermissionsChanged message from another replica).
        /// </summary>
        public void InvalidateLocal()
        {
            _Cache.Clear();
        }

        #endregion

        #region Private-Methods

        private static bool IsPlatformOnly(ResourceTypeEnum resourceType, OperationTypeEnum operation)
        {
            if (_PlatformResources.Contains(resourceType)) return true;
            if (resourceType == ResourceTypeEnum.Tenant && (operation == OperationTypeEnum.Create || operation == OperationTypeEnum.Delete)) return true;
            if (resourceType == ResourceTypeEnum.Node && operation != OperationTypeEnum.Read && operation != OperationTypeEnum.Execute) return true;
            return false;
        }

        private async Task<AuthorizationDecision> EvaluateRunAsync(RequestContext ctx, string tenantId, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId, CancellationToken token)
        {
            bool allowed =
                (resourceType == ResourceTypeEnum.Agent && (operation == OperationTypeEnum.Read || operation == OperationTypeEnum.Execute)) ||
                (resourceType == ResourceTypeEnum.Run && (operation == OperationTypeEnum.Read || operation == OperationTypeEnum.Create || operation == OperationTypeEnum.Update));
            if (!allowed) return AuthorizationDecision.Deny(AuthorizationResultEnum.DeniedImplicit, "Run tokens may only discover and invoke agents and read runs.");

            if (ctx.OriginPrincipalType == PrincipalTypeEnum.Administrator) return AuthorizationDecision.Permit("Run on behalf of a system administrator.");
            if (String.IsNullOrEmpty(ctx.OriginPrincipalId)) return AuthorizationDecision.Deny(AuthorizationResultEnum.DeniedImplicit, "Run has no originating principal.");

            RequestContext origin = new RequestContext();
            origin.IsAuthenticated = true;
            origin.TenantId = tenantId;
            if (ctx.OriginPrincipalType == PrincipalTypeEnum.Credential)
            {
                Credential? credential = await _Database.Credentials.ReadAsync(tenantId, ctx.OriginPrincipalId, token).ConfigureAwait(false);
                if (credential == null || !credential.Active) return AuthorizationDecision.Deny(AuthorizationResultEnum.DeniedImplicit, "Originating credential is inactive.");
                User? owner = await _Database.Users.ReadAsync(tenantId, credential.UserId, token).ConfigureAwait(false);
                origin.PrincipalType = PrincipalTypeEnum.Credential;
                origin.CredentialId = credential.Id;
                origin.UserId = credential.UserId;
                origin.IsAdmin = owner != null && owner.IsAdmin;
                origin.IsTenantAdmin = owner != null && owner.IsTenantAdmin;
            }
            else
            {
                User? user = await _Database.Users.ReadAsync(tenantId, ctx.OriginPrincipalId, token).ConfigureAwait(false);
                if (user == null || !user.Active) return AuthorizationDecision.Deny(AuthorizationResultEnum.DeniedImplicit, "Originating user is inactive.");
                origin.PrincipalType = PrincipalTypeEnum.User;
                origin.UserId = user.Id;
                origin.IsAdmin = user.IsAdmin;
                origin.IsTenantAdmin = user.IsTenantAdmin;
            }

            AuthorizationDecision ceiling = await EvaluateAsync(origin, tenantId, resourceType, operation, resourceId, token).ConfigureAwait(false);
            if (!ceiling.Permitted) ceiling.Reason = "Originating principal ceiling: " + ceiling.Reason;
            ceiling.BypassReason = null;
            return ceiling;
        }

        private async Task<List<PermissionGrant>> ExpandAsync(string? roleId, string? roleName, ResourceScopeEnum scope, string? resourceId, bool inherits, string tenantId, CancellationToken token)
        {
            List<PermissionGrant> grants = new List<PermissionGrant>();

            BuiltInRole? builtIn = BuiltInRoles.All.FirstOrDefault(r => r.Id == roleId) ?? BuiltInRoles.Find(roleName);
            if (builtIn != null)
            {
                foreach (BuiltInPermission permission in builtIn.Permissions)
                {
                    grants.Add(Grant(permission.ResourceTypes, permission.Operations, permission.PermissionType, scope, resourceId, inherits, builtIn.Name));
                }
                return grants;
            }

            Role? role = null;
            if (!String.IsNullOrEmpty(roleId)) role = await _Database.Roles.ReadAsync(tenantId, roleId, token).ConfigureAwait(false);
            if (role == null && !String.IsNullOrEmpty(roleName)) role = await _Database.Roles.ReadByNameAsync(tenantId, roleName, token).ConfigureAwait(false);
            if (role == null || !role.Active) return grants;

            List<RolePermissionMap> maps = await _Database.RolePermissionMaps.ListByRoleAsync(role.Id, token).ConfigureAwait(false);
            foreach (RolePermissionMap map in maps)
            {
                Permission? permission = await _Database.Permissions.ReadAsync(tenantId, map.PermissionId, token).ConfigureAwait(false);
                if (permission == null || !permission.Active) continue;
                grants.Add(Grant(permission.ResourceTypes, permission.OperationTypes, permission.PermissionType, scope, resourceId, inherits, role.Name));
            }
            return grants;
        }

        private static PermissionGrant Grant(List<string> types, List<string> operations, PermissionTypeEnum type, ResourceScopeEnum scope, string? resourceId, bool inherits, string source)
        {
            PermissionGrant grant = new PermissionGrant();
            grant.ResourceTypes = new List<string>(types);
            grant.Operations = new List<string>(operations);
            grant.PermissionType = type;
            grant.Scope = scope;
            grant.ResourceId = resourceId;
            grant.InheritsToChildren = inherits;
            grant.Source = source;
            return grant;
        }

        private List<PermissionGrant>? FromCache(string key)
        {
            if (_CacheSeconds == 0) return null;
            if (_Cache.TryGetValue(key, out CachedGrants? entry) && entry.ExpiresUtc > DateTime.UtcNow) return entry.Grants;
            return null;
        }

        private void ToCache(string key, List<PermissionGrant> grants)
        {
            if (_CacheSeconds == 0) return;
            CachedGrants entry = new CachedGrants();
            entry.Grants = grants;
            entry.ExpiresUtc = DateTime.UtcNow.AddSeconds(_CacheSeconds);
            _Cache[key] = entry;
        }

        #endregion
    }
}
