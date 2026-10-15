namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Worker.Hosting;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Upgrade-path tests (plan P15.6): build a database exactly as an older release left it (schema migrations applied
    /// only up to an older version, rows written with that version's columns, secrets encrypted with the installation's
    /// master key, a legacy SHA-256 password), start the current server against it, and check that migrations reach the
    /// latest version, the data reads back through the REST API with the same identifiers, the legacy password and
    /// credential still authenticate, and a run executes end to end on a worker. Rolling upgrades of a running
    /// Kubernetes deployment are covered separately by <c>k8s/tests/rolling-upgrade-test.sh</c>.
    /// </summary>
    public static class UpgradeSuite
    {
        #region Private-Members

        private const string MasterKey = "test-master-key";
        private const string TenantId = "ten_legacy";
        private const string UserId = "usr_legacy";
        private const string UserEmail = "legacy@example.com";
        private const string UserPassword = "legacy-password-1";
        private const string CredentialId = "crd_legacy";
        private const string AccessKey = "access_legacy_upgrade";
        private const string SecretKey = "secret_legacy_upgrade_value";
        private const string SecretId = "sec_legacy";
        private const string SecretValue = "legacy-secret-value-0123";
        private const string AgentId = "agt_legacy";
        private const string AgentName = "legacy-agent";
        private const string DeploymentId = "dep_legacy";
        private const string RunId = "run_legacy";
        private const string ConversationId = "cnv_legacy";
        private const string QuotaId = "uqt_legacy";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "upgrade-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "from-schema-1", "An installation at schema 1 (tenant, user with a legacy password, credential, secret, agent, deployment with parameters, a finished run with events) upgrades to the latest schema, reads back through the API, authenticates, and runs end to end (" + provider + ")", ct => UpgradeAsync(provider, 1, ct)));
                cases.Add(new TestCaseDescriptor(id, "from-schema-15", "An installation that started at schema 1 and later ran schema 15 (adds a conversation and a daily quota) upgrades to the latest schema with its data intact and quota enforcement off, and runs end to end (" + provider + ")", ct => UpgradeAsync(provider, 15, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Upgrade path (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static async Task UpgradeAsync(DatabaseTypeEnum provider, int olderVersion, CancellationToken token)
        {
            DatabaseSettings settings = TestEnvironment.IsolatedSettings(provider);
            DateTime seeded = new DateTime(2026, 1, 5, 10, 0, 0, DateTimeKind.Utc);
            await BuildLegacyDatabaseAsync(settings, olderVersion, seeded, token).ConfigureAwait(false);

            await using (TestServerHost host = await TestServerHost.StartAsync(provider, s => s.Database = settings, token).ConfigureAwait(false))
            {
                DatabaseDriverBase database = host.Server.Context.Database;
                Assert.Equal(SchemaBuilder.LatestVersion, database.SchemaVersion, "Schema version after upgrade");
                int expectedMigrations = SchemaBuilder.Build(((AdoDatabaseDriver)database).Catalog, ((AdoDatabaseDriver)database).Dialect).Count(m => m.Version > olderVersion);
                Assert.Equal(expectedMigrations, database.MigrationsApplied, "Only the migrations after schema " + olderVersion + " apply");

                // Administrator view of the legacy tenant.
                Tenant tenant = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + TenantId, null, 200, token).ConfigureAwait(false);
                Assert.Equal("legacy-tenant", tenant.Name, "Tenant name");
                Assert.True(!tenant.RequireUntrustedDeployments, "Existing tenants do not start requiring Untrusted deployments.");

                // The legacy SHA-256 password still signs in, and is rehashed on the way.
                using (HttpClient user = await host.UserClientAsync(UserEmail, UserPassword, TenantId, token).ConfigureAwait(false))
                {
                    await CheckTenantDataAsync(user, olderVersion, token).ConfigureAwait(false);
                }
                User rehashed = Assert.NotNull(await database.Users.ReadAsync(TenantId, UserId, token).ConfigureAwait(false), "Legacy user");
                Assert.True(!PasswordHasher.IsLegacy(rehashed.PasswordHash), "Legacy password hash upgraded on sign-in.");

                // The credential secret, encrypted with the installation's master key, still authenticates.
                using (HttpClient credential = host.CredentialClient(AccessKey, SecretKey))
                {
                    await CheckTenantDataAsync(credential, olderVersion, token).ConfigureAwait(false);
                }

                // The tenant secret decrypts to its original value.
                Secret secret = Assert.NotNull(await database.Secrets.ReadAsync(TenantId, SecretId, token).ConfigureAwait(false), "Legacy secret");
                Assert.Equal(SecretValue, host.Server.Context.Cipher.Decrypt(secret.ValueEncrypted!, secret.Id), "Secret value");

                // The built-in harness profile row the older release wrote was refreshed in place.
                HarnessProfile fake = Assert.NotNull(await database.HarnessProfiles.ReadAsync("hrn_builtin_fake", token).ConfigureAwait(false), "Built-in fake profile");
                Assert.True(fake.Arguments.Count > 0, "The refreshed built-in profile has its argument templates.");
                Assert.Equal(seeded, fake.CreatedUtc, "The refresh keeps the original creation time");

                // A run executes end to end on the upgraded installation.
                WorkerHost worker = await TestCluster.StartWorkerAsync(host.BaseUrl, "upgrade-worker-" + Guid.NewGuid().ToString("N").Substring(0, 6), null, token).ConfigureAwait(false);
                try
                {
                    using (HttpClient user = await host.UserClientAsync(UserEmail, UserPassword, TenantId, token).ConfigureAwait(false))
                    {
                        string api = "/v1.0/api/tenants/" + TenantId;
                        Run run = await HttpTestHelpers.SendAsync<Run>(user, HttpMethod.Post, api + "/agents/" + AgentId + "/invoke", new InvokeRequest { Input = "after the upgrade", Wait = true, WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                        Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Run after upgrade: " + run.ErrorMessage);
                        Assert.Equal(DeploymentId, run.DeploymentId, "The run used the legacy deployment");
                        Assert.True(run.ResultText != null && run.ResultText.Contains("after the upgrade", StringComparison.Ordinal), "The fake harness echoed the input: " + run.ResultText);
                        Assert.Equal(3, run.DeploymentVersion, "The run records the legacy deployment's configuration version");
                        RunEventsResponse events = await HttpTestHelpers.SendAsync<RunEventsResponse>(user, HttpMethod.Get, api + "/runs/" + run.Id + "/events?limit=1000", null, 200, token).ConfigureAwait(false);
                        Assert.True(events.Events.Count > 0, "The new run recorded events.");
                    }
                }
                finally
                {
                    await worker.DisposeAsync().ConfigureAwait(false);
                }
            }

            // A second start against the upgraded database applies nothing.
            await using (TestServerHost again = await TestServerHost.StartAsync(provider, s => s.Database = settings, token).ConfigureAwait(false))
            {
                Assert.Equal(0, again.Server.Context.Database.MigrationsApplied, "Restart applies no migrations");
                Assert.Equal(SchemaBuilder.LatestVersion, again.Server.Context.Database.SchemaVersion, "Schema version after restart");
            }
        }

        private static async Task CheckTenantDataAsync(HttpClient client, int olderVersion, CancellationToken token)
        {
            string api = "/v1.0/api/tenants/" + TenantId;
            EnumerationResult<Agent> agents = await HttpTestHelpers.SendAsync<EnumerationResult<Agent>>(client, HttpMethod.Get, api + "/agents", null, 200, token).ConfigureAwait(false);
            Agent agent = Assert.NotNull(agents.Objects.FirstOrDefault(a => a.Id == AgentId), "Legacy agent listed");
            Assert.Equal(AgentName, agent.Name, "Agent name");
            Assert.Equal("Agent from the older release", agent.Description, "Agent description");

            Deployment deployment = await HttpTestHelpers.SendAsync<Deployment>(client, HttpMethod.Get, api + "/deployments/" + DeploymentId, null, 200, token).ConfigureAwait(false);
            Assert.Equal(AgentId, deployment.AgentId, "Deployment agent");
            Assert.Equal("hrn_builtin_fake", deployment.HarnessProfileId, "Deployment harness profile");
            Assert.Equal(120, deployment.TimeoutSeconds ?? 0, "Deployment timeout");
            Assert.True(deployment.Parameters.Any(p => p.Name == "format" && p.Value == "claude"), "Deployment parameter format");
            Assert.True(deployment.Parameters.Any(p => p.Name == "legacyParam" && p.Value == "kept"), "Deployment parameter legacyParam");
            Assert.Equal(DeploymentTrustLevelEnum.Trusted, deployment.TrustLevel, "Existing deployments stay Trusted");
            Assert.Equal(DeploymentEffectPolicyEnum.AtMostOnce, deployment.EffectPolicy, "retryOnNodeLoss false reads back AtMostOnce");

            Run run = await HttpTestHelpers.SendAsync<Run>(client, HttpMethod.Get, api + "/runs/" + RunId, null, 200, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Legacy run status");
            Assert.Equal("legacy answer", run.ResultText, "Legacy run result");
            Assert.Equal(20L, run.OutputTokens, "Legacy run output tokens");
            Assert.True(run.Parameters.Any(p => p.Name == "legacyParam" && p.Value == "kept"), "Legacy run parameter");

            RunEventsResponse events = await HttpTestHelpers.SendAsync<RunEventsResponse>(client, HttpMethod.Get, api + "/runs/" + RunId + "/events?limit=1000", null, 200, token).ConfigureAwait(false);
            Assert.Equal(3, events.Events.Count, "Legacy run events");
            Assert.True(events.Events.Select(e => e.Sequence).SequenceEqual(new long[] { 1, 2, 3 }), "Legacy events in order");
            Assert.Equal(RunEventTypeEnum.AssistantText, events.Events[1].EventType, "Legacy event type");
            Assert.Equal("legacy answer", events.Events[1].Text, "Legacy event text");

            Secret secret = await HttpTestHelpers.SendAsync<Secret>(client, HttpMethod.Get, api + "/secrets/" + SecretId, null, 200, token).ConfigureAwait(false);
            Assert.Equal("legacy-secret", secret.Name, "Secret metadata");
            Assert.True(secret.ValueEncrypted == null || secret.ValueEncrypted.Length == 0 || !secret.ValueEncrypted.Contains(SecretValue, StringComparison.Ordinal), "Secret value is not exposed.");

            if (olderVersion >= 15)
            {
                Conversation conversation = await HttpTestHelpers.SendAsync<Conversation>(client, HttpMethod.Get, api + "/conversations/" + ConversationId, null, 200, token).ConfigureAwait(false);
                Assert.Equal(AgentId, conversation.AgentId, "Conversation agent");
                Assert.Equal("legacy-session", conversation.SessionId, "Conversation session to resume");
                Assert.Equal(1, conversation.TurnCount, "Conversation turns");

                UsageQuota quota = await HttpTestHelpers.SendAsync<UsageQuota>(client, HttpMethod.Get, api + "/usage-quotas/" + QuotaId, null, 200, token).ConfigureAwait(false);
                Assert.Equal(100L, quota.DailyRunLimit ?? 0, "Quota daily run limit");
                Assert.True(quota.Active && !quota.EnforcementEnabled, "Quotas from schema 15 upgrade with enforcement off (opt-in).");
            }
        }

        private static async Task BuildLegacyDatabaseAsync(DatabaseSettings settings, int olderVersion, DateTime seeded, CancellationToken token)
        {
            using (DatabaseDriverBase raw = DatabaseDriverFactory.Create(settings))
            {
                AdoDatabaseDriver ado = (AdoDatabaseDriver)raw;
                if (!String.IsNullOrEmpty(ado.Catalog.Schema))
                {
                    string? createSchema = ado.Dialect.CreateSchemaStatement(ado.Catalog.Schema!);
                    if (createSchema != null) await ado.NonQueryAsync(createSchema, null, token).ConfigureAwait(false);
                }
                await ado.NonQueryAsync(SchemaBuilder.MigrationsTableDdl(ado.Catalog, ado.Dialect), null, token).ConfigureAwait(false);
                List<SchemaMigration> migrations = SchemaBuilder.Build(ado.Catalog, ado.Dialect);

                await ApplyAsync(ado, migrations.Where(m => m.Version == 1), token).ConfigureAwait(false);
                await SeedSchema1Async(ado, seeded, token).ConfigureAwait(false);

                if (olderVersion >= 15)
                {
                    await ApplyAsync(ado, migrations.Where(m => m.Version > 1 && m.Version <= 15), token).ConfigureAwait(false);
                    await SeedSchema15Async(ado, seeded, token).ConfigureAwait(false);
                }
            }
        }

        private static async Task ApplyAsync(AdoDatabaseDriver ado, IEnumerable<SchemaMigration> migrations, CancellationToken token)
        {
            foreach (SchemaMigration migration in migrations.OrderBy(m => m.Version))
            {
                foreach (SchemaColumnAddition column in migration.Columns)
                {
                    await ado.NonQueryAsync(ado.Dialect.AddColumn(ado.Catalog.Schema, ado.Catalog.RawName(column.Table), column.Column, column.Definition), null, token).ConfigureAwait(false);
                }
                foreach (string statement in migration.Statements) await ado.NonQueryAsync(statement, null, token).ConfigureAwait(false);
                await ado.NonQueryAsync("INSERT INTO " + ado.Table("schema_migrations") + " (version, description, appliedutc) VALUES (@v, @d, @t);", c =>
                {
                    AdoDatabaseDriver.Add(c, "v", migration.Version);
                    AdoDatabaseDriver.Add(c, "d", migration.Description);
                    AdoDatabaseDriver.Add(c, "t", DateTime.UtcNow);
                }, token).ConfigureAwait(false);
            }
        }

        private static async Task ExecAsync(AdoDatabaseDriver ado, string sql, DateTime now, CancellationToken token, Action<System.Data.Common.DbCommand>? bind = null)
        {
            await ado.NonQueryAsync(sql, c =>
            {
                AdoDatabaseDriver.Add(c, "now", now);
                AdoDatabaseDriver.Add(c, "true", true);
                AdoDatabaseDriver.Add(c, "false", false);
                bind?.Invoke(c);
            }, token).ConfigureAwait(false);
        }

        private static async Task SeedSchema1Async(AdoDatabaseDriver ado, DateTime now, CancellationToken token)
        {
            SecretCipher cipher = new SecretCipher(MasterKey);

            await ExecAsync(ado, "INSERT INTO " + ado.Table("tenants") + " (id, name, description, active, isprotected, createdutc, lastupdateutc) VALUES ('" + TenantId + "', 'legacy-tenant', 'Tenant from the older release', @true, @false, @now, @now);", now, token).ConfigureAwait(false);

            await ExecAsync(ado, "INSERT INTO " + ado.Table("users") + " (id, tenantid, firstname, lastname, email, passwordsha256, isadmin, istenantadmin, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('" + UserId + "', '" + TenantId + "', 'Legacy', 'User', '" + UserEmail + "', @hash, @false, @false, @true, @false, @now, @now);", now, token,
                c => AdoDatabaseDriver.Add(c, "hash", PasswordHasher.LegacySha256(UserPassword))).ConfigureAwait(false);
            await ExecAsync(ado, "INSERT INTO " + ado.Table("userroleassignments") + " (id, tenantid, userid, roleid, rolename, resourcescope, resourceid, inheritstochildren, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('ura_legacy', '" + TenantId + "', '" + UserId + "', NULL, 'TenantAdmin', 'Tenant', NULL, @true, @true, @false, @now, @now);", now, token).ConfigureAwait(false);

            await ExecAsync(ado, "INSERT INTO " + ado.Table("credentials") + " (id, tenantid, userid, name, accesskey, secretkeyencrypted, secretkeylast4, authmode, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('" + CredentialId + "', '" + TenantId + "', '" + UserId + "', 'legacy-key', '" + AccessKey + "', @secret, @last4, 'Hybrid', @true, @false, @now, @now);", now, token, c =>
                {
                    AdoDatabaseDriver.Add(c, "secret", cipher.Encrypt(SecretKey, CredentialId));
                    AdoDatabaseDriver.Add(c, "last4", SecretKey.Substring(SecretKey.Length - 4));
                }).ConfigureAwait(false);
            await ExecAsync(ado, "INSERT INTO " + ado.Table("credentialscopeassignments") + " (id, tenantid, credentialid, roleid, rolename, resourcescope, resourceid, inheritstochildren, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('csa_legacy', '" + TenantId + "', '" + CredentialId + "', NULL, 'TenantAdmin', 'Tenant', NULL, @true, @true, @false, @now, @now);", now, token).ConfigureAwait(false);

            await ExecAsync(ado, "INSERT INTO " + ado.Table("secrets") + " (id, tenantid, name, description, kind, valueencrypted, valuelast4, fingerprint, keyversion, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('" + SecretId + "', '" + TenantId + "', 'legacy-secret', 'Secret from the older release', 'GenericEnv', @value, @last4, NULL, 1, @true, @false, @now, @now);", now, token, c =>
                {
                    AdoDatabaseDriver.Add(c, "value", cipher.Encrypt(SecretValue, SecretId));
                    AdoDatabaseDriver.Add(c, "last4", SecretValue.Substring(SecretValue.Length - 4));
                }).ConfigureAwait(false);

            // The older release seeded the built-in fake harness profile under its fixed identifier.
            await ExecAsync(ado, "INSERT INTO " + ado.Table("harness_profiles") + " (id, tenantid, name, description, harnesstype, executable, promptdelivery, systempromptdelivery, mcpconfigformat, outputparser, resultsource, successpolicy, "
                + "defaulttimeoutseconds, killgraceseconds, maxoutputbytes, stderrtailbytes, isolatehome, supportsresume, isbuiltin, builtinkey, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('hrn_builtin_fake', NULL, 'builtin/fake', 'Older built-in description', 'Generic', 'garrison-fake-harness', 'Stdin', 'File', 'None', 'ClaudeStreamJson', 'ParserFinalEvent', 'FinalEvent', "
                + "300, 2, 10485760, 4096, @true, @true, @true, 'fake', @true, @true, @now, @now);", now, token).ConfigureAwait(false);

            await ExecAsync(ado, "INSERT INTO " + ado.Table("agents") + " (id, tenantid, name, displayname, description, kind, exposea2a, exposemcptool, inputmode, delegationmode, delegationmaxdepth, delegationallowrecursion, registrationttlseconds, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('" + AgentId + "', '" + TenantId + "', '" + AgentName + "', 'Legacy Agent', 'Agent from the older release', 'Hosted', @true, @false, 'Text', 'None', 1, @false, 0, @true, @false, @now, @now);", now, token).ConfigureAwait(false);

            await ExecAsync(ado, "INSERT INTO " + ado.Table("deployments") + " (id, tenantid, agentid, name, description, harnessprofileid, maxconcurrentruns, timeoutseconds, maxattempts, retryonnodeloss, weight, configversion, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('" + DeploymentId + "', '" + TenantId + "', '" + AgentId + "', 'legacy-default', 'Deployment from the older release', 'hrn_builtin_fake', 0, 120, 1, @false, 100, 3, @true, @false, @now, @now);", now, token).ConfigureAwait(false);
            await ExecAsync(ado, "INSERT INTO " + ado.Table("deployment_parameters") + " (id, deploymentid, tenantid, name, value) VALUES ('dpp_legacy_1', '" + DeploymentId + "', '" + TenantId + "', 'format', 'claude');", now, token).ConfigureAwait(false);
            await ExecAsync(ado, "INSERT INTO " + ado.Table("deployment_parameters") + " (id, deploymentid, tenantid, name, value) VALUES ('dpp_legacy_2', '" + DeploymentId + "', '" + TenantId + "', 'legacyParam', 'kept');", now, token).ConfigureAwait(false);

            await ExecAsync(ado, "INSERT INTO " + ado.Table("runs") + " (id, tenantid, agentid, agentname, deploymentid, deploymentversion, harnesstype, kind, status, outcome, priority, inputtext, inputcontenttype, callertype, callerid, callername, depth, attempt, maxattempts, leaseepoch, "
                + "queuedutc, leasedutc, startedutc, completedutc, cancelrequested, resulttext, inputtokens, outputtokens, cachedtokens, costestimated, lasteventsequence, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('" + RunId + "', '" + TenantId + "', '" + AgentId + "', '" + AgentName + "', '" + DeploymentId + "', 3, 'Generic', 'Invoke', 'Succeeded', 'Succeeded', 0, 'legacy question', 'text/plain', 'User', '" + UserId + "', '" + UserEmail + "', 0, 1, 1, 1, "
                + "@now, @leased, @leased, @completed, @false, 'legacy answer', 10, 20, 0, @false, 3, @true, @false, @now, @completed);", now, token, c =>
                {
                    AdoDatabaseDriver.Add(c, "leased", now.AddMilliseconds(250));
                    AdoDatabaseDriver.Add(c, "completed", now.AddSeconds(4));
                }).ConfigureAwait(false);
            await ExecAsync(ado, "INSERT INTO " + ado.Table("run_parameters") + " (id, runid, tenantid, name, value) VALUES ('rpa_legacy', '" + RunId + "', '" + TenantId + "', 'legacyParam', 'kept');", now, token).ConfigureAwait(false);
            string[] types = new string[] { "Lifecycle", "AssistantText", "Result" };
            string[] texts = new string[] { "started", "legacy answer", "legacy answer" };
            for (int i = 0; i < types.Length; i++)
            {
                int sequence = i + 1;
                await ExecAsync(ado, "INSERT INTO " + ado.Table("run_events") + " (id, tenantid, runid, sequence, eventtype, timestamputc, text, createdutc) VALUES ('rev_legacy_" + sequence + "', '" + TenantId + "', '" + RunId + "', " + sequence + ", '" + types[i] + "', @at, @text, @at);", now, token, c =>
                {
                    AdoDatabaseDriver.Add(c, "at", now.AddSeconds(sequence));
                    AdoDatabaseDriver.Add(c, "text", texts[sequence - 1]);
                }).ConfigureAwait(false);
            }
        }

        private static async Task SeedSchema15Async(AdoDatabaseDriver ado, DateTime now, CancellationToken token)
        {
            await ExecAsync(ado, "INSERT INTO " + ado.Table("conversations") + " (id, tenantid, agentid, agentname, deploymentid, harnesstype, title, callertype, callerid, callername, sessionid, sessionharnessprofileid, lastrunid, turncount, fallbackcount, lastactivityutc, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('" + ConversationId + "', '" + TenantId + "', '" + AgentId + "', '" + AgentName + "', '" + DeploymentId + "', 'Generic', 'Legacy conversation', 'User', '" + UserId + "', '" + UserEmail + "', 'legacy-session', 'hrn_builtin_fake', '" + RunId + "', 1, 0, @now, @true, @false, @now, @now);", now, token).ConfigureAwait(false);
            await ExecAsync(ado, "UPDATE " + ado.Table("runs") + " SET conversationid = '" + ConversationId + "', conversationturn = 1 WHERE id = '" + RunId + "';", now, token).ConfigureAwait(false);
            await ExecAsync(ado, "INSERT INTO " + ado.Table("usage_quotas") + " (id, tenantid, name, description, scope, resourceid, dailyrunlimit, active, isprotected, createdutc, lastupdateutc) VALUES "
                + "('" + QuotaId + "', '" + TenantId + "', 'legacy-quota', 'Quota from schema 15', 'Tenant', '" + TenantId + "', 100, @true, @false, @now, @now);", now, token).ConfigureAwait(false);
        }

        #endregion
    }
}
