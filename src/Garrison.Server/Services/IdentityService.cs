namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Settings;

    /// <summary>
    /// Business rules for tenants, users, credentials, roles, permissions, and assignments: validation, uniqueness,
    /// protected-record rules, cascading deletes, credential secret handling, audit, and authorization cache
    /// invalidation. Thread-safe.
    /// </summary>
    public class IdentityService
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly SecretCipher _Cipher;
        private readonly AuditService _Audit;
        private readonly AuthorizationService _Authorization;
        private readonly Func<int> _PasswordHashIterations;
        private readonly Func<AuthSettings> _AuthSettings;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="cipher">Secret cipher.</param>
        /// <param name="audit">Audit.</param>
        /// <param name="authorization">Authorization service (cache invalidation and evaluation).</param>
        /// <param name="passwordHashIterations">Returns the PBKDF2 iterations for new password hashes (read on each use, so live setting changes apply). Null uses PasswordHasher.DefaultIterations.</param>
        /// <param name="authSettings">Live credential expiry policies; null uses defaults.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public IdentityService(DatabaseDriverBase database, SecretCipher cipher, AuditService audit, AuthorizationService authorization, Func<int>? passwordHashIterations = null, Func<AuthSettings>? authSettings = null)
        {
            _PasswordHashIterations = passwordHashIterations ?? (() => PasswordHasher.DefaultIterations);
            _AuthSettings = authSettings ?? (() => new AuthSettings());
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Authorization = authorization ?? throw new ArgumentNullException(nameof(authorization));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Create a tenant.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tenant.</returns>
        /// <exception cref="ValidationException">Thrown when the name is missing.</exception>
        /// <exception cref="ConflictException">Thrown when the name is taken.</exception>
        public async Task<Tenant> CreateTenantAsync(RequestContext ctx, TenantRequest request, CancellationToken token = default)
        {
            if (request == null || String.IsNullOrWhiteSpace(request.Name)) throw Invalid("name", "A tenant name is required.");
            if (await _Database.Tenants.ReadByNameAsync(request.Name.Trim(), token).ConfigureAwait(false) != null) throw new ConflictException("Duplicate", "A tenant named '" + request.Name + "' already exists.");
            Tenant tenant = new Tenant();
            tenant.Name = request.Name.Trim();
            tenant.Description = request.Description;
            tenant.Active = request.Active ?? true;
            if (request.SchedulingWeight.HasValue && request.SchedulingWeight.Value != 1 && !ctx.IsAdmin) throw Invalid("schedulingWeight", "Only system administrators may change scheduling weight.");
            tenant.SchedulingWeight = request.SchedulingWeight ?? 1;
            tenant.RequireUntrustedDeployments = request.RequireUntrustedDeployments ?? false;
            await _Database.Tenants.CreateAsync(tenant, token).ConfigureAwait(false);
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Tenant", tenant.Id, "Tenant created.", tenant.Id, token).ConfigureAwait(false);
            return tenant;
        }

        /// <summary>
        /// Update a tenant.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tenant.</returns>
        /// <exception cref="NotFoundException">Thrown when the tenant does not exist.</exception>
        public async Task<Tenant> UpdateTenantAsync(RequestContext ctx, string tenantId, TenantRequest request, CancellationToken token = default)
        {
            Tenant tenant = await _Database.Tenants.ReadAsync(tenantId, token).ConfigureAwait(false) ?? throw new NotFoundException("Tenant not found.");
            if (request == null) throw Invalid("body", "A request body is required.");
            if (!String.IsNullOrWhiteSpace(request.Name) && request.Name.Trim() != tenant.Name)
            {
                if (await _Database.Tenants.ReadByNameAsync(request.Name.Trim(), token).ConfigureAwait(false) != null) throw new ConflictException("Duplicate", "A tenant named '" + request.Name + "' already exists.");
                tenant.Name = request.Name.Trim();
            }
            if (request.Description != null) tenant.Description = request.Description;
            if (request.Active.HasValue)
            {
                if (tenant.IsProtected && !request.Active.Value) throw new ConflictException("Protected", "The protected tenant cannot be deactivated.");
                tenant.Active = request.Active.Value;
            }
            if (request.SchedulingWeight.HasValue && request.SchedulingWeight.Value != tenant.SchedulingWeight)
            {
                if (!ctx.IsAdmin) throw Invalid("schedulingWeight", "Only system administrators may change scheduling weight.");
                tenant.SchedulingWeight = request.SchedulingWeight.Value;
            }
            string summary = "Tenant updated.";
            if (request.RequireUntrustedDeployments.HasValue && request.RequireUntrustedDeployments.Value != tenant.RequireUntrustedDeployments)
            {
                tenant.RequireUntrustedDeployments = request.RequireUntrustedDeployments.Value;
                summary = "Tenant updated; requireUntrustedDeployments set to " + (tenant.RequireUntrustedDeployments ? "true" : "false") + ".";
            }
            await _Database.Tenants.UpdateAsync(tenant, token).ConfigureAwait(false);
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Tenant", tenant.Id, summary, tenant.Id, token).ConfigureAwait(false);
            _Authorization.Invalidate();
            return tenant;
        }

        /// <summary>
        /// Delete a tenant and every tenant-owned record.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows deleted.</returns>
        /// <exception cref="NotFoundException">Thrown when the tenant does not exist.</exception>
        /// <exception cref="ConflictException">Thrown when the tenant is protected.</exception>
        public async Task<int> DeleteTenantAsync(RequestContext ctx, string tenantId, CancellationToken token = default)
        {
            Tenant tenant = await _Database.Tenants.ReadAsync(tenantId, token).ConfigureAwait(false) ?? throw new NotFoundException("Tenant not found.");
            if (tenant.IsProtected) throw new ConflictException("Protected", "The protected tenant cannot be deleted.");
            int deleted = await _Database.Tenants.DeleteCascadeAsync(tenantId, token).ConfigureAwait(false);
            _Authorization.Invalidate();
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Tenant", tenantId, "Tenant deleted with " + deleted + " rows.", null, token).ConfigureAwait(false);
            return deleted;
        }

        /// <summary>
        /// Create a user and grant TenantMember.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>User.</returns>
        /// <exception cref="ValidationException">Thrown when email or password is missing.</exception>
        /// <exception cref="ConflictException">Thrown when the email is taken in the tenant.</exception>
        public async Task<User> CreateUserAsync(RequestContext ctx, string tenantId, UserRequest request, CancellationToken token = default)
        {
            if (request == null) throw Invalid("body", "A request body is required.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            if (String.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@')) errors["email"] = "A valid email is required.";
            if (String.IsNullOrEmpty(request.Password) || request.Password.Length < 8) errors["password"] = "A password of at least 8 characters is required.";
            if (request.IsAdmin == true && !ctx.IsAdmin) errors["isAdmin"] = "Only system administrators may create system administrators.";
            if (request.IsTenantAdmin == true && !ctx.IsAdmin && !ctx.IsTenantAdmin) errors["isTenantAdmin"] = "Only tenant administrators may create tenant administrators.";
            if (errors.Count > 0) throw new ValidationException("The user is invalid.", errors);
            await RequireTenantAsync(tenantId, token).ConfigureAwait(false);
            if (await _Database.Users.ReadByEmailAsync(tenantId, request.Email!.Trim(), token).ConfigureAwait(false) != null) throw new ConflictException("Duplicate", "A user with that email already exists in the tenant.");

            User user = new User();
            user.TenantId = tenantId;
            user.Email = request.Email.Trim();
            user.PasswordHash = PasswordHasher.Hash(request.Password!, _PasswordHashIterations());
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.IsTenantAdmin = request.IsTenantAdmin ?? false;
            user.IsAdmin = request.IsAdmin ?? false;
            user.Active = request.Active ?? true;
            await _Database.Users.CreateAsync(user, token).ConfigureAwait(false);

            BuiltInRole member = BuiltInRoles.Find(BuiltInRoles.TenantMember)!;
            UserRoleAssignment assignment = new UserRoleAssignment();
            assignment.TenantId = tenantId;
            assignment.UserId = user.Id;
            assignment.RoleId = member.Id;
            assignment.RoleName = member.Name;
            await _Database.UserRoleAssignments.CreateAsync(assignment, token).ConfigureAwait(false);

            _Authorization.Invalidate();
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "User", user.Id, "User " + user.Email + " created.", tenantId, token).ConfigureAwait(false);
            return user;
        }

        /// <summary>
        /// Update a user. Omitted fields are unchanged.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">User identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>User.</returns>
        /// <exception cref="NotFoundException">Thrown when the user does not exist.</exception>
        /// <exception cref="ValidationException">Thrown when the request is invalid, or when a caller who is not a system administrator changes a system administrator's flag, password, or email.</exception>
        public async Task<User> UpdateUserAsync(RequestContext ctx, string tenantId, string id, UserRequest request, CancellationToken token = default)
        {
            User user = await _Database.Users.ReadAsync(tenantId, id, token).ConfigureAwait(false) ?? throw new NotFoundException("User not found.");
            if (request == null) throw Invalid("body", "A request body is required.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            if (request.Email != null && (String.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))) errors["email"] = "A valid email is required.";
            if (request.Password != null && request.Password.Length < 8) errors["password"] = "Passwords must be at least 8 characters.";
            if (request.IsAdmin.HasValue && request.IsAdmin.Value != user.IsAdmin && !ctx.IsAdmin) errors["isAdmin"] = "Only system administrators may change the system administrator flag.";
            if (user.IsAdmin && !ctx.IsAdmin && request.Password != null) errors["password"] = "Only system administrators may change a system administrator's password.";
            if (user.IsAdmin && !ctx.IsAdmin && request.Email != null && !String.Equals(request.Email.Trim(), user.Email, StringComparison.OrdinalIgnoreCase)) errors["email"] = "Only system administrators may change a system administrator's email.";
            if (request.IsTenantAdmin.HasValue && request.IsTenantAdmin.Value != user.IsTenantAdmin && !ctx.IsAdmin && !ctx.IsTenantAdmin) errors["isTenantAdmin"] = "Only tenant administrators may change the tenant administrator flag.";
            if (errors.Count > 0) throw new ValidationException("The user is invalid.", errors);
            bool emailChanges = request.Email != null && !String.Equals(request.Email.Trim(), user.Email, StringComparison.OrdinalIgnoreCase);
            if ((request.Password != null || emailChanges) && user.Id != ctx.UserId)
            {
                // Whoever sets another user's password or email can sign in as that user, so it is limited to users whose
                // permissions the caller holds itself (SR-13).
                await RequireWithinCallerAsync(ctx, tenantId, user, null, request.Password != null ? "password" : "email", "Changing this user's " + (request.Password != null ? "password" : "email"), token).ConfigureAwait(false);
            }

            if (request.Email != null && !String.Equals(request.Email.Trim(), user.Email, StringComparison.OrdinalIgnoreCase))
            {
                if (await _Database.Users.ReadByEmailAsync(tenantId, request.Email.Trim(), token).ConfigureAwait(false) != null) throw new ConflictException("Duplicate", "A user with that email already exists in the tenant.");
                user.Email = request.Email.Trim();
            }
            if (request.Password != null) user.PasswordHash = PasswordHasher.Hash(request.Password, _PasswordHashIterations());
            bool passwordChanged = request.Password != null;
            if (request.FirstName != null) user.FirstName = request.FirstName;
            if (request.LastName != null) user.LastName = request.LastName;
            if (request.IsTenantAdmin.HasValue) user.IsTenantAdmin = request.IsTenantAdmin.Value;
            if (request.IsAdmin.HasValue) user.IsAdmin = request.IsAdmin.Value;
            if (request.Active.HasValue)
            {
                if (user.IsProtected && !request.Active.Value) throw new ConflictException("Protected", "Protected users cannot be deactivated.");
                user.Active = request.Active.Value;
            }
            await _Database.Users.UpdateAsync(user, token).ConfigureAwait(false);
            if (passwordChanged)
            {
                // A password change ends the user's other sessions at once (SR-17). A user changing their own password keeps
                // the session they did it from.
                int revoked = await _Database.Sessions.RevokeByUserAsync(user.Id, user.Id == ctx.UserId ? ctx.SessionId : null, "Password changed.", token).ConfigureAwait(false);
                if (revoked > 0) await _Audit.WriteAsync(ctx, AuditEventTypeEnum.SessionRevoked, "User", user.Id, "Password changed; " + revoked + " session(s) revoked.", tenantId, token).ConfigureAwait(false);
            }
            _Authorization.Invalidate();
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "User", user.Id, "User updated.", tenantId, token).ConfigureAwait(false);
            return user;
        }

        /// <summary>
        /// Delete a user with their credentials, sessions, and assignments.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">User identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="NotFoundException">Thrown when the user does not exist.</exception>
        /// <exception cref="ConflictException">Thrown when the user is protected.</exception>
        public async Task DeleteUserAsync(RequestContext ctx, string tenantId, string id, CancellationToken token = default)
        {
            User user = await _Database.Users.ReadAsync(tenantId, id, token).ConfigureAwait(false) ?? throw new NotFoundException("User not found.");
            if (user.IsProtected) throw new ConflictException("Protected", "Protected users cannot be deleted.");
            foreach (Credential credential in await _Database.Credentials.ListByUserAsync(tenantId, id, token).ConfigureAwait(false))
            {
                await DeleteCredentialCascadeAsync(tenantId, credential.Id, token).ConfigureAwait(false);
            }
            foreach (UserRoleAssignment assignment in await _Database.UserRoleAssignments.ListByUserAsync(tenantId, id, token).ConfigureAwait(false))
            {
                await _Database.UserRoleAssignments.DeleteAsync(assignment.Id, token).ConfigureAwait(false);
            }
            await _Database.Sessions.DeleteByUserAsync(id, token).ConfigureAwait(false);
            await _Database.Users.DeleteAsync(id, token).ConfigureAwait(false);
            _Authorization.Invalidate();
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "User", id, "User " + user.Email + " deleted.", tenantId, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Create a credential. The raw secret is returned only here.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Credential and secret.</returns>
        /// <exception cref="ValidationException">Thrown when the request is invalid, or when a caller who is not a system administrator creates a credential for a system administrator.</exception>
        public async Task<CredentialCreateResponse> CreateCredentialAsync(RequestContext ctx, string tenantId, CredentialRequest request, CancellationToken token = default)
        {
            if (request == null || String.IsNullOrWhiteSpace(request.Name)) throw Invalid("name", "A credential name is required.");
            string? userId = String.IsNullOrEmpty(request.UserId) ? ctx.UserId : request.UserId;
            if (String.IsNullOrEmpty(userId)) throw Invalid("userId", "An owning user is required.");
            User owner = await _Database.Users.ReadAsync(tenantId, userId, token).ConfigureAwait(false) ?? throw Invalid("userId", "The owning user does not exist in this tenant.");
            // A credential acts with its owner's IsAdmin flag, so minting one for a system administrator is itself a
            // system administrator operation.
            if (owner.IsAdmin && !ctx.IsAdmin) throw Invalid("userId", "Only system administrators may create credentials for a system administrator.");

            BuiltInRole? builtIn = null;
            Role? custom = null;
            if (!String.IsNullOrEmpty(request.RoleName))
            {
                builtIn = BuiltInRoles.Find(request.RoleName);
                if (builtIn == null) custom = await _Database.Roles.ReadByNameAsync(tenantId, request.RoleName, token).ConfigureAwait(false);
                if (builtIn == null && custom == null) throw Invalid("roleName", "Unknown role '" + request.RoleName + "'.");
            }
            List<PermissionGrant>? roleGrants = null;
            if (builtIn != null || custom != null)
            {
                roleGrants = await _Authorization.GrantsForRoleAsync(tenantId, builtIn != null ? builtIn.Id : custom!.Id, null, ResourceScopeEnum.Tenant, null, true, token).ConfigureAwait(false);
                await RequireCeilingAsync(ctx, tenantId, roleGrants, null, "roleName", "Role " + (builtIn != null ? builtIn.Name : custom!.Name), token).ConfigureAwait(false);
            }
            if (owner.Id != ctx.UserId)
            {
                // The holder of the new secret acts as the owner (bounded by the credential's role), so minting one for
                // another user is limited to what the caller holds itself (SR-13).
                await RequireWithinCallerAsync(ctx, tenantId, owner, roleGrants, "userId", "A credential for this user", token).ConfigureAwait(false);
            }

            string secret = SecretGenerator.NewSecretKey();
            Credential credential = new Credential();
            credential.TenantId = tenantId;
            credential.UserId = owner.Id;
            credential.Name = request.Name.Trim();
            credential.AccessKey = SecretGenerator.NewAccessKey();
            credential.SecretKeyEncrypted = _Cipher.Encrypt(secret, credential.Id);
            credential.SecretKeyLast4 = SecretGenerator.Last4(secret);
            credential.AuthMode = request.AuthMode ?? CredentialAuthModeEnum.Hybrid;
            credential.ExpiresUtc = CredentialExpiry(request.ExpiresUtc, true);
            credential.Active = request.Active ?? true;
            await _Database.Credentials.CreateAsync(credential, token).ConfigureAwait(false);

            if (builtIn != null || custom != null)
            {
                CredentialScopeAssignment scope = new CredentialScopeAssignment();
                scope.TenantId = tenantId;
                scope.CredentialId = credential.Id;
                scope.RoleId = builtIn != null ? builtIn.Id : custom!.Id;
                scope.RoleName = builtIn != null ? builtIn.Name : custom!.Name;
                await _Database.CredentialScopeAssignments.CreateAsync(scope, token).ConfigureAwait(false);
            }

            _Authorization.Invalidate();
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.CredentialCreated, "Credential", credential.Id, "Credential " + credential.Name + " created for " + owner.Email + ".", tenantId, token).ConfigureAwait(false);

            CredentialCreateResponse response = new CredentialCreateResponse();
            response.Credential = credential;
            response.AccessKey = credential.AccessKey;
            response.SecretKey = secret;
            return response;
        }

        /// <summary>
        /// Update a credential's name, auth mode, expiry, or active flag.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Credential identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Credential.</returns>
        /// <exception cref="NotFoundException">Thrown when the credential does not exist.</exception>
        public async Task<Credential> UpdateCredentialAsync(RequestContext ctx, string tenantId, string id, CredentialRequest request, CancellationToken token = default)
        {
            Credential credential = await _Database.Credentials.ReadAsync(tenantId, id, token).ConfigureAwait(false) ?? throw new NotFoundException("Credential not found.");
            if (request == null) throw Invalid("body", "A request body is required.");
            if (!String.IsNullOrWhiteSpace(request.Name)) credential.Name = request.Name.Trim();
            if (request.AuthMode.HasValue) credential.AuthMode = request.AuthMode.Value;
            if (request.ExpiresUtc.HasValue) credential.ExpiresUtc = CredentialExpiry(request.ExpiresUtc, false);
            if (request.Active.HasValue)
            {
                if (credential.IsProtected && !request.Active.Value) throw new ConflictException("Protected", "Protected credentials cannot be deactivated.");
                credential.Active = request.Active.Value;
            }
            await _Database.Credentials.UpdateAsync(credential, token).ConfigureAwait(false);
            _Authorization.Invalidate();
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Credential", credential.Id, "Credential updated.", tenantId, token).ConfigureAwait(false);
            return credential;
        }

        /// <summary>
        /// Rotate a credential's secret and revoke its sessions. The new secret is returned only here.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Credential identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Credential and new secret.</returns>
        /// <exception cref="NotFoundException">Thrown when the credential does not exist.</exception>
        /// <exception cref="ValidationException">Thrown when a caller who is not a system administrator rotates a system administrator's credential.</exception>
        public async Task<CredentialCreateResponse> RotateCredentialAsync(RequestContext ctx, string tenantId, string id, CancellationToken token = default)
        {
            Credential credential = await _Database.Credentials.ReadAsync(tenantId, id, token).ConfigureAwait(false) ?? throw new NotFoundException("Credential not found.");
            if (!ctx.IsAdmin)
            {
                User? owner = await _Database.Users.ReadAsync(tenantId, credential.UserId, token).ConfigureAwait(false);
                if (owner != null && owner.IsAdmin) throw Invalid("id", "Only system administrators may rotate a system administrator's credential.");
                if (owner != null && owner.Id != ctx.UserId)
                {
                    List<PermissionGrant> credentialGrants = await _Authorization.GrantsForCredentialAsync(tenantId, credential.Id, token).ConfigureAwait(false);
                    await RequireWithinCallerAsync(ctx, tenantId, owner, credentialGrants, "id", "Rotating this credential", token).ConfigureAwait(false);
                }
            }
            string secret = SecretGenerator.NewSecretKey();
            credential.SecretKeyEncrypted = _Cipher.Encrypt(secret, credential.Id);
            credential.SecretKeyLast4 = SecretGenerator.Last4(secret);
            await _Database.Credentials.UpdateAsync(credential, token).ConfigureAwait(false);
            await _Database.Sessions.DeleteByCredentialAsync(credential.Id, token).ConfigureAwait(false);
            // The old secret and the deleted sessions stop working at once on every replica (P10.24 authentication cache).
            _Authorization.Invalidate();
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.CredentialRotated, "Credential", credential.Id, "Credential secret rotated.", tenantId, token).ConfigureAwait(false);

            CredentialCreateResponse response = new CredentialCreateResponse();
            response.Credential = credential;
            response.AccessKey = credential.AccessKey;
            response.SecretKey = secret;
            return response;
        }

        /// <summary>
        /// Delete a credential with its scope assignments and sessions.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Credential identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="NotFoundException">Thrown when the credential does not exist.</exception>
        /// <exception cref="ConflictException">Thrown when the credential is protected.</exception>
        public async Task DeleteCredentialAsync(RequestContext ctx, string tenantId, string id, CancellationToken token = default)
        {
            Credential credential = await _Database.Credentials.ReadAsync(tenantId, id, token).ConfigureAwait(false) ?? throw new NotFoundException("Credential not found.");
            if (credential.IsProtected) throw new ConflictException("Protected", "Protected credentials cannot be deleted.");
            await DeleteCredentialCascadeAsync(tenantId, id, token).ConfigureAwait(false);
            _Authorization.Invalidate();
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Credential", id, "Credential " + credential.Name + " deleted.", tenantId, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Validate a permission's resource and operation lists.
        /// </summary>
        /// <param name="resourceTypes">Resource type names.</param>
        /// <param name="operations">Operation names.</param>
        /// <exception cref="ValidationException">Thrown when a name is unknown or a list is empty.</exception>
        public static void ValidatePermissionLists(List<string>? resourceTypes, List<string>? operations)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();
            if (resourceTypes == null || resourceTypes.Count == 0) errors["resourceTypes"] = "At least one resource type is required.";
            else
            {
                List<string> bad = resourceTypes.Where(r => !Enum.TryParse<ResourceTypeEnum>(r, true, out ResourceTypeEnum _)).ToList();
                if (bad.Count > 0) errors["resourceTypes"] = "Unknown resource types: " + String.Join(", ", bad) + ".";
            }
            if (operations == null || operations.Count == 0) errors["operationTypes"] = "At least one operation is required.";
            else
            {
                List<string> bad = operations.Where(o => !Enum.TryParse<OperationTypeEnum>(o, true, out OperationTypeEnum _)).ToList();
                if (bad.Count > 0) errors["operationTypes"] = "Unknown operations: " + String.Join(", ", bad) + ".";
            }
            if (errors.Count > 0) throw new ValidationException("The permission is invalid.", errors);
        }

        /// <summary>
        /// Resolve a role by identifier or name for an assignment (tenant roles first, then built-ins).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="roleId">Role identifier.</param>
        /// <param name="roleName">Role name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Role.</returns>
        /// <exception cref="ValidationException">Thrown when the role cannot be resolved.</exception>
        public async Task<Role> ResolveRoleAsync(string tenantId, string? roleId, string? roleName, CancellationToken token = default)
        {
            Role? role = null;
            if (!String.IsNullOrEmpty(roleId)) role = await _Database.Roles.ReadAsync(tenantId, roleId, token).ConfigureAwait(false);
            if (role == null && !String.IsNullOrEmpty(roleName)) role = await _Database.Roles.ReadByNameAsync(tenantId, roleName, token).ConfigureAwait(false);
            if (role == null) throw Invalid("roleId", "The role does not exist.");
            return role;
        }

        /// <summary>
        /// Require that the caller holds every permission an assignment of a role would grant (the grant ceiling, SR-13).
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="role">Role being assigned.</param>
        /// <param name="scope">Assignment scope.</param>
        /// <param name="resourceId">Resource identifier for Resource scope, or null.</param>
        /// <param name="inherits">Whether the assignment inherits to child resources.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or role is null.</exception>
        /// <exception cref="ValidationException">Thrown with field code GrantCeiling when the role grants something the caller does not hold.</exception>
        public async Task RequireAssignableAsync(RequestContext ctx, string tenantId, Role role, ResourceScopeEnum scope, string? resourceId, bool inherits, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (role == null) throw new ArgumentNullException(nameof(role));
            List<PermissionGrant> grants = await _Authorization.GrantsForRoleAsync(tenantId, role.Id, null, scope, resourceId, inherits, token).ConfigureAwait(false);
            await RequireCeilingAsync(ctx, tenantId, grants, null, "roleId", "Role " + role.Name, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Require that the caller holds every permission a permission record grants, before it is mapped to a role or its
        /// lists change (the grant ceiling, SR-13).
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="permission">Permission.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or permission is null.</exception>
        /// <exception cref="ValidationException">Thrown with field code GrantCeiling when the permission grants something the caller does not hold.</exception>
        public async Task RequirePermissionWithinCallerAsync(RequestContext ctx, string tenantId, Permission permission, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (permission == null) throw new ArgumentNullException(nameof(permission));
            PermissionGrant grant = new PermissionGrant();
            grant.ResourceTypes = new List<string>(permission.ResourceTypes);
            grant.Operations = new List<string>(permission.OperationTypes);
            grant.PermissionType = permission.PermissionType;
            grant.Scope = ResourceScopeEnum.Tenant;
            grant.InheritsToChildren = true;
            grant.Source = permission.Name;
            await RequireCeilingAsync(ctx, tenantId, new List<PermissionGrant> { grant }, null, "permissionId", "Permission " + permission.Name, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Compute effective permissions for a user.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="userId">User identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Effective permissions.</returns>
        /// <exception cref="NotFoundException">Thrown when the user does not exist.</exception>
        public async Task<EffectivePermissionsResponse> EffectiveForUserAsync(string tenantId, string userId, CancellationToken token = default)
        {
            User user = await _Database.Users.ReadAsync(tenantId, userId, token).ConfigureAwait(false) ?? throw new NotFoundException("User not found.");
            RequestContext principal = new RequestContext();
            principal.IsAuthenticated = true;
            principal.PrincipalType = PrincipalTypeEnum.User;
            principal.TenantId = tenantId;
            principal.UserId = user.Id;
            principal.IsAdmin = user.IsAdmin;
            principal.IsTenantAdmin = user.IsTenantAdmin;
            List<PermissionGrant> grants = await _Authorization.GrantsForUserAsync(tenantId, user.Id, token).ConfigureAwait(false);
            return await BuildEffectiveAsync(principal, user.Id, grants, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Compute effective permissions for a credential, including the owner ceiling.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="credentialId">Credential identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Effective permissions.</returns>
        /// <exception cref="NotFoundException">Thrown when the credential does not exist.</exception>
        public async Task<EffectivePermissionsResponse> EffectiveForCredentialAsync(string tenantId, string credentialId, CancellationToken token = default)
        {
            Credential credential = await _Database.Credentials.ReadAsync(tenantId, credentialId, token).ConfigureAwait(false) ?? throw new NotFoundException("Credential not found.");
            User? owner = await _Database.Users.ReadAsync(tenantId, credential.UserId, token).ConfigureAwait(false);
            RequestContext principal = new RequestContext();
            principal.IsAuthenticated = true;
            principal.PrincipalType = PrincipalTypeEnum.Credential;
            principal.TenantId = tenantId;
            principal.CredentialId = credential.Id;
            principal.UserId = credential.UserId;
            principal.IsAdmin = owner != null && owner.IsAdmin;
            principal.IsTenantAdmin = owner != null && owner.IsTenantAdmin;
            List<PermissionGrant> grants = await _Authorization.GrantsForCredentialAsync(tenantId, credential.Id, token).ConfigureAwait(false);
            return await BuildEffectiveAsync(principal, credential.Id, grants, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private DateTime? CredentialExpiry(DateTime? requested, bool creating)
        {
            AuthSettings policy = _AuthSettings();
            DateTime now = DateTime.UtcNow;
            DateTime? expiry = requested?.ToUniversalTime();
            if (creating && !expiry.HasValue)
            {
                int days = policy.CredentialDefaultLifetimeDays;
                if (policy.CredentialMaxLifetimeDays > 0 && (days == 0 || days > policy.CredentialMaxLifetimeDays)) days = policy.CredentialMaxLifetimeDays;
                if (days > 0) expiry = now.AddDays(days);
            }
            if (expiry.HasValue && expiry.Value <= now) throw Invalid("expiresUtc", "Credential expiry must be in the future.");
            if (expiry.HasValue && policy.CredentialMaxLifetimeDays > 0 && expiry.Value > now.AddDays(policy.CredentialMaxLifetimeDays))
                throw Invalid("expiresUtc", "Credential expiry exceeds Auth.CredentialMaxLifetimeDays.");
            return expiry;
        }

        private async Task<EffectivePermissionsResponse> BuildEffectiveAsync(RequestContext principal, string principalId, List<PermissionGrant> grants, CancellationToken token)
        {
            EffectivePermissionsResponse response = new EffectivePermissionsResponse();
            response.PrincipalType = principal.PrincipalType;
            response.PrincipalId = principalId;
            response.TenantId = principal.TenantId!;
            response.IsAdmin = principal.IsAdmin;
            response.IsTenantAdmin = principal.IsTenantAdmin;
            foreach (PermissionGrant grant in grants)
            {
                EffectiveGrant g = new EffectiveGrant();
                g.Source = grant.Source;
                g.PermissionType = grant.PermissionType;
                g.ResourceTypes = grant.ResourceTypes;
                g.Operations = grant.Operations;
                g.Scope = grant.Scope;
                g.ResourceId = grant.ResourceId;
                g.InheritsToChildren = grant.InheritsToChildren;
                response.Grants.Add(g);
            }

            OperationTypeEnum[] operations = new OperationTypeEnum[] { OperationTypeEnum.Read, OperationTypeEnum.Create, OperationTypeEnum.Update, OperationTypeEnum.Delete, OperationTypeEnum.Execute, OperationTypeEnum.Admin };
            foreach (ResourceTypeEnum resource in Enum.GetValues<ResourceTypeEnum>())
            {
                if (resource == ResourceTypeEnum.All) continue;
                foreach (OperationTypeEnum operation in operations)
                {
                    AuthorizationDecision decision = await _Authorization.EvaluateAsync(principal, principal.TenantId, resource, operation, null, token).ConfigureAwait(false);
                    PermissionCheck check = new PermissionCheck();
                    check.ResourceType = resource;
                    check.Operation = operation;
                    check.Permitted = decision.Permitted;
                    response.HasPermission.Add(check);
                }
            }
            return response;
        }

        private async Task RequireCeilingAsync(RequestContext ctx, string tenantId, List<PermissionGrant> grants, Func<ResourceTypeEnum, OperationTypeEnum, string?, Task<bool>>? targetHolds, string field, string subject, CancellationToken token)
        {
            string? missing = await _Authorization.CeilingViolationAsync(ctx, tenantId, grants, targetHolds, token).ConfigureAwait(false);
            if (missing == null) return;
            string message = subject + " would grant " + missing + ", which you do not hold. You can only grant permissions you hold yourself.";
            throw new ValidationException(message, new Dictionary<string, string> { { field, message } }, new Dictionary<string, string> { { field, "GrantCeiling" } });
        }

        private async Task RequireWithinCallerAsync(RequestContext ctx, string tenantId, User target, List<PermissionGrant>? credentialGrants, string field, string subject, CancellationToken token)
        {
            if (ctx.IsAdmin) return;
            if (target.IsTenantAdmin && !ctx.IsTenantAdmin)
            {
                string message = subject + " would act as a tenant administrator. Only tenant administrators may do this.";
                throw new ValidationException(message, new Dictionary<string, string> { { field, message } }, new Dictionary<string, string> { { field, "GrantCeiling" } });
            }
            List<PermissionGrant> targetGrants = await _Authorization.GrantsForUserAsync(tenantId, target.Id, token).ConfigureAwait(false);
            if (credentialGrants != null && credentialGrants.Count > 0)
            {
                // A credential with roles is bounded by its owner, so only what both grant needs checking.
                Func<ResourceTypeEnum, OperationTypeEnum, string?, Task<bool>> ownerHolds = (resourceType, operation, resourceId) =>
                    Task.FromResult(target.IsTenantAdmin || PermissionEvaluator.Evaluate(targetGrants, resourceType, operation, resourceId).Permitted);
                await RequireCeilingAsync(ctx, tenantId, credentialGrants, ownerHolds, field, subject, token).ConfigureAwait(false);
                return;
            }
            await RequireCeilingAsync(ctx, tenantId, targetGrants, null, field, subject, token).ConfigureAwait(false);
        }

        private async Task DeleteCredentialCascadeAsync(string tenantId, string credentialId, CancellationToken token)
        {
            foreach (CredentialScopeAssignment scope in await _Database.CredentialScopeAssignments.ListByCredentialAsync(tenantId, credentialId, token).ConfigureAwait(false))
            {
                await _Database.CredentialScopeAssignments.DeleteAsync(scope.Id, token).ConfigureAwait(false);
            }
            await _Database.Sessions.DeleteByCredentialAsync(credentialId, token).ConfigureAwait(false);
            await _Database.Credentials.DeleteAsync(credentialId, token).ConfigureAwait(false);
        }

        private async Task RequireTenantAsync(string tenantId, CancellationToken token)
        {
            if (await _Database.Tenants.ReadAsync(tenantId, token).ConfigureAwait(false) == null) throw new NotFoundException("Tenant not found.");
        }

        private static ValidationException Invalid(string field, string message)
        {
            return new ValidationException(message, new Dictionary<string, string> { { field, message } });
        }

        #endregion
    }
}
