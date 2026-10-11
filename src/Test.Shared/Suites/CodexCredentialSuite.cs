namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Codex;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Server.Backplane;
    using Garrison.Server.Runtime;
    using Garrison.Server.Settings;
    using SyslogLogging;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// G-22: the control plane owns the refresh of ChatGPT logins stored in CodexAuthJson secrets. Every case talks to
    /// a local fake token endpoint; nothing reaches OpenAI.
    /// </summary>
    public static class CodexCredentialSuite
    {
        #region Private-Members

        private static readonly string _MasterKey = "codex-credential-suite-key";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("codex-credentials", "auth-document", "auth.json parsing keeps unknown fields, reads JWT expiry, and the run copy drops the refresh token", ct => AuthDocumentAsync(ct)));
            suites.Add(new TestSuiteDescriptor("codex-credentials", "Codex credentials", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "codex-credentials-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "fresh-no-refresh", "A login far from expiry is not refreshed; short-lived tokens use half their lifetime (" + provider + ")", ct => FreshNoRefreshAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "near-expiry-refresh", "A login near expiry is refreshed once and written back encrypted with every field kept (" + provider + ")", ct => NearExpiryRefreshAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "concurrent-one-refresh", "Concurrent runs on two replicas cause exactly one refresh (" + provider + ")", ct => ConcurrentOneRefreshAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "reuse-needs-reauthentication", "refresh_token_reused and invalid_grant mark the secret NeedsReauthentication and stop further refreshes (" + provider + ")", ct => ReuseNeedsReauthenticationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "transient-failure", "A transient refresh failure keeps a still-valid login usable and fails an expired one without marking it (" + provider + ")", ct => TransientFailureAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "background-refresh", "The background check refreshes idle logins near expiry and skips the rest (" + provider + ")", ct => BackgroundRefreshAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "run-copy", "Runs get the login without its refresh token, Codex's own refresh is disabled, and previews never refresh (" + provider + ")", ct => RunCopyAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "run-end-to-end", "Runs refresh through the server, fail with NotCredentialed on a reused token, and replacing the secret clears the state (" + provider + ")", ct => RunEndToEndAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Codex credentials (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task AuthDocumentAsync(CancellationToken token)
        {
            DateTime expires = DateTime.UtcNow.AddHours(3);
            string json = FakeTokenEndpoint.AuthJson(expires, "rt-document");
            CodexAuthFile file = Assert.NotNull(CodexAuthDocument.TryParse(json), "parsed auth.json");
            Assert.True(file.IsRefreshable(), "a ChatGPT login is refreshable");
            DateTime? read = CodexAuthDocument.AccessTokenExpiresUtc(json);
            Assert.True(read.HasValue && Math.Abs((read.Value - expires).TotalSeconds) < 2, "expiry read from the exp claim");

            string written = CodexAuthDocument.Serialize(file);
            Assert.True(written.Contains("\"future_field\"", StringComparison.Ordinal) && written.Contains("\"nested\"", StringComparison.Ordinal), "unknown top-level fields survive");
            Assert.True(written.Contains("\"future_token_field\": \"keep-me\"", StringComparison.Ordinal), "unknown token fields survive");
            Assert.True(written.Contains("\"OPENAI_API_KEY\": null", StringComparison.Ordinal), "OPENAI_API_KEY is written even when null");
            Assert.True(written.Contains("\"auth_mode\": \"chatgpt\"", StringComparison.Ordinal), "auth_mode survives");

            string run = CodexAuthDocument.ForRun(json);
            CodexAuthFile runFile = Assert.NotNull(CodexAuthDocument.TryParse(run), "run copy parses");
            Assert.Equal(String.Empty, runFile.Tokens!.RefreshToken ?? "missing", "run copy has an empty refresh token");
            Assert.Equal(file.Tokens!.AccessToken, runFile.Tokens.AccessToken, "run copy keeps the access token");
            Assert.True(!run.Contains("rt-document", StringComparison.Ordinal), "run copy never contains the refresh token");

            Assert.Equal("sk-not-json", CodexAuthDocument.ForRun("sk-not-json"), "non-JSON values pass through");
            Assert.True(CodexAuthDocument.TryParse("{ broken") == null, "broken JSON reads as null");
            Assert.True(CodexAuthDocument.ReadClaims("not.a-jwt") == null, "bad JWT reads as null");
            string apiKeyOnly = "{\"OPENAI_API_KEY\":\"sk-test\"}";
            Assert.True(!Assert.NotNull(CodexAuthDocument.TryParse(apiKeyOnly), "api key auth.json").IsRefreshable(), "an API key login is not refreshable");
            Assert.Equal(apiKeyOnly, CodexAuthDocument.ForRun(apiKeyOnly), "API key logins pass through");
            return Task.CompletedTask;
        }

        private static async Task FreshNoRefreshAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeTokenEndpoint endpoint = new FakeTokenEndpoint())
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            using (CodexCredentialService service = NewService(db, endpoint, "node-a"))
            {
                Secret fresh = await CreateSecretAsync(db, "fresh", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddDays(5), "rt-fresh"), token).ConfigureAwait(false);
                Secret prepared = await service.PrepareAsync(fresh, token).ConfigureAwait(false);
                Assert.True(ReferenceEquals(fresh, prepared), "a fresh login is returned as is");

                // One-hour tokens with 50 minutes left are not due (half the lifetime is 30 minutes) ...
                Secret shortFresh = await CreateSecretAsync(db, "short-fresh", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddMinutes(50), "rt-short-fresh", TimeSpan.FromHours(1)), token).ConfigureAwait(false);
                await service.PrepareAsync(shortFresh, token).ConfigureAwait(false);
                Assert.Equal(0, endpoint.Requests, "no refresh for fresh logins");

                // ... but with 20 minutes left they are.
                Secret shortDue = await CreateSecretAsync(db, "short-due", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddMinutes(20), "rt-short-due", TimeSpan.FromHours(1)), token).ConfigureAwait(false);
                await service.PrepareAsync(shortDue, token).ConfigureAwait(false);
                Assert.Equal(1, endpoint.Requests, "a short-lived token past half its lifetime is refreshed");

                Secret other = new Secret();
                other.TenantId = "ten_codex";
                other.Name = "anthropic";
                other.Kind = SecretKindEnum.AnthropicApiKey;
                Assert.True(ReferenceEquals(other, await service.PrepareAsync(other, token).ConfigureAwait(false)), "other kinds are untouched");
                Assert.Equal(1, endpoint.Requests, "no refresh for other kinds");
            }
        }

        private static async Task NearExpiryRefreshAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeTokenEndpoint endpoint = new FakeTokenEndpoint())
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            using (CodexCredentialService service = NewService(db, endpoint, "node-a"))
            {
                List<CodexRefreshResult> events = new List<CodexRefreshResult>();
                service.RefreshCompleted += (sender, result) => { lock (events) events.Add(result); };
                DateTime started = DateTime.UtcNow;
                Secret secret = await CreateSecretAsync(db, "near", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddHours(1), "rt-initial"), token).ConfigureAwait(false);

                Secret prepared = await service.PrepareAsync(secret, token).ConfigureAwait(false);
                Assert.Equal(1, endpoint.Requests, "one refresh request");
                CodexTokenRefreshRequest sent = Assert.NotNull(endpoint.LastRequest, "request body");
                Assert.Equal(CodexSettings.DefaultClientId, sent.ClientId, "client_id is the Codex CLI client");
                Assert.Equal("refresh_token", sent.GrantType, "grant_type");
                Assert.Equal("rt-initial", sent.RefreshToken, "the stored refresh token is presented");
                Assert.True((endpoint.LastContentType ?? String.Empty).StartsWith("application/json", StringComparison.OrdinalIgnoreCase), "JSON request body, as Codex sends it");

                Secret stored = Assert.NotNull(await db.Secrets.ReadAsync(secret.Id, token).ConfigureAwait(false), "stored secret");
                Assert.True(stored.ValueEncrypted != secret.ValueEncrypted, "the stored value changed");
                Assert.True(!(stored.ValueEncrypted ?? String.Empty).Contains("rt-rotated", StringComparison.Ordinal), "the stored value is encrypted");
                string value = Cipher().Decrypt(stored.ValueEncrypted!, stored.Id);
                CodexAuthFile file = Assert.NotNull(CodexAuthDocument.TryParse(value), "stored auth.json");
                Assert.Equal(endpoint.LastIssuedAccessToken, file.Tokens!.AccessToken, "new access token written back");
                Assert.Equal(endpoint.LastIssuedRefreshToken, file.Tokens.RefreshToken, "rotated refresh token written back");
                Assert.Equal("acct-test", file.Tokens.AccountId, "account_id kept");
                Assert.True(value.Contains("\"future_token_field\": \"keep-me\"", StringComparison.Ordinal) && value.Contains("\"future_field\"", StringComparison.Ordinal) && value.Contains("\"auth_mode\": \"chatgpt\"", StringComparison.Ordinal), "fields Codex expects are kept");
                DateTime lastRefresh = file.LastRefreshUtc() ?? DateTime.MinValue;
                Assert.True(lastRefresh >= started.AddSeconds(-1) && lastRefresh <= DateTime.UtcNow.AddSeconds(1), "last_refresh updated");

                Assert.Equal(SecretStatusEnum.Ok, stored.Status, "status");
                Assert.True(stored.RefreshedUtc.HasValue && stored.RefreshedUtc.Value >= started.AddSeconds(-1), "refreshedUtc set");
                Assert.True(stored.AccessTokenExpiresUtc.HasValue && stored.AccessTokenExpiresUtc.Value > DateTime.UtcNow.AddDays(9), "accessTokenExpiresUtc from the new token");
                Assert.Equal(stored.ValueEncrypted, prepared.ValueEncrypted, "the run compiles with the refreshed value");
                Assert.Equal(1, events.Count(e => e.Outcome == CodexRefreshOutcomeEnum.Refreshed), "one Refreshed outcome raised");

                await service.PrepareAsync(stored, token).ConfigureAwait(false);
                Assert.Equal(1, endpoint.Requests, "the refreshed login is not refreshed again");
            }
        }

        private static async Task ConcurrentOneRefreshAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            DatabaseSettings settings = TestEnvironment.IsolatedSettings(provider);
            using (FakeTokenEndpoint endpoint = new FakeTokenEndpoint())
            using (DatabaseDriverBase dbA = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            using (DatabaseDriverBase dbB = await DatabaseDriverFactory.CreateAndInitializeAsync(settings.Clone(), token).ConfigureAwait(false))
            using (CodexCredentialService replicaA = NewService(dbA, endpoint, "replica-a"))
            using (CodexCredentialService replicaB = NewService(dbB, endpoint, "replica-b"))
            {
                endpoint.DelayMs = 500;
                int refreshed = 0;
                replicaA.RefreshCompleted += (sender, result) => { if (result.Outcome == CodexRefreshOutcomeEnum.Refreshed) Interlocked.Increment(ref refreshed); };
                replicaB.RefreshCompleted += (sender, result) => { if (result.Outcome == CodexRefreshOutcomeEnum.Refreshed) Interlocked.Increment(ref refreshed); };
                Secret secret = await CreateSecretAsync(dbA, "shared", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddMinutes(30), "rt-shared"), token).ConfigureAwait(false);

                List<Task<Secret>> runs = new List<Task<Secret>>();
                for (int i = 0; i < 8; i++)
                {
                    CodexCredentialService replica = i % 2 == 0 ? replicaA : replicaB;
                    DatabaseDriverBase db = i % 2 == 0 ? dbA : dbB;
                    runs.Add(Task.Run(async () =>
                    {
                        Secret loaded = Assert.NotNull(await db.Secrets.ReadAsync(secret.Id, token).ConfigureAwait(false), "secret as a run loads it");
                        return await replica.PrepareAsync(loaded, token).ConfigureAwait(false);
                    }, token));
                }
                Secret[] prepared = await Task.WhenAll(runs).ConfigureAwait(false);

                Assert.Equal(1, endpoint.Requests, "exactly one refresh request across both replicas");
                Assert.Equal(1, Volatile.Read(ref refreshed), "exactly one Refreshed outcome");
                foreach (Secret run in prepared)
                {
                    CodexAuthFile file = Assert.NotNull(CodexAuthDocument.TryParse(Cipher().Decrypt(run.ValueEncrypted!, run.Id)), "prepared login");
                    Assert.Equal(endpoint.LastIssuedAccessToken, file.Tokens!.AccessToken, "every run gets the refreshed access token");
                }
                Secret stored = Assert.NotNull(await dbB.Secrets.ReadAsync(secret.Id, token).ConfigureAwait(false), "stored secret");
                Assert.Equal(SecretStatusEnum.Ok, stored.Status, "status after the race");
                CoordinationLease? lease = await dbA.CoordinationLeases.ReadByNameAsync(CodexCredentialService.LeaseName(secret.Id), token).ConfigureAwait(false);
                Assert.True(lease != null && String.IsNullOrEmpty(lease.Holder), "the refresh lease is released");
            }
        }

        private static async Task ReuseNeedsReauthenticationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeTokenEndpoint endpoint = new FakeTokenEndpoint())
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            using (CodexCredentialService service = NewService(db, endpoint, "node-a"))
            {
                endpoint.Mode = FakeTokenEndpointModeEnum.Reused;
                Secret secret = await CreateSecretAsync(db, "reused", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddMinutes(10), "rt-reused"), token).ConfigureAwait(false);

                CredentialUnavailableException first = await ExpectUnavailableAsync(() => service.PrepareAsync(secret, token)).ConfigureAwait(false);
                Assert.Equal("SecretNeedsReauthentication", first.Code, "code");
                Assert.True(first.Message.Contains("needs reauthentication", StringComparison.Ordinal) && first.Message.Contains("refresh_token_reused", StringComparison.Ordinal), "message names the cause: " + first.Message);
                Assert.True(first.Message.Contains("auth.json", StringComparison.Ordinal), "message says how to fix it");

                Secret stored = Assert.NotNull(await db.Secrets.ReadAsync(secret.Id, token).ConfigureAwait(false), "stored secret");
                Assert.Equal(SecretStatusEnum.NeedsReauthentication, stored.Status, "status");
                Assert.True((stored.StatusMessage ?? String.Empty).Contains("refresh_token_reused", StringComparison.Ordinal), "status message");
                Assert.True(stored.StatusUtc.HasValue, "statusUtc");
                Assert.Equal(secret.ValueEncrypted, stored.ValueEncrypted, "the value is unchanged");

                await ExpectUnavailableAsync(() => service.PrepareAsync(stored, token)).ConfigureAwait(false);
                Assert.Equal(1, endpoint.Requests, "a secret that needs reauthentication is not refreshed again");

                endpoint.Mode = FakeTokenEndpointModeEnum.InvalidGrant;
                Secret invalid = await CreateSecretAsync(db, "invalid-grant", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddMinutes(10), "rt-invalid"), token).ConfigureAwait(false);
                CredentialUnavailableException second = await ExpectUnavailableAsync(() => service.PrepareAsync(invalid, token)).ConfigureAwait(false);
                Assert.Equal("SecretNeedsReauthentication", second.Code, "invalid_grant code");
                Secret invalidStored = Assert.NotNull(await db.Secrets.ReadAsync(invalid.Id, token).ConfigureAwait(false), "stored secret");
                Assert.Equal(SecretStatusEnum.NeedsReauthentication, invalidStored.Status, "invalid_grant marks the secret");
            }
        }

        private static async Task TransientFailureAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeTokenEndpoint endpoint = new FakeTokenEndpoint())
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            using (CodexCredentialService service = NewService(db, endpoint, "node-a"))
            {
                endpoint.Mode = FakeTokenEndpointModeEnum.ServerError;
                Secret valid = await CreateSecretAsync(db, "still-valid", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddHours(2), "rt-valid"), token).ConfigureAwait(false);
                Secret prepared = await service.PrepareAsync(valid, token).ConfigureAwait(false);
                Assert.Equal(valid.ValueEncrypted, prepared.ValueEncrypted, "a still-valid login is used as is");
                Assert.Equal(1, endpoint.Requests, "the refresh was attempted");

                Secret expired = await CreateSecretAsync(db, "expired", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddMinutes(-5), "rt-expired"), token).ConfigureAwait(false);
                CredentialUnavailableException failed = await ExpectUnavailableAsync(() => service.PrepareAsync(expired, token)).ConfigureAwait(false);
                Assert.Equal("SecretRefreshFailed", failed.Code, "code");
                Assert.True(failed.Message.Contains("503", StringComparison.Ordinal), "message carries the endpoint status: " + failed.Message);

                foreach (Secret secret in new Secret[] { valid, expired })
                {
                    Secret stored = Assert.NotNull(await db.Secrets.ReadAsync(secret.Id, token).ConfigureAwait(false), "stored secret");
                    Assert.Equal(SecretStatusEnum.Ok, stored.Status, "transient failures do not mark the secret");
                    Assert.Equal(secret.ValueEncrypted, stored.ValueEncrypted, "value unchanged");
                }

                endpoint.Mode = FakeTokenEndpointModeEnum.Rotate;
                await service.PrepareAsync(expired, token).ConfigureAwait(false);
                Assert.Equal(3, endpoint.Requests, "the next run retries and succeeds");
            }
        }

        private static async Task BackgroundRefreshAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeTokenEndpoint endpoint = new FakeTokenEndpoint())
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            using (CodexCredentialService service = NewService(db, endpoint, "node-a"))
            {
                Secret due = await CreateSecretAsync(db, "idle-due", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddHours(3), "rt-idle-due"), token).ConfigureAwait(false);
                Secret fresh = await CreateSecretAsync(db, "idle-fresh", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddDays(6), "rt-idle-fresh"), token).ConfigureAwait(false);
                Secret broken = await CreateSecretAsync(db, "idle-broken", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddHours(1), "rt-idle-broken"), token).ConfigureAwait(false);
                broken.Status = SecretStatusEnum.NeedsReauthentication;
                broken.StatusMessage = "test";
                await db.Secrets.UpdateAsync(broken, token).ConfigureAwait(false);
                Secret inactive = await CreateSecretAsync(db, "idle-inactive", FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddHours(1), "rt-idle-inactive"), token).ConfigureAwait(false);
                inactive.Active = false;
                await db.Secrets.UpdateAsync(inactive, token).ConfigureAwait(false);

                int refreshed = await service.RefreshDueSecretsAsync(token).ConfigureAwait(false);
                Assert.Equal(1, refreshed, "refreshed by the background check");
                Assert.Equal("rt-idle-due", endpoint.LastRequest?.RefreshToken, "only the due login was refreshed");
                Assert.Equal(1, endpoint.Requests, "requests");
                Secret freshStored = Assert.NotNull(await db.Secrets.ReadAsync(fresh.Id, token).ConfigureAwait(false), "fresh secret");
                Assert.True(freshStored.AccessTokenExpiresUtc.HasValue, "the background check records the expiry of fresh logins");
                Assert.True(freshStored.RefreshedUtc == null, "fresh logins are not refreshed");

                Assert.Equal(0, await service.RefreshDueSecretsAsync(token).ConfigureAwait(false), "nothing is due on the next pass");
            }
        }

        private static async Task RunCopyAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("codex", false, token).ConfigureAwait(false);
                string auth = FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddDays(5), "rt-must-not-leak");
                Secret login = await fixture.SecretAsync("sec_codex_login", SecretKindEnum.CodexAuthJson, auth, token).ConfigureAwait(false);
                deployment.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "codexauth", ResourceId = login.Id });
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);

                RecordingSecretPreparer preparer = new RecordingSecretPreparer();
                fixture.Compiler.SecretPreparer = preparer;
                CompilationResult result = await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(deployment, false), null, token).ConfigureAwait(false);
                int compileCalls = preparer.Calls;
                Assert.True(compileCalls >= 2, "run compiles pass every bound secret through the preparer");

                ExecutionFile file = result.Spec.Files.FirstOrDefault(f => f.Path == ".codex/auth.json") ?? throw new TestAssertionException("auth.json file missing from the spec.");
                Assert.True(file.IsSecret, "auth.json is a secret file");
                Assert.True(result.Spec.Files.All(f => !f.Content.Contains("rt-must-not-leak", StringComparison.Ordinal)), "no file carries the refresh token");
                CodexAuthFile runCopy = Assert.NotNull(CodexAuthDocument.TryParse(file.Content), "run copy");
                Assert.Equal(String.Empty, runCopy.Tokens!.RefreshToken ?? "missing", "refresh token removed");
                CodexAuthFile original = Assert.NotNull(CodexAuthDocument.TryParse(auth), "original");
                Assert.Equal(original.Tokens!.AccessToken, runCopy.Tokens.AccessToken, "access token kept");
                ExecutionEnvironmentVariable? disabled = result.Spec.Environment.FirstOrDefault(v => v.Name == "CODEX_REFRESH_TOKEN_URL_OVERRIDE");
                Assert.True(disabled != null && disabled.Value.StartsWith("http://127.0.0.1:9/", StringComparison.Ordinal), "Codex's own refresh is pointed at a dead loopback port");
                Assert.True(result.Spec.ScrubValues.Contains(original.Tokens.AccessToken!), "the access token is scrubbed from output");

                await fixture.Compiler.PreviewAsync(CompilerFixture.TenantId, deployment.Id, "preview", null, token).ConfigureAwait(false);
                Assert.Equal(compileCalls, preparer.Calls, "previews never call the preparer");
            }
        }

        private static async Task RunEndToEndAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeTokenEndpoint endpoint = new FakeTokenEndpoint())
            {
                await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 1, BackplaneModeEnum.Auto, s => s.Codex.TokenEndpoint = endpoint.TokenUrl, token).ConfigureAwait(false))
                {
                    TestServerHost host = cluster.Replicas[0];
                    await cluster.AddWorkerAsync(0, null, token).ConfigureAwait(false);
                    string secrets = "/v1.0/api/tenants/" + cluster.TenantId + "/secrets";

                    SecretRequest create = new SecretRequest();
                    create.Name = "codex-login";
                    create.Kind = SecretKindEnum.CodexAuthJson;
                    create.Value = FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddHours(1), "rt-e2e-1");
                    Secret secret = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, secrets, create, 201, token).ConfigureAwait(false);
                    Assert.Equal(SecretStatusEnum.Ok, secret.Status, "new secrets are Ok");
                    Assert.True(secret.AccessTokenExpiresUtc.HasValue, "the API reports the access token expiry");

                    Agent agent = await cluster.CreateAgentAsync(0, "codex-login-user", d => d.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "codexauth", ResourceId = secret.Id }), token).ConfigureAwait(false);

                    // Near expiry: the server refreshes before the run and writes the rotated login back.
                    Run refreshedRun = await InvokeAsync(host, cluster.TenantId, agent, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, refreshedRun.Status, "run with a refreshed login: " + refreshedRun.ErrorMessage);
                    Assert.Equal(1, endpoint.Requests, "one refresh");
                    Secret afterRefresh = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Get, secrets + "/" + secret.Id, null, 200, token).ConfigureAwait(false);
                    Assert.True(afterRefresh.RefreshedUtc.HasValue, "refreshedUtc reported");
                    Assert.True(afterRefresh.AccessTokenExpiresUtc.HasValue && afterRefresh.AccessTokenExpiresUtc.Value > DateTime.UtcNow.AddDays(9), "new expiry reported");

                    // A login whose refresh token was already used elsewhere: the run fails early with a clear message.
                    endpoint.Mode = FakeTokenEndpointModeEnum.Reused;
                    SecretValueRequest stale = new SecretValueRequest();
                    stale.Value = FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddMinutes(20), "rt-e2e-used-elsewhere");
                    await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Put, secrets + "/" + secret.Id + "/value", stale, 200, token).ConfigureAwait(false);
                    Run failed = await InvokeAsync(host, cluster.TenantId, agent, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Failed, failed.Status, "run status");
                    Assert.Equal(RunOutcomeEnum.NotCredentialed, failed.Outcome, "run outcome");
                    Assert.True((failed.ErrorMessage ?? String.Empty).Contains("needs reauthentication", StringComparison.Ordinal) && (failed.ErrorMessage ?? String.Empty).Contains("codex-login", StringComparison.Ordinal), "message names the secret and the fix: " + failed.ErrorMessage);
                    Assert.Equal(2, endpoint.Requests, "one refresh attempt for the stale login");

                    TestResponse marked = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, secrets + "/" + secret.Id, null, token).ConfigureAwait(false);
                    Assert.True(marked.Body.Contains("\"status\":\"NeedsReauthentication\"", StringComparison.Ordinal), "REST reports the status: " + marked.Body);
                    Secret markedSecret = Serializer.Deserialize<Secret>(marked.Body) ?? throw new TestAssertionException("Empty secret.");
                    Assert.True((markedSecret.StatusMessage ?? String.Empty).Contains("refresh_token_reused", StringComparison.Ordinal) && markedSecret.StatusUtc.HasValue, "status message and time");
                    Assert.True(!marked.Body.Contains("rt-e2e", StringComparison.Ordinal), "no token in the API response");

                    Run again = await InvokeAsync(host, cluster.TenantId, agent, token).ConfigureAwait(false);
                    Assert.Equal(RunOutcomeEnum.NotCredentialed, again.Outcome, "later runs fail at once");
                    Assert.Equal(2, endpoint.Requests, "no further refresh attempts");

                    // Replacing the value clears the state.
                    SecretValueRequest replacement = new SecretValueRequest();
                    replacement.Value = FakeTokenEndpoint.AuthJson(DateTime.UtcNow.AddDays(5), "rt-e2e-new-login");
                    Secret replaced = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Put, secrets + "/" + secret.Id + "/value", replacement, 200, token).ConfigureAwait(false);
                    Assert.Equal(SecretStatusEnum.Ok, replaced.Status, "status after replacing the value");
                    Assert.True(replaced.StatusMessage == null && replaced.StatusUtc == null && replaced.RefreshedUtc == null, "status details cleared");
                    Run recovered = await InvokeAsync(host, cluster.TenantId, agent, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, recovered.Status, "run after replacing the secret: " + recovered.ErrorMessage);
                    Assert.Equal(2, endpoint.Requests, "a fresh login is not refreshed");
                }
            }
        }

        private static async Task<Run> InvokeAsync(TestServerHost host, string tenantId, Agent agent, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = "Use the Codex login.";
            request.Wait = true;
            request.WaitSeconds = 60;
            TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            if (response.StatusCode != 200) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
            return Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
        }

        private static async Task<CredentialUnavailableException> ExpectUnavailableAsync(Func<Task> action)
        {
            try
            {
                await action().ConfigureAwait(false);
            }
            catch (CredentialUnavailableException e)
            {
                return e;
            }
            throw new TestAssertionException("Expected CredentialUnavailableException.");
        }

        private static async Task<Secret> CreateSecretAsync(DatabaseDriverBase db, string name, string value, CancellationToken token)
        {
            Secret secret = new Secret();
            secret.TenantId = "ten_codex";
            secret.Name = name;
            secret.Kind = SecretKindEnum.CodexAuthJson;
            secret.ValueEncrypted = Cipher().Encrypt(value, secret.Id);
            secret.ValueLast4 = SecretGenerator.Last4(value);
            secret.Fingerprint = SecretGenerator.Fingerprint(value);
            return await db.Secrets.CreateAsync(secret, token).ConfigureAwait(false);
        }

        private static CodexCredentialService NewService(DatabaseDriverBase db, FakeTokenEndpoint endpoint, string nodeId)
        {
            CodexSettings settings = new CodexSettings();
            settings.TokenEndpoint = endpoint.TokenUrl;
            settings.RefreshTimeoutSeconds = 10;
            LoggingModule logging = new LoggingModule();
            logging.Settings.EnableConsole = Environment.GetEnvironmentVariable("GARRISON_TEST_LOGS") == "true";
            CodexCredentialService service = new CodexCredentialService(db, Cipher(), () => settings, nodeId, logging);
            service.LockPollMs = 50;
            return service;
        }

        private static SecretCipher Cipher()
        {
            return new SecretCipher(_MasterKey);
        }

        #endregion
    }
}
