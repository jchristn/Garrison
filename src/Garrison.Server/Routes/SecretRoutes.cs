namespace Garrison.Server.Routes
{
    using System;
    using System.Linq;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Secret routes. Values are write-only: responses carry metadata (kind, last four characters, fingerprint) only.
    /// </summary>
    public class SecretRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/secrets";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public SecretRoutes(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        public void Register(RouteRegistrar routes)
        {
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Secret, OperationTypeEnum.Read, ListAsync, "List secrets (metadata only)", "Secrets", null, typeof(EnumerationResult<Secret>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Secret, OperationTypeEnum.Create, CreateAsync, "Create a secret", "Secrets", typeof(SecretRequest), typeof(Secret));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Secret, OperationTypeEnum.Read, ReadAsync, "Read secret metadata", "Secrets", null, typeof(Secret));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.Secret, OperationTypeEnum.Update, UpdateAsync, "Update secret metadata (and value when supplied)", "Secrets", typeof(SecretRequest), typeof(Secret));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}/value", ResourceTypeEnum.Secret, OperationTypeEnum.Update, SetValueAsync, "Set a secret value", "Secrets", typeof(SecretValueRequest), typeof(Secret));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/rotate", ResourceTypeEnum.Secret, OperationTypeEnum.Update, SetValueAsync, "Rotate a secret value", "Secrets", typeof(SecretValueRequest), typeof(Secret));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.Secret, OperationTypeEnum.Delete, DeleteAsync, "Delete a secret", "Secrets");
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.Secrets.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            SecretRequest request = RouteHelpers.RequiredBody<SecretRequest>(http);
            Validate(request);
            Secret? existing = await _Server.Database.Secrets.ReadByNameAsync(tenantId, request.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing, existing?.Id, null, request.Name);

            Secret secret = new Secret();
            secret.TenantId = tenantId;
            secret.Name = request.Name;
            secret.Description = request.Description;
            secret.Kind = request.Kind;
            secret.ExpiresUtc = request.ExpiresUtc;
            if (!String.IsNullOrEmpty(request.Value)) SetValue(secret, request.Value);
            Secret created = await _Server.Database.Secrets.CreateAsync(secret, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.SecretChanged, "Secret", created.Id, "Created secret " + created.Name + (String.IsNullOrEmpty(request.Value) ? " without a value." : " with a value.")).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Secret secret = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(secret.TenantId, false, secret.IsProtected, tenantId, "Secret " + secret.Name);
            SecretRequest request = RouteHelpers.RequiredBody<SecretRequest>(http);
            Validate(request);
            Secret? named = await _Server.Database.Secrets.ReadByNameAsync(tenantId, request.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, secret.Id, request.Name);
            secret.Name = request.Name;
            secret.Description = request.Description;
            bool kindChanged = secret.Kind != request.Kind;
            secret.Kind = request.Kind;
            secret.ExpiresUtc = request.ExpiresUtc;
            if (!String.IsNullOrEmpty(request.Value)) SetValue(secret, request.Value);
            else if (kindChanged) SecretValueState.Reset(secret, secret.Kind == SecretKindEnum.CodexAuthJson ? DecryptOrNull(secret) : null);
            Secret updated = await _Server.Database.Secrets.UpdateAsync(secret, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.SecretChanged, "Secret", updated.Id, "Updated secret " + updated.Name + (String.IsNullOrEmpty(request.Value) ? "." : " including its value.")).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task SetValueAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Secret secret = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(secret.TenantId, false, secret.IsProtected, tenantId, "Secret " + secret.Name);
            SecretValueRequest request = RouteHelpers.RequiredBody<SecretValueRequest>(http);
            if (String.IsNullOrEmpty(request.Value)) throw new ValidationException("A value is required.");
            SetValue(secret, request.Value);
            Secret updated = await _Server.Database.Secrets.UpdateAsync(secret, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.SecretChanged, "Secret", updated.Id, "Set the value of secret " + updated.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Secret secret = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(secret.TenantId, false, secret.IsProtected, tenantId, "Secret " + secret.Name);
            await ConfigurationSupport.EnsureUnreferencedAsync(_Server, tenantId, d => d.ResourceBindings.Any(b => b.Kind == ResourceBindingKindEnum.Secret && b.ResourceId == secret.Id), "Secret " + secret.Name, http.Token).ConfigureAwait(false);
            if (await _Server.Database.ArtifactStores.UsesSecretAsync(tenantId, secret.Id, http.Token).ConfigureAwait(false)) throw new ConflictException("ResourceInUse", "The secret is used by an artifact store.");
            await _Server.Database.Secrets.DeleteAsync(secret.Id, http.Token).ConfigureAwait(false);
            await CodexCredentialService.DeleteLeaseAsync(_Server.Database, secret.Id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.SecretChanged, "Secret", secret.Id, "Deleted secret " + secret.Name + ".").ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private void SetValue(Secret secret, string value)
        {
            secret.ValueEncrypted = _Server.Cipher.Encrypt(value, secret.Id);
            secret.ValueLast4 = SecretGenerator.Last4(value);
            secret.Fingerprint = SecretGenerator.Fingerprint(value);
            secret.KeyVersion = _Server.Cipher.KeyVersion;
            secret.RotatedUtc = DateTime.UtcNow;
            SecretValueState.Reset(secret, value);
        }

        private string? DecryptOrNull(Secret secret)
        {
            if (String.IsNullOrEmpty(secret.ValueEncrypted)) return null;
            try
            {
                return _Server.Cipher.Decrypt(secret.ValueEncrypted, secret.Id);
            }
            catch (Exception e) when (e is System.Security.Cryptography.CryptographicException || e is FormatException)
            {
                return null;
            }
        }

        private static void Validate(SecretRequest request)
        {
            System.Collections.Generic.Dictionary<string, string> errors = new System.Collections.Generic.Dictionary<string, string>();
            System.Collections.Generic.Dictionary<string, string> codes = new System.Collections.Generic.Dictionary<string, string>();
            ConfigurationValidator.Name(request.Name, errors);
            if (request.Value != null && request.Value.Length > 1048576)
            {
                errors["value"] = "Secret values are limited to 1 MiB.";
                codes["value"] = "TooLong";
            }
            if (!ConfigurationValidator.SecretExpiry(request.ExpiresUtc, DateTime.UtcNow, errors)) codes["expiresUtc"] = "ExpiryInPast";
            if (errors.Count > 0) throw new ValidationException("The secret is invalid: " + String.Join(" ", errors.Values), errors, codes);
        }

        private async Task<Secret> LoadAsync(HttpContextBase http)
        {
            Secret? secret = await _Server.Database.Secrets.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            return secret ?? throw new NotFoundException("Secret not found.");
        }

        #endregion
    }
}
