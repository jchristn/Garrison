namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.ProviderHarness;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Triggers (plan P12.5, D-054): signature verification, cron parsing and next-fire computation, validation, CRUD,
    /// tenant isolation and RBAC, signed webhooks (accept, reject, replay window, idempotent delivery identifiers, body
    /// limit, rotation), cron firing with catch-up and the lateness bound, run-as re-checks, leader-only firing across two
    /// replicas, manifests, and the management MCP tools.
    /// </summary>
    public static class TriggerSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("trigger-unit", "signature", "Webhook signatures: valid, several v1 values, mismatch, stale and future timestamps, malformed and missing headers, and the decoy key for an unknown trigger", SignatureAsync));
            unit.Add(new TestCaseDescriptor("trigger-unit", "cron", "Cron schedules: five-field validation, time zones, next occurrence across a daylight saving change, collapsing missed occurrences, and keeping the stored next fire on unrelated edits", CronAsync));
            suites.Add(new TestSuiteDescriptor("trigger-unit", "Triggers (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "triggers-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "crud-validation", "CRUD by id and name, signing secret shown once, validation codes, type immutability, reference guards, RBAC, the target check, and tenant isolation (" + provider + ")", ct => CrudValidationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "webhook", "Signed webhooks: 202 with a run, the same delivery identifier answers 200 with the same fire, uniform 401 for missing, wrong, stale, and unknown, 413, 409 inactive, rotation, input templates over JSON payloads, and pipeline targets (" + provider + ")", ct => WebhookAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "webhook-rate-limit", "Failed webhook signatures count against Auth.RateLimitPerMinute per address; past it the address gets 429 until the minute ends, even with a valid signature (" + provider + ")", ct => WebhookRateLimitAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "cron-firing", "Cron firing: a due trigger fires once and advances, missed occurrences collapse into one, an occurrence past the lateness bound is Skipped, the run-as principal is re-checked, and manual fire (" + provider + ")", ct => CronFiringAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "leader-once", "Two replicas: concurrent sweeps fire each occurrence once, and only the leader's maintenance pass fires (" + provider + ")", ct => LeaderOnceAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "manifests", "Manifest kind Trigger: dry run, apply, unchanged re-apply, run-as of the applier, signing secret only with allowSecretValues, and export (" + provider + ")", ct => ManifestsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp", "Management MCP tools for triggers: list, get, create with the secret once, update, fires, delete, viewer and run-token denials (" + provider + ")", ct => McpAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Triggers (" + provider + ")", cases));
            }
            return suites;
        }

        /// <summary>
        /// POST a webhook delivery with a signature made from a secret.
        /// </summary>
        /// <param name="host">Server.</param>
        /// <param name="tenantId">Tenant in the path.</param>
        /// <param name="triggerId">Trigger in the path.</param>
        /// <param name="secret">Signing secret, or null to send no signature.</param>
        /// <param name="body">Body text.</param>
        /// <param name="deliveryId">Delivery identifier, or null.</param>
        /// <param name="skewSeconds">Seconds added to the signature timestamp.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public static async Task<TestResponse> DeliverAsync(TestServerHost host, string tenantId, string triggerId, string? secret, string body, string? deliveryId, int skewSeconds, CancellationToken token)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(body);
            using (HttpClient client = new HttpClient())
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, host.BaseUrl + "/v1.0/api/tenants/" + tenantId + "/triggers/" + triggerId + "/webhook"))
            {
                request.Content = new ByteArrayContent(bytes);
                request.Content.Headers.TryAddWithoutValidation("Content-Type", "application/json");
                if (secret != null) request.Headers.TryAddWithoutValidation(Constants.HeaderWebhookSignature, WebhookSigner.Header(secret, DateTimeOffset.UtcNow.ToUnixTimeSeconds() + skewSeconds, bytes));
                if (deliveryId != null) request.Headers.TryAddWithoutValidation(Constants.HeaderWebhookDelivery, deliveryId);
                using (HttpResponseMessage response = await client.SendAsync(request, token).ConfigureAwait(false))
                {
                    TestResponse result = new TestResponse();
                    result.StatusCode = (int)response.StatusCode;
                    result.Body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    return result;
                }
            }
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static void Code(TestResponse response, int status, string code, string what)
        {
            Assert.Equal(status, response.StatusCode, what + " status (" + response.Body + ")");
            Assert.True(response.Body.Contains(code, StringComparison.Ordinal), what + " answers " + code + ": " + response.Body);
        }

        private static Trigger Cron(string name, Agent agent, string expression = "*/5 * * * *", string timeZone = "UTC")
        {
            Trigger trigger = new Trigger();
            trigger.Name = name;
            trigger.Type = TriggerTypeEnum.Cron;
            trigger.AgentId = agent.Id;
            trigger.CronExpression = expression;
            trigger.TimeZone = timeZone;
            return trigger;
        }

        private static Trigger Webhook(string name, Agent agent)
        {
            Trigger trigger = new Trigger();
            trigger.Name = name;
            trigger.Type = TriggerTypeEnum.Webhook;
            trigger.AgentId = agent.Id;
            return trigger;
        }

        private static Task<Trigger> CreateAsync(TestServerHost host, Trigger trigger, CancellationToken token)
        {
            return HttpTestHelpers.SendAsync<Trigger>(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", trigger, 201, token);
        }

        private static async Task<Run> WaitRunAsync(TestServerHost host, string runId, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(90);
            while (true)
            {
                Run run = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + runId, null, 200, token).ConfigureAwait(false);
                if (RunService.IsTerminal(run.Status)) return run;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Run " + runId + " did not finish in time (status " + run.Status + ").");
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        private static async Task<User> UserAsync(TestServerHost host, string email, string role, CancellationToken token)
        {
            User user = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = email, Password = "password123" }, 201, token).ConfigureAwait(false);
            await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = user.Id, RoleName = role }, 201, token).ConfigureAwait(false);
            return user;
        }

        private static async Task<TestCluster> ClusterAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false);
            // Tests drive cron firing themselves; the leader's own pass would race with them.
            cluster.Server.Server.Context.Get<MaintenanceService>().Triggers = null;
            return cluster;
        }

        private static Task SignatureAsync(CancellationToken token)
        {
            string secret = WebhookSigner.NewSecret();
            Assert.True(secret.StartsWith("whsec_", StringComparison.Ordinal) && secret.Length == 46, "Generated secrets are whsec_ plus 40 characters");
            byte[] body = Encoding.UTF8.GetBytes("{\"hello\":\"world\"}");
            DateTime now = DateTime.UtcNow;
            long unix = new DateTimeOffset(now).ToUnixTimeSeconds();
            string header = WebhookSigner.Header(secret, unix, body);
            Assert.True(header.StartsWith("t=" + unix + ",v1=", StringComparison.Ordinal) && header.Length == ("t=" + unix + ",v1=").Length + 64, "Header format t=<unix>,v1=<64 hex>");
            Assert.Equal(WebhookSignatureResultEnum.Valid, WebhookSigner.Verify(header, secret, body, now, 300), "A fresh signature verifies");
            Assert.Equal(WebhookSignatureResultEnum.Valid, WebhookSigner.Verify(" t=" + unix + " , v1=" + new string('0', 64) + ", v1=" + WebhookSigner.Signature(secret, unix, body), secret, body, now, 300), "Any of several v1 values may match");
            Assert.Equal(WebhookSignatureResultEnum.Mismatch, WebhookSigner.Verify(header, secret, Encoding.UTF8.GetBytes("{\"hello\":\"World\"}"), now, 300), "A changed body does not verify");
            Assert.Equal(WebhookSignatureResultEnum.Mismatch, WebhookSigner.Verify(header, WebhookSigner.NewSecret(), body, now, 300), "Another secret does not verify");
            Assert.Equal(WebhookSignatureResultEnum.Mismatch, WebhookSigner.Verify(header, null, body, now, 300), "No secret (unknown trigger) never verifies");
            Assert.Equal(WebhookSignatureResultEnum.Stale, WebhookSigner.Verify(WebhookSigner.Header(secret, unix - 301, body), secret, body, now, 300), "Older than the tolerance is stale (replay)");
            Assert.Equal(WebhookSignatureResultEnum.Stale, WebhookSigner.Verify(WebhookSigner.Header(secret, unix + 301, body), secret, body, now, 300), "Further in the future than the tolerance is stale");
            Assert.Equal(WebhookSignatureResultEnum.Valid, WebhookSigner.Verify(WebhookSigner.Header(secret, unix - 299, body), secret, body, now, 300), "Inside the tolerance verifies");
            Assert.Equal(WebhookSignatureResultEnum.Missing, WebhookSigner.Verify(null, secret, body, now, 300), "No header");
            Assert.Equal(WebhookSignatureResultEnum.Missing, WebhookSigner.Verify("  ", secret, body, now, 300), "Blank header");
            foreach (string malformed in new List<string> { "v1=" + new string('a', 64), "t=" + unix, "t=abc,v1=" + new string('a', 64), "t=" + unix + ",v1=xyz", "t=" + unix + ",v1=" + new string('g', 64), "garbage", "t=" + unix + ",t=" + unix + ",v1=" + new string('a', 64) })
            {
                Assert.Equal(WebhookSignatureResultEnum.Malformed, WebhookSigner.Verify(malformed, secret, body, now, 300), "Malformed header " + malformed);
            }
            Assert.Equal(WebhookSigner.Signature(secret, unix, null), WebhookSigner.Signature(secret, unix, Array.Empty<byte>()), "A null body signs as empty");
            return Task.CompletedTask;
        }

        private static Task CronAsync(CancellationToken token)
        {
            Assert.True(CronSchedule.Validate("0 9 * * 1-5", "America/New_York", out string? e1, out string? z1) && e1 == null && z1 == null, "Five fields and an IANA zone are valid");
            Assert.True(CronSchedule.Validate("@daily", null, out string? _, out string? _), "Macros are valid and a null zone means UTC");
            Assert.True(!CronSchedule.Validate("0 0 9 * * *", "UTC", out string? six, out string? _) && six != null, "Six fields (seconds) are refused");
            Assert.True(!CronSchedule.Validate("61 * * * *", "UTC", out string? range, out string? _) && range != null, "Out of range minute is refused");
            Assert.True(!CronSchedule.Validate("", "UTC", out string? empty, out string? _) && empty != null, "An empty expression is refused");
            Assert.True(!CronSchedule.Validate("* * * * *", "Mars/Olympus", out string? _, out string? zone) && zone != null, "An unknown zone is refused");

            DateTime start = new DateTime(2026, 3, 7, 13, 59, 30, DateTimeKind.Utc);
            Assert.Equal(new DateTime(2026, 3, 7, 14, 0, 0, DateTimeKind.Utc), CronSchedule.Next("0 9 * * *", "America/New_York", start)!.Value, "09:00 EST is 14:00 UTC");
            // Daylight saving starts on 2026-03-08 in New York: 09:00 EDT is 13:00 UTC.
            Assert.Equal(new DateTime(2026, 3, 8, 13, 0, 0, DateTimeKind.Utc), CronSchedule.Next("0 9 * * *", "America/New_York", new DateTime(2026, 3, 7, 14, 0, 0, DateTimeKind.Utc))!.Value, "09:00 EDT the next day is 13:00 UTC");
            Assert.Equal(new DateTime(2026, 3, 7, 14, 0, 0, DateTimeKind.Utc), CronSchedule.Next("*/5 * * * *", "UTC", new DateTime(2026, 3, 7, 13, 55, 0, DateTimeKind.Utc))!.Value, "Next is strictly after the given time");

            DateTime from = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            Assert.Equal(new DateTime(2026, 1, 1, 0, 50, 0, DateTimeKind.Utc), CronSchedule.LatestDue("*/10 * * * *", "UTC", from, new DateTime(2026, 1, 1, 0, 57, 0, DateTimeKind.Utc)), "Missed occurrences collapse into the latest one due");
            Assert.Equal(from, CronSchedule.LatestDue("*/10 * * * *", "UTC", from, from.AddMinutes(5)), "With nothing later due the known occurrence stays");

            DateTime now = DateTime.UtcNow;
            Trigger existing = new Trigger { Type = TriggerTypeEnum.Cron, CronExpression = "*/5 * * * *", TimeZone = "UTC", Active = true, NextFireUtc = new DateTime(2030, 1, 1, 0, 0, 0, DateTimeKind.Utc) };
            Trigger renamed = new Trigger { Type = TriggerTypeEnum.Cron, CronExpression = "*/5 * * * *", TimeZone = "UTC", Active = true, Name = "renamed" };
            Assert.Equal(existing.NextFireUtc, CronSchedule.NextFireFor(renamed, existing, now), "An unrelated edit keeps the stored next fire");
            Trigger rescheduled = new Trigger { Type = TriggerTypeEnum.Cron, CronExpression = "0 * * * *", TimeZone = "UTC", Active = true };
            DateTime? next = CronSchedule.NextFireFor(rescheduled, existing, now);
            Assert.True(next.HasValue && next.Value > now && next.Value <= now.AddHours(1) && next.Value.Minute == 0, "A schedule change computes the next fire from now");
            Assert.True(!CronSchedule.NextFireFor(new Trigger { Type = TriggerTypeEnum.Cron, CronExpression = "* * * * *", Active = false }, null, now).HasValue, "Inactive triggers have no next fire");
            Assert.True(!CronSchedule.NextFireFor(new Trigger { Type = TriggerTypeEnum.Webhook, Active = true }, null, now).HasValue, "Webhook triggers have no next fire");
            Trigger inactive = new Trigger { Type = TriggerTypeEnum.Cron, CronExpression = "*/5 * * * *", TimeZone = "UTC", Active = false, NextFireUtc = new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc) };
            DateTime? reactivated = CronSchedule.NextFireFor(renamed, inactive, now);
            Assert.True(reactivated.HasValue && reactivated.Value > now, "Activating again never catches up on the inactive time");
            return Task.CompletedTask;
        }

        private static async Task CrudValidationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("trig-crud", "builtin/fake", null, token).ConfigureAwait(false);
                Agent other = await cluster.CreateAgentAsync("trig-crud-other", "builtin/fake", null, token).ConfigureAwait(false);
                Deployment otherDeployment = (await host.Server.Context.Database.Deployments.ListByAgentAsync(host.TenantId, other.Id, token).ConfigureAwait(false)).Single();

                Trigger cron = Cron("nightly-crud", agent, "0 3 * * *", "Europe/Berlin");
                cron.Id = "trg_ignored";
                cron.FireCount = 99;
                Trigger created = await CreateAsync(host, cron, token).ConfigureAwait(false);
                Assert.True(created.Id.StartsWith(Constants.TriggerIdPrefix, StringComparison.Ordinal) && created.Id != "trg_ignored" && created.FireCount == 0, "Creation assigns the identifier and resets fire state");
                Assert.True(created.NextFireUtc.HasValue && created.NextFireUtc.Value > DateTime.UtcNow && created.SigningSecret == null && created.SigningSecretLast4 == null, "A cron trigger has a next fire and no secret");
                Assert.True(created.RunAsType == PrincipalTypeEnum.Administrator, "The trigger runs as its creator (" + created.RunAsType + ")");

                Trigger hook = await CreateAsync(host, Webhook("hook-crud", agent), token).ConfigureAwait(false);
                Assert.True(hook.SigningSecret != null && hook.SigningSecret.StartsWith("whsec_", StringComparison.Ordinal) && hook.SigningSecretLast4 == hook.SigningSecret.Substring(hook.SigningSecret.Length - 4), "A webhook trigger returns its secret once");
                Assert.True(!hook.NextFireUtc.HasValue, "Webhook triggers have no next fire");
                TestResponse readHook = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/triggers/" + hook.Name, null, token).ConfigureAwait(false);
                Assert.True(readHook.StatusCode == 200 && !readHook.Body.Contains("signingSecret\"", StringComparison.Ordinal) && !readHook.Body.Contains(hook.SigningSecret!, StringComparison.Ordinal) && readHook.Body.Contains("signingSecretLast4", StringComparison.Ordinal), "Reads never return the secret: " + readHook.Body);
                Assert.True(!readHook.Body.Contains("secretEncrypted", StringComparison.OrdinalIgnoreCase), "The encrypted secret is never serialized");

                EnumerationResult<Trigger> webhooks = await HttpTestHelpers.SendAsync<EnumerationResult<Trigger>>(host.AdminClient, HttpMethod.Get, T(host) + "/triggers?type=Webhook", null, 200, token).ConfigureAwait(false);
                Assert.True(webhooks.Objects.Count == 1 && webhooks.Objects[0].Id == hook.Id, "Type filter");
                EnumerationResult<Trigger> searched = await HttpTestHelpers.SendAsync<EnumerationResult<Trigger>>(host.AdminClient, HttpMethod.Get, T(host) + "/triggers?search=nightly", null, 200, token).ConfigureAwait(false);
                Assert.True(searched.Objects.Count == 1 && searched.Objects[0].Id == created.Id, "Search filter");

                // Names resolve to identifiers.
                Trigger byName = Cron("by-name", agent);
                byName.AgentId = agent.Name;
                Trigger resolved = await CreateAsync(host, byName, token).ConfigureAwait(false);
                Assert.Equal(agent.Id, resolved.AgentId, "agentId given as a name is stored as the identifier");

                // Validation.
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", Cron("bad-cron", agent, "0 0 9 * * *"), token).ConfigureAwait(false), 400, "InvalidCron", "Six-field cron");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", Cron("bad-zone", agent, "* * * * *", "Mars/Olympus"), token).ConfigureAwait(false), 400, "InvalidTimeZone", "Unknown zone");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", Cron("Bad Name", agent), token).ConfigureAwait(false), 400, "ValidationFailed", "Invalid name");
                Trigger missingAgent = Cron("missing-agent", agent);
                missingAgent.AgentId = "agt_missing";
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", missingAgent, token).ConfigureAwait(false), 400, "ReferenceNotFound", "Unknown agent");
                Trigger mismatch = Cron("deployment-mismatch", agent);
                mismatch.DeploymentId = otherDeployment.Id;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", mismatch, token).ConfigureAwait(false), 400, "DeploymentAgentMismatch", "Deployment of another agent");
                Trigger both = Cron("both-targets", agent);
                both.TargetType = TriggerTargetTypeEnum.Pipeline;
                both.PipelineId = "ppl_missing";
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", both, token).ConfigureAwait(false), 400, "TargetMismatch", "A pipeline target with an agent");
                Trigger webhookCron = Webhook("webhook-cron", agent);
                webhookCron.CronExpression = "* * * * *";
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", webhookCron, token).ConfigureAwait(false), 400, "cronExpression", "A webhook trigger with a schedule");
                Trigger systemTemplate = Cron("system-template", agent);
                systemTemplate.InputTemplateId = "builtin/default-system";
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", systemTemplate, token).ConfigureAwait(false), 400, "TemplateKindMismatch", "A System template as input");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", Cron("nightly-crud", agent), token).ConfigureAwait(false), 409, "NameConflict", "Duplicate name");

                // Update: the type cannot change; an unrelated edit keeps the next fire.
                Trigger edit = await HttpTestHelpers.SendAsync<Trigger>(host.AdminClient, HttpMethod.Get, T(host) + "/triggers/" + created.Id, null, 200, token).ConfigureAwait(false);
                edit.Description = "Edited";
                Trigger updated = await HttpTestHelpers.SendAsync<Trigger>(host.AdminClient, HttpMethod.Put, T(host) + "/triggers/" + created.Id, edit, 200, token).ConfigureAwait(false);
                Assert.True(updated.Description == "Edited" && updated.NextFireUtc == created.NextFireUtc && updated.CreatedUtc == created.CreatedUtc, "Unrelated edits keep the next fire");
                edit.Active = false;
                Trigger paused = await HttpTestHelpers.SendAsync<Trigger>(host.AdminClient, HttpMethod.Put, T(host) + "/triggers/" + created.Id, edit, 200, token).ConfigureAwait(false);
                Assert.True(!paused.Active && !paused.NextFireUtc.HasValue, "An inactive trigger has no next fire");
                edit.Type = TriggerTypeEnum.Webhook;
                edit.CronExpression = null;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/triggers/" + created.Id, edit, token).ConfigureAwait(false), 400, "TypeImmutable", "Type change");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers/" + created.Id + "/rotate-secret", null, token).ConfigureAwait(false), 409, "NotAWebhookTrigger", "Rotating a cron trigger");

                // Guards: an agent, deployment, or pipeline a trigger uses cannot be deleted.
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + agent.Id, null, token).ConfigureAwait(false), 409, "ReferencedByTrigger", "Deleting a triggered agent");
                Trigger pinned = Cron("pinned", other);
                pinned.DeploymentId = otherDeployment.Name;
                Trigger pinnedCreated = await CreateAsync(host, pinned, token).ConfigureAwait(false);
                Assert.Equal(otherDeployment.Id, pinnedCreated.DeploymentId, "Deployment given as a name");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/deployments/" + otherDeployment.Id, null, token).ConfigureAwait(false), 409, "ReferencedByTrigger", "Deleting a pinned deployment");
                Pipeline pipeline = new Pipeline { Name = "trig-pipeline" };
                pipeline.Stages.Add(new PipelineStage { Name = "only", AgentId = other.Id });
                Pipeline createdPipeline = await HttpTestHelpers.SendAsync<Pipeline>(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", pipeline, 201, token).ConfigureAwait(false);
                Trigger pipelineTrigger = new Trigger { Name = "pipeline-trigger", Type = TriggerTypeEnum.Cron, TargetType = TriggerTargetTypeEnum.Pipeline, PipelineId = createdPipeline.Name, CronExpression = "0 * * * *" };
                Trigger pipelineCreated = await CreateAsync(host, pipelineTrigger, token).ConfigureAwait(false);
                Assert.Equal(createdPipeline.Id, pipelineCreated.PipelineId, "Pipeline given as a name");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/pipelines/" + createdPipeline.Id, null, token).ConfigureAwait(false), 409, "ReferencedByTrigger", "Deleting a triggered pipeline");

                // RBAC: viewers read but cannot write; a role that may manage triggers but not run the agent cannot create
                // one for it.
                await UserAsync(host, "trig-viewer@example.com", "Viewer", token).ConfigureAwait(false);
                using (HttpClient viewer = await host.UserClientAsync("trig-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    await HttpTestHelpers.SendAsync<Trigger>(viewer, HttpMethod.Get, T(host) + "/triggers/" + hook.Id, null, 200, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<EnumerationResult<TriggerFire>>(viewer, HttpMethod.Get, T(host) + "/triggers/" + hook.Id + "/fires", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Post, T(host) + "/triggers", Cron("viewer-made", agent), token).ConfigureAwait(false)).StatusCode, "Viewers cannot create");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Post, T(host) + "/triggers/" + hook.Id + "/fire", null, token).ConfigureAwait(false)).StatusCode, "Viewers cannot fire");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Post, T(host) + "/triggers/" + hook.Id + "/rotate-secret", null, token).ConfigureAwait(false)).StatusCode, "Viewers cannot rotate");
                }
                Permission manage = await HttpTestHelpers.SendAsync<Permission>(host.AdminClient, HttpMethod.Post, T(host) + "/permissions", new PermissionRequest { Name = "Manage triggers only", ResourceTypes = new List<string> { "Trigger", "Agent" }, OperationTypes = new List<string> { "Read", "Write" } }, 201, token).ConfigureAwait(false);
                Role manager = await HttpTestHelpers.SendAsync<Role>(host.AdminClient, HttpMethod.Post, T(host) + "/roles", new RoleRequest { Name = "TriggerManager" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<RolePermissionMap>(host.AdminClient, HttpMethod.Post, T(host) + "/role-permissions", new RolePermissionRequest { RoleId = manager.Id, PermissionId = manage.Id }, 201, token).ConfigureAwait(false);
                User managerUser = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "trig-manager@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = managerUser.Id, RoleId = manager.Id }, 201, token).ConfigureAwait(false);
                using (HttpClient managerClient = await host.UserClientAsync("trig-manager@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    TestResponse denied = await HttpTestHelpers.SendAsync(managerClient, HttpMethod.Post, T(host) + "/triggers", Cron("manager-made", agent), token).ConfigureAwait(false);
                    Assert.True(denied.StatusCode == 403 && denied.Body.Contains("Agent", StringComparison.Ordinal), "Creating a trigger needs Agent Execute on its agent: " + denied.Body);
                    Assert.True(await host.Server.Context.Database.Triggers.ReadByNameAsync(host.TenantId, "manager-made", token).ConfigureAwait(false) == null, "Nothing was created");
                }

                // Tenant isolation: another tenant sees 404, never the record.
                Tenant otherTenant = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Triggers Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + otherTenant.Id + "/users", new UserRequest { Email = "trig-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("trig-outsider@example.com", "password123", otherTenant.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, T(host) + "/triggers/" + hook.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's trigger by its path");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + otherTenant.Id + "/triggers/" + hook.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's trigger through their own tenant");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Post, "/v1.0/api/tenants/" + otherTenant.Id + "/triggers/" + hook.Id + "/fire", null, token).ConfigureAwait(false)).StatusCode, "Cannot fire another tenant's trigger");
                    EnumerationResult<Trigger> theirs = await HttpTestHelpers.SendAsync<EnumerationResult<Trigger>>(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + otherTenant.Id + "/triggers", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(0, theirs.Objects.Count, "Other tenants list none");
                    Trigger crossTenant = Cron("cross-tenant", agent);
                    Code(await HttpTestHelpers.SendAsync(outsider, HttpMethod.Post, "/v1.0/api/tenants/" + otherTenant.Id + "/triggers", crossTenant, token).ConfigureAwait(false), 400, "ReferenceNotFound", "Another tenant's agent cannot be targeted");
                }

                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/triggers/" + hook.Name, null, token).ConfigureAwait(false)).StatusCode, "Delete by name");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/triggers/" + hook.Id, null, token).ConfigureAwait(false)).StatusCode, "Deleted");
                List<AuditRecord> audit = (await host.Server.Context.Database.Audit.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false)).Objects;
                Assert.True(audit.Any(a => a.ResourceType == "Trigger" && a.ResourceId == hook.Id && a.Description != null && a.Description.StartsWith("Deleted trigger", StringComparison.Ordinal)), "Deletion is audited");
                Assert.True(audit.Any(a => a.ResourceType == "Trigger" && a.ResourceId == created.Id && a.Description != null && a.Description.StartsWith("Created Cron trigger", StringComparison.Ordinal)), "Creation is audited");
            }
        }

        private static async Task WebhookRateLimitAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("trig-limited", "builtin/fake", null, token).ConfigureAwait(false);
                Trigger hook = await CreateAsync(host, Webhook("limited", agent), token).ConfigureAwait(false);
                host.Settings.Auth.RateLimitPerMinute = 3;
                // A minute boundary between the failures resets the count, so allow one retry of the whole sequence.
                int status = 0;
                for (int attempt = 0; attempt < 2 && status != 429; attempt++)
                {
                    for (int i = 0; i < 4; i++)
                    {
                        TestResponse bad = await DeliverAsync(host, host.TenantId, hook.Id, WebhookSigner.NewSecret(), "{}", null, 0, token).ConfigureAwait(false);
                        Assert.True(bad.StatusCode == 401 || bad.StatusCode == 429, "A wrong signature answers 401, or 429 once limited (" + bad.StatusCode + ")");
                    }
                    status = (await DeliverAsync(host, host.TenantId, hook.Id, hook.SigningSecret!, "{}", null, 0, token).ConfigureAwait(false)).StatusCode;
                }
                Assert.Equal(429, status, "After more failed signatures than the limit, the address is refused even with a valid signature");
            }
        }

        private static async Task WebhookAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("trig-hooked", "builtin/fake", null, token, d => d.Parameters.Add(new DeploymentParameter { Name = "echoChars", Value = "0" })).ConfigureAwait(false);
                Trigger hook = await CreateAsync(host, Webhook("deploys", agent), token).ConfigureAwait(false);
                string secret = hook.SigningSecret!;
                string body = "{\"action\":\"opened\",\"number\":42,\"title\":\"PAYLOAD-MARKER\"}";

                TestResponse accepted = await DeliverAsync(host, host.TenantId, hook.Id, secret, body, "delivery-1", 0, token).ConfigureAwait(false);
                Assert.Equal(202, accepted.StatusCode, "A signed delivery is accepted (" + accepted.Body + ")");
                TriggerFire fire = Serializer.Deserialize<TriggerFire>(accepted.Body)!;
                Assert.True(fire.Outcome == TriggerFireOutcomeEnum.Started && fire.Source == TriggerFireSourceEnum.Webhook && fire.DeliveryId == "delivery-1" && fire.RunId != null && !fire.Duplicate, "The fire started a run");
                Run run = await WaitRunAsync(host, fire.RunId!, token).ConfigureAwait(false);
                Assert.True(run.Status == RunStatusEnum.Succeeded && run.TriggerId == hook.Id && run.Kind == RunKindEnum.Trigger && run.CallerName == "trigger:deploys", "The run records the trigger (" + run.Status + ", " + run.Kind + ")");
                Assert.True(run.InputText != null && run.InputText.Contains("PAYLOAD-MARKER", StringComparison.Ordinal) && run.InputText.Contains("deploys", StringComparison.Ordinal), "The built-in template carries the payload: " + run.InputText);
                EnumerationResult<Run> byTrigger = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(host.AdminClient, HttpMethod.Get, T(host) + "/runs?triggerId=" + hook.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(byTrigger.Objects.Count == 1 && byTrigger.Objects[0].Id == run.Id, "Runs filter by trigger");

                TestResponse repeated = await DeliverAsync(host, host.TenantId, hook.Id, secret, body, "delivery-1", 0, token).ConfigureAwait(false);
                Assert.Equal(200, repeated.StatusCode, "A repeated delivery identifier answers 200");
                TriggerFire again = Serializer.Deserialize<TriggerFire>(repeated.Body)!;
                Assert.True(again.Id == fire.Id && again.Duplicate && again.RunId == fire.RunId, "The repeat returns the first fire and starts nothing");

                // Every failed verification looks the same.
                string expected401 = "InvalidSignature";
                Code(await DeliverAsync(host, host.TenantId, hook.Id, null, body, null, 0, token).ConfigureAwait(false), 401, expected401, "No signature");
                Code(await DeliverAsync(host, host.TenantId, hook.Id, WebhookSigner.NewSecret(), body, null, 0, token).ConfigureAwait(false), 401, expected401, "Wrong secret");
                Code(await DeliverAsync(host, host.TenantId, hook.Id, secret, body, null, -600, token).ConfigureAwait(false), 401, expected401, "Stale timestamp (replay)");
                Code(await DeliverAsync(host, host.TenantId, hook.Id, secret, body, null, 600, token).ConfigureAwait(false), 401, expected401, "Future timestamp");
                Code(await DeliverAsync(host, host.TenantId, "trg_missing", secret, body, null, 0, token).ConfigureAwait(false), 401, expected401, "Unknown trigger");
                Code(await DeliverAsync(host, "no-such-tenant", hook.Id, secret, body, null, 0, token).ConfigureAwait(false), 401, expected401, "Unknown tenant");
                Trigger cron = await CreateAsync(host, Cron("not-a-hook", agent), token).ConfigureAwait(false);
                Code(await DeliverAsync(host, host.TenantId, cron.Id, secret, body, null, 0, token).ConfigureAwait(false), 401, expected401, "A cron trigger");
                TestResponse missing = await DeliverAsync(host, host.TenantId, "trg_missing", secret, body, null, 0, token).ConfigureAwait(false);
                TestResponse wrong = await DeliverAsync(host, host.TenantId, hook.Id, WebhookSigner.NewSecret(), body, null, 0, token).ConfigureAwait(false);
                Assert.Equal(missing.Body.Replace(ErrorRequestId(missing.Body), String.Empty), wrong.Body.Replace(ErrorRequestId(wrong.Body), String.Empty), "An unknown trigger and a wrong signature answer the same body");
                Code(await DeliverAsync(host, host.TenantId, hook.Id, secret, body, "bad delivery id with spaces", 0, token).ConfigureAwait(false), 400, "InvalidDeliveryId", "Delivery identifiers are printable without spaces");
                Code(await DeliverAsync(host, host.TenantId, hook.Id, secret, new string('x', 300000), null, 0, token).ConfigureAwait(false), 413, "PayloadTooLarge", "Bodies over Triggers.WebhookMaxBodyBytes");

                // Without a delivery identifier every delivery fires.
                TestResponse first = await DeliverAsync(host, host.TenantId, hook.Id, secret, "{}", null, 0, token).ConfigureAwait(false);
                TestResponse second = await DeliverAsync(host, host.TenantId, hook.Id, secret, "{}", null, 0, token).ConfigureAwait(false);
                Assert.True(first.StatusCode == 202 && second.StatusCode == 202 && Serializer.Deserialize<TriggerFire>(first.Body)!.Id != Serializer.Deserialize<TriggerFire>(second.Body)!.Id, "Deliveries without an identifier are distinct fires");

                // Rotation: the old secret stops working at once.
                Trigger rotated = await HttpTestHelpers.SendAsync<Trigger>(host.AdminClient, HttpMethod.Post, T(host) + "/triggers/" + hook.Id + "/rotate-secret", null, 200, token).ConfigureAwait(false);
                Assert.True(rotated.SigningSecret != null && rotated.SigningSecret != secret, "Rotation returns a new secret once");
                Code(await DeliverAsync(host, host.TenantId, hook.Id, secret, body, "after-rotation", 0, token).ConfigureAwait(false), 401, expected401, "The old secret");
                Assert.Equal(202, (await DeliverAsync(host, host.TenantId, hook.Id, rotated.SigningSecret!, body, "after-rotation", 0, token).ConfigureAwait(false)).StatusCode, "The new secret");
                List<AuditRecord> audit = (await host.Server.Context.Database.Audit.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false)).Objects;
                Assert.True(audit.Any(a => a.EventType == AuditEventTypeEnum.SigningSecretRotated && a.ResourceId == hook.Id), "Rotation is audited");

                // Inactive triggers answer 409 to a correctly signed delivery only.
                Trigger current = await HttpTestHelpers.SendAsync<Trigger>(host.AdminClient, HttpMethod.Get, T(host) + "/triggers/" + hook.Id, null, 200, token).ConfigureAwait(false);
                current.Active = false;
                await HttpTestHelpers.SendAsync<Trigger>(host.AdminClient, HttpMethod.Put, T(host) + "/triggers/" + hook.Id, current, 200, token).ConfigureAwait(false);
                Code(await DeliverAsync(host, host.TenantId, hook.Id, rotated.SigningSecret!, body, null, 0, token).ConfigureAwait(false), 409, "TriggerInactive", "Inactive trigger");
                Code(await DeliverAsync(host, host.TenantId, hook.Id, secret, body, null, 0, token).ConfigureAwait(false), 401, expected401, "Inactive trigger with a wrong signature");

                // A custom input template reads the JSON payload.
                PromptTemplateRequest templateRequest = new PromptTemplateRequest();
                templateRequest.Name = "pr-review-input";
                templateRequest.Kind = PromptTemplateKindEnum.Task;
                templateRequest.Content = "Review pull request #{{webhook.json.number}} ({{webhook.json.action}}) for {{trigger.name}} via {{trigger.source}}.";
                PromptTemplate template = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, T(host) + "/prompt-templates", templateRequest, 201, token).ConfigureAwait(false);
                Trigger templated = Webhook("templated", agent);
                templated.InputTemplateId = template.Name;
                Trigger templatedCreated = await CreateAsync(host, templated, token).ConfigureAwait(false);
                Assert.Equal(template.Id, templatedCreated.InputTemplateId, "Template given by name is stored by identifier");
                TestResponse templatedDelivery = await DeliverAsync(host, host.TenantId, templatedCreated.Id, templatedCreated.SigningSecret!, body, null, 0, token).ConfigureAwait(false);
                TriggerFire templatedFire = Serializer.Deserialize<TriggerFire>(templatedDelivery.Body)!;
                Run templatedRun = await WaitRunAsync(host, templatedFire.RunId!, token).ConfigureAwait(false);
                Assert.Equal("Review pull request #42 (opened) for templated via Webhook.", templatedRun.InputText, "The template renders the JSON payload");

                // A template that renders nothing fails the fire, and the fire records why.
                PromptTemplateRequest blankRequest = new PromptTemplateRequest();
                blankRequest.Name = "blank-input";
                blankRequest.Kind = PromptTemplateKindEnum.Task;
                blankRequest.Content = "{{#if webhook.json.missing}}never{{/if}}";
                PromptTemplate blank = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, T(host) + "/prompt-templates", blankRequest, 201, token).ConfigureAwait(false);
                Trigger blankTrigger = Webhook("blank", agent);
                blankTrigger.InputTemplateId = blank.Id;
                Trigger blankCreated = await CreateAsync(host, blankTrigger, token).ConfigureAwait(false);
                TestResponse blankDelivery = await DeliverAsync(host, host.TenantId, blankCreated.Id, blankCreated.SigningSecret!, body, null, 0, token).ConfigureAwait(false);
                TriggerFire blankFire = Serializer.Deserialize<TriggerFire>(blankDelivery.Body)!;
                Assert.True(blankDelivery.StatusCode == 202 && blankFire.Outcome == TriggerFireOutcomeEnum.Failed && blankFire.ErrorCode == "InputRequired" && blankFire.RunId == null, "An empty input fails the fire (" + blankFire.ErrorCode + ")");

                // Pipeline targets start a pipeline run whose stage runs carry the trigger.
                Pipeline pipeline = new Pipeline { Name = "hooked-pipeline" };
                pipeline.Stages.Add(new PipelineStage { Name = "only", AgentId = agent.Id });
                Pipeline createdPipeline = await HttpTestHelpers.SendAsync<Pipeline>(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", pipeline, 201, token).ConfigureAwait(false);
                Trigger pipelineHook = await CreateAsync(host, new Trigger { Name = "pipeline-hook", Type = TriggerTypeEnum.Webhook, TargetType = TriggerTargetTypeEnum.Pipeline, PipelineId = createdPipeline.Id }, token).ConfigureAwait(false);
                TestResponse pipelineDelivery = await DeliverAsync(host, host.TenantId, pipelineHook.Id, pipelineHook.SigningSecret!, body, "pipe-1", 0, token).ConfigureAwait(false);
                TriggerFire pipelineFire = Serializer.Deserialize<TriggerFire>(pipelineDelivery.Body)!;
                Assert.True(pipelineDelivery.StatusCode == 202 && pipelineFire.PipelineRunId != null && pipelineFire.RunId == null, "The fire started a pipeline run (" + pipelineDelivery.Body + ")");
                PipelineRun pipelineRun = await HttpTestHelpers.SendAsync<PipelineRun>(host.AdminClient, HttpMethod.Get, T(host) + "/pipeline-runs/" + pipelineFire.PipelineRunId, null, 200, token).ConfigureAwait(false);
                Assert.Equal(pipelineHook.Id, pipelineRun.TriggerId, "The pipeline run records the trigger");
                DateTime deadline = DateTime.UtcNow.AddSeconds(60);
                while (true)
                {
                    EnumerationResult<Run> stageRuns = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(host.AdminClient, HttpMethod.Get, T(host) + "/runs?pipelineRunId=" + pipelineRun.Id, null, 200, token).ConfigureAwait(false);
                    if (stageRuns.Objects.Count > 0)
                    {
                        Assert.Equal(pipelineHook.Id, stageRuns.Objects[0].TriggerId, "Stage runs carry the trigger");
                        break;
                    }
                    if (DateTime.UtcNow > deadline) throw new TestAssertionException("No stage run appeared.");
                    await Task.Delay(100, token).ConfigureAwait(false);
                }

                EnumerationResult<TriggerFire> fires = await HttpTestHelpers.SendAsync<EnumerationResult<TriggerFire>>(host.AdminClient, HttpMethod.Get, T(host) + "/triggers/" + hook.Id + "/fires", null, 200, token).ConfigureAwait(false);
                Assert.Equal(4, fires.Objects.Count, "Fire history of the webhook trigger (one per distinct delivery)");
                Assert.True(fires.Objects[0].CreatedUtc >= fires.Objects[fires.Objects.Count - 1].CreatedUtc, "Newest first");
                Trigger counted = await HttpTestHelpers.SendAsync<Trigger>(host.AdminClient, HttpMethod.Get, T(host) + "/triggers/" + hook.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(counted.FireCount == 4 && counted.LastFireOutcome == TriggerFireOutcomeEnum.Started && counted.LastFireUtc.HasValue, "The trigger counts its fires (" + counted.FireCount + ")");
                EnumerationResult<TriggerFire> failed = await HttpTestHelpers.SendAsync<EnumerationResult<TriggerFire>>(host.AdminClient, HttpMethod.Get, T(host) + "/triggers/" + blankCreated.Id + "/fires?outcome=Failed", null, 200, token).ConfigureAwait(false);
                Assert.Equal(1, failed.Objects.Count, "Outcome filter");
            }
        }

        private static string ErrorRequestId(string body)
        {
            int index = body.IndexOf("\"requestId\":\"", StringComparison.Ordinal);
            if (index < 0) return "\u0000";
            int start = index + "\"requestId\":\"".Length;
            int end = body.IndexOf('"', start);
            return end < 0 ? "\u0000" : body.Substring(start, end - start);
        }

        private static async Task CronFiringAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                TriggerService triggers = host.Server.Context.Get<TriggerService>();
                Agent agent = await cluster.CreateAgentAsync("trig-cron", "builtin/fake", null, token).ConfigureAwait(false);
                Trigger created = await CreateAsync(host, Cron("every-ten", agent, "*/10 * * * *"), token).ConfigureAwait(false);

                // Pretend the schedule came due a while ago: three occurrences were missed.
                DateTime now = DateTime.UtcNow;
                DateTime missed = new DateTime(now.Year, now.Month, now.Day, now.Hour, now.Minute / 10 * 10, 0, DateTimeKind.Utc).AddMinutes(-30);
                Trigger stored = (await host.Server.Context.Database.Triggers.ReadAsync(host.TenantId, created.Id, token).ConfigureAwait(false))!;
                stored.NextFireUtc = missed;
                await host.Server.Context.Database.Triggers.UpdateAsync(stored, token).ConfigureAwait(false);

                Assert.True(await triggers.SweepAsync(now, token).ConfigureAwait(false), "The sweep fires the due trigger");
                Assert.True(!await triggers.SweepAsync(now, token).ConfigureAwait(false), "A second sweep finds nothing due");
                EnumerationResult<TriggerFire> fires = await host.Server.Context.Database.TriggerFires.EnumerateAsync(host.TenantId, created.Id, null, new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.Equal(1, fires.Objects.Count, "Missed occurrences collapse into one fire");
                TriggerFire fire = fires.Objects[0];
                DateTime latest = CronSchedule.LatestDue("*/10 * * * *", "UTC", missed, now);
                Assert.True(fire.Source == TriggerFireSourceEnum.Cron && fire.Outcome == TriggerFireOutcomeEnum.Started && fire.ScheduledUtc == latest && fire.RunId != null, "The fire is for the latest occurrence (" + fire.ScheduledUtc.ToString("o") + " vs " + latest.ToString("o") + ", " + fire.Outcome + ": " + fire.ErrorMessage + ")");
                Run run = await WaitRunAsync(host, fire.RunId!, token).ConfigureAwait(false);
                Assert.True(run.Status == RunStatusEnum.Succeeded && run.TriggerId == created.Id && run.InputText != null && run.InputText.Contains("every-ten", StringComparison.Ordinal), "The scheduled run ran with the built-in input");
                Trigger after = (await host.Server.Context.Database.Triggers.ReadAsync(host.TenantId, created.Id, token).ConfigureAwait(false))!;
                Assert.True(after.NextFireUtc.HasValue && after.NextFireUtc.Value > now && after.LastFireUtc == latest && after.FireCount == 1 && after.LastFireOutcome == TriggerFireOutcomeEnum.Started, "The schedule advanced past now");

                // A yearly schedule whose latest occurrence is older than the lateness bound is recorded as Skipped, and
                // nothing runs.
                triggers.Options.CronMaxLatenessSeconds = 600;
                Trigger yearly = await CreateAsync(host, Cron("yearly", agent, "0 0 1 1 *"), token).ConfigureAwait(false);
                Trigger yearlyStored = (await host.Server.Context.Database.Triggers.ReadAsync(host.TenantId, yearly.Id, token).ConfigureAwait(false))!;
                DateTime newYear = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                DateTime sweepAt = newYear.AddDays(3);
                yearlyStored.NextFireUtc = newYear;
                await host.Server.Context.Database.Triggers.UpdateAsync(yearlyStored, token).ConfigureAwait(false);
                await triggers.SweepAsync(sweepAt, token).ConfigureAwait(false);
                EnumerationResult<TriggerFire> skipped = await host.Server.Context.Database.TriggerFires.EnumerateAsync(host.TenantId, yearly.Id, null, new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.True(skipped.Objects.Count == 1 && skipped.Objects[0].Outcome == TriggerFireOutcomeEnum.Skipped && skipped.Objects[0].ErrorCode == "MissedSchedule" && skipped.Objects[0].RunId == null && skipped.Objects[0].ScheduledUtc == newYear, "An occurrence older than the bound is Skipped");
                Trigger yearlyAfter = (await host.Server.Context.Database.Triggers.ReadAsync(host.TenantId, yearly.Id, token).ConfigureAwait(false))!;
                Assert.True(yearlyAfter.NextFireUtc == newYear.AddYears(1) && yearlyAfter.LastFireOutcome == TriggerFireOutcomeEnum.Skipped, "A skipped occurrence still advances the schedule");
                triggers.Options.CronMaxLatenessSeconds = 0;
                yearlyAfter.NextFireUtc = newYear;
                await host.Server.Context.Database.Triggers.UpdateAsync(yearlyAfter, token).ConfigureAwait(false);
                await triggers.SweepAsync(sweepAt.AddMinutes(1), token).ConfigureAwait(false);
                Assert.Equal(1L, (await host.Server.Context.Database.TriggerFires.EnumerateAsync(host.TenantId, yearly.Id, null, new EnumerationQuery(), token).ConfigureAwait(false)).TotalRecords, "The same occurrence never fires twice, even with the bound off");
                triggers.Options.CronMaxLatenessSeconds = 3600;

                // The run-as principal is checked on every fire.
                User author = await UserAsync(host, "trig-author@example.com", "Editor", token).ConfigureAwait(false);
                Trigger authored;
                using (HttpClient client = await host.UserClientAsync("trig-author@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    authored = await HttpTestHelpers.SendAsync<Trigger>(client, HttpMethod.Post, T(host) + "/triggers", Webhook("authored", agent), 201, token).ConfigureAwait(false);
                }
                Assert.True(authored.RunAsType == PrincipalTypeEnum.User && authored.RunAsId == author.Id, "The trigger runs as its author");
                TriggerFire byAuthor = await HttpTestHelpers.SendAsync<TriggerFire>(host.AdminClient, HttpMethod.Post, T(host) + "/triggers/" + authored.Id + "/fire", new TriggerFireRequest { Body = "{\"n\":1}", ContentType = "application/json" }, 201, token).ConfigureAwait(false);
                Assert.True(byAuthor.Outcome == TriggerFireOutcomeEnum.Started && byAuthor.Source == TriggerFireSourceEnum.Manual, "A manual fire runs as the author (" + byAuthor.ErrorMessage + ")");
                Run authoredRun = await WaitRunAsync(host, byAuthor.RunId!, token).ConfigureAwait(false);
                Assert.True(authoredRun.CallerType == PrincipalTypeEnum.User && authoredRun.CallerId == author.Id, "The run's caller is the run-as principal");
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Put, T(host) + "/users/" + author.Id, new UserRequest { Active = false }, 200, token).ConfigureAwait(false);
                TriggerFire denied = await HttpTestHelpers.SendAsync<TriggerFire>(host.AdminClient, HttpMethod.Post, T(host) + "/triggers/" + authored.Id + "/fire", null, 201, token).ConfigureAwait(false);
                Assert.True(denied.Outcome == TriggerFireOutcomeEnum.Failed && denied.ErrorCode == "RunAsNotAuthorized" && denied.RunId == null, "A deactivated run-as user fails the fire (" + denied.ErrorCode + ")");

                // Manual fire of a cron trigger, and a payload over the limit.
                TriggerFire manual = await HttpTestHelpers.SendAsync<TriggerFire>(host.AdminClient, HttpMethod.Post, T(host) + "/triggers/" + created.Id + "/fire", null, 201, token).ConfigureAwait(false);
                Assert.True(manual.Outcome == TriggerFireOutcomeEnum.Started && manual.Source == TriggerFireSourceEnum.Manual, "Manual fire of a cron trigger");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/triggers/" + created.Id + "/fire", new TriggerFireRequest { Body = new string('y', 300000) }, token).ConfigureAwait(false), 400, "PayloadTooLarge", "Manual payload over the limit");

                // Inactive cron triggers never fire.
                Trigger inactive = await CreateAsync(host, new Trigger { Name = "inactive-cron", Type = TriggerTypeEnum.Cron, AgentId = agent.Id, CronExpression = "* * * * *", Active = false }, token).ConfigureAwait(false);
                Assert.True(!inactive.NextFireUtc.HasValue, "Inactive cron triggers have no next fire");
                await triggers.SweepAsync(DateTime.UtcNow.AddHours(1), token).ConfigureAwait(false);
                Assert.Equal(0L, (await host.Server.Context.Database.TriggerFires.EnumerateAsync(host.TenantId, inactive.Id, null, new EnumerationQuery(), token).ConfigureAwait(false)).TotalRecords, "Inactive triggers do not fire");
            }
        }

        private static async Task LeaderOnceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, Garrison.Server.Backplane.BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                foreach (TestServerHost replica in cluster.Replicas) replica.Server.Context.Get<MaintenanceService>().Triggers = null;
                await cluster.AddWorkerAsync(0, null, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync(0, "trig-replicas", null, token).ConfigureAwait(false);
                TestServerHost a = cluster.Replicas[0];
                TestServerHost b = cluster.Replicas[1];
                Trigger created = await HttpTestHelpers.SendAsync<Trigger>(a.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.TenantId + "/triggers", Cron("replicated", agent, "* * * * *"), 201, token).ConfigureAwait(false);

                // Both replicas sweep the same due occurrence at the same moment, several times: one fire, one run.
                DateTime baseline = DateTime.UtcNow;
                baseline = new DateTime(baseline.Year, baseline.Month, baseline.Day, baseline.Hour, baseline.Minute, 0, DateTimeKind.Utc).AddHours(-1);
                for (int round = 0; round < 3; round++)
                {
                    Trigger stored = (await a.Server.Context.Database.Triggers.ReadAsync(cluster.TenantId, created.Id, token).ConfigureAwait(false))!;
                    DateTime occurrence = baseline.AddMinutes(round * 10);
                    DateTime now = occurrence.AddSeconds(20);
                    stored.NextFireUtc = occurrence;
                    await a.Server.Context.Database.Triggers.UpdateAsync(stored, token).ConfigureAwait(false);
                    List<Task<bool>> sweeps = new List<Task<bool>>();
                    for (int i = 0; i < 4; i++)
                    {
                        sweeps.Add(a.Server.Context.Get<TriggerService>().SweepAsync(now, token));
                        sweeps.Add(b.Server.Context.Get<TriggerService>().SweepAsync(now, token));
                    }
                    bool[] results = await Task.WhenAll(sweeps).ConfigureAwait(false);
                    Assert.Equal(1, results.Count(r => r), "Exactly one sweep fired round " + round);
                }
                EnumerationResult<TriggerFire> fires = await a.Server.Context.Database.TriggerFires.EnumerateAsync(cluster.TenantId, created.Id, null, new EnumerationQuery { MaxResults = 100 }, token).ConfigureAwait(false);
                Assert.Equal(3, fires.Objects.Count, "One fire per occurrence across both replicas");
                EnumerationResult<Run> runs = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(a.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + cluster.TenantId + "/runs?triggerId=" + created.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(3, runs.Objects.Count, "One run per occurrence");

                // With the maintenance passes back on, only the leader fires the next due occurrence.
                // A yearly schedule, so no new occurrence comes due while the test waits.
                foreach (TestServerHost replica in cluster.Replicas)
                {
                    replica.Server.Context.Get<TriggerService>().Options.CronMaxLatenessSeconds = 0;
                    replica.Server.Context.Get<MaintenanceService>().Triggers = replica.Server.Context.Get<TriggerService>();
                }
                Trigger due = (await a.Server.Context.Database.Triggers.ReadAsync(cluster.TenantId, created.Id, token).ConfigureAwait(false))!;
                due.CronExpression = "0 0 1 1 *";
                due.NextFireUtc = new DateTime(DateTime.UtcNow.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                await a.Server.Context.Database.Triggers.UpdateAsync(due, token).ConfigureAwait(false);
                DateTime deadline = DateTime.UtcNow.AddSeconds(30);
                while ((await a.Server.Context.Database.TriggerFires.EnumerateAsync(cluster.TenantId, created.Id, null, new EnumerationQuery(), token).ConfigureAwait(false)).TotalRecords < 4)
                {
                    if (DateTime.UtcNow > deadline) throw new TestAssertionException("The leader's maintenance pass did not fire the due trigger.");
                    await Task.Delay(200, token).ConfigureAwait(false);
                }
                await Task.Delay(5000, token).ConfigureAwait(false);
                Assert.Equal(4L, (await a.Server.Context.Database.TriggerFires.EnumerateAsync(cluster.TenantId, created.Id, null, new EnumerationQuery(), token).ConfigureAwait(false)).TotalRecords, "The occurrence fired once in total");
                Assert.Equal(1, cluster.Replicas.Count(r => r.Server.Context.Get<ILeaderState>().IsLeader), "Exactly one leader");
            }
        }

        private static async Task ManifestsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                await cluster.CreateAgentAsync("manifest-target", "builtin/fake", null, token).ConfigureAwait(false);
                string secret = "whsec_manifest_secret_0123456789";
                string yaml = String.Join("\n",
                    "apiVersion: garrison/v1",
                    "kind: Trigger",
                    "metadata:",
                    "  name: manifest-cron",
                    "  description: Morning report",
                    "spec:",
                    "  agent: manifest-target",
                    "  cron: \"0 8 * * 1-5\"",
                    "  timeZone: Europe/London",
                    "---",
                    "apiVersion: garrison/v1",
                    "kind: Trigger",
                    "metadata:",
                    "  name: manifest-hook",
                    "spec:",
                    "  type: Webhook",
                    "  agent: manifest-target",
                    "  inputTemplate: builtin/trigger-input",
                    "  signingSecret: " + secret);

                TestResponse refused = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply", yaml, token).ConfigureAwait(false);
                Assert.True(refused.StatusCode == 400 && refused.Body.Contains("does not allow secret values", StringComparison.Ordinal), "A signing secret needs allowSecretValues: " + refused.Body);
                ManifestApply dry = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply?dryRun=true&allowSecretValues=true", yaml, 200, token).ConfigureAwait(false);
                Assert.True(dry.CreatedCount == 2 && dry.FailedCount == 0, "Dry run plans two creations");
                Assert.True(await host.Server.Context.Database.Triggers.ReadByNameAsync(host.TenantId, "manifest-cron", token).ConfigureAwait(false) == null, "A dry run writes nothing");
                ManifestApply applied = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply?allowSecretValues=true", yaml, 200, token).ConfigureAwait(false);
                Assert.True(applied.CreatedCount == 2, "Apply creates both");
                Trigger cron = (await host.Server.Context.Database.Triggers.ReadByNameAsync(host.TenantId, "manifest-cron", token).ConfigureAwait(false))!;
                Assert.True(cron.Description == "Morning report" && cron.TimeZone == "Europe/London" && cron.NextFireUtc.HasValue && cron.RunAsType == PrincipalTypeEnum.Administrator, "Cron trigger from the manifest");
                Trigger hook = (await host.Server.Context.Database.Triggers.ReadByNameAsync(host.TenantId, "manifest-hook", token).ConfigureAwait(false))!;
                Assert.True(hook.Type == TriggerTypeEnum.Webhook && hook.SigningSecretLast4 == "6789", "Webhook trigger with the given secret");
                Assert.Equal(202, (await DeliverAsync(host, host.TenantId, hook.Id, secret, "{}", null, 0, token).ConfigureAwait(false)).StatusCode, "The manifest secret signs deliveries");

                ManifestApply again = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply?allowSecretValues=true", yaml, 200, token).ConfigureAwait(false);
                Assert.True(again.UnchangedCount == 2 && again.UpdatedCount == 0, "Re-applying the same documents changes nothing (" + again.UnchangedCount + " unchanged, " + again.UpdatedCount + " updated)");
                Trigger reread = (await host.Server.Context.Database.Triggers.ReadByNameAsync(host.TenantId, "manifest-cron", token).ConfigureAwait(false))!;
                Assert.Equal(cron.NextFireUtc, reread.NextFireUtc, "An unchanged apply keeps the schedule");

                string changed = yaml.Replace("0 8 * * 1-5", "30 8 * * 1-5", StringComparison.Ordinal);
                ManifestApply updated = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply?allowSecretValues=true", changed, 200, token).ConfigureAwait(false);
                Assert.True(updated.UpdatedCount == 1 && updated.Items.Any(i => i.Name == "manifest-cron" && i.Changes.Any(c => c.Field == "cron")), "A schedule change is an update with a cron diff");

                string retype = String.Join("\n", "apiVersion: garrison/v1", "kind: Trigger", "metadata:", "  name: manifest-cron", "spec:", "  type: Webhook", "  agent: manifest-target");
                TestResponse retyped = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply", retype, token).ConfigureAwait(false);
                Assert.True(retyped.StatusCode == 400 && retyped.Body.Contains("the type cannot change", StringComparison.Ordinal) && retyped.Body.Contains("spec.type", StringComparison.Ordinal), "The type cannot change through a manifest: " + retyped.Body);

                string generated = String.Join("\n", "apiVersion: garrison/v1", "kind: Trigger", "metadata:", "  name: manifest-generated", "spec:", "  type: Webhook", "  agent: manifest-target");
                ManifestApply generatedApply = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply", generated, 200, token).ConfigureAwait(false);
                Assert.True(generatedApply.Items[0].Message != null && generatedApply.Items[0].Message!.Contains("rotate", StringComparison.Ordinal), "A webhook trigger without a secret gets a generated one");
                Assert.True((await host.Server.Context.Database.Triggers.ReadByNameAsync(host.TenantId, "manifest-generated", token).ConfigureAwait(false))!.SigningSecretLast4 != null, "Generated secret stored");

                TestResponse export = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/manifests/export", null, token).ConfigureAwait(false);
                Assert.True(export.StatusCode == 200 && export.Body.Contains("kind: Trigger", StringComparison.Ordinal) && export.Body.Contains("manifest-hook", StringComparison.Ordinal) && export.Body.Contains("30 8 * * 1-5", StringComparison.Ordinal), "Export carries triggers");
                Assert.True(!export.Body.Contains(secret, StringComparison.Ordinal) && !export.Body.Contains("signingSecret", StringComparison.Ordinal), "Export never carries a signing secret");
            }
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            using (TestMcpClient client = new TestMcpClient())
            {
                TestServerHost host = cluster.Server;
                await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                List<string> names = new List<string> { "garrison_list_triggers", "garrison_get_trigger", "garrison_create_trigger", "garrison_update_trigger", "garrison_delete_trigger", "garrison_list_trigger_fires" };
                ProviderToolPage listed = await client.ToolsAsync(token).ConfigureAwait(false);
                foreach (string name in names)
                {
                    McpToolDefinition? tool = McpToolCatalog.All().FirstOrDefault(t => t.Name == name);
                    Assert.True(tool != null && tool.UserOnly && tool.ManagementTool, name + " is a management tool");
                    Assert.True(host.Server.Context.Scopes.Find("MCP", name) != null, name + " scope is registered");
                    Assert.True(listed.Tools.Any(t => t.Name == name), "Administrator sees " + name);
                }

                Agent agent = await cluster.CreateAgentAsync("mcp-trig-agent", "builtin/fake", null, token).ConfigureAwait(false);
                Trigger definition = new Trigger { Id = "trg_ignored", Name = "mcp-hook", Type = TriggerTypeEnum.Webhook, AgentId = agent.Name };
                Trigger created = await client.CallAsync<Trigger>("garrison_create_trigger", new { configuration = definition }, token).ConfigureAwait(false);
                Assert.True(created.Id != "trg_ignored" && created.SigningSecret != null && created.AgentId == agent.Id, "Creation through MCP returns the secret once");
                await client.ExpectErrorAsync("garrison_create_trigger", new { configuration = definition }, "NameConflict", token).ConfigureAwait(false);
                await client.ExpectErrorAsync("garrison_create_trigger", new { configuration = new Trigger { Name = "mcp-bad", Type = TriggerTypeEnum.Cron, AgentId = agent.Id, CronExpression = "nope" } }, "ValidationFailed", token).ConfigureAwait(false);
                Trigger read = await client.CallAsync<Trigger>("garrison_get_trigger", new { trigger = created.Name }, token).ConfigureAwait(false);
                Assert.True(read.Id == created.Id && read.SigningSecret == null, "Reads by name never return the secret");
                read.Description = "updated through MCP";
                Trigger updated = await client.CallAsync<Trigger>("garrison_update_trigger", new { trigger = read.Id, configuration = read }, token).ConfigureAwait(false);
                Assert.Equal("updated through MCP", updated.Description, "Update through MCP");
                Assert.Equal(202, (await DeliverAsync(host, host.TenantId, created.Id, created.SigningSecret!, "{}", "mcp-1", 0, token).ConfigureAwait(false)).StatusCode, "The MCP-created secret signs deliveries");
                EnumerationResult<TriggerFire> fires = await client.CallAsync<EnumerationResult<TriggerFire>>("garrison_list_trigger_fires", new { trigger = created.Id, outcome = "Started" }, token).ConfigureAwait(false);
                Assert.Equal(1, fires.Objects.Count, "Fires through MCP");
                await client.ExpectErrorAsync("garrison_list_trigger_fires", new { trigger = created.Id, outcome = "Sometimes" }, "ValidationFailed", token).ConfigureAwait(false);
                EnumerationResult<Trigger> all = await client.CallAsync<EnumerationResult<Trigger>>("garrison_list_triggers", new { type = "Webhook" }, token).ConfigureAwait(false);
                Assert.True(all.Objects.Any(t => t.Id == created.Id), "List through MCP");
                await client.ExpectErrorAsync("garrison_get_trigger", new { trigger = "missing-trigger" }, "NotFound", token).ConfigureAwait(false);

                await UserAsync(host, "mcp-trig-viewer@example.com", "Viewer", token).ConfigureAwait(false);
                using (HttpClient login = await host.UserClientAsync("mcp-trig-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                using (TestMcpClient viewer = new TestMcpClient())
                {
                    await viewer.ConnectAsync(host, login.DefaultRequestHeaders.Authorization!.Parameter, token).ConfigureAwait(false);
                    Assert.Equal(created.Id, (await viewer.CallAsync<Trigger>("garrison_get_trigger", new { trigger = created.Id }, token).ConfigureAwait(false)).Id, "Viewers read triggers");
                    await viewer.ExpectErrorAsync("garrison_create_trigger", new { configuration = new Trigger { Name = "viewer-hook", Type = TriggerTypeEnum.Webhook, AgentId = agent.Id } }, "Forbidden", token).ConfigureAwait(false);
                    await viewer.ExpectErrorAsync("garrison_delete_trigger", new { trigger = created.Id }, "Forbidden", token).ConfigureAwait(false);
                }

                Deployment deployment = (await host.Server.Context.Database.Deployments.ListByAgentAsync(host.TenantId, agent.Id, token).ConfigureAwait(false)).First();
                Run hosted = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = deployment.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1 }, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(hosted, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (TestMcpClient runClient = new TestMcpClient())
                {
                    await runClient.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                    ProviderToolPage runTools = await runClient.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(runTools.Tools.All(t => !names.Contains(t.Name)), "Run tokens see no trigger tools");
                    await runClient.ExpectErrorAsync("garrison_list_triggers", new { }, "Forbidden", token).ConfigureAwait(false);
                }

                McpConfigurationDeletion deleted = await client.CallAsync<McpConfigurationDeletion>("garrison_delete_trigger", new { trigger = created.Name }, token).ConfigureAwait(false);
                Assert.True(deleted.Deleted && deleted.Id == created.Id, "Delete through MCP");
            }
        }

        #endregion
    }
}
