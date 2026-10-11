namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
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
        /// Password hashing: PBKDF2 format, per-password salt, wrong passwords, legacy SHA-256 verification, and rehash detection.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public static Task PasswordHashingAsync(CancellationToken token)
        {
            string first = PasswordHasher.Hash("correct horse");
            string second = PasswordHasher.Hash("correct horse");
            Assert.True(first.StartsWith("pbkdf2-sha256$600000$", StringComparison.Ordinal), "Default format and iterations: " + first);
            string[] parts = first.Split('$');
            Assert.Equal(4, parts.Length, "Encoded parts");
            Assert.Equal(16, Convert.FromBase64String(parts[2]).Length, "Salt bytes");
            Assert.Equal(32, Convert.FromBase64String(parts[3]).Length, "Hash bytes");
            Assert.True(first.Length <= 128, "Encoded hash fits the 128-character column: " + first.Length);
            Assert.True(first != second, "Two hashes of one password share a salt.");
            Assert.True(PasswordHasher.Verify("correct horse", first), "Correct password rejected.");
            Assert.True(PasswordHasher.Verify("correct horse", second), "Correct password rejected (second salt).");
            Assert.True(!PasswordHasher.Verify("correct horsf", first), "Wrong password accepted.");
            Assert.True(!PasswordHasher.Verify("", first), "Empty password accepted.");
            Assert.True(!PasswordHasher.Verify(null, first), "Null password accepted.");
            Assert.True(!PasswordHasher.NeedsRehash(first, PasswordHasher.DefaultIterations), "Current hash flagged for rehash.");

            string low = PasswordHasher.Hash("correct horse", 10000);
            Assert.True(low.StartsWith("pbkdf2-sha256$10000$", StringComparison.Ordinal), "Explicit iterations: " + low);
            Assert.True(PasswordHasher.Verify("correct horse", low), "Low-iteration hash rejected.");
            Assert.True(PasswordHasher.NeedsRehash(low, PasswordHasher.DefaultIterations), "Hash with fewer iterations not flagged.");
            Assert.True(!PasswordHasher.NeedsRehash(first, 10000), "Hash with more iterations flagged for a downgrade.");

            string legacy = PasswordHasher.LegacySha256("correct horse");
            Assert.Equal(64, legacy.Length, "Legacy length");
            Assert.True(PasswordHasher.IsLegacy(legacy), "Legacy hash not detected.");
            Assert.True(PasswordHasher.Verify("correct horse", legacy), "Legacy hash rejected.");
            Assert.True(PasswordHasher.Verify("correct horse", legacy.ToUpperInvariant()), "Uppercase legacy hash rejected.");
            Assert.True(!PasswordHasher.Verify("wrong horse", legacy), "Wrong password accepted against a legacy hash.");
            Assert.True(PasswordHasher.NeedsRehash(legacy, PasswordHasher.DefaultIterations), "Legacy hash not flagged for rehash.");

            foreach (string malformed in new[] { "pbkdf2-sha256$", "pbkdf2-sha256$abc$AAAA$AAAA", "pbkdf2-sha256$1000$!!!$AAAA", "pbkdf2-sha256$1000$$", "plain-text-password", "correct horse" })
            {
                Assert.True(!PasswordHasher.Verify("correct horse", malformed), "Malformed hash accepted: " + malformed);
            }
            Assert.True(!PasswordHasher.VerifyDummy("correct horse"), "Dummy verification returned true.");

            bool threw = false;
            try
            {
                PasswordHasher.Hash("x", 10);
            }
            catch (ArgumentOutOfRangeException)
            {
                threw = true;
            }
            Assert.True(threw, "Too few iterations accepted.");
            return Task.CompletedTask;
        }

        /// <summary>
        /// Comparison is constant time: equal-length comparisons that differ at the first or last byte take about as long,
        /// and a dummy verification for an unknown user takes about as long as a real one.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public static Task PasswordTimingAsync(CancellationToken token)
        {
            string a = new string('a', 4096);
            string earlyDiff = "b" + new string('a', 4095);
            string lateDiff = new string('a', 4095) + "b";
            Assert.True(PasswordHasher.FixedTimeEquals(a, new string('a', 4096)), "Equal strings compared unequal.");
            Assert.True(!PasswordHasher.FixedTimeEquals(a, earlyDiff) && !PasswordHasher.FixedTimeEquals(a, lateDiff), "Different strings compared equal.");
            Assert.True(!PasswordHasher.FixedTimeEquals(a, null) && !PasswordHasher.FixedTimeEquals(null, a), "Null compared equal.");

            for (int i = 0; i < 2000; i++) PasswordHasher.FixedTimeEquals(a, earlyDiff);
            long early = MedianTicks(() => PasswordHasher.FixedTimeEquals(a, earlyDiff), 2000);
            long late = MedianTicks(() => PasswordHasher.FixedTimeEquals(a, lateDiff), 2000);
            double ratio = (double)Math.Max(early, late) / Math.Max(1, Math.Min(early, late));
            Assert.True(ratio < 3.0, "Comparison time depends on where the strings differ (early " + early + " ticks, late " + late + " ticks).");

            string stored = PasswordHasher.Hash("correct horse");
            long real = MedianTicks(() => PasswordHasher.Verify("wrong horse", stored), 5);
            long dummy = MedianTicks(() => PasswordHasher.VerifyDummy("wrong horse"), 5);
            double verifyRatio = (double)Math.Max(real, dummy) / Math.Max(1, Math.Min(real, dummy));
            Assert.True(verifyRatio < 3.0, "Unknown-user verification time differs from a real verification (real " + real + " ticks, dummy " + dummy + " ticks).");
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

        private static long MedianTicks(Func<bool> action, int samples)
        {
            List<long> ticks = new List<long>();
            for (int i = 0; i < samples; i++)
            {
                Stopwatch watch = Stopwatch.StartNew();
                action();
                watch.Stop();
                ticks.Add(watch.ElapsedTicks);
            }
            ticks.Sort();
            return ticks[ticks.Count / 2];
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
