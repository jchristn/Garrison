namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Security.Cryptography;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Security;
    using Garrison.Server.Services;
    using Test.Shared.Infrastructure;

    /// <summary>
    /// Identity unit cases that need no server.
    /// </summary>
    public static class IdentityUnitCases
    {
        /// <summary>
        /// Tampered and expired tokens are rejected.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public static Task TokenTamperAsync(CancellationToken token)
        {
            TokenService tokens = new TokenService("signing-key", "garrison", 60);
            TokenPayload payload = new TokenPayload();
            payload.SessionId = "ses_1";
            payload.TokenId = "tok";
            payload.TenantId = "ten_a";
            payload.ExpiresUtc = DateTime.UtcNow.AddMinutes(5);
            string issued = tokens.Issue(payload);
            Assert.True(tokens.Validate(issued) != null, "Valid token rejected.");

            char[] chars = issued.ToCharArray();
            int index = chars.Length / 2;
            chars[index] = chars[index] == 'A' ? 'B' : 'A';
            Assert.True(tokens.Validate(new string(chars)) == null, "Tampered token accepted.");
            Assert.True(new TokenService("other-key", "garrison", 60).Validate(issued) == null, "Token accepted with the wrong key.");

            payload.ExpiresUtc = DateTime.UtcNow.AddMinutes(-1);
            Assert.True(tokens.Validate(tokens.Issue(payload)) == null, "Expired token accepted.");
            Assert.True(tokens.Validate("not-a-token") == null, "Garbage accepted.");
            return Task.CompletedTask;
        }

        /// <summary>
        /// RBAC evaluator semantics.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public static Task RbacMatrixAsync(CancellationToken token)
        {
            PermissionGrant permitAll = Grant(new[] { "All" }, new[] { "All" }, PermissionTypeEnum.Permit, ResourceScopeEnum.Tenant, null, true);
            PermissionGrant denyAgentDelete = Grant(new[] { "Agent" }, new[] { "Delete" }, PermissionTypeEnum.Deny, ResourceScopeEnum.Tenant, null, true);
            List<PermissionGrant> grants = new List<PermissionGrant> { permitAll, denyAgentDelete };
            Assert.Equal(AuthorizationResultEnum.DeniedExplicit, PermissionEvaluator.Evaluate(grants, ResourceTypeEnum.Agent, OperationTypeEnum.Delete, "agt_1").Result, "Deny beats permit");
            Assert.True(PermissionEvaluator.Evaluate(grants, ResourceTypeEnum.Agent, OperationTypeEnum.Read, "agt_1").Permitted, "Permit All reads");

            PermissionGrant resourceScoped = Grant(new[] { "Agent" }, new[] { "All" }, PermissionTypeEnum.Permit, ResourceScopeEnum.Resource, "agt_x", true);
            List<PermissionGrant> scoped = new List<PermissionGrant> { resourceScoped };
            Assert.True(PermissionEvaluator.Evaluate(scoped, ResourceTypeEnum.Agent, OperationTypeEnum.Update, "agt_x").Permitted, "Resource grant on its resource");
            Assert.Equal(AuthorizationResultEnum.DeniedImplicit, PermissionEvaluator.Evaluate(scoped, ResourceTypeEnum.Agent, OperationTypeEnum.Update, "agt_y").Result, "Resource grant on another resource");
            Assert.Equal(AuthorizationResultEnum.DeniedImplicit, PermissionEvaluator.Evaluate(scoped, ResourceTypeEnum.Agent, OperationTypeEnum.Update, null).Result, "Resource grant at tenant level");

            PermissionGrant noInherit = Grant(new[] { "Agent" }, new[] { "Read" }, PermissionTypeEnum.Permit, ResourceScopeEnum.Tenant, null, false);
            List<PermissionGrant> tenantOnly = new List<PermissionGrant> { noInherit };
            Assert.True(PermissionEvaluator.Evaluate(tenantOnly, ResourceTypeEnum.Agent, OperationTypeEnum.Read, null).Permitted, "Tenant-level read");
            Assert.True(!PermissionEvaluator.Evaluate(tenantOnly, ResourceTypeEnum.Agent, OperationTypeEnum.Read, "agt_1").Permitted, "Non-inheriting grant applied to a resource");

            PermissionGrant write = Grant(new[] { "Deployment" }, new[] { "Write" }, PermissionTypeEnum.Permit, ResourceScopeEnum.Tenant, null, true);
            List<PermissionGrant> writes = new List<PermissionGrant> { write };
            Assert.True(PermissionEvaluator.Evaluate(writes, ResourceTypeEnum.Deployment, OperationTypeEnum.Create, null).Permitted, "Write covers Create");
            Assert.True(PermissionEvaluator.Evaluate(writes, ResourceTypeEnum.Deployment, OperationTypeEnum.Delete, null).Permitted, "Write covers Delete");
            Assert.True(!PermissionEvaluator.Evaluate(writes, ResourceTypeEnum.Deployment, OperationTypeEnum.Read, null).Permitted, "Write does not cover Read");
            Assert.True(!PermissionEvaluator.Evaluate(writes, ResourceTypeEnum.Agent, OperationTypeEnum.Create, null).Permitted, "Write is limited to its resource type");
            Assert.Equal(AuthorizationResultEnum.DeniedImplicit, PermissionEvaluator.Evaluate(new List<PermissionGrant>(), ResourceTypeEnum.Agent, OperationTypeEnum.Read, null).Result, "No grants");
            return Task.CompletedTask;
        }

        /// <summary>
        /// Secret cipher round trip and tamper detection.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public static Task SecretCipherAsync(CancellationToken token)
        {
            SecretCipher cipher = new SecretCipher("master-key");
            string encrypted = cipher.Encrypt("sk-ant-secret", "sec_1");
            Assert.Equal("sk-ant-secret", cipher.Decrypt(encrypted, "sec_1"), "Round trip");
            Assert.True(!encrypted.Contains("sk-ant"), "Plaintext visible in ciphertext.");
            bool rejected = false;
            try
            {
                cipher.Decrypt(encrypted, "sec_2");
            }
            catch (CryptographicException)
            {
                rejected = true;
            }
            Assert.True(rejected, "Associated data mismatch was not detected.");
            return Task.CompletedTask;
        }

        /// <summary>
        /// Redaction rules.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public static Task RedactionAsync(CancellationToken token)
        {
            foreach (string header in new[] { "Authorization", "x-api-key", "X-Secret-Key", "x-token", "Cookie", "x-custom-token", "x-password" })
            {
                Assert.True(RequestHistoryCaptureService.IsSecretHeader(header), header + " should be redacted.");
            }
            Assert.True(!RequestHistoryCaptureService.IsSecretHeader("Content-Type"), "Content-Type redacted.");
            Assert.True(RequestHistoryCaptureService.IsSecretRoute("/v1.0/api/tenants/ten_1/secrets/sec_1/value"), "Secret route not detected.");
            Assert.True(RequestHistoryCaptureService.IsSecretRoute("/v1.0/token"), "Token route not detected.");
            Assert.True(RequestHistoryCaptureService.IsSecretRoute("/v1.0/api/tenants/ten_1/credentials"), "Credential route not detected.");
            Assert.True(!RequestHistoryCaptureService.IsSecretRoute("/v1.0/api/tenants/ten_1/agents"), "Agent route redacted.");
            return Task.CompletedTask;
        }

        private static PermissionGrant Grant(string[] types, string[] operations, PermissionTypeEnum type, ResourceScopeEnum scope, string? resourceId, bool inherits)
        {
            PermissionGrant grant = new PermissionGrant();
            grant.ResourceTypes = new List<string>(types);
            grant.Operations = new List<string>(operations);
            grant.PermissionType = type;
            grant.Scope = scope;
            grant.ResourceId = resourceId;
            grant.InheritsToChildren = inherits;
            grant.Source = "test";
            return grant;
        }
    }
}
