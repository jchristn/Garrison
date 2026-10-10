namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;

    /// <summary>
    /// Idempotent first-boot seeding: built-in roles and permissions (refreshed every start with stable identifiers),
    /// the Default tenant, the administrator user, the default administrator credential, and the worker node credential.
    /// Thread-safe for a single caller at startup.
    /// </summary>
    public class DefaultSeeder
    {
        #region Public-Members

        /// <summary>
        /// Email of the internal user that owns node credentials.
        /// </summary>
        public static readonly string NodeUserEmail = "nodes@garrison";

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly SecretCipher _Cipher;
        private readonly Action<string>? _Log;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="cipher">Secret cipher for credential secrets.</param>
        /// <param name="log">Optional log callback.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public DefaultSeeder(DatabaseDriverBase database, SecretCipher cipher, Action<string>? log = null)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
            _Log = log;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Run seeding.
        /// </summary>
        /// <param name="options">Seed options.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The default tenant.</returns>
        /// <exception cref="ArgumentNullException">Thrown when options is null.</exception>
        public async Task<Tenant> SeedAsync(SeedOptions options, CancellationToken token = default)
        {
            if (options == null) throw new ArgumentNullException(nameof(options));

            await SeedBuiltInRolesAsync(token).ConfigureAwait(false);

            Tenant? tenant = await _Database.Tenants.ReadByNameAsync(Constants.DefaultTenantName, token).ConfigureAwait(false);
            if (tenant == null)
            {
                tenant = new Tenant();
                tenant.Id = Constants.DefaultTenantId;
                tenant.Name = Constants.DefaultTenantName;
                tenant.Description = "Default tenant created on first boot.";
                tenant.IsProtected = true;
                await _Database.Tenants.CreateAsync(tenant, token).ConfigureAwait(false);
                _Log?.Invoke("seeded tenant " + tenant.Name + " (" + tenant.Id + ")");
            }

            User? admin = await _Database.Users.ReadByEmailAsync(tenant.Id, options.AdminEmail, token).ConfigureAwait(false);
            if (admin == null)
            {
                admin = new User();
                admin.TenantId = tenant.Id;
                admin.FirstName = "Garrison";
                admin.LastName = "Administrator";
                admin.Email = options.AdminEmail;
                admin.PasswordSha256 = PasswordHasher.Hash(options.AdminPassword);
                admin.IsAdmin = true;
                admin.IsTenantAdmin = true;
                admin.IsProtected = true;
                await _Database.Users.CreateAsync(admin, token).ConfigureAwait(false);
                await AssignAsync(tenant.Id, admin.Id, BuiltInRoles.TenantAdmin, token).ConfigureAwait(false);
                _Log?.Invoke("seeded administrator " + admin.Email);
            }

            await EnsureCredentialAsync(tenant.Id, admin.Id, "Default Administrator Key", options.DefaultAccessKey, options.DefaultSecretKey, BuiltInRoles.TenantAdmin, token).ConfigureAwait(false);

            User? nodeUser = await _Database.Users.ReadByEmailAsync(tenant.Id, NodeUserEmail, token).ConfigureAwait(false);
            if (nodeUser == null)
            {
                nodeUser = new User();
                nodeUser.TenantId = tenant.Id;
                nodeUser.FirstName = "Garrison";
                nodeUser.LastName = "Nodes";
                nodeUser.Email = NodeUserEmail;
                nodeUser.PasswordSha256 = PasswordHasher.Hash(SecretGenerator.Alphanumeric(48));
                nodeUser.IsProtected = true;
                await _Database.Users.CreateAsync(nodeUser, token).ConfigureAwait(false);
                await AssignAsync(tenant.Id, nodeUser.Id, BuiltInRoles.NodeAgent, token).ConfigureAwait(false);
                _Log?.Invoke("seeded node service user " + nodeUser.Email);
            }

            await EnsureCredentialAsync(tenant.Id, nodeUser.Id, "Worker Node Key", options.NodeAccessKey, options.NodeSecretKey, BuiltInRoles.NodeAgent, token).ConfigureAwait(false);

            return tenant;
        }

        #endregion

        #region Private-Methods

        private async Task SeedBuiltInRolesAsync(CancellationToken token)
        {
            foreach (BuiltInRole definition in BuiltInRoles.All)
            {
                Role? role = await _Database.Roles.ReadAsync(definition.Id, token).ConfigureAwait(false);
                bool create = role == null;
                if (role == null) role = new Role();
                role.Id = definition.Id;
                role.TenantId = null;
                role.Name = definition.Name;
                role.Description = definition.Description;
                role.IsBuiltIn = true;
                role.IsProtected = true;
                role.Active = true;
                if (create) await _Database.Roles.CreateAsync(role, token).ConfigureAwait(false);
                else await _Database.Roles.UpdateAsync(role, token).ConfigureAwait(false);

                foreach (BuiltInPermission permissionDefinition in definition.Permissions)
                {
                    string permissionId = "prm_builtin_" + permissionDefinition.Name.Replace(".", "_").ToLowerInvariant();
                    Permission? permission = await _Database.Permissions.ReadAsync(permissionId, token).ConfigureAwait(false);
                    bool createPermission = permission == null;
                    if (permission == null) permission = new Permission();
                    permission.Id = permissionId;
                    permission.TenantId = null;
                    permission.Name = permissionDefinition.Name;
                    permission.PermissionType = permissionDefinition.PermissionType;
                    permission.ResourceTypes = new List<string>(permissionDefinition.ResourceTypes);
                    permission.OperationTypes = new List<string>(permissionDefinition.Operations);
                    permission.IsBuiltIn = true;
                    permission.IsProtected = true;
                    if (createPermission) await _Database.Permissions.CreateAsync(permission, token).ConfigureAwait(false);
                    else await _Database.Permissions.UpdateAsync(permission, token).ConfigureAwait(false);

                    string mapId = "rpm_builtin_" + permissionId.Substring("prm_builtin_".Length);
                    if (!await _Database.RolePermissionMaps.ExistsAsync(mapId, token).ConfigureAwait(false))
                    {
                        RolePermissionMap map = new RolePermissionMap();
                        map.Id = mapId;
                        map.TenantId = null;
                        map.RoleId = role.Id;
                        map.PermissionId = permission.Id;
                        map.IsProtected = true;
                        await _Database.RolePermissionMaps.CreateAsync(map, token).ConfigureAwait(false);
                    }
                }
            }
        }

        private async Task AssignAsync(string tenantId, string userId, string roleName, CancellationToken token)
        {
            BuiltInRole role = BuiltInRoles.Find(roleName) ?? throw new InvalidOperationException("Unknown built-in role " + roleName + ".");
            UserRoleAssignment assignment = new UserRoleAssignment();
            assignment.TenantId = tenantId;
            assignment.UserId = userId;
            assignment.RoleId = role.Id;
            assignment.RoleName = role.Name;
            assignment.ResourceScope = ResourceScopeEnum.Tenant;
            assignment.InheritsToChildren = true;
            assignment.IsProtected = true;
            await _Database.UserRoleAssignments.CreateAsync(assignment, token).ConfigureAwait(false);
        }

        private async Task EnsureCredentialAsync(string tenantId, string userId, string name, string accessKey, string secretKey, string roleName, CancellationToken token)
        {
            if (String.IsNullOrEmpty(accessKey) || String.IsNullOrEmpty(secretKey)) return;

            Credential? existing = await _Database.Credentials.ReadByAccessKeyAsync(accessKey, token).ConfigureAwait(false);
            if (existing != null)
            {
                string current = String.Empty;
                try
                {
                    current = _Cipher.Decrypt(existing.SecretKeyEncrypted, existing.Id);
                }
                catch (Exception e) when (e is System.Security.Cryptography.CryptographicException || e is FormatException)
                {
                    current = String.Empty;
                }
                if (current != secretKey)
                {
                    existing.SecretKeyEncrypted = _Cipher.Encrypt(secretKey, existing.Id);
                    existing.SecretKeyLast4 = SecretGenerator.Last4(secretKey);
                    await _Database.Credentials.UpdateAsync(existing, token).ConfigureAwait(false);
                    _Log?.Invoke("updated secret for credential " + name);
                }
                return;
            }

            Credential credential = new Credential();
            credential.TenantId = tenantId;
            credential.UserId = userId;
            credential.Name = name;
            credential.AccessKey = accessKey;
            credential.SecretKeyEncrypted = _Cipher.Encrypt(secretKey, credential.Id);
            credential.SecretKeyLast4 = SecretGenerator.Last4(secretKey);
            credential.AuthMode = CredentialAuthModeEnum.Hybrid;
            credential.IsProtected = true;
            await _Database.Credentials.CreateAsync(credential, token).ConfigureAwait(false);

            BuiltInRole role = BuiltInRoles.Find(roleName) ?? throw new InvalidOperationException("Unknown built-in role " + roleName + ".");
            CredentialScopeAssignment scope = new CredentialScopeAssignment();
            scope.TenantId = tenantId;
            scope.CredentialId = credential.Id;
            scope.RoleId = role.Id;
            scope.RoleName = role.Name;
            scope.ResourceScope = ResourceScopeEnum.Tenant;
            scope.IsProtected = true;
            await _Database.CredentialScopeAssignments.CreateAsync(scope, token).ConfigureAwait(false);
            _Log?.Invoke("seeded credential " + name + " (" + accessKey + ")");
        }

        #endregion
    }
}
