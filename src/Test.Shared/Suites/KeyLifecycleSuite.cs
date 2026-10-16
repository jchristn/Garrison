namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Net;
    using System.Net.Http;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Server.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Key rotation and credential lifetime regressions (P15.2, P15.3).</summary>
    public static class KeyLifecycleSuite
    {
        /// <summary>Build provider suites.</summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "key-lifecycle-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Key lifecycle (" + provider + ")", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "rotate-key-ring", "Old secret material rotates without losing values; repeat passes are idempotent and retired keys are refused", ct => RotationAsync(provider, ct)),
                    new TestCaseDescriptor(id, "expiry-policy", "Credential default and maximum expiry policies reject invalid lifetimes and bound issued session and run tokens", ct => ExpiryAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static async Task RotationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, settings =>
            {
                settings.Security.MasterKey = "active-key-two";
                settings.Security.MasterKeyVersion = 2;
                settings.Security.PreviousMasterKeys.Add(1, "old-key-one");
            }, token).ConfigureAwait(false))
            {
                DatabaseDriverBase database = host.Server.Context.Database;
                SecretCipher old = new SecretCipher("old-key-one", 1);
                Secret secret = new Secret { TenantId = host.TenantId, Name = "old-secret", Kind = SecretKindEnum.GenericEnv };
                secret.ValueEncrypted = old.Encrypt("preserved-value", secret.Id);
                secret.Fingerprint = old.Fingerprint("preserved-value");
                await database.Secrets.CreateAsync(secret, token).ConfigureAwait(false);
                Trigger trigger = new Trigger { TenantId = host.TenantId, Name = "old-trigger", Active = false };
                SigningSecrets.Apply(trigger, "preserved-trigger-signing-key", old);
                await database.Triggers.CreateAsync(trigger, token).ConfigureAwait(false);
                NotificationEndpoint endpoint = new NotificationEndpoint { TenantId = host.TenantId, Name = "old-endpoint", Url = "https://example.com/", Active = false };
                SigningSecrets.Apply(endpoint, "preserved-endpoint-signing-key", old);
                await database.NotificationEndpoints.CreateAsync(endpoint, token).ConfigureAwait(false);
                Credential credential = await database.Credentials.ReadByAccessKeyAsync("access_garrison_default", token).ConfigureAwait(false) ?? throw new TestAssertionException("Seed credential");
                credential.SecretKeyEncrypted = old.Encrypt("preserved-credential-key", credential.Id);
                await database.Credentials.UpdateAsync(credential, token).ConfigureAwait(false);
                using (HttpResponseMessage response = await host.AdminClient.PostAsync("/v1.0/api/settings/keys/rotate", null, token).ConfigureAwait(false))
                {
                    Assert.Equal(HttpStatusCode.OK, response.StatusCode, "Admin rotation route");
                    MasterKeyRotationResponse result = Serializer.Deserialize<MasterKeyRotationResponse>(await response.Content.ReadAsStringAsync(token).ConfigureAwait(false))!;
                    Assert.Equal(4, result.Rotated, "All four secret stores rotate");
                    Assert.Equal(0, result.Failed, "No unreadable values");
                }
                Secret rotated = (await database.Secrets.ReadAsync(host.TenantId, secret.Id, token).ConfigureAwait(false))!;
                SecretCipher activeOnly = new SecretCipher("active-key-two", 2);
                Assert.Equal("preserved-value", activeOnly.Decrypt(rotated.ValueEncrypted!, secret.Id), "Old key can be removed after rotation");
                Assert.Equal(2, rotated.KeyVersion, "Metadata version updated");
                Assert.Equal(activeOnly.Fingerprint("preserved-value"), rotated.Fingerprint, "Fingerprint uses new key");
                Assert.Equal("preserved-trigger-signing-key", SigningSecrets.Read((await database.Triggers.ReadAsync(host.TenantId, trigger.Id, token).ConfigureAwait(false))!, activeOnly), "Trigger key preserved");
                Assert.Equal("preserved-endpoint-signing-key", SigningSecrets.Read((await database.NotificationEndpoints.ReadAsync(host.TenantId, endpoint.Id, token).ConfigureAwait(false))!, activeOnly), "Endpoint key preserved");
                MasterKeyRotationResponse again = await new MasterKeyRotationService(database, host.Server.Context.Cipher).RotateAsync(token).ConfigureAwait(false);
                Assert.Equal(0, again.Rotated, "Repeat pass is idempotent");
                bool refused = false;
                try { activeOnly.Decrypt(secret.ValueEncrypted!, secret.Id); }
                catch (CryptographicException) { refused = true; }
                Assert.True(refused, "Removing a key refuses its old ciphertext");
                using (HttpClient anonymous = new HttpClient())
                using (HttpResponseMessage denied = await anonymous.PostAsync(host.BaseUrl + "/v1.0/api/settings/keys/rotate", null, token).ConfigureAwait(false))
                    Assert.Equal(HttpStatusCode.Unauthorized, denied.StatusCode, "Anonymous rotation denied");
            }
        }

        private static async Task ExpiryAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, settings =>
            {
                settings.Auth.CredentialDefaultLifetimeDays = 2;
                settings.Auth.CredentialMaxLifetimeDays = 3;
                settings.Auth.RunTokenLifetimeMinutes = 2;
            }, token).ConfigureAwait(false))
            {
                string path = "/v1.0/api/tenants/" + host.TenantId + "/credentials";
                User owner = (await host.Server.Context.Database.Users.ReadByEmailAsync(host.TenantId, "admin@garrison", token).ConfigureAwait(false))!;
                CredentialCreateResponse created;
                using (HttpResponseMessage response = await host.AdminClient.PostAsync(path, Json(new { name = "bounded", userId = owner.Id }), token).ConfigureAwait(false))
                {
                    string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    Assert.Equal(HttpStatusCode.Created, response.StatusCode, body);
                    created = Serializer.Deserialize<CredentialCreateResponse>(body)!;
                }
                Assert.True(created.Credential.ExpiresUtc > DateTime.UtcNow.AddDays(1.9) && created.Credential.ExpiresUtc <= DateTime.UtcNow.AddDays(2), "Default expiry is two days");
                foreach (DateTime expiry in new[] { DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(4) })
                {
                    using (HttpResponseMessage response = await host.AdminClient.PutAsync(path + "/" + created.Credential.Id, Json(new { expiresUtc = expiry }), token).ConfigureAwait(false))
                        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode, "Invalid expiry refused");
                }
                Credential credential = created.Credential;
                credential.ExpiresUtc = DateTime.UtcNow.AddSeconds(30);
                TokenResponse issued = await host.Server.Context.Authentication.IssueForCredentialAsync(credential, AuthSchemeEnum.AccessKeySecret, null, null, token).ConfigureAwait(false);
                Assert.True(issued.ExpiresUtc <= credential.ExpiresUtc, "Session never outlives credential");
                string runToken = await host.Server.Context.Authentication.IssueForRunAsync(new Run { TenantId = host.TenantId }, 1, DateTime.UtcNow.AddDays(1), token).ConfigureAwait(false);
                Assert.True(host.Server.Context.Authentication.Decode(runToken)!.ExpiresUtc <= DateTime.UtcNow.AddMinutes(2), "Run token lifetime ceiling");
            }
        }

        private static StringContent Json(object value)
        {
            return new StringContent(Serializer.Serialize(value), Encoding.UTF8, "application/json");
        }
    }
}
