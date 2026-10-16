namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Actual HTTP provider issuance, fencing, tombstones, compiler integration, and retry guarantees.</summary>
    public static class CredentialBrokerSuite
    {
        /// <summary>Build provider contract regression suites for both persistence providers.</summary>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "credential-broker-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Revocable provider credentials", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "metadata-change-retries", "Broker resource edits revoke credentials and maintenance retries failed revocation", ct => MetadataAsync(provider, ct)),
                    new TestCaseDescriptor(id, "tenant-delete-retries", "Tenant deletion preserves pending revocation metadata through provider outages and purges it only after confirmation", ct => TenantDeleteAsync(provider, ct)),
                    new TestCaseDescriptor(id, "epoch-revocation", "Provider credentials are idempotent within an epoch, revoked before replacement, and revoked at completion", ct => EpochAsync(provider, ct)),
                    new TestCaseDescriptor(id, "retry-before-replacement", "Provider outage blocks overlapping replacement credentials and maintenance retries confirmed revocation", ct => RetryAsync(provider, ct)),
                    new TestCaseDescriptor(id, "delayed-issuance-tombstone", "A provider revoke tombstone fences an issuance response delayed past lease expiry", ct => DelayedAsync(provider, ct)),
                    new TestCaseDescriptor(id, "bounded-ttl-and-redirect", "Too-short or overlong TTL and redirected issuance fail closed without returning a credential", ct => BoundsAsync(provider, ct)),
                    new TestCaseDescriptor(id, "compiler-and-metadata-api", "Broker metadata is tenant-managed without static values; compiler injects only ephemeral values and previews do not mint", ct => CompilerAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static async Task MetadataAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeCredentialIssuer issuer = new FakeCredentialIssuer())
            await using (TestServerHost host = await StartAsync(provider, issuer, token).ConfigureAwait(false))
            {
                CredentialBrokerService broker = host.Server.Context.Get<CredentialBrokerService>();
                Secret secret = await SecretAsync(host, token).ConfigureAwait(false);
                Run run = await RunAsync(host, token).ConfigureAwait(false);
                string value = await ValueAsync(host, broker, secret, run, token).ConfigureAwait(false);
                issuer.FailRevocation = true;
                Secret updated = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Put, "/v1.0/api/tenants/" + host.TenantId + "/secrets/" + secret.Id,
                    new SecretRequest { Name = secret.Name, Kind = SecretKindEnum.LeaseBroker, BrokerResource = "changed-resource" }, 200, token).ConfigureAwait(false);
                Assert.Equal("changed-resource", updated.BrokerResource, "Broker metadata edit persisted");
                Assert.True(issuer.RevokeCalls > 0 && issuer.Accepts(value), "Provider outage is not falsely reported as successful revocation");
                Assert.Equal(1, (await host.Server.Context.Database.CredentialLeases.ListRevocationCandidatesAsync(token).ConfigureAwait(false)).Count, "Changed metadata selected for retry even while run remains active");
                int issueCalls = issuer.IssueCalls;
                await ExpectAsync("CredentialLeaseFenced", () => broker.PrepareAsync(updated, run, token), token).ConfigureAwait(false);
                Assert.Equal(issueCalls, issuer.IssueCalls, "Changed resource cannot reissue the old same-epoch credential during revocation outage");
                Secret audienceChanged = new Secret { Id = secret.Id, TenantId = secret.TenantId, Kind = SecretKindEnum.LeaseBroker, BrokerResource = secret.BrokerResource, BrokerAudience = "changed-audience" };
                await ExpectAsync("CredentialLeaseFenced", () => broker.PrepareAsync(audienceChanged, run, token), token).ConfigureAwait(false);
                DateTime originalDeadline = run.DeadlineUtc!.Value;
                run.DeadlineUtc = originalDeadline.AddSeconds(-5);
                await ExpectAsync("CredentialLeaseFenced", () => broker.PrepareAsync(secret, run, token), token).ConfigureAwait(false);
                run.DeadlineUtc = originalDeadline.AddSeconds(5);
                await ExpectAsync("CredentialLeaseFenced", () => broker.PrepareAsync(secret, run, token), token).ConfigureAwait(false);
                run.DeadlineUtc = originalDeadline;
                Assert.Equal(issueCalls, issuer.IssueCalls, "Audience and deadline changes fail before provider issuance");
                issuer.FailRevocation = false;
                await broker.SweepAsync(token).ConfigureAwait(false);
                Assert.True(!issuer.Accepts(value), "Provider retry revokes superseded resource credential");
            }
        }

        private static async Task TenantDeleteAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeCredentialIssuer issuer = new FakeCredentialIssuer())
            await using (TestServerHost host = await StartAsync(provider, issuer, token).ConfigureAwait(false))
            {
                AdoDatabaseDriver db = (AdoDatabaseDriver)host.Server.Context.Database;
                CredentialBrokerService broker = host.Server.Context.Get<CredentialBrokerService>();
                Tenant tenant = await db.Tenants.CreateAsync(new Tenant { Name = "broker-delete-tenant" }, token).ConfigureAwait(false);
                Secret secret = await db.Secrets.CreateAsync(new Secret { TenantId = tenant.Id, Name = "broker", Kind = SecretKindEnum.LeaseBroker, BrokerResource = "tenant-resource" }, token).ConfigureAwait(false);
                Run run = await db.Runs.CreateAsync(new Run { TenantId = tenant.Id, AgentId = "agt_broker", DeploymentId = "dep_broker", Status = RunStatusEnum.Running, LeaseEpoch = 7, LeaseNodeId = "nod_broker", LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5), DeadlineUtc = DateTime.UtcNow.AddMinutes(1) }, token).ConfigureAwait(false);
                string value = await ValueAsync(host, broker, secret, run, token).ConfigureAwait(false);
                issuer.FailRevocation = true;
                TestResponse deleted = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, "/v1.0/api/tenants/" + tenant.Id, null, token).ConfigureAwait(false);
                Assert.Equal(204, deleted.StatusCode, "Tenant cascade completed");
                Assert.True(await db.Tenants.ReadAsync(tenant.Id, token).ConfigureAwait(false) == null, "Tenant removed");
                Assert.Equal(1, (await db.CredentialLeases.ListOutstandingAsync(tenant.Id, run.Id, token).ConfigureAwait(false)).Count, "Pending provider obligation survives cascade");
                await broker.SweepAsync(token).ConfigureAwait(false);
                Assert.True(issuer.Accepts(value), "Outage leaves bounded provider credential active, not silently forgotten");
                issuer.FailRevocation = false;
                await broker.SweepAsync(token).ConfigureAwait(false);
                Assert.True(!issuer.Accepts(value), "Provider cleanup retried after tenant deletion");
                List<int> leftovers = await db.QueryAsync("SELECT 1 FROM " + db.Table("credential_leases") + " WHERE tenantid=@tenant", command => AdoDatabaseDriver.Add(command, "tenant", tenant.Id), reader => 1, token).ConfigureAwait(false);
                Assert.Equal(0, leftovers.Count, "Confirmed orphan metadata purged");
            }
        }

        private static async Task EpochAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeCredentialIssuer issuer = new FakeCredentialIssuer())
            await using (TestServerHost host = await StartAsync(provider, issuer, token).ConfigureAwait(false))
            {
                CredentialBrokerService broker = host.Server.Context.Get<CredentialBrokerService>();
                Secret secret = await SecretAsync(host, token).ConfigureAwait(false);
                Run run = await RunAsync(host, token).ConfigureAwait(false);
                string first = await ValueAsync(host, broker, secret, run, token).ConfigureAwait(false);
                Assert.Equal(first, await ValueAsync(host, broker, secret, run, token).ConfigureAwait(false), "Same epoch recompile uses stable provider idempotency identity");
                Assert.True(issuer.Accepts(first), "Destination accepts current credential");
                run.LeaseEpoch++;
                run = await host.Server.Context.Database.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                string second = await ValueAsync(host, broker, secret, run, token).ConfigureAwait(false);
                Assert.True(second != first && !issuer.Accepts(first) && issuer.Accepts(second), "Old provider credential revoked before replacement succeeds");
                await host.Server.Context.Get<RunEventService>().CompleteAsync(run.Id, new RunCompleteRequest { NodeId = run.LeaseNodeId!, Epoch = run.LeaseEpoch, Status = RunStatusEnum.Succeeded, Outcome = RunOutcomeEnum.Succeeded }, token).ConfigureAwait(false);
                Assert.True(!issuer.Accepts(second), "Actual completion hook immediately revokes provider credential");
                Assert.Equal(0, (await host.Server.Context.Database.CredentialLeases.ListOutstandingAsync(run.TenantId, run.Id, token).ConfigureAwait(false)).Count, "Revocations durably confirmed");
            }
        }

        private static async Task RetryAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeCredentialIssuer issuer = new FakeCredentialIssuer())
            await using (TestServerHost host = await StartAsync(provider, issuer, token).ConfigureAwait(false))
            {
                CredentialBrokerService broker = host.Server.Context.Get<CredentialBrokerService>();
                Secret secret = await SecretAsync(host, token).ConfigureAwait(false);
                Run run = await RunAsync(host, token).ConfigureAwait(false);
                string first = await ValueAsync(host, broker, secret, run, token).ConfigureAwait(false);
                issuer.FailRevocation = true;
                run.LeaseEpoch++;
                run = await host.Server.Context.Database.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                await ExpectAsync("CredentialRevocationPending", () => broker.PrepareAsync(secret, run, token)).ConfigureAwait(false);
                Assert.Equal(1, issuer.IssueCalls, "No overlapping credential minted while prior revocation is unconfirmed");
                Assert.True(issuer.Accepts(first), "Outage cannot pretend an external token was revoked");
                CredentialLease outstanding = (await host.Server.Context.Database.CredentialLeases.ListOutstandingAsync(run.TenantId, run.Id, token).ConfigureAwait(false)).Single();
                Assert.True(outstanding.RevokeAttempts >= 1, "Retry state is durable");
                issuer.FailRevocation = false;
                await broker.SweepAsync(token).ConfigureAwait(false);
                string replacement = await ValueAsync(host, broker, secret, run, token).ConfigureAwait(false);
                Assert.True(!issuer.Accepts(first) && issuer.Accepts(replacement), "Confirmed retry unblocks safe replacement");
                await broker.RevokeRunAsync(run.TenantId, run.Id, run.LeaseEpoch, token).ConfigureAwait(false);
                Assert.True(!issuer.Accepts(replacement), "Immediate completion/suspension hook revokes current epoch");
            }
        }

        private static async Task DelayedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeCredentialIssuer issuer = new FakeCredentialIssuer { PauseIssue = true })
            await using (TestServerHost host = await StartAsync(provider, issuer, token).ConfigureAwait(false))
            {
                CredentialBrokerService broker = host.Server.Context.Get<CredentialBrokerService>();
                Secret secret = await SecretAsync(host, token).ConfigureAwait(false);
                Run run = await RunAsync(host, token).ConfigureAwait(false);
                Task<Secret> pending = broker.PrepareAsync(secret, run, token);
                await issuer.IssueArrived.Task.WaitAsync(TimeSpan.FromSeconds(10), token).ConfigureAwait(false);
                run.LeaseExpiresUtc = DateTime.UtcNow.AddSeconds(-1);
                await host.Server.Context.Database.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                await broker.SweepAsync(token).ConfigureAwait(false);
                Assert.True(issuer.RevokeCalls >= 1, "Unknown issuance tombstoned before delayed response");
                issuer.ReleaseIssue.TrySetResult(true);
                await ExpectAsync("CredentialIssueFailed", () => pending).ConfigureAwait(false);
                Assert.Equal(0, (await host.Server.Context.Database.CredentialLeases.ListOutstandingAsync(run.TenantId, run.Id, token).ConfigureAwait(false)).Count, "Delayed issue cannot resurrect a revoked lease");
            }
        }

        private static async Task BoundsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeCredentialIssuer issuer = new FakeCredentialIssuer())
            await using (TestServerHost host = await StartAsync(provider, issuer, token).ConfigureAwait(false))
            {
                CredentialBrokerService broker = host.Server.Context.Get<CredentialBrokerService>();
                Secret secret = await SecretAsync(host, token).ConfigureAwait(false);
                Run run = await RunAsync(host, token).ConfigureAwait(false);
                run.DeadlineUtc = DateTime.UtcNow.AddDays(2);
                await ExpectAsync("CredentialLeaseTooShort", () => broker.PrepareAsync(secret, run, token)).ConfigureAwait(false);
                Assert.Equal(0, issuer.IssueCalls, "Overlong run refused before contacting issuer");
                run.DeadlineUtc = DateTime.UtcNow.AddMinutes(1);
                issuer.ShortExpiry = true;
                await ExpectAsync("CredentialLeaseTooShort", () => broker.PrepareAsync(secret, run, token)).ConfigureAwait(false);
                Assert.True(issuer.RevokeCalls >= 1, "Unsuitable provider response revoked");
                issuer.ShortExpiry = false;
                issuer.LongExpiry = true;
                Run overlong = await RunAsync(host, token).ConfigureAwait(false);
                await ExpectAsync("CredentialLeaseTooShort", () => broker.PrepareAsync(secret, overlong, token)).ConfigureAwait(false);
                issuer.LongExpiry = false;
                Run redirected = await RunAsync(host, token).ConfigureAwait(false);
                issuer.ShortExpiry = false;
                issuer.RedirectIssue = true;
                int before = issuer.IssueCalls;
                await ExpectAsync("CredentialIssueFailed", () => broker.PrepareAsync(secret, redirected, token)).ConfigureAwait(false);
                Assert.Equal(before + 1, issuer.IssueCalls, "Issue redirect not followed");
            }
        }

        private static async Task CompilerAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeCredentialIssuer issuer = new FakeCredentialIssuer())
            await using (TestServerHost host = await StartAsync(provider, issuer, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                string prefix = "/v1.0/api/tenants/" + host.TenantId;
                Secret secret = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, prefix + "/secrets", new SecretRequest { Name = "provider-metadata", Kind = SecretKindEnum.LeaseBroker, BrokerResource = "tenant-scoped-resource", BrokerAudience = "fixture" }, 201, token).ConfigureAwait(false);
                TestResponse settingsRead = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/settings", null, token).ConfigureAwait(false);
                Assert.True(!settingsRead.Body.Contains("fixture-operator-provider-auth", StringComparison.Ordinal), "Operator provider authorization is absent from settings API");
                Secret stored = Assert.NotNull(await db.Secrets.ReadAsync(host.TenantId, secret.Id, token).ConfigureAwait(false), "Stored secret metadata");
                Assert.True(stored.ValueEncrypted == null && stored.BrokerResource == "tenant-scoped-resource", "No reusable or issued credential persisted");
                TestResponse staticValue = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, prefix + "/secrets/" + secret.Id + "/value", new { value = "forbidden-static-value" }, token).ConfigureAwait(false);
                Assert.Equal(400, staticValue.StatusCode, "Broker values cannot be set through metadata API");
                HarnessProfile profile = Assert.NotNull(await db.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/fake", token).ConfigureAwait(false), "Fake profile");
                profile.Id = Garrison.Core.Helpers.IdGenerator.NewHarnessProfileId();
                profile.TenantId = host.TenantId; profile.Name = "broker-profile"; profile.IsBuiltIn = false; profile.IsProtected = false;
                profile.CredentialEnvironmentAllowlist.Add("BROKER_TOKEN");
                profile.Environment.Add(new HarnessEnvironmentVariable { Name = "BROKER_TOKEN", ValueTemplate = "{{secret.leased}}", IsSecret = true });
                await db.HarnessProfiles.CreateAsync(profile, token).ConfigureAwait(false);
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, prefix + "/agents", new Agent { Name = "broker-agent" }, 201, token).ConfigureAwait(false);
                Deployment deployment = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, prefix + "/deployments", new Deployment { Name = "broker-deployment", AgentId = agent.Id, HarnessProfileId = profile.Id, ResourceBindings = new List<DeploymentResourceBinding> { new DeploymentResourceBinding { Alias = "leased", ResourceId = secret.Id, Kind = ResourceBindingKindEnum.Secret } } }, 201, token).ConfigureAwait(false);
                Run run = await RunAsync(host, token).ConfigureAwait(false);
                run.AgentId = agent.Id; run.DeploymentId = deployment.Id;
                run = await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                InvocationCompiler compiler = host.Server.Context.Get<InvocationCompiler>();
                await compiler.PreviewAsync(host.TenantId, deployment.Id, "preview", null, token).ConfigureAwait(false);
                Assert.Equal(0, issuer.IssueCalls, "Preview never mints provider credentials");
                CompilationResult compiled = await compiler.CompileAsync(run, null, token).ConfigureAwait(false);
                string value = compiled.Spec.Environment.Single(variable => variable.Name == "BROKER_TOKEN").Value;
                Assert.True(issuer.Accepts(value), "Real compiler injects issued ephemeral value");
                Assert.True(compiled.Spec.ScrubValues.Contains(value), "Ephemeral values participate in run output scrubbing");
                Assert.True((await db.Secrets.ReadAsync(host.TenantId, secret.Id, token).ConfigureAwait(false))!.ValueEncrypted == null, "Compile does not persist issued token into secret");
            }
        }

        private static Task<TestServerHost> StartAsync(DatabaseTypeEnum provider, FakeCredentialIssuer issuer, CancellationToken token)
        {
            return TestServerHost.StartAsync(provider, settings =>
            {
                settings.CredentialBroker.Enabled = true;
                settings.CredentialBroker.IssuerUrl = issuer.BaseUrl + "/issue";
                settings.CredentialBroker.RevokerUrl = issuer.BaseUrl + "/revoke";
                settings.CredentialBroker.AuthorizationToken = "fixture-operator-provider-auth";
                settings.CredentialBroker.AllowPrivateDestinations = true;
            }, token);
        }

        private static Task<Secret> SecretAsync(TestServerHost host, CancellationToken token)
        {
            return host.Server.Context.Database.Secrets.CreateAsync(new Secret { TenantId = host.TenantId, Name = "broker-fixture", Kind = SecretKindEnum.LeaseBroker, BrokerResource = "tenant-scoped-resource" }, token);
        }

        private static Task<Run> RunAsync(TestServerHost host, CancellationToken token)
        {
            return host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = "agt_broker", DeploymentId = "dep_broker", Status = RunStatusEnum.Running, LeaseEpoch = 7, LeaseNodeId = "nod_broker", LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5), DeadlineUtc = DateTime.UtcNow.AddMinutes(1), StartedUtc = DateTime.UtcNow }, token);
        }

        private static async Task<string> ValueAsync(TestServerHost host, CredentialBrokerService broker, Secret secret, Run run, CancellationToken token)
        {
            Secret ephemeral = await broker.PrepareAsync(secret, run, token).ConfigureAwait(false);
            return host.Server.Context.Cipher.Decrypt(ephemeral.ValueEncrypted!, ephemeral.Id);
        }

        private static async Task ExpectAsync(string code, Func<Task<Secret>> action, CancellationToken token = default)
        {
            token.ThrowIfCancellationRequested();
            try { await action().ConfigureAwait(false); }
            catch (CredentialUnavailableException e) when (e.Code == code) { return; }
            throw new TestAssertionException("Expected provider failure " + code + ".");
        }
    }
}
