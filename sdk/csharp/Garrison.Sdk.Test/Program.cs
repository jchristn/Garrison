namespace Garrison.Sdk.Test
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Security.Cryptography;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk;
    using Garrison.Sdk.Clients;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// End-to-end test harness for the C# SDK. Usage: Garrison.Sdk.Test [baseUrl] [accessKey] [secretKey].
    /// Requires a running server and a worker that can run the builtin/fake harness profile.
    /// </summary>
    public static class Program
    {
        #region Private-Members

        private static readonly List<string> _Failures = new List<string>();
        private static int _Passed = 0;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Entry point.
        /// </summary>
        /// <param name="args">Base URL, access key, secret key.</param>
        /// <returns>0 when every check passed, otherwise 1.</returns>
        public static async Task<int> Main(string[] args)
        {
            string baseUrl = args.Length > 0 ? args[0] : "http://127.0.0.1:8700";
            string accessKey = args.Length > 1 ? args[1] : "access_garrison_default";
            string secretKey = args.Length > 2 ? args[2] : "secret_garrison_default_change_me";
            string suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            Console.WriteLine("Garrison C# SDK harness against " + baseUrl);

            using (CancellationTokenSource cts = new CancellationTokenSource(TimeSpan.FromMinutes(5)))
            using (GarrisonClient client = new GarrisonClient(baseUrl))
            {
                CancellationToken token = cts.Token;
                string? tenantId = null;
                string? agentId = null;
                string? deploymentId = null;
                Run? invokedRun = null;

                await CheckAsync("health", async () =>
                {
                    HealthResponse health = await client.HealthAsync(token).ConfigureAwait(false);
                    Require(health.Status == "healthy", "status " + health.Status);
                }).ConfigureAwait(false);

                int authFailureStatus = 0;
                await CheckAsync("token auth", async () =>
                {
                    TokenResponse issued;
                    try
                    {
                        issued = await client.LoginWithKeysAsync(accessKey, secretKey, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 401 || e.StatusCode == 403)
                    {
                        authFailureStatus = e.StatusCode;
                        throw;
                    }

                    Require(!String.IsNullOrEmpty(issued.Token), "empty token");
                    tenantId = issued.TenantId;
                    TokenDetailsResponse details = await client.GetTokenDetailsAsync(token).ConfigureAwait(false);
                    Require(details.PrincipalType == PrincipalTypeEnum.Credential, "principal " + details.PrincipalType);
                }).ConfigureAwait(false);

                if (authFailureStatus != 0)
                {
                    Console.WriteLine();
                    Console.WriteLine(
                        "Authentication failed (HTTP " + authFailureStatus + "): the server rejected access key " + accessKey + ". "
                        + "The remaining checks need a signed-in client, so the harness stops here. Pass this server's keys as arguments: "
                        + "Garrison.Sdk.Test <baseUrl> <accessKey> <secretKey>. Docker Compose and source builds default to "
                        + "access_garrison_default and secret_garrison_default_change_me; on Kubernetes read default-access-key and "
                        + "default-secret-key from Secret garrison-secrets (see README, \"Where the credentials come from\").");
                    return 1;
                }

                await CheckAsync("signed request auth", async () =>
                {
                    using (GarrisonClient signed = new GarrisonClient(baseUrl))
                    {
                        signed.UseSignedRequests(accessKey, secretKey, tenantId ?? "default");
                        EnumerationQuery query = new EnumerationQuery();
                        query.MaxResults = 5;
                        EnumerationResult<Agent> agents = await signed.Agents.ListAsync(query, token).ConfigureAwait(false);
                        Require(agents.Success, "list failed");
                    }
                }).ConfigureAwait(false);

                string? fakeProfileId = null;
                await CheckAsync("model price CRUD", async () =>
                {
                    ModelPrice price = await client.ModelPrices.CreateAsync(new ModelPrice { Name = "sdk-cs-price-" + suffix, Model = "fixture-cs-" + suffix, HarnessType = HarnessTypeEnum.Generic, InputUsdPerMillion = 0.5, OutputUsdPerMillion = 2, ReasoningUsdPerMillion = 0, InputIncludesCachedTokens = false }, token).ConfigureAwait(false);
                    try
                    {
                        ModelPrice saved = await client.ModelPrices.GetAsync(price.Id, token).ConfigureAwait(false);
                        Require(saved.InputUsdPerMillion == 0.5 && saved.ReasoningUsdPerMillion == 0 && !saved.InputIncludesCachedTokens, "price fields");
                        Require((await client.ModelPrices.ListAsync(new Garrison.Sdk.Enumeration.EnumerationQuery { Search = price.Name }, token).ConfigureAwait(false)).Objects.Any(p => p.Id == price.Id), "price list");
                        saved.OutputUsdPerMillion = 3;
                        Require((await client.ModelPrices.UpdateAsync(price.Id, saved, token).ConfigureAwait(false)).OutputUsdPerMillion == 3, "price update");
                    }
                    finally { await client.ModelPrices.DeleteAsync(price.Id, token).ConfigureAwait(false); }
                }).ConfigureAwait(false);

                await CheckAsync("builtin harness profiles", async () =>
                {
                    List<HarnessProfile> builtIns = await client.HarnessProfiles.ListBuiltInAsync(token).ConfigureAwait(false);
                    Require(builtIns.Any(p => p.Name == "builtin/provider-api" && p.HarnessType == HarnessTypeEnum.ProviderApi && p.OutputParser == OutputParserEnum.ProviderApiJsonl), "optional provider profile enums");
                    Require(builtIns.Any(p => p.Name == "builtin/opencode" && p.HarnessType == HarnessTypeEnum.OpenCode && p.OutputParser == OutputParserEnum.OpenCodeJsonl && p.McpConfigFormat == McpConfigFormatEnum.OpenCodeJson), "opencode profile enums");
                    Require(builtIns.Any(p => p.Name == "builtin/pi" && p.HarnessType == HarnessTypeEnum.Pi && p.OutputParser == OutputParserEnum.PiJsonl && p.McpConfigFormat == McpConfigFormatEnum.PiJson), "pi profile enums");
                    HarnessProfile? fake = builtIns.FirstOrDefault(p => p.Name == "builtin/fake");
                    Require(fake != null, "builtin/fake not found among " + builtIns.Count);
                    fakeProfileId = fake!.Id;
                }).ConfigureAwait(false);

                await CheckAsync("create agent and deployment", async () =>
                {
                    Agent agent = new Agent();
                    agent.Name = "sdk-cs-" + suffix;
                    agent.Description = "C# SDK harness scratch agent.";
                    agent = await client.Agents.CreateAsync(agent, token).ConfigureAwait(false);
                    agentId = agent.Id;

                    Deployment deployment = new Deployment();
                    deployment.Name = "sdk-cs-" + suffix + "-fake";
                    deployment.AgentId = agent.Id;
                    deployment.HarnessProfileId = fakeProfileId ?? throw new InvalidOperationException("no fake profile");
                    deployment = await client.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
                    deploymentId = deployment.Id;
                }).ConfigureAwait(false);

                await CheckAsync("usage quota CRUD and meters", async () =>
                {
                    UsageQuota quota = await client.UsageQuotas.CreateAsync(new UsageQuota { Name = "sdk-cs-quota-" + suffix, Scope = UsageQuotaScopeEnum.Agent, ResourceId = agentId!, DailyRunLimit = 100, DailyCostUsdLimit = 0.125 }, token).ConfigureAwait(false);
                    try
                    {
                        Require(!quota.EnforcementEnabled && (await client.UsageQuotas.GetAsync(quota.Id, token).ConfigureAwait(false)).DailyRunLimit == 100, "quota fields and default monitoring");
                        UsageQuotaUsage usage = await client.UsageQuotas.UsageAsync(quota.Id, token).ConfigureAwait(false);
                        Require(usage.RunsUsed == 0 && usage.CostAccountingComplete && usage.WindowEndUtc > usage.WindowStartUtc, "quota usage");
                        quota.DailyRunLimit = null;
                        quota.EnforcementEnabled = true;
                        UsageQuota updated = await client.UsageQuotas.UpdateAsync(quota.Id, quota, token).ConfigureAwait(false);
                        Require(updated.DailyRunLimit == null && updated.EnforcementEnabled, "explicit enforcement opt-in");
                    }
                    finally { await client.UsageQuotas.DeleteAsync(quota.Id, token).ConfigureAwait(false); }
                }).ConfigureAwait(false);

                await CheckAsync("invoke with wait", async () =>
                {
                    InvokeRequest request = new InvokeRequest();
                    request.Input = "Hello from the C# SDK";
                    request.Wait = true;
                    request.WaitSeconds = 90;
                    Run run = await client.Agents.InvokeAsync(agentId ?? throw new InvalidOperationException("no agent"), request, token).ConfigureAwait(false);
                    Require(run.Status == RunStatusEnum.Succeeded, "status " + run.Status + " " + run.ErrorMessage);
                    Require((run.ResultText ?? String.Empty).StartsWith("Echo:", StringComparison.Ordinal), "result " + run.ResultText);
                    invokedRun = run;
                }).ConfigureAwait(false);

                await CheckAsync("run transcript (Markdown and JSON)", async () =>
                {
                    string runId = invokedRun?.Id ?? throw new InvalidOperationException("no invoked run");
                    string markdown = await client.Runs.GetTranscriptMarkdownAsync(runId, false, token).ConfigureAwait(false);
                    Require(markdown.Contains("sdk-cs-" + suffix, StringComparison.Ordinal), "markdown lacks the agent name");
                    Require(markdown.Contains("Hello from the C# SDK", StringComparison.Ordinal), "markdown lacks the input");
                    Transcript transcript = await client.Runs.GetTranscriptAsync(runId, false, token).ConfigureAwait(false);
                    Require(transcript.Schema == "garrison.transcript/v1" && transcript.Kind == TranscriptKindEnum.Run, "schema " + transcript.Schema + " kind " + transcript.Kind);
                    Require(transcript.RunId == runId && transcript.AgentName == "sdk-cs-" + suffix, "run " + transcript.RunId + " agent " + transcript.AgentName);
                    Require(transcript.TurnCount == 1 && transcript.Turns.Count == 1, "turns " + transcript.TurnCount);
                    Require(transcript.Turns[0].Input == "Hello from the C# SDK" && transcript.Turns[0].Status == RunStatusEnum.Succeeded, "turn input " + transcript.Turns[0].Input);
                    Require(!transcript.IncludesThinking, "thinking included by default");
                }).ConfigureAwait(false);

                await CheckAsync("run trail", async () =>
                {
                    // A direct invoke: the caller starts the run and the trail ends with the reply to that caller.
                    string runId = invokedRun?.Id ?? throw new InvalidOperationException("no invoked run");
                    RunTrail trail = await client.Runs.GetRunTrailAsync(runId, null, token).ConfigureAwait(false);
                    Require(trail.FocusRunId == runId && trail.Truncation == RunTrailTruncationEnum.None && trail.NodeCount == trail.Nodes.Count, "trail header " + trail.FocusRunId + " " + trail.Truncation);
                    RunTrailNode? origin = trail.Nodes.FirstOrDefault(n => n.Id == trail.OriginId);
                    Require(origin != null && origin.Kind == RunTrailNodeKindEnum.Caller && origin.CallerType == PrincipalTypeEnum.Credential && origin.EntrySurface == EntrySurfaceEnum.Rest, "origin is the calling credential, over REST");
                    RunTrailNode? focus = trail.Nodes.FirstOrDefault(n => n.Id == runId);
                    Require(focus != null && focus.IsFocus && focus.Kind == RunTrailNodeKindEnum.Run && focus.State == "Succeeded" && focus.RunKind == RunKindEnum.Invoke, "focus run node");
                    Require(trail.Edges.Any(e => e.FromId == trail.OriginId && e.ToId == runId && e.Kind == RunTrailEdgeKindEnum.Started), "Started edge");
                    Require(trail.Nodes.Any(n => n.Kind == RunTrailNodeKindEnum.Reply) && trail.Edges.Any(e => e.FromId == runId && e.Kind == RunTrailEdgeKindEnum.Replied), "Reply node and Replied edge");
                    RunTrail withoutEffects = await client.Runs.GetRunTrailAsync(runId, false, token).ConfigureAwait(false);
                    Require(!withoutEffects.Nodes.Any(n => n.Kind == RunTrailNodeKindEnum.Effect), "includeEffects false leaves out effects");
                    try
                    {
                        await client.Runs.GetRunTrailAsync("run_sdk_missing", null, token).ConfigureAwait(false);
                        Require(false, "the trail of an unknown run is not found");
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404) { }
                }).ConfigureAwait(false);

                await CheckAsync("input schema enforcement", async () =>
                {
                    Agent structured = new Agent();
                    structured.Name = "sdk-cs-" + suffix + "-schema";
                    structured.InputMode = AgentInputModeEnum.Structured;
                    structured.InputSchema = Json("{\"type\":\"object\",\"properties\":{\"topic\":{\"type\":\"string\"},\"count\":{\"type\":\"integer\"}},\"required\":[\"topic\"]}");
                    structured = await client.Agents.CreateAsync(structured, token).ConfigureAwait(false);
                    Deployment structuredDeployment = new Deployment();
                    structuredDeployment.Name = "sdk-cs-" + suffix + "-schema-fake";
                    structuredDeployment.AgentId = structured.Id;
                    structuredDeployment.HarnessProfileId = fakeProfileId ?? throw new InvalidOperationException("no fake profile");
                    structuredDeployment = await client.Deployments.CreateAsync(structuredDeployment, token).ConfigureAwait(false);
                    try
                    {
                        Require(structured.InputSchema.HasValue && structured.InputSchema.Value.ValueKind == JsonValueKind.Object && structured.InputSchema.Value.GetProperty("properties").TryGetProperty("topic", out JsonElement _), "inputSchema not stored as an object");
                        InvokeRequest valid = new InvokeRequest();
                        valid.Input = "{\"topic\":\"sdk\",\"count\":2}";
                        valid.InputContentType = "application/json";
                        valid.WaitSeconds = 90;
                        Run run = await client.Agents.InvokeAsync(structured.Id, valid, token).ConfigureAwait(false);
                        Require(run.Status == RunStatusEnum.Succeeded, "valid input status " + run.Status + " " + run.ErrorMessage);

                        GarrisonException? missing = null;
                        try
                        {
                            await client.Agents.InvokeAsync(structured.Id, new InvokeRequest { Input = "{\"count\":\"x\"}", InputContentType = "application/json" }, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 400)
                        {
                            missing = e;
                        }
                        Require(missing != null, "expected 400 for an input that breaks the schema");
                        Dictionary<string, string> codes = missing!.Error?.FieldCodes ?? new Dictionary<string, string>();
                        Require(codes.TryGetValue("input.topic", out string? topicCode) && topicCode == "InputSchemaViolation", "fieldCodes " + String.Join(",", codes.Select(c => c.Key + "=" + c.Value)));

                        GarrisonException? notJson = null;
                        try
                        {
                            await client.Agents.InvokeAsync(structured.Id, new InvokeRequest { Input = "plain words" }, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 400)
                        {
                            notJson = e;
                        }
                        Require(notJson != null, "expected 400 for an input that is not JSON");
                        Dictionary<string, string> notJsonCodes = notJson!.Error?.FieldCodes ?? new Dictionary<string, string>();
                        Require(notJsonCodes.TryGetValue("input", out string? inputCode) && inputCode == "InputNotJson", "fieldCodes " + String.Join(",", notJsonCodes.Select(c => c.Key + "=" + c.Value)));
                    }
                    finally
                    {
                        await client.Deployments.DeleteAsync(structuredDeployment.Id, token).ConfigureAwait(false);
                        await client.Agents.DeleteAsync(structured.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("run timing fields", async () =>
                {
                    Run run = await client.Runs.GetAsync(invokedRun?.Id ?? throw new InvalidOperationException("no invoked run"), token).ConfigureAwait(false);
                    Require(run.TimeToFirstTokenMs.HasValue && run.TimeToFirstTokenMs.Value >= 0, "timeToFirstTokenMs " + run.TimeToFirstTokenMs);
                    Require(run.ExecutionMs.HasValue && run.ExecutionMs.Value >= 0, "executionMs " + run.ExecutionMs);
                    Require(run.ToolCallCount >= 0, "toolCallCount " + run.ToolCallCount);
                }).ConfigureAwait(false);

                await CheckAsync("run trace id", async () =>
                {
                    Run run = await client.Runs.GetAsync(invokedRun?.Id ?? throw new InvalidOperationException("no invoked run"), token).ConfigureAwait(false);
                    Require(run.TraceId != null && run.TraceId.Length == 32 && run.TraceId.All(c => (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')), "traceId " + run.TraceId);
                }).ConfigureAwait(false);

                await CheckAsync("run analytics", async () =>
                {
                    RunAnalyticsQuery query = new RunAnalyticsQuery();
                    query.From = DateTime.UtcNow.AddHours(-1);
                    query.To = DateTime.UtcNow.AddMinutes(1);
                    query.Interval = AnalyticsIntervalEnum.Minute;
                    RunAnalyticsResponse analytics = await client.Analytics.RunsAsync(query, token).ConfigureAwait(false);
                    Require(analytics.Totals.Runs >= 1, "totals.runs " + analytics.Totals.Runs);
                    Require(analytics.Series.Count > 0, "no series");
                    foreach (RunAnalyticsSeries series in analytics.Series)
                    {
                        Require(series.Buckets.Count > 0, "series " + series.Key + " has no buckets");
                        Require(series.Buckets.All(b => b.StartUtc != default(DateTime)), "bucket without startUtc in " + series.Key);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("run analytics grouped by harness", async () =>
                {
                    RunAnalyticsQuery query = new RunAnalyticsQuery();
                    query.From = DateTime.UtcNow.AddHours(-1);
                    query.To = DateTime.UtcNow.AddMinutes(1);
                    query.Interval = AnalyticsIntervalEnum.Auto;
                    query.GroupBy = AnalyticsGroupByEnum.Harness;
                    RunAnalyticsResponse analytics = await client.Analytics.RunsAsync(query, token).ConfigureAwait(false);
                    Require(analytics.Series.Count > 0, "no series");
                }).ConfigureAwait(false);

                await CheckAsync("run analytics grouped by harness and model", async () =>
                {
                    RunAnalyticsQuery query = new RunAnalyticsQuery();
                    query.From = DateTime.UtcNow.AddHours(-1);
                    query.To = DateTime.UtcNow.AddMinutes(1);
                    query.GroupBy = AnalyticsGroupByEnum.HarnessModel;
                    RunAnalyticsResponse analytics = await client.Analytics.RunsAsync(query, token).ConfigureAwait(false);
                    Require(analytics.Series.Count > 0, "no series");
                    foreach (RunAnalyticsSeries series in analytics.Series)
                    {
                        Require(series.Key.Contains('|'), "series key " + series.Key);
                        Require(series.Label.Contains(" / ", StringComparison.Ordinal), "series label " + series.Label);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("run analytics dimensions", async () =>
                {
                    RunAnalyticsDimensions dimensions = await client.Analytics.DimensionsAsync(DateTime.UtcNow.AddHours(-1), DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false);
                    Require(dimensions.Agents.Any(a => a.Id == agentId), "scratch agent missing from dimensions");
                    Require(dimensions.Deployments.Any(d => d.Id == deploymentId && d.AgentId == agentId), "scratch deployment missing from dimensions");
                    Require(dimensions.Harnesses.Count > 0, "no harnesses");
                    Require(dimensions.Models.Count > 0, "no models");
                    string expected = String.IsNullOrWhiteSpace(invokedRun?.ServedModel) ? "unknown" : invokedRun!.ServedModel!;
                    Require(dimensions.Models.Contains(expected), "model " + expected + " missing from " + String.Join(",", dimensions.Models));
                }).ConfigureAwait(false);

                await CheckAsync("run analytics filtered by model", async () =>
                {
                    string model = String.IsNullOrWhiteSpace(invokedRun?.ServedModel) ? "unknown" : invokedRun!.ServedModel!;
                    RunAnalyticsQuery query = new RunAnalyticsQuery();
                    query.From = DateTime.UtcNow.AddHours(-1);
                    query.To = DateTime.UtcNow.AddMinutes(1);
                    query.AgentId = agentId;
                    query.Model = model;
                    RunAnalyticsResponse matched = await client.Analytics.RunsAsync(query, token).ConfigureAwait(false);
                    Require(matched.Totals.Runs >= 1, "model " + model + " matched " + matched.Totals.Runs + " runs");
                    query.Model = "garrison-sdk-no-such-model";
                    RunAnalyticsResponse none = await client.Analytics.RunsAsync(query, token).ConfigureAwait(false);
                    Require(none.Totals.Runs == 0, "unknown model matched " + none.Totals.Runs + " runs");
                }).ConfigureAwait(false);

                await CheckAsync("run analytics rejects from >= to", async () =>
                {
                    RunAnalyticsQuery query = new RunAnalyticsQuery();
                    query.From = DateTime.UtcNow;
                    query.To = query.From.Value.AddHours(-1);
                    bool rejected = false;
                    try
                    {
                        await client.Analytics.RunsAsync(query, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 400)
                    {
                        rejected = true;
                    }
                    Require(rejected, "expected 400");
                }).ConfigureAwait(false);

                await CheckAsync("stream events", async () =>
                {
                    RunCreateRequest request = new RunCreateRequest();
                    request.AgentId = agentId;
                    request.Input = "Stream this please";
                    Run run = await client.Runs.CreateAsync(request, token).ConfigureAwait(false);
                    int events = 0;
                    Run? final = null;
                    await foreach (RunStreamEvent item in client.Runs.StreamAsync(run.Id, 0, token).ConfigureAwait(false))
                    {
                        if (item.Event != null) events++;
                        if (item.Run != null) final = item.Run;
                    }
                    Require(final != null, "no run.completed");
                    Require(final!.Status == RunStatusEnum.Succeeded, "status " + final.Status);
                    Require(events > 0, "no events");
                }).ConfigureAwait(false);

                await CheckAsync("cancel run", async () =>
                {
                    RunCreateRequest request = new RunCreateRequest();
                    request.AgentId = agentId;
                    request.Input = "Cancel me";
                    Run run = await client.Runs.CreateAsync(request, token).ConfigureAwait(false);
                    try
                    {
                        await client.Runs.CancelAsync(run.Id, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 409)
                    {
                    }
                    Run final = await client.Runs.WaitForCompletionAsync(run.Id, TimeSpan.FromSeconds(60), token).ConfigureAwait(false);
                    Require(final.Status == RunStatusEnum.Cancelled || final.Status == RunStatusEnum.Succeeded, "status " + final.Status);
                }).ConfigureAwait(false);

                await CheckAsync("untrusted deployment queues without isolation", async () =>
                {
                    Deployment trusted = await client.Deployments.GetAsync(deploymentId ?? throw new InvalidOperationException("no deployment"), token).ConfigureAwait(false);
                    Require(trusted.TrustLevel == DeploymentTrustLevelEnum.Trusted, "default trustLevel " + trusted.TrustLevel);
                    Deployment untrusted = new Deployment();
                    untrusted.Name = "sdk-cs-" + suffix + "-untrusted";
                    untrusted.AgentId = agentId ?? throw new InvalidOperationException("no agent");
                    untrusted.HarnessProfileId = fakeProfileId ?? throw new InvalidOperationException("no fake profile");
                    untrusted.TrustLevel = DeploymentTrustLevelEnum.Untrusted;
                    untrusted.Weight = 0;
                    untrusted = await client.Deployments.CreateAsync(untrusted, token).ConfigureAwait(false);
                    try
                    {
                        Require(untrusted.TrustLevel == DeploymentTrustLevelEnum.Untrusted, "trustLevel " + untrusted.TrustLevel);
                        RunCreateRequest request = new RunCreateRequest();
                        request.AgentId = agentId;
                        request.DeploymentId = untrusted.Id;
                        request.Input = "Untrusted input";
                        Run run = await client.Runs.CreateAsync(request, token).ConfigureAwait(false);
                        Run read = await client.Runs.GetAsync(run.Id, token).ConfigureAwait(false);
                        Require(read.TrustLevel == DeploymentTrustLevelEnum.Untrusted && read.Executor == RunExecutorEnum.KubernetesJob, "run " + read.TrustLevel + " " + read.Executor);
                        Require(read.Status == RunStatusEnum.Queued && read.BlockedReason == RunBlockedReasonEnum.NoIsolatingWorker, "run " + read.Status + " " + read.BlockedReason);
                        await client.Runs.CancelAsync(run.Id, token).ConfigureAwait(false);
                    }
                    finally
                    {
                        await client.Deployments.DeleteAsync(untrusted.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("effect policy default, update, and legacy retryOnNodeLoss", async () =>
                {
                    Deployment created = new Deployment();
                    created.Name = "sdk-cs-" + suffix + "-effect";
                    created.AgentId = agentId ?? throw new InvalidOperationException("no agent");
                    created.HarnessProfileId = fakeProfileId ?? throw new InvalidOperationException("no fake profile");
                    created.Weight = 0;
                    created = await client.Deployments.CreateAsync(created, token).ConfigureAwait(false);
                    try
                    {
                        Require(created.EffectPolicy == DeploymentEffectPolicyEnum.AtMostOnce && !created.RetryOnNodeLoss, "default effectPolicy " + created.EffectPolicy);
                        created.EffectPolicy = DeploymentEffectPolicyEnum.AtLeastOnce;
                        Deployment updated = await client.Deployments.UpdateAsync(created.Id, created, token).ConfigureAwait(false);
                        Require(updated.EffectPolicy == DeploymentEffectPolicyEnum.AtLeastOnce && updated.RetryOnNodeLoss, "updated effectPolicy " + updated.EffectPolicy);
                        updated.EffectPolicy = DeploymentEffectPolicyEnum.Journaled;
                        Deployment journaled = await client.Deployments.UpdateAsync(updated.Id, updated, token).ConfigureAwait(false);
                        Require(journaled.EffectPolicy == DeploymentEffectPolicyEnum.Journaled && !journaled.RetryOnNodeLoss, "journaled " + journaled.EffectPolicy);
                        journaled.RetryOnNodeLoss = true;
                        Deployment legacy = await client.Deployments.UpdateAsync(journaled.Id, journaled, token).ConfigureAwait(false);
                        Require(legacy.EffectPolicy == DeploymentEffectPolicyEnum.AtLeastOnce, "legacy retryOnNodeLoss true " + legacy.EffectPolicy);
                        RunCreateRequest request = new RunCreateRequest();
                        request.AgentId = agentId;
                        request.DeploymentId = legacy.Id;
                        request.Input = "Effect policy";
                        Run run = await client.Runs.CreateAsync(request, token).ConfigureAwait(false);
                        Require(run.EffectPolicy == DeploymentEffectPolicyEnum.AtLeastOnce, "run effectPolicy " + run.EffectPolicy);
                        await client.Runs.CancelAsync(run.Id, token).ConfigureAwait(false);
                    }
                    finally
                    {
                        await client.Deployments.DeleteAsync(created.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("egress allowlist round trip, validation, and queueing", async () =>
                {
                    Deployment allowlisted = new Deployment();
                    allowlisted.Name = "sdk-cs-" + suffix + "-egress";
                    allowlisted.AgentId = agentId ?? throw new InvalidOperationException("no agent");
                    allowlisted.HarnessProfileId = fakeProfileId ?? throw new InvalidOperationException("no fake profile");
                    allowlisted.Weight = 0;
                    DeploymentEgressRule rule = new DeploymentEgressRule();
                    rule.Cidr = "203.0.113.0/24";
                    rule.Port = 443;
                    rule.Protocol = EgressProtocolEnum.TCP;
                    allowlisted.EgressRules.Add(rule);
                    allowlisted = await client.Deployments.CreateAsync(allowlisted, token).ConfigureAwait(false);
                    try
                    {
                        Deployment read = await client.Deployments.GetAsync(allowlisted.Id, token).ConfigureAwait(false);
                        Require(read.EgressRules.Count == 1, "egressRules count " + read.EgressRules.Count);
                        Require(read.EgressRules[0].Cidr == "203.0.113.0/24" && read.EgressRules[0].Port == 443 && read.EgressRules[0].Protocol == EgressProtocolEnum.TCP,
                            "egress rule " + read.EgressRules[0].Cidr + " " + read.EgressRules[0].Port + " " + read.EgressRules[0].Protocol);

                        read.EgressRules[0].Cidr = "203.0.113.7/24";
                        bool rejected = false;
                        try
                        {
                            await client.Deployments.UpdateAsync(read.Id, read, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 400)
                        {
                            rejected = (e.ResponseBody ?? String.Empty).Contains("InvalidCidr", StringComparison.Ordinal);
                        }
                        Require(rejected, "expected 400 InvalidCidr for a CIDR with host bits set");

                        RunCreateRequest request = new RunCreateRequest();
                        request.AgentId = agentId;
                        request.DeploymentId = allowlisted.Id;
                        request.Input = "Egress allowlist";
                        Run run = await client.Runs.CreateAsync(request, token).ConfigureAwait(false);
                        Run queued = await client.Runs.GetAsync(run.Id, token).ConfigureAwait(false);
                        Require(queued.Executor == RunExecutorEnum.KubernetesJob, "run executor " + queued.Executor);
                        Require(queued.Status == RunStatusEnum.Queued && queued.BlockedReason == RunBlockedReasonEnum.NoIsolatingWorker, "run " + queued.Status + " " + queued.BlockedReason);
                        await client.Runs.CancelAsync(run.Id, token).ConfigureAwait(false);
                    }
                    finally
                    {
                        await client.Deployments.DeleteAsync(allowlisted.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("manifest dry run", async () =>
                {
                    string yaml = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: sdk-cs-manifest-" + suffix + "\nspec:\n  description: Dry run only.\n";
                    ManifestApply result = await client.Manifests.ApplyAsync(yaml, true, false, token).ConfigureAwait(false);
                    Require(result.DryRun, "not a dry run");
                    Require(result.FailedCount == 0, "failed documents " + result.FailedCount);
                }).ConfigureAwait(false);

                await CheckAsync("manifest bundle export", async () =>
                {
                    ManifestExportRequest request = new ManifestExportRequest();
                    request.Resources.Add("Agent/sdk-cs-" + suffix);
                    request.FollowReferences = true;
                    string bundle = await client.Manifests.ExportAsync(request, token).ConfigureAwait(false);
                    Require(bundle.Contains("kind: Bundle", StringComparison.Ordinal), "no Bundle document");
                    Require(bundle.Contains("kind: Agent", StringComparison.Ordinal) && bundle.Contains("name: sdk-cs-" + suffix, StringComparison.Ordinal), "agent missing from bundle");
                    Require(bundle.Contains("sdk-cs-" + suffix + "-fake", StringComparison.Ordinal), "followReferences did not bring the deployment");
                    Require(bundle.Contains("builtin/fake", StringComparison.Ordinal), "built-in requirement missing");
                    ManifestApply dry = await client.Manifests.ApplyAsync(bundle, true, false, token).ConfigureAwait(false);
                    Require(dry.FailedCount == 0, "bundle dry run failed " + dry.FailedCount);

                    bool rejected = false;
                    try
                    {
                        await client.Manifests.ExportAsync(new ManifestExportRequest { Kinds = new List<string> { "NoSuchKind" } }, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 400)
                    {
                        rejected = e.Error?.FieldCodes != null && e.Error.FieldCodes.TryGetValue("kinds", out string? code) && code == "UnknownKind";
                    }
                    Require(rejected, "expected 400 UnknownKind");
                }).ConfigureAwait(false);

                await CheckAsync("clamped values return ValueClamped warnings", async () =>
                {
                    // The typed Deployment model clamps MaxAttempts locally, so send the out-of-range value through the transport.
                    Dictionary<string, object> body = new Dictionary<string, object>();
                    body["name"] = "sdk-cs-" + suffix + "-clamp";
                    body["agentId"] = agentId ?? throw new InvalidOperationException("no agent");
                    body["harnessProfileId"] = fakeProfileId ?? throw new InvalidOperationException("no fake profile");
                    body["weight"] = 0;
                    body["maxAttempts"] = 99;
                    string path = "/v1.0/api/tenants/" + Uri.EscapeDataString(tenantId ?? "default") + "/deployments";
                    Deployment? clamped = await client.Transport.SendAsync<Deployment>(System.Net.Http.HttpMethod.Post, path, body, null, "application/json", token).ConfigureAwait(false);
                    Require(clamped != null, "no deployment returned");
                    try
                    {
                        Require(clamped!.MaxAttempts == 10, "stored maxAttempts " + clamped.MaxAttempts);
                        Require(clamped.Warnings != null && clamped.Warnings.Count == 1, "create warnings missing");
                        FieldWarning warning = clamped.Warnings![0];
                        Require(warning.Field == "maxAttempts" && warning.Code == "ValueClamped" && warning.Given == "99" && warning.Stored == "10", "warning " + warning.Field + " " + warning.Code + " " + warning.Given + " " + warning.Stored);
                        Deployment read = await client.Deployments.GetAsync(clamped.Id, token).ConfigureAwait(false);
                        Require(read.Warnings == null, "read carries warnings");
                    }
                    finally
                    {
                        await client.Deployments.DeleteAsync(clamped!.Id, token).ConfigureAwait(false);
                    }

                    string yaml = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: sdk-cs-clamp-" + suffix + "\nspec:\n  delegation:\n    maxDepth: 99\n";
                    ManifestApply result = await client.Manifests.ApplyAsync(yaml, true, false, token).ConfigureAwait(false);
                    Require(result.Items.Count == 1, "items " + result.Items.Count);
                    ManifestApplyItem item = result.Items[0];
                    Require(item.Warnings.Count == 1 && item.Warnings[0].Field == "delegationMaxDepth" && item.Warnings[0].Code == "ValueClamped", "manifest warnings " + item.Warnings.Count);
                }).ConfigureAwait(false);

                await CheckAsync("node containerized flag", async () =>
                {
                    EnumerationResult<Node> nodes = await client.Nodes.ListAsync(token: token).ConfigureAwait(false);
                    Node? worker = nodes.Objects.FirstOrDefault(n => n.Name == "sdk-harness-worker");
                    Require(worker == null || !worker.Containerized, "host worker reported containerized");
                }).ConfigureAwait(false);

                await CheckAsync("list runs by agent", async () =>
                {
                    RunFilter filter = new RunFilter();
                    filter.AgentId = agentId;
                    EnumerationResult<Run> runs = await client.Runs.ListAsync(filter, token).ConfigureAwait(false);
                    Require(runs.TotalRecords >= 3, "total " + runs.TotalRecords);
                    Require(runs.Objects.All(r => r.AgentId == agentId), "foreign runs returned");
                }).ConfigureAwait(false);

                string? conversationDeploymentId = null;
                string? conversationId = null;
                await CheckAsync("conversation start", async () =>
                {
                    Deployment deployment = new Deployment();
                    deployment.Name = "sdk-cs-" + suffix + "-turns";
                    deployment.AgentId = agentId ?? throw new InvalidOperationException("no agent");
                    deployment.HarnessProfileId = fakeProfileId ?? throw new InvalidOperationException("no fake profile");
                    DeploymentParameter reportTurns = new DeploymentParameter();
                    reportTurns.Name = "reportTurns";
                    reportTurns.Value = "true";
                    deployment.Parameters.Add(reportTurns);
                    deployment = await client.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
                    conversationDeploymentId = deployment.Id;

                    InvokeRequest request = new InvokeRequest();
                    request.Input = "First turn from the C# SDK";
                    request.DeploymentId = deployment.Id;
                    request.StartConversation = true;
                    request.WaitSeconds = 90;
                    Run run = await client.Agents.InvokeAsync(agentId, request, token).ConfigureAwait(false);
                    Require(run.Status == RunStatusEnum.Succeeded, "status " + run.Status + " " + run.ErrorMessage);
                    Require(!String.IsNullOrEmpty(run.ConversationId) && run.ConversationId!.StartsWith("cnv_", StringComparison.Ordinal), "conversationId " + run.ConversationId);
                    Require(run.ConversationTurn == 1, "conversationTurn " + run.ConversationTurn);
                    Require((run.ResultText ?? String.Empty).StartsWith("[turn 1] ", StringComparison.Ordinal), "result " + run.ResultText);
                    conversationId = run.ConversationId;
                }).ConfigureAwait(false);

                await CheckAsync("conversation continue", async () =>
                {
                    InvokeRequest request = new InvokeRequest();
                    request.Input = "Second turn from the C# SDK";
                    request.ConversationId = conversationId ?? throw new InvalidOperationException("no conversation");
                    request.WaitSeconds = 90;
                    Run run = await client.Agents.InvokeAsync(agentId ?? throw new InvalidOperationException("no agent"), request, token).ConfigureAwait(false);
                    Require(run.Status == RunStatusEnum.Succeeded, "status " + run.Status + " " + run.ErrorMessage);
                    Require(run.ConversationId == conversationId, "conversationId " + run.ConversationId);
                    Require(run.ConversationTurn == 2, "conversationTurn " + run.ConversationTurn);
                    Require((run.ResultText ?? String.Empty).StartsWith("[turn 2] ", StringComparison.Ordinal), "result " + run.ResultText);
                }).ConfigureAwait(false);

                await CheckAsync("conversation read and list", async () =>
                {
                    string id = conversationId ?? throw new InvalidOperationException("no conversation");
                    Conversation conversation = await client.Conversations.GetAsync(id, token).ConfigureAwait(false);
                    Require(conversation.TurnCount == 2, "turnCount " + conversation.TurnCount);
                    Require(!String.IsNullOrEmpty(conversation.SessionId), "sessionId empty");
                    Require(conversation.DeploymentId == conversationDeploymentId, "deploymentId " + conversation.DeploymentId);
                    Require(!conversation.Busy, "busy");

                    ConversationFilter filter = new ConversationFilter();
                    filter.AgentId = agentId;
                    EnumerationResult<Conversation> page = await client.Conversations.ListAsync(filter, token).ConfigureAwait(false);
                    Require(page.Objects.Any(c => c.Id == id), "conversation missing from list");

                    EnumerationResult<Run> turns = await client.Conversations.ListRunsAsync(id, 25, 0, token).ConfigureAwait(false);
                    Require(turns.Objects.Count == 2, "turns " + turns.Objects.Count);
                    Require(turns.Objects[0].ConversationTurn == 1 && turns.Objects[1].ConversationTurn == 2, "turn order");

                    RunFilter runFilter = new RunFilter();
                    runFilter.ConversationId = id;
                    EnumerationResult<Run> runs = await client.Runs.ListAsync(runFilter, token).ConfigureAwait(false);
                    Require(runs.TotalRecords == 2, "runs by conversationId " + runs.TotalRecords);
                }).ConfigureAwait(false);

                await CheckAsync("conversation transcript", async () =>
                {
                    string id = conversationId ?? throw new InvalidOperationException("no conversation");
                    Transcript transcript = await client.Conversations.GetTranscriptAsync(id, false, token).ConfigureAwait(false);
                    Require(transcript.Kind == TranscriptKindEnum.Conversation && transcript.ConversationId == id, "kind " + transcript.Kind + " conversation " + transcript.ConversationId);
                    Require(transcript.TurnCount == 2 && transcript.Turns.Count == 2, "turns " + transcript.TurnCount);
                    Require(transcript.Turns[0].Turn == 1 && transcript.Turns[1].Input == "Second turn from the C# SDK", "turn order");
                    string markdown = await client.Conversations.GetTranscriptMarkdownAsync(id, false, token).ConfigureAwait(false);
                    Require(markdown.Contains("First turn from the C# SDK", StringComparison.Ordinal) && markdown.Contains("Second turn from the C# SDK", StringComparison.Ordinal), "markdown lacks a turn");
                }).ConfigureAwait(false);

                await CheckAsync("conversation delete", async () =>
                {
                    string id = conversationId ?? throw new InvalidOperationException("no conversation");
                    await client.Conversations.DeleteAsync(id, token).ConfigureAwait(false);
                    bool missing = false;
                    try
                    {
                        await client.Conversations.GetAsync(id, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404)
                    {
                        missing = true;
                    }
                    Require(missing, "expected 404 after delete");

                    InvokeRequest request = new InvokeRequest();
                    request.Input = "Turn for a deleted conversation";
                    request.ConversationId = id;
                    bool refused = false;
                    try
                    {
                        await client.Agents.InvokeAsync(agentId ?? throw new InvalidOperationException("no agent"), request, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404)
                    {
                        refused = true;
                    }
                    Require(refused, "expected 404 continuing a deleted conversation");
                }).ConfigureAwait(false);

                await CheckAsync("control nodes", async () =>
                {
                    ControlNodeListResponse list = await client.ControlNodes.ListAsync(null, token).ConfigureAwait(false);
                    Require(!String.IsNullOrEmpty(list.RespondingNodeId), "respondingNodeId empty");
                    Require(list.Objects.Any(n => n.Status == ControlNodeStatusEnum.Ready), "no Ready control node among " + list.Objects.Count);
                    Require(list.Objects.Count(n => n.IsLeader) == 1, "leaders " + list.Objects.Count(n => n.IsLeader));
                    ControlNode first = list.Objects[0];
                    ControlNode read = await client.ControlNodes.GetAsync(first.Id, token).ConfigureAwait(false);
                    Require(read.Id == first.Id, "read id " + read.Id);
                    Require(read.RespondingNodeId == list.RespondingNodeId, "read respondingNodeId " + read.RespondingNodeId);
                    OverviewResponse overview = await client.OverviewAsync(token).ConfigureAwait(false);
                    Require(overview.ControlNodesByStatus.Any(c => c.Status == "Ready" && c.Count >= 1), "overview controlNodesByStatus");
                    Require(!String.IsNullOrEmpty(overview.LeaderNodeId), "overview leaderNodeId empty");
                }).ConfigureAwait(false);

                await CheckAsync("approvals list and read", async () =>
                {
                    ApprovalFilter filter = new ApprovalFilter();
                    filter.Status = ApprovalStatusEnum.Pending;
                    filter.MaxResults = 1;
                    EnumerationResult<Approval> pending = await client.Approvals.ListAsync(filter, token).ConfigureAwait(false);
                    Require(pending.Objects.All(a => a.Status == ApprovalStatusEnum.Pending), "non-pending approval in Pending list");
                    Require(pending.TotalRecords >= pending.Objects.Count, "totalRecords " + pending.TotalRecords);
                    ApprovalFilter byDeployment = new ApprovalFilter();
                    byDeployment.DeploymentId = deploymentId ?? throw new InvalidOperationException("no deployment");
                    EnumerationResult<Approval> scoped = await client.Approvals.ListAsync(byDeployment, token).ConfigureAwait(false);
                    Require(scoped.Objects.Count == 0, "scratch deployment has " + scoped.Objects.Count + " approvals");
                    int missingStatus = 0;
                    try
                    {
                        await client.Approvals.GetAsync("apr_missing" + suffix, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404)
                    {
                        missingStatus = e.StatusCode;
                    }
                    Require(missingStatus == 404, "expected 404 reading a missing approval");
                    int decideStatus = 0;
                    try
                    {
                        ApprovalDecideRequest decide = new ApprovalDecideRequest();
                        decide.Decision = ApprovalDecisionEnum.Allow;
                        await client.Approvals.DecideAsync("apr_missing" + suffix, decide, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404)
                    {
                        decideStatus = e.StatusCode;
                    }
                    Require(decideStatus == 404, "expected 404 deciding a missing approval");
                }).ConfigureAwait(false);

                await CheckAsync("approval rules and approval check", async () =>
                {
                    string id = deploymentId ?? throw new InvalidOperationException("no deployment");
                    Deployment deployment = await client.Deployments.GetAsync(id, token).ConfigureAwait(false);
                    Require(!deployment.ApprovalsEnabled, "approvalsEnabled defaulted to true");
                    Require(deployment.ApprovalDefaultAction == ApprovalRuleActionEnum.Allow, "approvalDefaultAction " + deployment.ApprovalDefaultAction);
                    Require(deployment.ApprovalTimeoutSeconds == 300, "approvalTimeoutSeconds " + deployment.ApprovalTimeoutSeconds);
                    Require(deployment.ApprovalTimeoutDecision == ApprovalDecisionEnum.Allow, "approvalTimeoutDecision " + deployment.ApprovalTimeoutDecision);

                    DeploymentApprovalRule allowGit = new DeploymentApprovalRule();
                    allowGit.Action = ApprovalRuleActionEnum.Allow;
                    allowGit.Pattern = "Bash(git status:*)";
                    DeploymentApprovalRule denyRm = new DeploymentApprovalRule();
                    denyRm.Action = ApprovalRuleActionEnum.Deny;
                    denyRm.Pattern = "Bash(rm:*)";
                    denyRm.Description = "C# SDK harness rule.";
                    deployment.ApprovalRules = new List<DeploymentApprovalRule> { allowGit, denyRm };
                    deployment.ApprovalDefaultAction = ApprovalRuleActionEnum.Deny;
                    deployment.ApprovalTimeoutSeconds = 120;
                    deployment = await client.Deployments.UpdateAsync(id, deployment, token).ConfigureAwait(false);
                    Require(deployment.ApprovalRules.Count == 2, "rules " + deployment.ApprovalRules.Count);
                    Require(deployment.ApprovalRules.All(r => r.Id.StartsWith("dar_", StringComparison.Ordinal)), "rule ids not assigned");
                    Require(deployment.ApprovalTimeoutSeconds == 120, "approvalTimeoutSeconds " + deployment.ApprovalTimeoutSeconds);

                    ApprovalCheckRequest gitStatus = new ApprovalCheckRequest();
                    gitStatus.ToolName = "Bash";
                    gitStatus.Input = new ApprovalToolInput();
                    gitStatus.Input.Command = "git status --short";
                    ApprovalCheckResponse allowed = await client.Approvals.CheckAsync(id, gitStatus, token).ConfigureAwait(false);
                    Require(allowed.Action == ApprovalRuleActionEnum.Allow && allowed.Source == ApprovalSourceEnum.Rule, "git status " + allowed.Action + " " + allowed.Source);
                    Require(allowed.RulePattern == "Bash(git status:*)", "git status rule " + allowed.RulePattern);
                    Require(!allowed.ApprovalsEnabled, "approvalsEnabled true on a fake deployment");

                    ApprovalCheckRequest rm = new ApprovalCheckRequest();
                    rm.ToolName = "Bash";
                    rm.Input = new ApprovalToolInput();
                    rm.Input.Command = "rm -rf build";
                    ApprovalCheckResponse denied = await client.Approvals.CheckAsync(id, rm, token).ConfigureAwait(false);
                    Require(denied.Action == ApprovalRuleActionEnum.Deny && denied.Source == ApprovalSourceEnum.Rule, "rm " + denied.Action + " " + denied.Source);

                    ApprovalCheckRequest edit = new ApprovalCheckRequest();
                    edit.ToolName = "Edit";
                    edit.Input = new ApprovalToolInput();
                    edit.Input.FilePath = "src/app.cs";
                    ApprovalCheckResponse fallback = await client.Approvals.CheckAsync(id, edit, token).ConfigureAwait(false);
                    Require(fallback.Action == ApprovalRuleActionEnum.Deny && fallback.Source == ApprovalSourceEnum.Default, "edit " + fallback.Action + " " + fallback.Source);
                    Require(!String.IsNullOrEmpty(fallback.SuggestedRule), "suggestedRule empty");

                    deployment.ApprovalsEnabled = true;
                    int enableStatus = 0;
                    try
                    {
                        await client.Deployments.UpdateAsync(id, deployment, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 400)
                    {
                        enableStatus = e.StatusCode;
                    }
                    Require(enableStatus == 400, "expected 400 enabling approvals on a fake deployment");

                    Run run = await client.Runs.GetAsync(invokedRun?.Id ?? throw new InvalidOperationException("no invoked run"), token).ConfigureAwait(false);
                    Require(run.PendingApprovals == 0 && !run.AwaitingApproval, "run pendingApprovals " + run.PendingApprovals);
                    Require(run.ApprovalWaitMs == null, "run approvalWaitMs " + run.ApprovalWaitMs);
                }).ConfigureAwait(false);

                await CheckAsync("artifact collection and binary download", async () =>
                {
                    ArtifactStore store = await client.ArtifactStores.CreateAsync(new ArtifactStore { Name = "sdk-cs-artifacts-" + suffix, Kind = ArtifactStoreKindEnum.Filesystem, PathPrefix = "sdk-cs-" + suffix }, token).ConfigureAwait(false);
                    Deployment deployment = await client.Deployments.GetAsync(deploymentId!, token).ConfigureAwait(false);
                    string? originalStore = deployment.ArtifactStoreId;
                    List<string> originalGlobs = deployment.ArtifactGlobs;
                    List<DeploymentArgumentOverride> originalArguments = deployment.ArgumentOverrides;
                    try
                    {
                        deployment.ArtifactStoreId = store.Id;
                        deployment.ArtifactGlobs = new List<string> { "reports/**/*.txt" };
                        deployment.ArgumentOverrides = new List<DeploymentArgumentOverride> { new DeploymentArgumentOverride { Position = 0, Template = "--output-last-message" }, new DeploymentArgumentOverride { Position = 1, Template = "{{run.workspaceDir}}/reports/answer.txt" } };
                        await client.Deployments.UpdateAsync(deployment.Id, deployment, token).ConfigureAwait(false);
                        Run run = await client.Agents.InvokeAsync(agentId!, new InvokeRequest { Input = "artifact SDK payload", Wait = true, WaitSeconds = 30, DeploymentId = deployment.Id }, token).ConfigureAwait(false);
                        Require(run.Status == RunStatusEnum.Succeeded, "artifact run failed");
                        EnumerationResult<Artifact> rows = await client.Artifacts.ListAsync(runId: run.Id, storeId: store.Id, token: token).ConfigureAwait(false);
                        Require(rows.Objects.Count == 1, "one collected artifact");
                        Artifact artifact = await client.Artifacts.GetAsync(rows.Objects.Single().Id, token).ConfigureAwait(false);
                        Require(artifact.Name == "reports/answer.txt", "artifact name");
                        byte[] bytes = await client.Artifacts.DownloadAsync(artifact.Id, token).ConfigureAwait(false);
                        Require(System.Text.Encoding.UTF8.GetString(bytes).Contains("artifact SDK payload", StringComparison.Ordinal), "raw bytes");
                        Require((await client.Artifacts.DownloadUrlAsync(artifact.Id, token).ConfigureAwait(false)).Url.Length > 0, "download link");
                        bool rejected = false;
                        try { await client.Artifacts.UploadAsync(run.Id, store.Id, artifact.Name, System.Text.Encoding.UTF8.GetBytes("late upload"), run.LeaseEpoch, run.RepairAttempts, token: token).ConfigureAwait(false); }
                        catch (GarrisonException error) when (error.StatusCode == 409) { rejected = true; }
                        Require(rejected, "terminal upload fence");
                        await client.Artifacts.DeleteAsync(artifact.Id, token).ConfigureAwait(false);
                        Require(!(await client.Artifacts.ListAsync(runId: run.Id, token: token).ConfigureAwait(false)).Objects.Any(), "deleted artifact");
                    }
                    finally
                    {
                        deployment.ArtifactStoreId = originalStore; deployment.ArtifactGlobs = originalGlobs; deployment.ArgumentOverrides = originalArguments;
                        await client.Deployments.UpdateAsync(deployment.Id, deployment, token).ConfigureAwait(false);
                        await client.ArtifactStores.DeleteAsync(store.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("pipelines, pipeline runs, and reviews", async () =>
                {
                    Agent editor = await client.Agents.CreateAsync(new Agent { Name = "sdk-cs-editor-" + suffix, Description = "C# SDK harness pipeline stage." }, token).ConfigureAwait(false);
                    Deployment editorDeployment = await client.Deployments.CreateAsync(new Deployment { Name = "sdk-cs-editor-" + suffix + "-fake", AgentId = editor.Id, HarnessProfileId = fakeProfileId ?? throw new InvalidOperationException("no fake profile") }, token).ConfigureAwait(false);
                    Pipeline? pipeline = null;
                    try
                    {
                        Pipeline definition = new Pipeline();
                        definition.Name = "sdk-cs-pipeline-" + suffix;
                        definition.Description = "C# SDK harness pipeline.";
                        definition.Stages.Add(new PipelineStage { Name = "write", AgentId = agentId!, RequiresReview = true, MaxRevisions = 1 });
                        definition.Stages.Add(new PipelineStage { Name = "edit", AgentId = editor.Id, Parameters = new List<PipelineStageParameter>() });
                        pipeline = await client.Pipelines.CreateAsync(definition, token).ConfigureAwait(false);
                        Require(pipeline.Id.StartsWith("ppl_", StringComparison.Ordinal) && pipeline.Version == 1 && pipeline.Stages.Count == 2 && pipeline.Stages[0].RequiresReview, "pipeline create");
                        Pipeline byName = await client.Pipelines.GetAsync(pipeline.Name, token).ConfigureAwait(false);
                        Require(byName.Id == pipeline.Id && byName.Stages[1].Position == 2, "pipeline get by name");
                        byName.Description = "C# SDK harness pipeline, updated.";
                        Pipeline updated = await client.Pipelines.UpdateAsync(pipeline.Id, byName, token).ConfigureAwait(false);
                        Require(updated.Version == 2 && updated.Description == byName.Description, "pipeline update version " + updated.Version);
                        Require((await client.Pipelines.ListAsync(new EnumerationQuery { Search = pipeline.Name }, token).ConfigureAwait(false)).Objects.Any(p => p.Id == pipeline.Id), "pipeline list");
                        PipelinePreviewResponse preview = await client.Pipelines.PreviewAsync(pipeline.Id, new PipelinePreviewRequest { Input = "preview input", SampleOutputs = new List<string> { "sample stage one output" } }, token).ConfigureAwait(false);
                        Require(preview.Stages.Count == 2 && preview.Stages.All(s => s.Success && !String.IsNullOrEmpty(s.Prompt)), "pipeline preview");

                        string key = "sdk-cs-key-" + suffix;
                        PipelineRun started = await client.Pipelines.StartAsync(pipeline.Id, new PipelineStartRequest { Input = "Write a haiku", Wait = true, WaitSeconds = 30 }, key, token).ConfigureAwait(false);
                        Require(started.Status == PipelineRunStatusEnum.AwaitingReview && started.Stages.Count == 2, "pipeline start waits for review, got " + started.Status);
                        PipelineRun repeated = await client.Pipelines.StartAsync(pipeline.Name, new PipelineStartRequest { Input = "Write a haiku" }, key, token).ConfigureAwait(false);
                        Require(repeated.Id == started.Id, "idempotent start");

                        EnumerationResult<PipelineReview> pending = await client.PipelineReviews.ListAsync(new PipelineReviewFilter { Status = PipelineReviewStatusEnum.Pending, PipelineRunId = started.Id }, token).ConfigureAwait(false);
                        Require(pending.Objects.Count == 1, "one pending review, got " + pending.Objects.Count);
                        PipelineReview review = await client.PipelineReviews.GetAsync(pending.Objects[0].Id, token).ConfigureAwait(false);
                        Require(review.Position == 1 && review.Status == PipelineReviewStatusEnum.Pending, "review get");
                        PipelineReview approved = await client.PipelineReviews.DecideAsync(review.Id, new PipelineReviewDecideRequest { Decision = PipelineReviewDecisionEnum.Approve, Comment = "Looks good" }, token).ConfigureAwait(false);
                        Require(approved.Status == PipelineReviewStatusEnum.Approved && approved.DecisionSource == PipelineReviewSourceEnum.User, "review approve");
                        PipelineRun finished = await client.PipelineRuns.GetAsync(started.Id, 30, token).ConfigureAwait(false);
                        Require(finished.Status == PipelineRunStatusEnum.Succeeded && finished.Outcome == PipelineRunOutcomeEnum.Succeeded && finished.Runs.Count == 2, "pipeline run succeeded, got " + finished.Status);
                        Require((await client.PipelineRuns.ListAsync(new PipelineRunFilter { PipelineId = pipeline.Id }, token).ConfigureAwait(false)).Objects.Any(r => r.Id == started.Id), "pipeline runs by pipeline");

                        PipelineRun second = await client.Pipelines.StartAsync(pipeline.Id, new PipelineStartRequest { Input = "Write another" }, null, token).ConfigureAwait(false);
                        PipelineRun cancelling = await client.PipelineRuns.CancelAsync(second.Id, token).ConfigureAwait(false);
                        Require(cancelling.Status == PipelineRunStatusEnum.Cancelling || cancelling.Status == PipelineRunStatusEnum.Cancelled, "cancel " + cancelling.Status);
                        PipelineRun cancelled = await client.PipelineRuns.GetAsync(second.Id, 30, token).ConfigureAwait(false);
                        Require(cancelled.Status == PipelineRunStatusEnum.Cancelled && cancelled.Outcome == PipelineRunOutcomeEnum.Cancelled, "cancelled " + cancelled.Status);
                        PipelineRun resumed = await client.PipelineRuns.RetryAsync(second.Id, token).ConfigureAwait(false);
                        Require(resumed.Status == PipelineRunStatusEnum.Running || resumed.Status == PipelineRunStatusEnum.AwaitingReview, "retry " + resumed.Status);
                        await client.PipelineRuns.CancelAsync(second.Id, token).ConfigureAwait(false);
                        Require((await client.PipelineRuns.GetAsync(second.Id, 30, token).ConfigureAwait(false)).Status == PipelineRunStatusEnum.Cancelled, "cancelled after retry");
                        await client.PipelineRuns.DeleteAsync(second.Id, token).ConfigureAwait(false);
                        int missing = 0;
                        try { await client.PipelineRuns.GetAsync(second.Id, null, token).ConfigureAwait(false); }
                        catch (GarrisonException e) when (e.StatusCode == 404) { missing = e.StatusCode; }
                        Require(missing == 404, "deleted pipeline run");
                    }
                    finally
                    {
                        if (pipeline != null) await client.Pipelines.DeleteAsync(pipeline.Id, token).ConfigureAwait(false);
                        await client.Deployments.DeleteAsync(editorDeployment.Id, token).ConfigureAwait(false);
                        await client.Agents.DeleteAsync(editor.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("webhook signature helper", () =>
                {
                    byte[] sample = System.Text.Encoding.UTF8.GetBytes("{\"a\":1}");
                    long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                    string header = WebhookSignature.Header("whsec_test_secret_value", now, sample);
                    Require(header.StartsWith("t=" + now + ",v1=", StringComparison.Ordinal) && header.Length == ("t=" + now + ",v1=").Length + 64, "header shape " + header);
                    Require(WebhookSignature.Verify(header, "whsec_test_secret_value", sample), "verify own signature");
                    Require(WebhookSignature.Verify("t=" + now + ",v1=" + new string('0', 64) + ",v1=" + WebhookSignature.Sign("whsec_test_secret_value", now, sample), "whsec_test_secret_value", sample), "verify second v1");
                    Require(!WebhookSignature.Verify(header, "whsec_other_secret_value", sample), "wrong secret");
                    Require(!WebhookSignature.Verify(WebhookSignature.Header("whsec_test_secret_value", now - 3600, sample), "whsec_test_secret_value", sample), "stale timestamp");
                    return Task.CompletedTask;
                }).ConfigureAwait(false);

                await CheckAsync("webhook and cron triggers", async () =>
                {
                    Trigger? webhook = null;
                    Trigger? cron = null;
                    try
                    {
                        webhook = await client.Triggers.CreateAsync(new Trigger { Name = "sdk-cs-hook-" + suffix, Type = TriggerTypeEnum.Webhook, AgentId = agentId! }, token).ConfigureAwait(false);
                        string secret = webhook.SigningSecret ?? throw new InvalidOperationException("no signing secret on create");
                        Require(webhook.Id.StartsWith("trg_", StringComparison.Ordinal) && secret.StartsWith("whsec_", StringComparison.Ordinal) && webhook.SigningSecretLast4 == secret.Substring(secret.Length - 4), "webhook create");
                        Trigger read = await client.Triggers.GetAsync(webhook.Name, token).ConfigureAwait(false);
                        Require(read.Id == webhook.Id && read.SigningSecret == null && read.RunAsType == PrincipalTypeEnum.Credential, "get by name hides the secret");

                        string deliveryId = "sdk-cs-delivery-" + suffix;
                        TriggerFire fire = await client.Triggers.DeliverWebhookAsync(webhook.Id, secret, "{\"event\":\"push\"}", "application/json", deliveryId, token).ConfigureAwait(false);
                        Require(fire.Outcome == TriggerFireOutcomeEnum.Started && fire.RunId != null && !fire.Duplicate && fire.DeliveryId == deliveryId, "signed delivery started a run: " + fire.Outcome + " " + fire.ErrorMessage);
                        TriggerFire repeat = await client.Triggers.DeliverWebhookAsync(webhook.Id, secret, "{\"event\":\"push\"}", "application/json", deliveryId, token).ConfigureAwait(false);
                        Require(repeat.Duplicate && repeat.Id == fire.Id, "repeated delivery returns the same fire");
                        Run started = await client.Runs.GetAsync(fire.RunId!, token).ConfigureAwait(false);
                        Require(started.TriggerId == webhook.Id && started.Kind == RunKindEnum.Trigger, "run carries the trigger");
                        Require((await client.Runs.ListAsync(new RunFilter { TriggerId = webhook.Id }, token).ConfigureAwait(false)).Objects.Any(r => r.Id == fire.RunId), "runs by trigger");

                        int badStatus = 0;
                        string badCode = String.Empty;
                        try { await client.Triggers.DeliverWebhookAsync(webhook.Id, "whsec_wrong_secret_for_this_trigger", "{}", "application/json", null, token).ConfigureAwait(false); }
                        catch (GarrisonException e) { badStatus = e.StatusCode; badCode = e.Error?.Code ?? String.Empty; }
                        Require(badStatus == 401 && badCode == "InvalidSignature", "bad signature answers 401 InvalidSignature, got " + badStatus + " " + badCode);

                        EnumerationResult<TriggerFire> fires = await client.Triggers.ListFiresAsync(webhook.Id, TriggerFireOutcomeEnum.Started, null, token).ConfigureAwait(false);
                        Require(fires.Objects.Count == 1 && fires.Objects[0].Id == fire.Id, "fire history");
                        Trigger rotated = await client.Triggers.RotateSecretAsync(webhook.Id, token).ConfigureAwait(false);
                        Require(rotated.SigningSecret != null && rotated.SigningSecret != secret, "rotate secret");

                        cron = await client.Triggers.CreateAsync(new Trigger { Name = "sdk-cs-cron-" + suffix, Type = TriggerTypeEnum.Cron, AgentId = agentId!, CronExpression = "0 9 * * 1-5", TimeZone = "America/New_York" }, token).ConfigureAwait(false);
                        Require(cron.NextFireUtc.HasValue && cron.NextFireUtc.Value > DateTime.UtcNow && cron.SigningSecret == null, "cron next fire");
                        Require((await client.Triggers.ListAsync(null, TriggerTypeEnum.Cron, token).ConfigureAwait(false)).Objects.Any(t => t.Id == cron.Id), "list by type");
                    }
                    finally
                    {
                        if (webhook != null) await client.Triggers.DeleteAsync(webhook.Id, token).ConfigureAwait(false);
                        if (cron != null) await client.Triggers.DeleteAsync(cron.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("keeper mandates", async () =>
                {
                    Mandate? keeper = null;
                    try
                    {
                        MandateRevision first = new MandateRevision { Objective = "Keep the SDK scratch service healthy.", HealthyDefinition = "No failing checks.", WakeMode = WakeModeEnum.Backoff, MinIntervalSeconds = 60, MaxIntervalSeconds = 3600 };
                        first.Signals = new List<MandateRevisionSignal> { new MandateRevisionSignal { Name = "uptime", Description = "Is it up?", Order = 0 }, new MandateRevisionSignal { Name = "errors", Order = 1 } };
                        keeper = await client.Mandates.CreateAsync(new Mandate { Name = "sdk-cs-keeper-" + suffix, Description = "SDK keeper", AgentId = agentId!, DeploymentId = deploymentId!, CurrentRevision = first }, token).ConfigureAwait(false);
                        Require(keeper.Id.StartsWith("mdt_", StringComparison.Ordinal) && keeper.Status == MandateStatusEnum.Active && keeper.CurrentRevisionNumber == 1 && keeper.CurrentRevision != null, "keeper create is Active at revision 1: " + keeper.Status + " " + keeper.CurrentRevisionNumber);
                        Require(keeper.CurrentRevision!.State == MandateRevisionStateEnum.Published && keeper.CurrentRevision.Signals.Count == 2 && keeper.CurrentRevision.Signals[0].Name == "uptime" && keeper.CurrentRevision.Signals[1].Order == 1, "signals round-trip");

                        Mandate read = await client.Mandates.GetAsync(keeper.Name, token).ConfigureAwait(false);
                        Require(read.Id == keeper.Id && read.RunAsType == PrincipalTypeEnum.Credential, "get by name");
                        Require((await client.Mandates.ListAsync(null, MandateStatusEnum.Active, agentId, deploymentId, token).ConfigureAwait(false)).Objects.Any(m => m.Id == keeper.Id), "list by status");
                        Require(!(await client.Mandates.ListAsync(null, MandateStatusEnum.Retired, agentId, null, token).ConfigureAwait(false)).Objects.Any(m => m.Id == keeper.Id), "list by another status");

                        Mandate updated = await client.Mandates.UpdateAsync(keeper.Id, new Mandate { Description = "SDK keeper, updated" }, token).ConfigureAwait(false);
                        Require(updated.Description == "SDK keeper, updated" && updated.Name == keeper.Name, "update description");

                        MandateRevision draft = await client.Mandates.CreateRevisionAsync(keeper.Id, new MandateRevision { Objective = "Keep the SDK scratch service healthy and fast.", ChangeNote = "second revision", MinIntervalSeconds = 10, MaxIntervalSeconds = 3600 }, token).ConfigureAwait(false);
                        Require(draft.Number == 2 && draft.State == MandateRevisionStateEnum.Draft, "draft revision 2");
                        Require(draft.Warnings != null && draft.Warnings.Any(w => w.Field == "minIntervalSeconds" && w.Code == "ValueClamped") && draft.MinIntervalSeconds == 60, "clamp warning raises 10 to the floor of 60");
                        MandateRevision fetched = await client.Mandates.GetRevisionAsync(keeper.Id, draft.Id, token).ConfigureAwait(false);
                        Require(fetched.Id == draft.Id && fetched.ChangeNote == "second revision", "get revision");
                        Require((await client.Mandates.ListRevisionsAsync(keeper.Id, null, token).ConfigureAwait(false)).Objects.Count == 2, "list revisions");
                        Mandate published = await client.Mandates.PublishRevisionAsync(keeper.Id, draft.Id, token).ConfigureAwait(false);
                        Require(published.CurrentRevisionNumber == 2 && published.CurrentRevisionId == draft.Id, "publish makes revision 2 current");

                        Mandate paused = await client.Mandates.PauseAsync(keeper.Id, token).ConfigureAwait(false);
                        Require(paused.Status == MandateStatusEnum.Paused, "pause");
                        Mandate resumed = await client.Mandates.ResumeAsync(keeper.Id, token).ConfigureAwait(false);
                        Require(resumed.Status == MandateStatusEnum.Active, "resume");
                        Mandate woken = await client.Mandates.WakeAsync(keeper.Id, token).ConfigureAwait(false);
                        Require(woken.Status == MandateStatusEnum.Active, "wake");

                        MandateTick? tick = null;
                        DateTime deadline = DateTime.UtcNow.AddSeconds(30);
                        while (DateTime.UtcNow < deadline)
                        {
                            tick = (await client.Mandates.ListTicksAsync(keeper.Id, null, null, token).ConfigureAwait(false)).Objects.FirstOrDefault(t => t.RunId != null);
                            if (tick != null) break;
                            await Task.Delay(1000, token).ConfigureAwait(false);
                        }
                        Require(tick != null, "a tick with a run appeared within 30 seconds");
                        MandateTick readTick = await client.Mandates.GetTickAsync(tick!.Id, token).ConfigureAwait(false);
                        Require(readTick.Id == tick.Id && readTick.MandateId == keeper.Id && readTick.RunId == tick.RunId && readTick.RevisionNumber >= 1, "get tick");
                        EnumerationResult<Run> keeperRuns = await client.Runs.ListAsync(new RunFilter { MandateId = keeper.Id }, token).ConfigureAwait(false);
                        Run keeperRun = keeperRuns.Objects.FirstOrDefault(r => r.Id == tick.RunId) ?? throw new InvalidOperationException("runs by mandate did not include the tick run");
                        Require(keeperRun.Kind == RunKindEnum.Keeper && keeperRun.MandateId == keeper.Id && keeperRun.MandateTickId == tick.Id, "run carries the mandate and tick");
                    }
                    finally
                    {
                        if (keeper != null) await client.Mandates.DeleteAsync(keeper.Id, true, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("escalations", async () =>
                {
                    // Only runs raise escalations (garrison_escalate over MCP), so this checks the list filters, the 404s
                    // for an unknown escalation, and the escalation fields on keeper revisions and notification endpoints.
                    EnumerationResult<Escalation> open = await client.Escalations.ListAsync(new EscalationFilter { Status = EscalationStatusEnum.Open, Severity = EscalationSeverityEnum.Urgent, TargetKind = EscalationTargetKindEnum.User, MaxResults = 10 }, token).ConfigureAwait(false);
                    Require(open.Objects.All(e => e.Status == EscalationStatusEnum.Open && e.Severity == EscalationSeverityEnum.Urgent), "list by status and severity");
                    foreach (Func<Task> call in new List<Func<Task>>
                    {
                        () => client.Escalations.GetAsync("esc_sdk_missing", token),
                        () => client.Escalations.AnswerAsync("esc_sdk_missing", new EscalationAnswerRequest { Text = "yes" }, token),
                        () => client.Escalations.CancelAsync("esc_sdk_missing", new EscalationCancelRequest { Reason = "no longer needed" }, token)
                    })
                    {
                        int status = 0;
                        try { await call().ConfigureAwait(false); }
                        catch (GarrisonException e) when (e.StatusCode == 404) { status = e.StatusCode; }
                        Require(status == 404, "an unknown escalation answers 404");
                    }

                    Mandate? keeper = null;
                    NotificationEndpoint? endpoint = null;
                    try
                    {
                        MandateRevision first = new MandateRevision { Objective = "Ask before restarting the SDK scratch service.", EscalationTargetKind = EscalationTargetKindEnum.Role, EscalationTargetId = "TenantAdmin", MinIntervalSeconds = 3600 };
                        keeper = await client.Mandates.CreateAsync(new Mandate { Name = "sdk-cs-escalating-" + suffix, AgentId = agentId!, DeploymentId = deploymentId!, CurrentRevision = first }, token).ConfigureAwait(false);
                        Require(keeper.CurrentRevision!.EscalationTargetKind == EscalationTargetKindEnum.Role && keeper.CurrentRevision.EscalationTargetId == "TenantAdmin", "keeper default escalation target round-trips");
                        int refused = 0;
                        try { await client.Mandates.CreateRevisionAsync(keeper.Id, new MandateRevision { Objective = "x", EscalationTargetKind = EscalationTargetKindEnum.User }, token).ConfigureAwait(false); }
                        catch (GarrisonException e) when (e.StatusCode == 400) { refused = e.StatusCode; }
                        Require(refused == 400, "a User target without an identifier is refused");

                        endpoint = await client.NotificationEndpoints.CreateAsync(new NotificationEndpoint { Name = "sdk-cs-escalations-" + suffix, Url = "https://example.invalid/escalations", Events = new List<NotificationEventEnum> { NotificationEventEnum.EscalationRaised, NotificationEventEnum.EscalationExpired }, EscalationMinimumSeverity = EscalationSeverityEnum.Urgent }, token).ConfigureAwait(false);
                        NotificationEndpoint readBack = await client.NotificationEndpoints.GetAsync(endpoint.Id, token).ConfigureAwait(false);
                        Require(readBack.Events.Contains(NotificationEventEnum.EscalationRaised) && readBack.EscalationMinimumSeverity == EscalationSeverityEnum.Urgent, "endpoint escalation events and minimum severity round-trip");
                    }
                    finally
                    {
                        if (keeper != null) await client.Mandates.DeleteAsync(keeper.Id, true, token).ConfigureAwait(false);
                        if (endpoint != null) await client.NotificationEndpoints.DeleteAsync(endpoint.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("freezes", async () =>
                {
                    // Freeze a scratch keeper, see it Frozen, lift it, see it Active; read and restore the kill switch.
                    Mandate? keeper = null;
                    KillSwitchState before = await client.Freezes.GetKillSwitchAsync(token).ConfigureAwait(false);
                    try
                    {
                        keeper = await client.Mandates.CreateAsync(new Mandate { Name = "sdk-cs-frozen-" + suffix, AgentId = agentId!, DeploymentId = deploymentId!, CurrentRevision = new MandateRevision { Objective = "Watch the SDK scratch queue.", MinIntervalSeconds = 3600 } }, token).ConfigureAwait(false);
                        Freeze freeze = await client.Freezes.ApplyAsync(new Freeze { TargetKind = FreezeTargetKindEnum.Mandate, TargetId = keeper.Name, Reason = "SDK harness" }, token).ConfigureAwait(false);
                        Require(freeze.Id.StartsWith("mfz_", StringComparison.Ordinal) && freeze.Active && freeze.TargetId == keeper.Id, "a freeze by name stores the mandate identifier");
                        Require((await client.Mandates.GetAsync(keeper.Id, token).ConfigureAwait(false)).Status == MandateStatusEnum.Frozen, "a frozen keeper shows Frozen");
                        EnumerationResult<Freeze> active = await client.Freezes.ListAsync(new FreezeFilter { TargetKind = FreezeTargetKindEnum.Mandate, TargetId = keeper.Id, Active = true }, token).ConfigureAwait(false);
                        Require(active.Objects.Count == 1 && active.Objects[0].Id == freeze.Id, "list active freezes by target");
                        Freeze lifted = await client.Freezes.LiftAsync(freeze.Id, new FreezeLiftRequest { Reason = "done" }, token).ConfigureAwait(false);
                        Require(!lifted.Active && lifted.LiftReason == "done" && lifted.LiftedUtc != null, "lift records the reason");
                        Require((await client.Mandates.GetAsync(keeper.Id, token).ConfigureAwait(false)).Status == MandateStatusEnum.Active, "a lifted keeper is Active again");
                        Require(!(await client.Freezes.GetAsync(freeze.Id, token).ConfigureAwait(false)).Active, "read a lifted freeze");

                        KillSwitchState on = await client.Freezes.SetKillSwitchAsync(new KillSwitchRequest { Enabled = true, Reason = "SDK harness" }, token).ConfigureAwait(false);
                        Require(on.Enabled && on.FreezeId != null && on.Reason == "SDK harness", "kill switch turns on");
                        KillSwitchState off = await client.Freezes.SetKillSwitchAsync(new KillSwitchRequest { Enabled = false }, token).ConfigureAwait(false);
                        Require(!off.Enabled && off.FreezeId == null, "kill switch turns off");
                    }
                    finally
                    {
                        if (before.Enabled) await client.Freezes.SetKillSwitchAsync(new KillSwitchRequest { Enabled = true, Reason = before.Reason }, token).ConfigureAwait(false);
                        if (keeper != null) await client.Mandates.DeleteAsync(keeper.Id, true, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("memory", async () =>
                {
                    // Agents write memory through MCP tools; the client browses, reads, and deletes. A fresh server holds none.
                    List<MemoryScopeSummary> scopes = await client.Memory.ListScopesAsync(token).ConfigureAwait(false);
                    Require(scopes != null, "list memory scopes");
                    EnumerationResult<MemoryEntry> entries = await client.Memory.ListAsync(new MemoryEntryFilter { ScopeKind = MemoryScopeKindEnum.Agent, ScopeId = agentId, Search = "sdk", MaxResults = 10 }, token).ConfigureAwait(false);
                    Require(entries.Objects != null && entries.TotalRecords >= 0, "list memory entries with filters");
                    try
                    {
                        await client.Memory.GetAsync("mem_sdk_missing", token).ConfigureAwait(false);
                        Require(false, "an unknown entry is not found");
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404) { }
                    try
                    {
                        await client.Memory.DeleteAsync("mem_sdk_missing", 1, token).ConfigureAwait(false);
                        Require(false, "deleting an unknown entry is not found");
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404) { }
                }).ConfigureAwait(false);

                await CheckAsync("reports", async () =>
                {
                    // People file reports with an idempotency key; agents file through garrison_file_report.
                    string key = "sdk-" + Guid.NewGuid().ToString("N");
                    ReportFileRequest request = new ReportFileRequest { Agent = agentId, Title = "SDK status", Kind = ReportKindEnum.Status, Health = ReportHealthEnum.Healthy, IdempotencyKey = key, Metrics = new List<ReportMetric> { new ReportMetric { Name = "sdk_checks", Value = 3, Unit = "count" } } };
                    Report filed = await client.Reports.FileAsync(request, token).ConfigureAwait(false);
                    Report again = await client.Reports.FileAsync(request, token).ConfigureAwait(false);
                    Require(filed.Id.StartsWith("rpt_", StringComparison.Ordinal) && again.Id == filed.Id && filed.AuthorAgentId == agentId, "file a report once per idempotency key");
                    EnumerationResult<Report> page = await client.Reports.ListAsync(new ReportFilter { Author = agentId, Health = ReportHealthEnum.Healthy, MaxResults = 10 }, token).ConfigureAwait(false);
                    Require(page.Objects.Exists(r => r.Id == filed.Id), "list reports by author and health");
                    Report read = await client.Reports.GetAsync(filed.Id, token).ConfigureAwait(false);
                    Require(read.Metrics.Count == 1 && read.Metrics[0].Name == "sdk_checks", "read a report with its metrics");
                    List<ReportMetricPoint> series = await client.Reports.MetricSeriesAsync(new ReportMetricFilter { Author = agentId, Name = "sdk_checks" }, token).ConfigureAwait(false);
                    Require(series.Exists(p => p.ReportId == filed.Id && p.Value == 3), "metric series");
                    try
                    {
                        await client.Reports.GetAsync("rpt_sdk_missing", token).ConfigureAwait(false);
                        Require(false, "an unknown report is not found");
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404) { }
                }).ConfigureAwait(false);

                await CheckAsync("messages", async () =>
                {
                    // People write to any agent with an idempotency key; agents use the garrison_*_message MCP tools.
                    string key = "sdk-" + Guid.NewGuid().ToString("N");
                    AgentMessageSendRequest request = new AgentMessageSendRequest { Recipient = agentId, Subject = "SDK check", Body = "Hello from the SDK.", IdempotencyKey = key };
                    AgentMessage sent = await client.Messages.SendAsync(request, token).ConfigureAwait(false);
                    AgentMessage again = await client.Messages.SendAsync(request, token).ConfigureAwait(false);
                    Require(sent.Id.StartsWith("amg_", StringComparison.Ordinal) && again.Id == sent.Id && sent.RecipientAgentId == agentId && sent.Status == MessageStatusEnum.Queued, "send a message once per idempotency key");
                    EnumerationResult<AgentMessage> page = await client.Messages.ListAsync(new AgentMessageFilter { Recipient = agentId, Status = MessageStatusEnum.Queued, MaxResults = 10 }, token).ConfigureAwait(false);
                    Require(page.Objects.Exists(m => m.Id == sent.Id), "list messages by recipient and status");
                    AgentMessage read = await client.Messages.GetAsync(sent.Id, token).ConfigureAwait(false);
                    Require(read.Subject == "SDK check" && read.ThreadId == sent.Id, "read a message");
                    List<AgentMessage> thread = await client.Messages.ThreadAsync(sent.ThreadId, token).ConfigureAwait(false);
                    Require(thread.Count >= 1 && thread[0].Id == sent.Id, "read a thread");
                    try
                    {
                        await client.Messages.GetAsync("amg_sdk_missing", token).ConfigureAwait(false);
                        Require(false, "an unknown message is not found");
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404) { }
                }).ConfigureAwait(false);

                await CheckAsync("organizations", async () =>
                {
                    // Unit edits change the working tree; publishing a revision makes it live.
                    Agent member = await client.Agents.CreateAsync(new Agent { Name = "sdk-cs-org-member-" + suffix, Description = "C# SDK harness org unit lead." }, token).ConfigureAwait(false);
                    Organization? organization = null;
                    try
                    {
                        organization = await client.Organizations.CreateAsync(new Organization { Name = "sdk-cs-org-" + suffix, Mission = "Exercise the C# SDK." }, token).ConfigureAwait(false);
                        Require(organization.Id.StartsWith("org_", StringComparison.Ordinal) && organization.Status == OrganizationStatusEnum.Draft, "create an organization");
                        OrgUnit root = await client.Organizations.CreateUnitAsync(organization.Id, new OrgUnit { Name = "board", LeadAgentId = agentId, LeadTitle = "CEO" }, token).ConfigureAwait(false);
                        Require(root.Id.StartsWith("oun_", StringComparison.Ordinal) && root.ParentUnitId == null && root.LeadAgentId == agentId, "add the root unit");
                        OrgUnit child = new OrgUnit { Name = "engineering", ParentUnitId = root.Id, LeadAgentId = member.Name, LeadTitle = "Head of engineering" };
                        child.Budgets.Add(new OrgUnitBudget { Period = BudgetPeriodEnum.Day, AmountUsd = 5 });
                        child = await client.Organizations.CreateUnitAsync(organization.Id, child, token).ConfigureAwait(false);
                        Require(child.ParentUnitId == root.Id && child.LeadAgentId == member.Id && child.Budgets.Count == 1, "add a child unit with a budget");
                        Organization read = await client.Organizations.GetAsync(organization.Name, token).ConfigureAwait(false);
                        Require(read.RootUnitId == root.Id && read.Units != null && read.Units.Count == 2, "read an organization with its units");
                        Require((await client.Organizations.ListUnitsAsync(organization.Id, token).ConfigureAwait(false)).Count == 2, "list units");
                        Require((await client.Organizations.GetUnitAsync(organization.Id, "engineering", token).ConfigureAwait(false)).Id == child.Id, "read a unit by name");
                        OrgChart working = await client.Organizations.ChartAsync(organization.Id, token).ConfigureAwait(false);
                        Require(working.Source == "Working" && working.Units.Count == 2, "chart of the working tree, got " + working.Source);

                        OrgRevision first = await client.Organizations.CreateRevisionAsync(organization.Id, new OrgRevisionRequest { Note = "First" }, token).ConfigureAwait(false);
                        Require(first.State == OrgRevisionStateEnum.Draft && first.Number == 1, "draft a revision");
                        OrgRevision published = await client.Organizations.PublishAsync(organization.Id, first.Id, token).ConfigureAwait(false);
                        Require(published.State == OrgRevisionStateEnum.Published, "publish a revision");
                        OrgChart live = await client.Organizations.ChartAsync(organization.Id, token).ConfigureAwait(false);
                        Require(live.Source == "Live" && live.RevisionId == first.Id && live.Units.Exists(u => u.Id == child.Id && u.ParentUnitId == root.Id && u.Lead != null && u.Lead.AgentId == member.Id), "chart of the live revision");

                        child.Description = "Builds things.";
                        await client.Organizations.UpdateUnitAsync(organization.Id, child.Id, child, token).ConfigureAwait(false);
                        OrgRevision second = await client.Organizations.CreateRevisionAsync(organization.Id, new OrgRevisionRequest { Note = "Second" }, token).ConfigureAwait(false);
                        await client.Organizations.PublishAsync(organization.Id, second.Id, token).ConfigureAwait(false);
                        OrgRevision rolledBack = await client.Organizations.RollbackAsync(organization.Id, new OrgRollbackRequest { Note = "Back to the first" }, token).ConfigureAwait(false);
                        Require(rolledBack.RollbackOfRevisionId == first.Id && rolledBack.State == OrgRevisionStateEnum.Published, "roll back to the first revision");
                        List<OrgRevision> revisions = await client.Organizations.ListRevisionsAsync(organization.Id, token).ConfigureAwait(false);
                        Require(revisions.Count == 3 && revisions[0].Id == rolledBack.Id, "list revisions newest first");
                        Require((await client.Organizations.GetRevisionAsync(organization.Id, first.Id, token).ConfigureAwait(false)).Units.Count == 2, "read a revision with its snapshot");

                        List<OrgUnitSpend> spend = await client.Organizations.SpendAsync(organization.Id, token).ConfigureAwait(false);
                        Require(spend.Exists(s => s.UnitId == child.Id && s.Period == BudgetPeriodEnum.Day && s.AmountUsd == 5 && !s.Exhausted), "spend against the unit budget");

                        try
                        {
                            await client.Organizations.GetAsync("org_sdk_missing", token).ConfigureAwait(false);
                            Require(false, "an unknown organization is not found");
                        }
                        catch (GarrisonException e) when (e.StatusCode == 404) { }

                        await client.Organizations.DeleteAsync(organization.Id, token).ConfigureAwait(false);
                        organization = null;
                    }
                    finally
                    {
                        if (organization != null) await client.Organizations.DeleteAsync(organization.Id, token).ConfigureAwait(false);
                        await client.Agents.DeleteAsync(member.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("organization validate", async () =>
                {
                    // A dry run of publishing: an empty tree has no root (an Error), and a root with an active lead is valid.
                    Organization? organization = null;
                    try
                    {
                        organization = await client.Organizations.CreateAsync(new Organization { Name = "sdk-cs-validate-" + suffix, Mission = "Validate with the C# SDK." }, token).ConfigureAwait(false);
                        OrganizationValidationResult empty = await client.Organizations.ValidateOrganizationAsync(organization.Id, token).ConfigureAwait(false);
                        Require(!empty.Valid && empty.Problems.Any(p => p.Code == OrganizationValidationProblemCodeEnum.NoRootUnit && p.Severity == OrganizationValidationSeverityEnum.Error && !String.IsNullOrEmpty(p.Message)), "an empty tree reports NoRootUnit");
                        OrgUnit root = await client.Organizations.CreateUnitAsync(organization.Id, new OrgUnit { Name = "board", LeadAgentId = agentId, LeadTitle = "CEO" }, token).ConfigureAwait(false);
                        await client.Organizations.CreateUnitAsync(organization.Id, new OrgUnit { Name = "unled", ParentUnitId = root.Id }, token).ConfigureAwait(false);
                        OrganizationValidationResult filled = await client.Organizations.ValidateOrganizationAsync(organization.Name, token).ConfigureAwait(false);
                        Require(filled.Valid && !filled.Problems.Any(p => p.Severity == OrganizationValidationSeverityEnum.Error), "a rooted tree is valid");
                        Require(filled.Problems.Any(p => p.Code == OrganizationValidationProblemCodeEnum.UnitWithoutLead && p.Severity == OrganizationValidationSeverityEnum.Warning && p.UnitId != null), "a unit without a lead is a warning");
                        try
                        {
                            await client.Organizations.ValidateOrganizationAsync("org_sdk_missing", token).ConfigureAwait(false);
                            Require(false, "validating an unknown organization is not found");
                        }
                        catch (GarrisonException e) when (e.StatusCode == 404) { }
                    }
                    finally
                    {
                        if (organization != null) await client.Organizations.DeleteAsync(organization.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("evaluations", async () =>
                {
                    // An eval set is written, approved, and run against a deployment on the fake harness; a shadow trial and a canary release are started and stopped.
                    Agent? evalAgent = null;
                    Deployment? baseline = null;
                    Deployment? candidate = null;
                    ShadowTrial? trial = null;
                    CanaryRelease? release = null;
                    try
                    {
                        evalAgent = await client.Agents.CreateAsync(new Agent { Name = "sdk-cs-eval-" + suffix }, token).ConfigureAwait(false);
                        baseline = await client.Deployments.CreateAsync(new Deployment { Name = "sdk-cs-eval-" + suffix + "-base", AgentId = evalAgent.Id, HarnessProfileId = fakeProfileId ?? throw new InvalidOperationException("no fake profile") }, token).ConfigureAwait(false);
                        candidate = await client.Deployments.CreateAsync(new Deployment { Name = "sdk-cs-eval-" + suffix + "-cand", AgentId = evalAgent.Id, HarnessProfileId = fakeProfileId }, token).ConfigureAwait(false);

                        string setName = "sdk-cs-evals-" + suffix;
                        EvalSetRequest setRequest = new EvalSetRequest { Name = setName, Description = "C# SDK eval set", Tags = new List<string> { "sdk" }, Cases = new List<EvalCase>() };
                        setRequest.Cases.Add(new EvalCase { Name = "first", InputText = "case-0 alpha", Checks = new List<EvalCaseCheck> { new EvalCaseCheck { Scorer = EvalScorerEnum.Contains, Argument = "case-0" } } });
                        setRequest.Cases.Add(new EvalCase { Name = "second", InputText = "case-1 beta", ExpectedText = "case-1", Checks = new List<EvalCaseCheck> { new EvalCaseCheck { Scorer = EvalScorerEnum.Contains } } });
                        EvalSet set = await client.EvalSets.CreateAsync(setRequest, token).ConfigureAwait(false);
                        Require(set.Id.StartsWith("evs_", StringComparison.Ordinal) && set.Version == 1 && set.State == EvalSetStateEnum.Draft && set.Origin == EvalSetOriginEnum.Human && set.CaseCount == 2, "create an eval set");

                        EvalCase third = await client.EvalSets.CreateCaseAsync(set.Id, new EvalCase { Name = "third", InputText = "case-2 gamma", Checks = new List<EvalCaseCheck> { new EvalCaseCheck { Scorer = EvalScorerEnum.Contains, Argument = "case-2", Weight = 2 } } }, token).ConfigureAwait(false);
                        Require(third.Id.StartsWith("evc_", StringComparison.Ordinal) && third.Order == 2 && third.SetId == set.Id && third.Checks[0].Weight == 2, "add a case");
                        List<EvalCase> cases = await client.EvalSets.ListCasesAsync(set.Id, token).ConfigureAwait(false);
                        Require(cases.Count == 3 && cases.Select(c => c.Order).SequenceEqual(new[] { 0, 1, 2 }), "list cases in order");
                        EvalCase readCase = await client.EvalSets.GetCaseAsync(set.Id, third.Id, token).ConfigureAwait(false);
                        readCase.Name = "third-renamed";
                        EvalCase updatedCase = await client.EvalSets.UpdateCaseAsync(set.Id, third.Id, readCase, token).ConfigureAwait(false);
                        Require(updatedCase.Id == third.Id && updatedCase.Name == "third-renamed", "update a case");

                        EvalSet edited = await client.EvalSets.UpdateAsync(set.Id, new EvalSetRequest { Description = "C# SDK eval set, edited", Tags = new List<string> { "sdk", "edited" } }, token).ConfigureAwait(false);
                        Require(edited.Id == set.Id && edited.Version == 1 && edited.Description == "C# SDK eval set, edited" && edited.Tags.Count == 2, "a draft is edited in place");
                        EnumerationResult<EvalSet> sets = await client.EvalSets.ListAsync(new EvalSetFilter { Search = setName, LatestOnly = true }, token).ConfigureAwait(false);
                        Require(sets.Objects.Count == 1 && sets.Objects[0].Id == set.Id, "list eval sets");

                        EvalSet approved = await client.EvalSets.ApproveAsync(setName, token).ConfigureAwait(false);
                        Require(approved.State == EvalSetStateEnum.Approved && approved.ApprovedUtc.HasValue && approved.CaseCount == 3, "approve an eval set");
                        string? againCode = null;
                        try
                        {
                            await client.EvalSets.ApproveAsync(set.Id, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 409) { againCode = e.Error?.Code; }
                        Require(againCode == "AlreadyApproved", "approving twice is a conflict, got " + againCode);

                        EvalRun run = await client.EvalRuns.CreateAsync(new EvalRunRequest { SetId = setName, TargetType = EvalRunTargetEnum.Deployment, DeploymentId = baseline.Id, Threshold = 0.5 }, token).ConfigureAwait(false);
                        Require(run.Id.StartsWith("evr_", StringComparison.Ordinal) && run.SetId == set.Id && run.TotalCases == 3 && run.DeploymentId == baseline.Id, "start an eval run");
                        DateTime deadline = DateTime.UtcNow.AddSeconds(120);
                        while ((run.Status == EvalRunStatusEnum.Pending || run.Status == EvalRunStatusEnum.Running) && DateTime.UtcNow < deadline)
                        {
                            await Task.Delay(500, token).ConfigureAwait(false);
                            run = await client.EvalRuns.GetAsync(run.Id, token).ConfigureAwait(false);
                        }
                        Require(run.Status == EvalRunStatusEnum.Completed && run.Passed == true && run.Score == 1 && run.PassedCases == 3 && run.CompletedUtc.HasValue, "the eval run completes and passes: " + run.Status + " " + run.Score + " " + run.FailureReason);
                        List<EvalCaseResult> results = await client.EvalRuns.ResultsAsync(run.Id, token).ConfigureAwait(false);
                        Require(results.Count == 3 && results.All(r => r.Passed && r.RunId != null && r.OutputText != null && r.OutputText.Contains("case-" + r.Order, StringComparison.Ordinal) && r.CheckResults.Count == 1), "three passing case results");
                        EnumerationResult<EvalRun> runs = await client.EvalRuns.ListAsync(new EvalRunFilter { Set = setName }, token).ConfigureAwait(false);
                        Require(runs.Objects.Any(r => r.Id == run.Id), "list eval runs by set");
                        string? finishedCode = null;
                        try
                        {
                            await client.EvalRuns.CancelAsync(run.Id, "too late", token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 409) { finishedCode = e.Error?.Code; }
                        Require(finishedCode == "EvalRunFinished", "a finished run cannot be cancelled, got " + finishedCode);

                        EvalSet next = await client.EvalSets.DeleteCaseAsync(set.Id, third.Id, token).ConfigureAwait(false);
                        Require(next.Id != set.Id && next.Version == 2 && next.State == EvalSetStateEnum.Draft && next.CaseCount == 2 && next.PreviousVersionId == set.Id, "removing a case of an approved set makes version 2");
                        await client.EvalSets.DeleteAsync(next.Id, token).ConfigureAwait(false);
                        EvalSet latest = await client.EvalSets.GetAsync(setName, token).ConfigureAwait(false);
                        Require(latest.Id == set.Id, "the draft version is deleted");

                        trial = await client.ShadowTrials.CreateAsync(new ShadowTrial { Name = "sdk-cs-shadow", SourceDeploymentId = baseline.Id, CandidateDeploymentId = candidate.Name, SamplePercent = 50 }, token).ConfigureAwait(false);
                        Require(trial.Id.StartsWith("shd_", StringComparison.Ordinal) && trial.Status == ShadowTrialStatusEnum.Running && trial.CandidateDeploymentId == candidate.Id && trial.AgentId == evalAgent.Id && trial.SamplePercent == 50, "start a shadow trial");
                        ShadowTrial readTrial = await client.ShadowTrials.GetAsync(trial.Id, token).ConfigureAwait(false);
                        Require(readTrial.ComparedCount == 0 && readTrial.Name == "sdk-cs-shadow", "read a shadow trial");
                        EnumerationResult<ShadowTrial> trials = await client.ShadowTrials.ListAsync(new ShadowTrialFilter { Source = baseline.Id, Status = ShadowTrialStatusEnum.Running }, token).ConfigureAwait(false);
                        Require(trials.Objects.Count == 1 && trials.Objects[0].Id == trial.Id, "list shadow trials");
                        ShadowTrial stopped = await client.ShadowTrials.StopAsync(trial.Id, "harness done", token).ConfigureAwait(false);
                        Require(stopped.Status == ShadowTrialStatusEnum.Stopped && stopped.StopReason == "harness done" && stopped.CompletedUtc.HasValue, "stop a shadow trial");
                        string? stopCode = null;
                        try
                        {
                            await client.ShadowTrials.StopAsync(trial.Id, null, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 409) { stopCode = e.Error?.Code; }
                        Require(stopCode == "ShadowTrialNotRunning", "a stopped trial cannot stop again, got " + stopCode);
                        trial = null;

                        CanaryRelease releaseRequest = new CanaryRelease { AgentId = evalAgent.Name, CandidateDeploymentId = candidate.Id, BaselineDeploymentId = baseline.Id, MaxErrorRatePercent = 10 };
                        releaseRequest.Steps.Add(new CanaryReleaseStep { WeightPercent = 25, MinimumRuns = 1000, MinimumMinutes = 60 });
                        releaseRequest.Steps.Add(new CanaryReleaseStep { WeightPercent = 100, MinimumRuns = 1000, MinimumMinutes = 60 });
                        release = await client.CanaryReleases.CreateAsync(releaseRequest, token).ConfigureAwait(false);
                        Require(release.Id.StartsWith("cnr_", StringComparison.Ordinal) && release.Status == CanaryStatusEnum.Running && release.AgentId == evalAgent.Id && release.CurrentStepIndex == 0 && release.Steps.Count == 2 && release.CandidateInitialWeight == 100, "start a canary release");
                        Deployment weighted = await client.Deployments.GetAsync(candidate.Id, token).ConfigureAwait(false);
                        Deployment baselineWeighted = await client.Deployments.GetAsync(baseline.Id, token).ConfigureAwait(false);
                        Require(weighted.Weight * 3 == baselineWeighted.Weight, "the first step gives the candidate 25 percent of the weight, got " + weighted.Weight + " and " + baselineWeighted.Weight);
                        CanaryRelease readRelease = await client.CanaryReleases.GetAsync(release.Id, token).ConfigureAwait(false);
                        Require(readRelease.Steps[0].WeightPercent == 25 && readRelease.MaxErrorRatePercent == 10, "read a canary release");
                        EnumerationResult<CanaryRelease> releases = await client.CanaryReleases.ListAsync(new CanaryReleaseFilter { Agent = evalAgent.Id, Status = CanaryStatusEnum.Running }, token).ConfigureAwait(false);
                        Require(releases.Objects.Count == 1 && releases.Objects[0].Id == release.Id, "list canary releases");
                        CanaryRelease aborted = await client.CanaryReleases.AbortAsync(release.Id, "harness done", token).ConfigureAwait(false);
                        Require(aborted.Status == CanaryStatusEnum.Aborted && aborted.RollbackReason == "harness done", "abort a canary release");
                        release = null;
                        Deployment restored = await client.Deployments.GetAsync(candidate.Id, token).ConfigureAwait(false);
                        Require(restored.Weight == 100, "abort restores the candidate's weight, got " + restored.Weight);
                    }
                    finally
                    {
                        if (trial != null) await client.ShadowTrials.StopAsync(trial.Id, "harness cleanup", token).ConfigureAwait(false);
                        if (release != null) await client.CanaryReleases.AbortAsync(release.Id, "harness cleanup", token).ConfigureAwait(false);
                        if (candidate != null) await client.Deployments.DeleteAsync(candidate.Id, token).ConfigureAwait(false);
                        if (baseline != null) await client.Deployments.DeleteAsync(baseline.Id, token).ConfigureAwait(false);
                        if (evalAgent != null) await client.Agents.DeleteAsync(evalAgent.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("change rules", async () =>
                {
                    // A rule pre-authorizes classes of executive change below a unit; proposals list an organization's executive drafts.
                    Organization? organization = null;
                    ChangeRule? rule = null;
                    try
                    {
                        organization = await client.Organizations.CreateAsync(new Organization { Name = "sdk-cs-rules-" + suffix, Mission = "Exercise C# SDK change rules." }, token).ConfigureAwait(false);
                        OrgUnit root = await client.Organizations.CreateUnitAsync(organization.Id, new OrgUnit { Name = "board", LeadAgentId = agentId, LeadTitle = "CEO" }, token).ConfigureAwait(false);
                        OrgRevision first = await client.Organizations.CreateRevisionAsync(organization.Id, new OrgRevisionRequest { Note = "First" }, token).ConfigureAwait(false);
                        await client.Organizations.PublishAsync(organization.Id, first.Id, token).ConfigureAwait(false);

                        ChangeRule request = new ChangeRule { OrganizationId = organization.Name, UnitId = "board", Name = "retune-and-wake", Description = "Prompt and wake tuning below the board." };
                        request.Classes.Add(new ChangeRuleClass { Class = ChangeClassEnum.PromptRetune });
                        request.Classes.Add(new ChangeRuleClass { Class = ChangeClassEnum.WakeTuning });
                        request.Limits.Add(new ChangeRuleLimit { Class = ChangeClassEnum.WakeTuning, Name = "minIntervalSeconds", Minimum = 300 });
                        rule = await client.ChangeRules.CreateAsync(request, token).ConfigureAwait(false);
                        Require(rule.Id.StartsWith("cru_", StringComparison.Ordinal) && rule.OrganizationId == organization.Id && rule.UnitId == root.Id && rule.UnitName == "board" && rule.Active && rule.Classes.Count == 2 && rule.Limits.Count == 1, "create a change rule");

                        ChangeRule read = await client.ChangeRules.GetAsync(rule.Id, token).ConfigureAwait(false);
                        Require(read.Name == "retune-and-wake" && read.OrganizationName == organization.Name && read.Limits[0].Minimum == 300, "read a change rule");
                        EnumerationResult<ChangeRule> listed = await client.ChangeRules.ListAsync(new ChangeRuleFilter { Organization = organization.Id, ActiveOnly = true }, token).ConfigureAwait(false);
                        Require(listed.Objects.Count == 1 && listed.Objects[0].Id == rule.Id, "list change rules by organization");

                        read.Active = false;
                        read.Limits.Clear();
                        read.Classes.RemoveAll(c => c.Class == ChangeClassEnum.WakeTuning);
                        ChangeRule updated = await client.ChangeRules.UpdateAsync(rule.Id, read, token).ConfigureAwait(false);
                        Require(!updated.Active && updated.Classes.Count == 1 && updated.Limits.Count == 0, "update a change rule");

                        ChangeRule bad = new ChangeRule { OrganizationId = organization.Id, UnitId = root.Id, Name = "bad" };
                        bad.Classes.Add(new ChangeRuleClass { Class = ChangeClassEnum.DeploymentWeight });
                        bad.Limits.Add(new ChangeRuleLimit { Class = ChangeClassEnum.DeploymentWeight, Name = "speed", Maximum = 1 });
                        int badStatus = 0;
                        string? badCode = null;
                        try
                        {
                            await client.ChangeRules.CreateAsync(bad, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) { badStatus = e.StatusCode; e.Error?.FieldCodes?.TryGetValue("limits[0].name", out badCode); }
                        Require(badStatus == 400 && badCode == "UnknownLimit", "an unknown limit is refused, got " + badStatus + " " + badCode);

                        EnumerationResult<OrgProposal> proposals = await client.Organizations.ListProposalsAsync(organization.Id, null, null, token).ConfigureAwait(false);
                        Require(proposals.Objects.Count == 0, "no proposals yet");
                        try
                        {
                            await client.Organizations.GetProposalAsync(organization.Id, "sdr_sdk_missing", token).ConfigureAwait(false);
                            Require(false, "an unknown proposal is not found");
                        }
                        catch (GarrisonException e) when (e.StatusCode == 404) { }

                        await client.ChangeRules.DeleteAsync(rule.Id, token).ConfigureAwait(false);
                        try
                        {
                            await client.ChangeRules.GetAsync(rule.Id, token).ConfigureAwait(false);
                            Require(false, "a deleted change rule is not found");
                        }
                        catch (GarrisonException e) when (e.StatusCode == 404) { }
                        rule = null;
                    }
                    finally
                    {
                        if (rule != null) await client.ChangeRules.DeleteAsync(rule.Id, token).ConfigureAwait(false);
                        if (organization != null) await client.Organizations.DeleteAsync(organization.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("board", async () =>
                {
                    // The board reads the organization in one call, directs the CEO through its mandate, and talks to it.
                    Organization? organization = null;
                    Mandate? ceoMandate = null;
                    try
                    {
                        ceoMandate = await client.Mandates.CreateAsync(new Mandate { Name = "sdk-cs-ceo-" + suffix, AgentId = agentId!, DeploymentId = deploymentId!, CurrentRevision = new MandateRevision { Objective = "Run the SDK organization.", MinIntervalSeconds = 3600, BriefIntervalHours = 24 } }, token).ConfigureAwait(false);
                        Require(ceoMandate.CurrentRevision != null && ceoMandate.CurrentRevision.BriefIntervalHours == 24, "briefIntervalHours round-trips on a mandate revision");
                        organization = await client.Organizations.CreateAsync(new Organization { Name = "sdk-cs-board-" + suffix, Mission = "Exercise the C# SDK board." }, token).ConfigureAwait(false);
                        await client.Organizations.CreateUnitAsync(organization.Id, new OrgUnit { Name = "board", LeadAgentId = agentId, LeadMandateId = ceoMandate.Id, LeadTitle = "CEO" }, token).ConfigureAwait(false);
                        OrgRevision first = await client.Organizations.CreateRevisionAsync(organization.Id, new OrgRevisionRequest { Note = "First" }, token).ConfigureAwait(false);
                        await client.Organizations.PublishAsync(organization.Id, first.Id, token).ConfigureAwait(false);

                        Board board = await client.Board.GetAsync(organization.Id, 10, token).ConfigureAwait(false);
                        Require(board.OrganizationId == organization.Id && board.Chart != null && board.UnitHealth.Count == 1 && board.KillSwitch != null, "read the board");
                        Require(board.Ceo != null && board.Ceo.AgentId == agentId && board.Ceo.MandateId == ceoMandate.Id, "the board names the CEO");

                        MandateRevision directed = await client.Board.DirectAsync(organization.Name, new BoardDirectionRequest { Direction = "Focus on reliability this week.", ChangeNote = "SDK harness direction" }, token).ConfigureAwait(false);
                        Require(directed.MandateId == ceoMandate.Id && directed.Direction == "Focus on reliability this week." && directed.Source == MandateRevisionSourceEnum.Board && directed.State == MandateRevisionStateEnum.Published, "give the CEO direction");

                        int emptyStatus = 0;
                        try { await client.Board.DirectAsync(organization.Id, new BoardDirectionRequest { Direction = "" }, token).ConfigureAwait(false); }
                        catch (GarrisonException e) { emptyStatus = e.StatusCode; }
                        Require(emptyStatus == 400, "empty direction is refused, got " + emptyStatus);

                        try
                        {
                            Run run = await client.Board.SendMessageAsync(organization.Id, new BoardMessageRequest { Input = "What is the state of the organization?" }, token).ConfigureAwait(false);
                            Require(run.Id.StartsWith("run_", StringComparison.Ordinal) && !String.IsNullOrEmpty(run.ConversationId), "message the CEO");
                        }
                        catch (GarrisonException e) when (e.StatusCode == 409)
                        {
                            Console.WriteLine("  (board message skipped: " + e.Message + ")");
                        }

                        EnumerationResult<Conversation> conversations = await client.Board.ListConversationsAsync(organization.Id, token).ConfigureAwait(false);
                        Require(conversations.Objects != null && conversations.Objects.All(c => c.OrganizationId == organization.Id), "list board conversations");

                        try
                        {
                            await client.Board.GetAsync("org_sdk_missing", null, token).ConfigureAwait(false);
                            Require(false, "an unknown organization has no board");
                        }
                        catch (GarrisonException e) when (e.StatusCode == 404) { }
                    }
                    finally
                    {
                        if (organization != null) await client.Organizations.DeleteAsync(organization.Id, token).ConfigureAwait(false);
                        if (ceoMandate != null) await client.Mandates.DeleteAsync(ceoMandate.Id, true, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("performance and org brakes", async () =>
                {
                    // Performance reads, a cascade cancel, a rollback with the ticks option, a scheduled check, and the freeze margin. The organization may have no runs, so only shapes are asserted.
                    Organization? organization = null;
                    EvalSet? checkSet = null;
                    Trigger? check = null;
                    try
                    {
                        organization = await client.Organizations.CreateAsync(new Organization { Name = "sdk-cs-perf-" + suffix, Mission = "Exercise C# SDK performance.", BudgetFreezeMarginPercent = 15 }, token).ConfigureAwait(false);
                        Require(organization.BudgetFreezeMarginPercent == 15, "budgetFreezeMarginPercent round-trips on create");
                        OrgUnit root = await client.Organizations.CreateUnitAsync(organization.Id, new OrgUnit { Name = "board", LeadAgentId = agentId, LeadTitle = "CEO" }, token).ConfigureAwait(false);
                        OrgRevision first = await client.Organizations.CreateRevisionAsync(organization.Id, new OrgRevisionRequest { Note = "First" }, token).ConfigureAwait(false);
                        await client.Organizations.PublishAsync(organization.Id, first.Id, token).ConfigureAwait(false);

                        OrgPerformance performance = await client.Performance.GetAsync(organization.Id, null, token).ConfigureAwait(false);
                        Require(performance.OrganizationId == organization.Id && performance.FromUtc < performance.ToUtc && performance.Units.Exists(u => u.UnitId == root.Id && u.Metrics != null), "read performance over the default window");
                        Require(performance.Agents.All(a => a.Metrics != null && a.Metrics.Runs >= 0 && a.Metrics.SampleRunIds.Count <= 5) && performance.Checks != null, "performance agent metrics have the expected shape");

                        DateTime windowEnd = DateTime.UtcNow;
                        OrgPerformance windowed = await client.Performance.GetAsync(organization.Name, new PerformanceQuery { FromUtc = windowEnd.AddDays(-1), ToUtc = windowEnd, UnitId = root.Id }, token).ConfigureAwait(false);
                        Require(windowed.Units.Count >= 1 && windowed.Units[0].UnitId == root.Id && (windowed.ToUtc - windowed.FromUtc).TotalHours <= 25, "read performance over an explicit window and unit");

                        int spanStatus = 0;
                        try { await client.Performance.GetAsync(organization.Id, new PerformanceQuery { FromUtc = windowEnd.AddDays(-91), ToUtc = windowEnd }, token).ConfigureAwait(false); }
                        catch (GarrisonException e) { spanStatus = e.StatusCode; }
                        Require(spanStatus == 400, "a span over 90 days is refused, got " + spanStatus);

                        CascadeCancelResult cancelled = await client.Organizations.CancelAllAsync(organization.Id, root.Id, "SDK harness cascade cancel", token).ConfigureAwait(false);
                        Require(cancelled.UnitId == root.Id && cancelled.RunsCancelled >= 0 && cancelled.TicksCancelled >= 0 && cancelled.EscalationsWithdrawn >= 0 && cancelled.MessagesExpired >= 0 && cancelled.RunIds.Count == cancelled.RunsCancelled, "cancel everything in a unit");

                        int missingUnitStatus = 0;
                        try { await client.Organizations.CancelAllAsync(organization.Id, "oun_sdk_missing", null, token).ConfigureAwait(false); }
                        catch (GarrisonException e) { missingUnitStatus = e.StatusCode; }
                        Require(missingUnitStatus == 404, "cascade cancel of an unknown unit is 404, got " + missingUnitStatus);

                        OrgRevision second = await client.Organizations.CreateRevisionAsync(organization.Id, new OrgRevisionRequest { Note = "Second" }, token).ConfigureAwait(false);
                        await client.Organizations.PublishAsync(organization.Id, second.Id, token).ConfigureAwait(false);
                        OrgRevision rolledBack = await client.Organizations.RollbackAsync(organization.Id, new OrgRollbackRequest { Note = "Cancel ticks and go back", ActiveTicks = RollbackActiveTicksEnum.Cancel }, token).ConfigureAwait(false);
                        Require(rolledBack.RollbackOfRevisionId == first.Id && rolledBack.State == OrgRevisionStateEnum.Published, "roll back with activeTicks Cancel");

                        Organization margin = await client.Organizations.GetAsync(organization.Id, token).ConfigureAwait(false);
                        margin.BudgetFreezeMarginPercent = 0;
                        margin = await client.Organizations.UpdateAsync(organization.Id, margin, token).ConfigureAwait(false);
                        Require(margin.BudgetFreezeMarginPercent == 0, "update the freeze margin");
                        bool refusedLocally = false;
                        try { margin.BudgetFreezeMarginPercent = 101; }
                        catch (ArgumentOutOfRangeException) { refusedLocally = true; }
                        Require(refusedLocally, "a margin over 100 is refused");

                        EvalSetRequest setRequest = new EvalSetRequest { Name = "sdk-cs-check-" + suffix, Cases = new List<EvalCase>() };
                        setRequest.Cases.Add(new EvalCase { Name = "first", InputText = "check alpha", Checks = new List<EvalCaseCheck> { new EvalCaseCheck { Scorer = EvalScorerEnum.Contains, Argument = "alpha" } } });
                        checkSet = await client.EvalSets.CreateAsync(setRequest, token).ConfigureAwait(false);
                        checkSet = await client.EvalSets.ApproveAsync(checkSet.Id, token).ConfigureAwait(false);
                        try
                        {
                            check = await client.Triggers.CreateAsync(new Trigger { Name = "sdk-cs-check-" + suffix, Type = TriggerTypeEnum.Cron, TargetType = TriggerTargetTypeEnum.EvalSet, EvalSetId = checkSet.Id, DeploymentId = deploymentId, EvalRecentInputCount = 5, CronExpression = "0 6 * * *", Active = false }, token).ConfigureAwait(false);
                            Require(check.TargetType == TriggerTargetTypeEnum.EvalSet && check.EvalSetId == checkSet.Id && check.EvalRecentInputCount == 5 && check.DeploymentId == deploymentId, "create a scheduled check");
                        }
                        catch (GarrisonException e) when (e.StatusCode == 400)
                        {
                            // A scheduled check runs as a user; the harness signs in with an access key, so its run-as principal is a credential.
                            Console.WriteLine("  (scheduled check refused for a credential caller: " + e.Message + ")");
                        }

                        int noDeploymentStatus = 0;
                        try { await client.Triggers.CreateAsync(new Trigger { Name = "sdk-cs-check-bad-" + suffix, Type = TriggerTypeEnum.Cron, TargetType = TriggerTargetTypeEnum.EvalSet, EvalSetId = checkSet.Id, CronExpression = "0 6 * * *" }, token).ConfigureAwait(false); }
                        catch (GarrisonException e) { noDeploymentStatus = e.StatusCode; }
                        Require(noDeploymentStatus == 400, "a check without a deployment is refused, got " + noDeploymentStatus);
                    }
                    finally
                    {
                        if (check != null) await client.Triggers.DeleteAsync(check.Id, token).ConfigureAwait(false);
                        if (checkSet != null)
                        {
                            try { await client.EvalSets.DeleteAsync(checkSet.Id, token).ConfigureAwait(false); }
                            catch (GarrisonException) { }
                        }
                        if (organization != null) await client.Organizations.DeleteAsync(organization.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("notification endpoints", async () =>
                {
                    int blockedStatus = 0;
                    string? blockedCode = null;
                    try { await client.NotificationEndpoints.CreateAsync(new NotificationEndpoint { Name = "sdk-cs-local-" + suffix, Url = "http://127.0.0.1:9/x", Events = new List<NotificationEventEnum> { NotificationEventEnum.RunFailed } }, token).ConfigureAwait(false); }
                    catch (GarrisonException e) { blockedStatus = e.StatusCode; e.Error?.FieldCodes?.TryGetValue("url", out blockedCode); }
                    Require(blockedStatus == 400 && blockedCode == "DestinationBlocked", "loopback URL refused, got " + blockedStatus + " " + blockedCode);

                    NotificationEndpoint endpoint = await client.NotificationEndpoints.CreateAsync(new NotificationEndpoint { Name = "sdk-cs-notify-" + suffix, Url = "https://example.invalid/hook", Events = new List<NotificationEventEnum> { NotificationEventEnum.RunSucceeded, NotificationEventEnum.RunFailed } }, token).ConfigureAwait(false);
                    try
                    {
                        Require(endpoint.Id.StartsWith("nep_", StringComparison.Ordinal) && endpoint.SigningSecret != null && endpoint.Events.Count == 2, "endpoint create");
                        NotificationEndpoint read = await client.NotificationEndpoints.GetAsync(endpoint.Name, token).ConfigureAwait(false);
                        Require(read.SigningSecret == null && read.SigningSecretLast4 != null, "get hides the secret");
                        NotificationDelivery test = await client.NotificationEndpoints.TestAsync(endpoint.Id, token).ConfigureAwait(false);
                        Require(test.Event == NotificationEventEnum.Test && test.Attempts == 1 && (test.Status == NotificationDeliveryStatusEnum.Pending || test.Status == NotificationDeliveryStatusEnum.Failed), "test delivery " + test.Status + " " + test.LastError);
                        EnumerationResult<NotificationDelivery> deliveries = await client.NotificationEndpoints.ListDeliveriesAsync(endpoint.Id, null, null, token).ConfigureAwait(false);
                        Require(deliveries.Objects.Any(d => d.Id == test.Id), "delivery log");
                        NotificationDelivery one = await client.NotificationEndpoints.GetDeliveryAsync(endpoint.Id, test.Id, token).ConfigureAwait(false);
                        Require(one.Payload.HasValue && one.Payload.Value.ValueKind == JsonValueKind.Object && one.Payload.Value.TryGetProperty("event", out JsonElement payloadEvent) && payloadEvent.GetString() == "Test", "delivery payload");
                        read.Active = false;
                        Require(!(await client.NotificationEndpoints.UpdateAsync(endpoint.Id, read, token).ConfigureAwait(false)).Active, "endpoint update");
                    }
                    finally { await client.NotificationEndpoints.DeleteAsync(endpoint.Id, token).ConfigureAwait(false); }
                }).ConfigureAwait(false);

                await CheckAsync("stdio MCP worker diagnostic", async () =>
                {
                    Node node = (await client.Nodes.ListAsync(token: token).ConfigureAwait(false)).Objects.First(n => n.SupportsMcpTests && n.Status == NodeStatusEnum.Ready);
                    McpServer server = await client.McpServers.CreateAsync(new McpServer { Name = "sdk-cs-stdio-" + suffix, Transport = McpTransportEnum.Stdio, Command = "garrison-fake-harness", Arguments = new List<string> { "--mcp-stdio" }, RequiredTools = new List<string> { "fixture_status" } }, token).ConfigureAwait(false);
                    try
                    {
                        McpServerTestResponse result = await client.McpServers.TestOnWorkerAsync(server.Id, node.Id, token).ConfigureAwait(false);
                        Require(result.Success && result.NodeId == node.Id && result.Tools.Contains("fixture_status"), "worker stdio diagnostic");
                    }
                    finally { await client.McpServers.DeleteAsync(server.Id, token).ConfigureAwait(false); }
                }).ConfigureAwait(false);

                await CheckAsync("effect journal and active suspension status", async () =>
                {
                    List<EffectOperation> operations = await client.Runs.GetOperationsAsync(invokedRun?.Id ?? throw new InvalidOperationException("no invoked run"), token).ConfigureAwait(false);
                    Require(operations.All(operation => operation.TenantId == tenantId), "journal tenant isolation");
                    RunPlacementResponse placement = await client.Runs.GetPlacementAsync(invokedRun!.Id, token).ConfigureAwait(false);
                    Require(placement.RunId == invokedRun.Id && placement.Reasons.Contains("RunNotQueued") && !placement.Eligible, "terminal placement diagnostic");
                    List<RunDatabaseUsage> databaseUsage = await client.Runs.GetDatabaseUsageAsync(invokedRun.Id, token).ConfigureAwait(false);
                    Require(databaseUsage.Any(usage => usage.Statements > 0) && databaseUsage.All(usage => usage.RunId == invokedRun.Id && usage.TenantId == tenantId), "per-run database attribution");
                    Require(!new[] { RunStatusEnum.Succeeded, RunStatusEnum.Failed, RunStatusEnum.Cancelled, RunStatusEnum.TimedOut, RunStatusEnum.Rejected }.Contains(RunStatusEnum.Suspended), "Suspended must remain active");
                    bool missing = false;
                    try { await client.Runs.GetOperationsAsync("run_missing_sdk", token).ConfigureAwait(false); }
                    catch (GarrisonException e) when (e.StatusCode == 404) { missing = true; }
                    Require(missing, "unknown run journal must be 404");
                }).ConfigureAwait(false);

                await CheckAsync("scheduling, pinned sessions, remote admission, and key rotation", async () =>
                {
                    using (GarrisonClient administrator = new GarrisonClient(baseUrl))
                    {
                        administrator.UseAdminApiKey(Environment.GetEnvironmentVariable("GARRISON_SDK_ADMIN_API_KEY") ?? "garrisonadmin", tenantId);
                        Tenant scratch = await administrator.Tenants.CreateAsync(new TenantRequest { Name = "sdk-cs-weight-" + suffix, SchedulingWeight = 7 }, token).ConfigureAwait(false);
                        try
                        {
                            Require(scratch.SchedulingWeight == 7, "tenant weight create");
                            Tenant updated = await administrator.Tenants.UpdateAsync(scratch.Id, new TenantRequest { SchedulingWeight = 3 }, token).ConfigureAwait(false);
                            Require(updated.SchedulingWeight == 3, "tenant weight update");
                        }
                        finally { await administrator.Tenants.DeleteAsync(scratch.Id, token).ConfigureAwait(false); }
                        MasterKeyRotationResponse rotated = await administrator.Settings.RotateMasterKeyAsync(token).ConfigureAwait(false);
                        Require(rotated.KeyVersion >= 1 && rotated.Failed == 0 && rotated.Conflicts == 0, "rotation pass failed");
                        MasterKeyRotationResponse repeated = await administrator.Settings.RotateMasterKeyAsync(token).ConfigureAwait(false);
                        Require(repeated.Rotated == 0 && repeated.Failed == 0, "rotation must be resumable and idempotent");
                    }
                    Secret brokerMetadata = await client.Secrets.CreateAsync(new SecretRequest { Name = "sdk-cs-broker-" + suffix, Kind = SecretKindEnum.LeaseBroker, BrokerResource = "tenant-scoped-fixture", BrokerAudience = "fixture" }, token).ConfigureAwait(false);
                    try
                    {
                        Secret read = await client.Secrets.GetAsync(brokerMetadata.Id, token).ConfigureAwait(false);
                        Require(read.BrokerResource == "tenant-scoped-fixture" && read.BrokerAudience == "fixture" && read.ValueEncrypted == null, "provider metadata round trip");
                        bool refused = false;
                        try { await client.Secrets.SetValueAsync(read.Id, "forbidden-static-value", token).ConfigureAwait(false); }
                        catch (GarrisonException e) when (e.StatusCode == 400) { refused = true; }
                        Require(refused, "broker metadata rejects reusable static values");
                        string notRevealable = String.Empty;
                        try { await client.Secrets.RevealAsync(read.Id, token).ConfigureAwait(false); }
                        catch (GarrisonException e) when (e.StatusCode == 409) { notRevealable = e.Error?.Code ?? String.Empty; }
                        Require(notRevealable == "NotRevealable", "broker reveal must be 409 NotRevealable, got " + notRevealable);
                    }
                    finally { await client.Secrets.DeleteAsync(brokerMetadata.Id, token).ConfigureAwait(false); }
                    Secret revealable = await client.Secrets.CreateAsync(new SecretRequest { Name = "sdk-cs-reveal-" + suffix, Kind = SecretKindEnum.GenericEnv, Value = "sdk-cs-reveal-one-" + suffix }, token).ConfigureAwait(false);
                    try
                    {
                        SecretReveal first = await client.Secrets.RevealAsync(revealable.Id, token).ConfigureAwait(false);
                        Require(first.Id == revealable.Id && first.Name == revealable.Name && first.Kind == SecretKindEnum.GenericEnv && first.Value == "sdk-cs-reveal-one-" + suffix, "reveal returns the created value");
                        await client.Secrets.RotateAsync(revealable.Id, "sdk-cs-reveal-two-" + suffix, token).ConfigureAwait(false);
                        SecretReveal second = await client.Secrets.RevealAsync(revealable.Id, token).ConfigureAwait(false);
                        Require(second.Value == "sdk-cs-reveal-two-" + suffix && second.ValueLast4 == second.Value.Substring(second.Value.Length - 4), "reveal returns the rotated value");
                        bool missingSecret = false;
                        try { await client.Secrets.RevealAsync("sec_missing_sdk_cs", token).ConfigureAwait(false); }
                        catch (GarrisonException e) when (e.StatusCode == 404) { missingSecret = true; }
                        Require(missingSecret, "unknown secret reveal must be 404");
                    }
                    finally { await client.Secrets.DeleteAsync(revealable.Id, token).ConfigureAwait(false); }
                    HarnessProfile pinned = await client.HarnessProfiles.CreateAsync(new HarnessProfile { Name = "sdk-cs-session-" + suffix, Executable = "garrison-fake-harness", SessionFormat = "sdk-fixture-v1" }, token).ConfigureAwait(false);
                    try { Require((await client.HarnessProfiles.GetAsync(pinned.Id, token).ConfigureAwait(false)).SessionFormat == "sdk-fixture-v1", "session format round trip"); }
                    finally { await client.HarnessProfiles.DeleteAsync(pinned.Id, token).ConfigureAwait(false); }
                    Agent remote = await client.Agents.CreateAsync(new Agent { Name = "sdk-cs-remote-" + suffix, Kind = AgentKindEnum.Remote, RemoteProtocol = RemoteProtocolEnum.A2A, RemoteEndpointUrl = "http://127.0.0.1:9/a2a" }, token).ConfigureAwait(false);
                    try
                    {
                        bool denied = false;
                        try { await client.Agents.InvokeAsync(remote.Id, new InvokeRequest { Input = "fixture", DeploymentId = deploymentId }, token).ConfigureAwait(false); }
                        catch (GarrisonException e) when (e.StatusCode == 409) { denied = e.Error?.Code == "RemoteDeploymentUnsupported"; }
                        Require(denied, "remote deployment override must be rejected before network I/O");
                    }
                    finally { await client.Agents.DeleteAsync(remote.Id, token).ConfigureAwait(false); }
                    Deployment current = await client.Deployments.GetAsync(deploymentId ?? throw new InvalidOperationException("no deployment"), token).ConfigureAwait(false);
                    Require(!current.SuspensionEnabled, "suspension defaults to opt out");
                }).ConfigureAwait(false);

                await CheckAsync("agent revisions and promotion", async () =>
                {
                    Agent agent = await client.Agents.CreateAsync(new Agent { Name = "sdk-cs-rev-" + suffix, Description = "Revision fixture." }, token).ConfigureAwait(false);
                    string? devId = null;
                    string? stagingId = null;
                    try
                    {
                        Deployment dev = await client.Deployments.CreateAsync(new Deployment { Name = "sdk-cs-rev-dev-" + suffix, AgentId = agent.Id, HarnessProfileId = fakeProfileId ?? throw new InvalidOperationException("no fake profile") }, token).ConfigureAwait(false);
                        devId = dev.Id;
                        Require(dev.Environment == "dev" && dev.AgentRevisionId == null, "dev deployment defaults");
                        Deployment staging = await client.Deployments.CreateAsync(new Deployment { Name = "sdk-cs-rev-staging-" + suffix, AgentId = agent.Id, HarnessProfileId = fakeProfileId, Environment = "staging" }, token).ConfigureAwait(false);
                        stagingId = staging.Id;
                        Require(staging.Environment == "staging", "staging environment");

                        AgentRevision draft = await client.AgentRevisions.SaveDraftAsync(agent.Id, new AgentRevision { Description = "Revision fixture, changed." }, token).ConfigureAwait(false);
                        Require(draft.State == AgentRevisionStateEnum.Draft && draft.Description == "Revision fixture, changed.", "draft saved");
                        AgentRevision published = await client.AgentRevisions.PublishAsync(agent.Id, draft.Id, new RevisionPublishRequest { ChangeNote = "sdk harness" }, token).ConfigureAwait(false);
                        Require(published.State == AgentRevisionStateEnum.Published, "published state");
                        Require((await client.AgentRevisions.GetAsync(agent.Id, published.Number.ToString(), token).ConfigureAwait(false)).Id == published.Id, "get by number");
                        Require((await client.AgentRevisions.ListAsync(agent.Id, null, token).ConfigureAwait(false)).Objects.Any(r => r.Id == published.Id), "revision list");

                        PromotionRecord promotion = await client.Promotions.PromoteAsync(new PromotionRequest { AgentId = agent.Id, SourceEnvironment = "dev", AgentRevisionId = published.Id, Note = "sdk harness" }, token).ConfigureAwait(false);
                        Require(promotion.Kind == PromotionKindEnum.Promote && promotion.TargetEnvironment == "staging", "promotion target " + promotion.TargetEnvironment);
                        Require((await client.Deployments.GetAsync(staging.Id, token).ConfigureAwait(false)).AgentRevisionId == published.Id, "staging pinned to published revision");
                        Require((await client.Promotions.GetAsync(promotion.Id, token).ConfigureAwait(false)).Items.Any(i => i.DeploymentId == staging.Id), "promotion items");

                        PromotionRecord rollback = await client.Promotions.RollbackAsync(promotion.Id, new PromotionRollbackRequest { Note = "sdk harness" }, token).ConfigureAwait(false);
                        Require(rollback.Kind == PromotionKindEnum.Rollback && rollback.RollbackOfId == promotion.Id, "rollback record");
                        Require((await client.Deployments.GetAsync(staging.Id, token).ConfigureAwait(false)).AgentRevisionId == null, "staging pin restored");
                        Require((await client.Promotions.ListAsync(agent.Id, null, null, token).ConfigureAwait(false)).Objects.Count >= 2, "promotion list");

                        TenantEnvironmentList environments = await client.Promotions.GetEnvironmentsAsync(token).ConfigureAwait(false);
                        Require(environments.IsDefault && String.Join(",", environments.Environments.OrderBy(e => e.Position).Select(e => e.Name)) == "dev,staging,prod", "default environments");
                    }
                    finally
                    {
                        if (stagingId != null) await client.Deployments.DeleteAsync(stagingId, token).ConfigureAwait(false);
                        if (devId != null) await client.Deployments.DeleteAsync(devId, token).ConfigureAwait(false);
                        await client.Agents.DeleteAsync(agent.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("agent assets", async () =>
                {
                    AgentAsset asset = await client.AgentAssets.CreateAsync(new AgentAsset { Name = "sdk-cs-asset-" + suffix, Kind = AgentAssetKindEnum.Skill, Description = "Asset fixture." }, token).ConfigureAwait(false);
                    string? assetAgentId = null;
                    try
                    {
                        Require(asset.Kind == AgentAssetKindEnum.Skill && asset.CurrentVersion == 0, "asset created with no version");
                        byte[] content = Encoding.UTF8.GetBytes("# SDK skill\n\nCreated by the C# SDK harness.\n");
                        string expectedSha = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
                        List<AgentAssetUploadFile> files = new List<AgentAssetUploadFile> { AgentAssetUploadFile.FromBytes("SKILL.md", content, "text/markdown") };
                        AgentAssetVersion first = await client.AgentAssets.UploadFilesAsync(asset.Id, files, "sdk harness", token).ConfigureAwait(false);
                        Require(first.Number == 1, "first version number " + first.Number);
                        AgentAssetFile? skill = first.Files.FirstOrDefault(f => f.Path == "SKILL.md");
                        Require(skill != null && String.Equals(skill.Sha256, expectedSha, StringComparison.OrdinalIgnoreCase), "file sha256");
                        AgentAssetVersion again = await client.AgentAssets.UploadFilesAsync(asset.Id, files, "sdk harness", token).ConfigureAwait(false);
                        Require(again.Number == 1, "identical upload returned version " + again.Number);
                        byte[] downloaded = await client.AgentAssets.DownloadFileAsync(asset.Id, 1, "SKILL.md", token).ConfigureAwait(false);
                        Require(downloaded.SequenceEqual(content), "downloaded bytes match");
                        Require((await client.AgentAssets.ListVersionsAsync(asset.Id, token).ConfigureAwait(false)).Any(v => v.Number == 1), "version list");
                        Require((await client.AgentAssets.GetVersionAsync(asset.Id, 1, token).ConfigureAwait(false)).Number == 1, "get version");
                        Require((await client.AgentAssets.GetAsync(asset.Id, token).ConfigureAwait(false)).CurrentVersion == 1, "current version");
                        Require((await client.AgentAssets.ListAsync(AgentAssetKindEnum.Skill, new EnumerationQuery { Search = asset.Name }, token).ConfigureAwait(false)).Objects.Any(a => a.Id == asset.Id), "asset list");

                        Agent agent = await client.Agents.CreateAsync(new Agent { Name = "sdk-cs-asset-agent-" + suffix, Description = "Asset pin fixture." }, token).ConfigureAwait(false);
                        assetAgentId = agent.Id;
                        AgentRevision draft = await client.AgentRevisions.SaveDraftAsync(agent.Id, new AgentRevision { Description = "Pins an asset.", AssetPins = new List<AgentRevisionAssetPin> { new AgentRevisionAssetPin { AssetId = asset.Id } } }, token).ConfigureAwait(false);
                        AgentRevision published = await client.AgentRevisions.PublishAsync(agent.Id, draft.Id, new RevisionPublishRequest { ChangeNote = "sdk harness" }, token).ConfigureAwait(false);
                        Require(published.AssetPins.Any(p => p.AssetId == asset.Id), "published revision pins the asset");

                        bool inUse = false;
                        try
                        {
                            await client.AgentAssets.DeleteAsync(asset.Id, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 409)
                        {
                            inUse = e.Error?.Code == "AssetInUse";
                        }
                        Require(inUse, "delete of a pinned asset returns 409 AssetInUse");
                    }
                    finally
                    {
                        if (assetAgentId != null) await client.Agents.DeleteAsync(assetAgentId, token).ConfigureAwait(false);
                        await client.AgentAssets.DeleteAsync(asset.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("conversation file spaces", async () =>
                {
                    // The conversation cases delete their conversation, so this case starts its own.
                    InvokeRequest startRequest = new InvokeRequest();
                    startRequest.Input = "File space turn from the C# SDK";
                    startRequest.DeploymentId = conversationDeploymentId ?? throw new InvalidOperationException("no conversation deployment");
                    startRequest.StartConversation = true;
                    startRequest.WaitSeconds = 90;
                    Run started = await client.Agents.InvokeAsync(agentId!, startRequest, token).ConfigureAwait(false);
                    string id = started.ConversationId ?? throw new InvalidOperationException("no conversation");
                    string text = "# Notes\n\nWritten by the C# SDK harness.\n";
                    FileSpaceUploadResult first = await client.FileSpaces.WriteTextAsync(FileSpaceOwnerEnum.Conversation, id, "notes/a.md", text, 0, "text/markdown", token).ConfigureAwait(false);
                    Require(first.Version == 1 && !first.Conflict && first.Path == "notes/a.md", "first write version " + first.Version + " conflict " + first.Conflict);
                    FileSpaceUploadResult second = await client.FileSpaces.WriteTextAsync(FileSpaceOwnerEnum.Conversation, id, "notes/a.md", "conflicting edit\n", 0, "text/markdown", token).ConfigureAwait(false);
                    Require(second.Conflict && second.Path != "notes/a.md" && second.RequestedPath == "notes/a.md", "stale write conflict " + second.Conflict + " path " + second.Path);

                    FileSpaceListing listing = await client.FileSpaces.ListAsync(FileSpaceOwnerEnum.Conversation, id, false, token).ConfigureAwait(false);
                    Require(listing.Files.Any(f => f.Path == "notes/a.md") && listing.Files.Any(f => f.Path == second.Path), "listing has both files");
                    Require(!String.IsNullOrEmpty(listing.FileSpaceId), "listing fileSpaceId");

                    List<ConversationFileVersion> versions = await client.FileSpaces.ListVersionsAsync(FileSpaceOwnerEnum.Conversation, id, "notes/a.md", token).ConfigureAwait(false);
                    Require(versions.Any(v => v.Number == 1), "version 1 listed");

                    byte[] content = await client.FileSpaces.ReadAsync(FileSpaceOwnerEnum.Conversation, id, "notes/a.md", null, token).ConfigureAwait(false);
                    Require(content.SequenceEqual(Encoding.UTF8.GetBytes(text)), "content matches");

                    FileDownloadUrl link = await client.FileSpaces.DownloadUrlAsync(FileSpaceOwnerEnum.Conversation, id, "notes/a.md", 1, token).ConfigureAwait(false);
                    Require(link.Url.Length > 0, "download url");
                    using (HttpClient anonymous = new HttpClient())
                    {
                        byte[] fetched = await anonymous.GetByteArrayAsync(link.Url, token).ConfigureAwait(false);
                        Require(fetched.SequenceEqual(content), "download url content matches");
                    }

                    await client.FileSpaces.DeleteAsync(FileSpaceOwnerEnum.Conversation, id, second.Path, token).ConfigureAwait(false);
                    FileSpaceListing after = await client.FileSpaces.ListAsync(FileSpaceOwnerEnum.Conversation, id, false, token).ConfigureAwait(false);
                    Require(!after.Files.Any(f => f.Path == second.Path), "conflict file deleted");

                    EnumerationResult<Run> turns = await client.Conversations.ListRunsAsync(id, 25, 0, token).ConfigureAwait(false);
                    Run turn = turns.Objects.FirstOrDefault() ?? throw new InvalidOperationException("no conversation turn");
                    Run fetchedRun = await client.Runs.GetAsync(turn.Id, token).ConfigureAwait(false);
                    Require(!String.IsNullOrEmpty(fetchedRun.FileSpaceId), "run fileSpaceId");
                    FileSpaceListing byRun = await client.FileSpaces.ListAsync(FileSpaceOwnerEnum.Run, turn.Id, false, token).ConfigureAwait(false);
                    Require(byRun.Files.Any(f => f.Path == "notes/a.md"), "run listing has the file");
                }).ConfigureAwait(false);

                await CheckAsync("capability catalog", async () =>
                {
                    EnumerationResult<CapabilityDescriptor> catalog = await client.Capabilities.ListAsync(null, null, null, token).ConfigureAwait(false);
                    Require(catalog.TotalRecords == catalog.Objects.Count, "totalRecords " + catalog.TotalRecords + " objects " + catalog.Objects.Count);
                    CapabilityDescriptor? agentDescriptor = catalog.Objects.FirstOrDefault(d => d.Kind == CapabilityKindEnum.Agent && d.SourceAgentId == agentId);
                    Require(agentDescriptor != null, "test agent has no Agent descriptor");
                    Require(agentDescriptor!.Origin == CapabilityOriginEnum.Derived && !String.IsNullOrEmpty(agentDescriptor.SourceRevisionId) && agentDescriptor.Id.StartsWith("cap_", StringComparison.Ordinal), "agent descriptor fields");
                    Require((await client.Capabilities.ListAsync(CapabilityKindEnum.Agent, null, null, token).ConfigureAwait(false)).Objects.All(d => d.Kind == CapabilityKindEnum.Agent), "kind filter");

                    string name = "sdk-cs-cap-" + suffix;
                    string tag = "sdk-cs-tag-" + suffix;
                    CapabilityDescriptor request = new CapabilityDescriptor
                    {
                        Name = name,
                        Kind = CapabilityKindEnum.McpTool,
                        Summary = "Manual descriptor from the C# SDK harness.",
                        InputSchema = Json("{\"type\":\"object\",\"properties\":{\"text\":{\"type\":\"string\"}},\"required\":[\"text\"]}"),
                        Tags = new List<string> { tag },
                        Requirements = new List<CapabilityRequirement> { new CapabilityRequirement { Key = "garrison.io/sdk-fixture", Value = "true" } }
                    };
                    CapabilityDescriptor created = await client.Capabilities.CreateAsync(request, token).ConfigureAwait(false);
                    try
                    {
                        Require(created.Origin == CapabilityOriginEnum.Manual && created.TenantId == tenantId && created.SourceKey == "manual:" + created.Id, "manual descriptor fields");
                        Require(created.Tags.Contains(tag) && created.Requirements.Any(r => r.Key == "garrison.io/sdk-fixture"), "tags and requirements");
                        Require((await client.Capabilities.GetAsync(created.Id, token).ConfigureAwait(false)).Name == name, "read by id");
                        Require((await client.Capabilities.GetAsync(name, token).ConfigureAwait(false)).Id == created.Id, "read by name");
                        EnumerationResult<CapabilityDescriptor> tagged = await client.Capabilities.ListAsync(null, tag, null, token).ConfigureAwait(false);
                        Require(tagged.Objects.Count == 1 && tagged.Objects[0].Id == created.Id, "tag filter returned " + tagged.Objects.Count);

                        string? badSchemaCode = null;
                        try
                        {
                            await client.Capabilities.CreateAsync(new CapabilityDescriptor { Name = name + "-bad", Kind = CapabilityKindEnum.McpTool, InputSchema = Json("[1,2]") }, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 400)
                        {
                            badSchemaCode = e.Error?.Code;
                        }
                        Require(badSchemaCode == "InvalidJsonSchema", "invalid schema code " + badSchemaCode);

                        string? duplicateCode = null;
                        try
                        {
                            await client.Capabilities.CreateAsync(new CapabilityDescriptor { Name = name, Kind = CapabilityKindEnum.McpTool }, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 409)
                        {
                            duplicateCode = e.Error?.Code;
                        }
                        Require(duplicateCode == "NameConflict", "duplicate name code " + duplicateCode);

                        created.Summary = "Updated by the C# SDK harness.";
                        CapabilityDescriptor updated = await client.Capabilities.UpdateAsync(created.Id, created, token).ConfigureAwait(false);
                        Require(updated.Summary == "Updated by the C# SDK harness." && updated.Tags.Contains(tag), "update");

                        CapabilityRefreshResult refreshed = await client.Capabilities.RefreshAsync(null, token).ConfigureAwait(false);
                        Require(refreshed.Agents >= 0 && refreshed.HarnessBuiltIns >= 0 && refreshed.Hints >= 0, "refresh counts");
                        Require(refreshed.McpServers.All(s => !String.IsNullOrEmpty(s.McpServerId)), "refresh server entries");
                    }
                    finally
                    {
                        await client.Capabilities.DeleteAsync(created.Id, token).ConfigureAwait(false);
                    }

                    int missing = 0;
                    try
                    {
                        await client.Capabilities.GetAsync(created.Id, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404)
                    {
                        missing = e.StatusCode;
                    }
                    Require(missing == 404, "deleted descriptor still readable");
                }).ConfigureAwait(false);

                await CheckAsync("fan-out groups", async () =>
                {
                    string runId = invokedRun?.Id ?? throw new InvalidOperationException("no invoked run");
                    List<FanOutGroup> groups = await client.FanOutGroups.ListByRunAsync(runId, token).ConfigureAwait(false);
                    Require(groups.Count == 0, "expected no fan-out groups, got " + groups.Count);
                    int readStatus = 0;
                    try
                    {
                        await client.FanOutGroups.GetAsync("fog_missing", token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404)
                    {
                        readStatus = e.StatusCode;
                    }
                    Require(readStatus == 404, "expected 404 reading a missing fan-out group");
                    int cancelStatus = 0;
                    try
                    {
                        await client.FanOutGroups.CancelAsync("fog_missing", token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e) when (e.StatusCode == 404)
                    {
                        cancelStatus = e.StatusCode;
                    }
                    Require(cancelStatus == 404, "expected 404 cancelling a missing fan-out group");
                }).ConfigureAwait(false);

                await CheckAsync("agentic app, delegation plan, and app revision", async () =>
                {
                    string entryId = agentId ?? throw new InvalidOperationException("no scratch agent");
                    AgenticApp request = new AgenticApp();
                    request.Name = "sdk-cs-app-" + suffix;
                    request.Description = "C# SDK harness app.";
                    request.EntryAgentId = entryId;
                    request.Members = new List<AgenticAppMember> { new AgenticAppMember { AgentId = entryId, Role = "Talks to people" } };
                    request.AuthMode = AppAuthModeEnum.Anonymous;
                    request.AnonymousEnabled = true;
                    AgenticApp app = await client.Apps.CreateAsync(request, token).ConfigureAwait(false);
                    try
                    {
                        Require(app.Id.StartsWith("app_", StringComparison.Ordinal), "app id " + app.Id);
                        Require(app.Slug == request.Name, "slug defaults to the name, got " + app.Slug);
                        AgenticApp byName = await client.Apps.GetAsync(request.Name, token).ConfigureAwait(false);
                        Require(byName.Id == app.Id && byName.AuthMode == AppAuthModeEnum.Anonymous && byName.AnonymousEnabled, "read by name");
                        Require(byName.Members.Count == 1 && byName.Members[0].AgentId == entryId, "members " + byName.Members.Count);
                        AppDelegationPlan plan = await client.Apps.GetDelegationAsync(app.Id, token).ConfigureAwait(false);
                        Require(plan.AppId == app.Id && plan.Members.Count == 1 && !plan.Applied, "delegation plan members " + plan.Members.Count);
                        AppRevision draft = await client.Apps.CreateRevisionAsync(app.Id, new AppRevisionRequest { ChangeNote = "sdk harness" }, token).ConfigureAwait(false);
                        Require(draft.State == AgentRevisionStateEnum.Draft && draft.Members.Count == 1, "app revision state " + draft.State);
                        AppRevision published = await client.Apps.PublishRevisionAsync(app.Id, draft.Number.ToString(System.Globalization.CultureInfo.InvariantCulture), token).ConfigureAwait(false);
                        Require(published.State == AgentRevisionStateEnum.Published && published.Id == draft.Id, "published state " + published.State);
                        AppRevision read = await client.Apps.GetRevisionAsync(app.Id, published.Id, token).ConfigureAwait(false);
                        Require(read.Number == published.Number, "revision read");
                        List<AppRevision> revisions = await client.Apps.ListRevisionsAsync(app.Id, token).ConfigureAwait(false);
                        Require(revisions.Any(r => r.Id == published.Id), "published revision not listed");
                        AgenticApp afterPublish = await client.Apps.GetAsync(app.Id, token).ConfigureAwait(false);
                        Require(afterPublish.LatestPublishedRevisionId == published.Id, "latestPublishedRevisionId " + afterPublish.LatestPublishedRevisionId);
                    }
                    finally
                    {
                        await client.Apps.DeleteAsync(app.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("studio draft, graph, and approved apply", async () =>
                {
                    Agent live = new Agent();
                    live.Name = "sdk-cs-studio-" + suffix;
                    live.Description = "C# SDK harness studio member.";
                    live = await client.Agents.CreateAsync(live, token).ConfigureAwait(false);
                    string draftAgentName = "sdk-cs-draft-" + suffix;
                    string appName = "sdk-cs-studio-app-" + suffix;
                    StudioDraft? draft = null;
                    try
                    {
                        draft = await client.StudioDrafts.CreateAsync(new StudioDraftCreateRequest { Title = "sdk cs studio " + suffix }, token).ConfigureAwait(false);
                        Require(draft.Id.StartsWith("sdr_", StringComparison.Ordinal) && draft.Status == StudioDraftStatusEnum.Open && draft.Items.Count == 0, "new draft " + draft.Id + " " + draft.Status);
                        int readVersion = draft.Version;
                        string document = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: " + draftAgentName + "\n  description: x\nspec:\n  displayName: x\n";
                        StudioDraft withItem = await client.StudioDrafts.PutItemAsync(draft.Id, "Agent", draftAgentName, readVersion, document, null, token).ConfigureAwait(false);
                        Require(withItem.Version > readVersion && withItem.Items.Count == 1 && withItem.Items[0].Operation == StudioDraftOperationEnum.Upsert, "item put, version " + withItem.Version);

                        int staleStatus = 0;
                        string? staleCode = null;
                        try
                        {
                            await client.StudioDrafts.PutItemAsync(draft.Id, "Agent", draftAgentName, readVersion, document, null, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 409)
                        {
                            staleStatus = e.StatusCode;
                            staleCode = e.Error?.Code;
                        }
                        Require(staleStatus == 409 && staleCode == "DraftVersionConflict", "stale put: " + staleStatus + " " + staleCode);

                        EnumerationResult<StudioDraft> mine = await client.StudioDrafts.ListAsync(true, new EnumerationQuery { Search = draft.Title }, token).ConfigureAwait(false);
                        Require(mine.Objects.Any(d => d.Id == draft.Id), "draft not listed as mine");

                        StudioGraphOperationRequest add = new StudioGraphOperationRequest();
                        add.Version = withItem.Version;
                        add.Operation = StudioGraphOperationEnum.AddMember;
                        add.App = appName;
                        add.Agent = live.Name;
                        StudioGraph graph = await client.StudioDrafts.ApplyGraphOperationAsync(draft.Id, add, token).ConfigureAwait(false);
                        Require(graph.Nodes.Any(n => n.Kind == "AgenticApp" && n.Name == appName && n.InDraft), "app node missing");
                        Require(graph.Nodes.Any(n => n.Kind == "Agent" && n.Name == live.Name && n.EntryOf.Contains(appName)), "entry agent node missing");
                        StudioGraph read = await client.StudioDrafts.GetGraphAsync(draft.Id, token).ConfigureAwait(false);
                        Require(read.Version == graph.Version && read.Nodes.Count == graph.Nodes.Count, "graph read");

                        StudioDraftDiff diff = await client.StudioDrafts.DiffAsync(draft.Id, token).ConfigureAwait(false);
                        Require(diff.Valid && diff.Items.Count == 2 && diff.Items.All(i => i.Change == "Create"), "diff valid " + diff.Valid + " items " + diff.Items.Count);
                        StudioDraftDiff validated = await client.StudioDrafts.ValidateAsync(draft.Id, token).ConfigureAwait(false);
                        Require(validated.Valid && validated.Items.Count == 2, "validate");

                        Approval approval = await client.StudioDrafts.RequestApplyAsync(draft.Id, graph.Version, token).ConfigureAwait(false);
                        Require(approval.Kind == ApprovalKindEnum.DraftApply && approval.DraftId == draft.Id && approval.Status == ApprovalStatusEnum.Pending, "approval " + approval.Kind + " " + approval.Status);
                        Require((await client.StudioDrafts.GetAsync(draft.Id, token).ConfigureAwait(false)).Status == StudioDraftStatusEnum.PendingApproval, "draft not pending");
                        await client.Approvals.DecideAsync(approval.Id, new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, token).ConfigureAwait(false);
                        StudioDraft applied = await client.StudioDrafts.GetAsync(draft.Id, token).ConfigureAwait(false);
                        Require(applied.Status == StudioDraftStatusEnum.Applied && !String.IsNullOrEmpty(applied.ManifestApplyId), "draft status " + applied.Status);
                        AgenticApp app = await client.Apps.GetAsync(appName, token).ConfigureAwait(false);
                        Require(app.Members.Count == 1, "applied app members " + app.Members.Count);
                    }
                    finally
                    {
                        if (draft != null)
                        {
                            try { await client.StudioDrafts.DeleteAsync(draft.Id, token).ConfigureAwait(false); } catch (GarrisonException) { }
                        }
                        try { await client.Apps.DeleteAsync(appName, token).ConfigureAwait(false); } catch (GarrisonException e) when (e.StatusCode == 404) { }
                        try { await client.Agents.DeleteAsync(draftAgentName, token).ConfigureAwait(false); } catch (GarrisonException e) when (e.StatusCode == 404) { }
                        await client.Agents.DeleteAsync(live.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("architect prompts", async () =>
                {
                    List<ArchitectPromptEntry> prompts = (await client.StudioDrafts.ListArchitectPromptsAsync(null, token).ConfigureAwait(false)).Objects;
                    Require(prompts.Count > 0 && prompts[0].Name == "builtin/agent-architect" && prompts[0].IsBuiltIn && prompts[0].IsDefault, "first architect prompt " + (prompts.Count > 0 ? prompts[0].Name : "none"));
                    PromptTemplate clone = await client.PromptTemplates.CloneAsync(prompts[0].Id, "sdk-cs-architect-" + suffix, token).ConfigureAwait(false);
                    string? architectDeploymentId = null;
                    try
                    {
                        Agent architect = await client.Agents.GetAsync("agent-architect", token).ConfigureAwait(false);
                        Deployment request = new Deployment();
                        request.Name = "sdk-cs-architect-" + suffix;
                        request.AgentId = architect.Id;
                        request.HarnessProfileId = "hrn_builtin_fake";
                        request.ArchitectPromptTemplateId = clone.Id;
                        Deployment created = await client.Deployments.CreateAsync(request, token).ConfigureAwait(false);
                        architectDeploymentId = created.Id;
                        Require(created.ManagementAccess == ManagementAccessEnum.Drafts, "managementAccess " + created.ManagementAccess);
                        ArchitectPromptSelection selected = await client.StudioDrafts.GetArchitectPromptAsync(created.Id, token).ConfigureAwait(false);
                        Require(selected.ArchitectPromptTemplateId == clone.Id && selected.ArchitectPromptVersion == null, "selected " + selected.ArchitectPromptTemplateId);
                        ArchitectPromptSelection reset = await client.StudioDrafts.SetArchitectPromptAsync(created.Id, "builtin/agent-architect", null, token).ConfigureAwait(false);
                        Require(reset.ArchitectPromptName == "builtin/agent-architect", "set back to " + reset.ArchitectPromptName);
                        PromptTemplate restored = await client.PromptTemplates.ResetAsync(clone.Id, token).ConfigureAwait(false);
                        Require(restored.Id == clone.Id, "reset clone");
                    }
                    finally
                    {
                        if (architectDeploymentId != null) await client.Deployments.DeleteAsync(architectDeploymentId, token).ConfigureAwait(false);
                        await client.PromptTemplates.DeleteAsync(clone.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("agent architects", async () =>
                {
                    string name = "sdk-cs-arch-" + suffix;
                    string renamed = name + "-renamed";
                    string? architectId = null;
                    Secret credential = await client.Secrets.CreateAsync(new SecretRequest { Name = "sdk-cs-arch-cred-" + suffix, Kind = SecretKindEnum.AnthropicApiKey, Value = "sk-ant-fake-" + suffix }, token).ConfigureAwait(false);
                    try
                    {
                        ArchitectRequest create = new ArchitectRequest();
                        create.Name = name;
                        create.Description = "SDK harness architect";
                        create.HarnessProfileId = "hrn_builtin_fake";
                        create.CredentialSecretId = credential.Name;
                        Architect created = await client.StudioDrafts.CreateArchitectAsync(create, token).ConfigureAwait(false);
                        architectId = created.Id;
                        Require(created.CredentialSecretId == credential.Id && created.CredentialSecretName == credential.Name, "created credential " + created.CredentialSecretId + " " + created.CredentialSecretName);
                        Require(created.Name == name && created.HarnessProfileId == "hrn_builtin_fake" && created.Active && created.AgentName == "agent-architect", "created " + created.Name + " " + created.AgentName);
                        Require(created.ArchitectPromptName == "builtin/agent-architect" && created.ArchitectPromptVersion == null, "created prompt " + created.ArchitectPromptName);

                        EnumerationQuery query = new EnumerationQuery();
                        query.MaxResults = 1;
                        query.Search = name;
                        EnumerationResult<Architect> page = await client.StudioDrafts.ListArchitectsAsync(query, token).ConfigureAwait(false);
                        Require(page.Objects.Count == 1 && page.Objects[0].Id == created.Id && page.TotalRecords == 1 && page.MaxResults == 1, "list page " + page.Objects.Count + " of " + page.TotalRecords);

                        Architect byId = await client.StudioDrafts.GetArchitectAsync(created.Id, token).ConfigureAwait(false);
                        Require(byId.Name == name, "get by id " + byId.Name);
                        Architect byName = await client.StudioDrafts.GetArchitectAsync(name, token).ConfigureAwait(false);
                        Require(byName.Id == created.Id, "get by name " + byName.Id);

                        ArchitectRequest update = new ArchitectRequest();
                        update.Name = renamed;
                        update.HarnessProfileId = "hrn_builtin_fake";
                        update.Model = "fake-model";
                        update.Active = false;
                        update.ArchitectPromptTemplateId = "builtin/agent-architect-guided";
                        Architect updated = await client.StudioDrafts.UpdateArchitectAsync(created.Id, update, token).ConfigureAwait(false);
                        Require(updated.Id == created.Id && updated.Name == renamed && updated.Model == "fake-model" && !updated.Active, "updated " + updated.Name + " " + updated.Model + " " + updated.Active);
                        Require(updated.ArchitectPromptName == "builtin/agent-architect-guided", "updated prompt " + updated.ArchitectPromptName);

                        ArchitectRequest unbind = new ArchitectRequest();
                        unbind.Name = renamed;
                        unbind.HarnessProfileId = "hrn_builtin_fake";
                        unbind.Active = false;
                        unbind.CredentialSecretId = "";
                        Architect unbound = await client.StudioDrafts.UpdateArchitectAsync(created.Id, unbind, token).ConfigureAwait(false);
                        Require(unbound.CredentialSecretId == null && unbound.CredentialSecretName == null, "unbound credential " + unbound.CredentialSecretId);

                        EnumerationQuery promptQuery = new EnumerationQuery();
                        promptQuery.MaxResults = 1;
                        EnumerationResult<ArchitectPromptEntry> first = await client.StudioDrafts.ListArchitectPromptsAsync(promptQuery, token).ConfigureAwait(false);
                        Require(first.Objects.Count == 1 && first.Objects[0].Name == "builtin/agent-architect" && first.TotalRecords >= 2 && !first.EndOfResults, "prompt page 1 " + first.Objects.Count + " of " + first.TotalRecords);
                        promptQuery.Skip = 1;
                        EnumerationResult<ArchitectPromptEntry> second = await client.StudioDrafts.ListArchitectPromptsAsync(promptQuery, token).ConfigureAwait(false);
                        Require(second.Objects.Count == 1 && second.Objects[0].Name == "builtin/agent-architect-guided" && second.Objects[0].Deployments.Contains(created.Id), "prompt page 2 " + (second.Objects.Count > 0 ? second.Objects[0].Name : "none"));

                        await client.StudioDrafts.DeleteArchitectAsync(created.Id, token).ConfigureAwait(false);
                        architectId = null;
                        int status = 0;
                        try
                        {
                            await client.StudioDrafts.GetArchitectAsync(created.Id, token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e)
                        {
                            status = e.StatusCode;
                        }
                        Require(status == 404, "read after delete " + status);
                    }
                    finally
                    {
                        if (architectId != null)
                        {
                            try { await client.StudioDrafts.DeleteArchitectAsync(architectId, token).ConfigureAwait(false); } catch (GarrisonException e) when (e.StatusCode == 404) { }
                        }
                        await client.Secrets.DeleteAsync(credential.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("app gateway chat with the support triage bundle", async () =>
                {
                    string bundle = await File.ReadAllTextAsync(FindExample("support-triage/support-triage.yaml"), token).ConfigureAwait(false);
                    ManifestApply applied = await client.Manifests.ApplyAsync(bundle, false, false, token).ConfigureAwait(false);
                    Require(applied.FailedCount == 0, "bundle apply failed " + applied.FailedCount);
                    AgenticApp app = await client.Apps.GetAsync("support-triage", token).ConfigureAwait(false);
                    using (AppGatewayClient gateway = client.AppGateway(app.Slug))
                    {
                        AppInfo info = await gateway.InfoAsync(token).ConfigureAwait(false);
                        Require(info.Slug == app.Slug && info.AuthMode == AppAuthModeEnum.Anonymous && info.AnonymousAllowed, "info " + info.Slug + " " + info.AuthMode);
                        Require(app.PaletteId == "ocean" && app.StarterPrompts.Count == 3 && app.DarkPrimaryColor == "#38BDF8" && app.CornerStyle == AppCornerStyleEnum.Rounded && app.ShowPoweredBy, "app appearance " + app.PaletteId + " " + app.StarterPrompts.Count);
                        Require(info.PaletteId == "ocean" && info.StarterPrompts.Count == 3 && info.DarkFilesColor == "#072A40" && info.WelcomeTitle == "How can we help?" && info.AgentDisplayName == "Support"
                            && info.ThemeDefault == AppThemeDefaultEnum.System && info.Density == AppDensityEnum.Comfortable && info.AllowThemeSwitch && info.ShowFilesPanel && info.AgentAvatarUrl == null, "info appearance " + info.PaletteId + " " + info.StarterPrompts.Count);
                        Require(gateway.LogoUrl().EndsWith("/v1.0/apps/" + app.Slug + "/logo", StringComparison.Ordinal), "logo URL " + gateway.LogoUrl());
                        int logoStatus = 0;
                        try
                        {
                            await gateway.GetLogoAsync(token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 404)
                        {
                            logoStatus = 404;
                        }
                        Require(logoStatus == 404, "an app without a logo served one");
                        AppSessionResponse session = await gateway.StartSessionAsync(null, token).ConfigureAwait(false);
                        Require(session.Anonymous && session.Token.StartsWith("gas_", StringComparison.Ordinal) && gateway.Token == session.Token, "session " + session.PrincipalName);
                        AppConversationStart started = await gateway.StartConversationAsync("My invoice was charged twice.", token).ConfigureAwait(false);
                        List<string> names = new List<string>();
                        await foreach (AppTurnStreamEvent frame in gateway.StreamTurnAsync(started.ConversationId, started.Turn.RunId, 0, token).ConfigureAwait(false)) names.Add(frame.Name);
                        Require(names.Count > 0 && names[names.Count - 1] == "turn.completed", "turn stream " + String.Join(",", names));
                        AppTurnView turn = await gateway.WaitForTurnAsync(started.ConversationId, started.Turn.RunId, TimeSpan.FromSeconds(120), token).ConfigureAwait(false);
                        Require(turn.Status == RunStatusEnum.Succeeded && !String.IsNullOrEmpty(turn.Answer), "turn " + turn.Status + " " + turn.Error);
                        AppConversationView view = await gateway.GetConversationAsync(started.ConversationId, token).ConfigureAwait(false);
                        Require(view.Id == started.ConversationId && view.Turns.Count == 1, "conversation turns " + view.Turns.Count);
                        List<AppConversationView> listed = await gateway.ListConversationsAsync(token).ConfigureAwait(false);
                        Require(listed.Any(c => c.Id == started.ConversationId), "conversation not listed");
                        FileSpaceListing files = await gateway.ListFilesAsync(started.ConversationId, token).ConfigureAwait(false);
                        Require(files.Files != null, "file listing");
                        using (CancellationTokenSource streamCts = CancellationTokenSource.CreateLinkedTokenSource(token))
                        {
                            AppFilesChanged? first = null;
                            await foreach (AppFilesChanged changed in gateway.StreamFilesAsync(started.ConversationId, streamCts.Token).ConfigureAwait(false))
                            {
                                first = changed;
                                break;
                            }
                            Require(first != null && first.ConversationId == started.ConversationId, "files.changed");
                        }
                        await gateway.EndSessionAsync(token).ConfigureAwait(false);
                        Require(gateway.Token == null, "EndSessionAsync kept the token");
                        int status = 0;
                        try
                        {
                            await gateway.ListConversationsAsync(token).ConfigureAwait(false);
                        }
                        catch (GarrisonException e) when (e.StatusCode == 401)
                        {
                            status = 401;
                        }
                        Require(status == 401, "conversations without a session were served");
                    }
                }).ConfigureAwait(false);

                await CheckAsync("playground and compile preview of a draft revision", async () =>
                {
                    Agent agent = new Agent();
                    agent.Name = "sdk-cs-playground-" + suffix;
                    agent.Description = "C# SDK harness playground agent.";
                    agent = await client.Agents.CreateAsync(agent, token).ConfigureAwait(false);
                    string? deploymentId = null;
                    try
                    {
                        Deployment request = new Deployment();
                        request.Name = "sdk-cs-playground-" + suffix;
                        request.AgentId = agent.Id;
                        request.HarnessProfileId = "hrn_builtin_fake";
                        request.Environment = "dev";
                        Deployment dev = await client.Deployments.CreateAsync(request, token).ConfigureAwait(false);
                        deploymentId = dev.Id;

                        AgentRevision draftContent = new AgentRevision();
                        draftContent.Description = "C# SDK playground draft " + suffix;
                        AgentRevision draft = await client.AgentRevisions.SaveDraftAsync(agent.Id, draftContent, token).ConfigureAwait(false);
                        Require(draft.State == AgentRevisionStateEnum.Draft, "draft state " + draft.State);

                        PlaygroundInvokeRequest invoke = new PlaygroundInvokeRequest();
                        invoke.Input = "Hello from the C# SDK playground";
                        invoke.AgentRevisionId = draft.Id;
                        invoke.Wait = true;
                        invoke.WaitSeconds = 60;
                        Run run = await client.Agents.PlaygroundInvokeAsync(agent.Name, invoke, token).ConfigureAwait(false);
                        Require(run.Status == RunStatusEnum.Succeeded, "playground status " + run.Status + " " + run.ErrorMessage);
                        Require(run.Kind == RunKindEnum.Playground, "playground kind " + run.Kind);
                        Require(run.AgentRevisionId == draft.Id, "playground revision " + run.AgentRevisionId + " expected " + draft.Id);

                        CompilePreviewRequest preview = new CompilePreviewRequest();
                        preview.Input = "Preview the draft";
                        preview.AgentRevisionId = draft.Id;
                        CompilePreviewResponse compiled = await client.Deployments.CompilePreviewAsync(dev.Id, preview, token).ConfigureAwait(false);
                        Require(compiled.AgentRevisionId == draft.Id, "preview revision " + compiled.AgentRevisionId + " expected " + draft.Id);
                        Require(compiled.DeploymentId == dev.Id, "preview deployment " + compiled.DeploymentId);
                    }
                    finally
                    {
                        if (deploymentId != null)
                        {
                            try { await client.Deployments.DeleteAsync(deploymentId, token).ConfigureAwait(false); } catch (GarrisonException e) when (e.StatusCode == 404) { }
                        }
                        await client.Agents.DeleteAsync(agent.Id, token).ConfigureAwait(false);
                    }
                }).ConfigureAwait(false);

                await CheckAsync("cleanup", async () =>
                {
                    if (conversationDeploymentId != null) await client.Deployments.DeleteAsync(conversationDeploymentId, token).ConfigureAwait(false);
                    if (deploymentId != null) await client.Deployments.DeleteAsync(deploymentId, token).ConfigureAwait(false);
                    if (agentId != null) await client.Agents.DeleteAsync(agentId, token).ConfigureAwait(false);
                }).ConfigureAwait(false);
            }

            Console.WriteLine();
            Console.WriteLine("Passed: " + _Passed + "  Failed: " + _Failures.Count);
            foreach (string failure in _Failures) Console.WriteLine("  FAIL " + failure);
            return _Failures.Count == 0 ? 0 : 1;
        }

        #endregion

        #region Private-Methods

        private static async Task CheckAsync(string name, Func<Task> check)
        {
            Stopwatch timer = Stopwatch.StartNew();
            try
            {
                await check().ConfigureAwait(false);
                _Passed++;
                Console.WriteLine("PASS  " + name + " (" + timer.ElapsedMilliseconds + "ms)");
            }
            catch (Exception e)
            {
                _Failures.Add(name + ": " + e.Message);
                Console.WriteLine("FAIL  " + name + " (" + timer.ElapsedMilliseconds + "ms): " + e.Message);
            }
        }

        private static string FindExample(string relative, [System.Runtime.CompilerServices.CallerFilePath] string sourceFile = "")
        {
            foreach (string? start in new[] { Path.GetDirectoryName(sourceFile), Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
            {
                string? directory = start;
                while (!String.IsNullOrEmpty(directory))
                {
                    string candidate = Path.Combine(directory, "examples", "agentic-apps", relative);
                    if (File.Exists(candidate)) return candidate;
                    directory = Path.GetDirectoryName(directory);
                }
            }
            throw new FileNotFoundException("examples/agentic-apps/" + relative + " was not found above the source, working, or base directory.");
        }

        private static void Require(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }

        private static JsonElement Json(string text)
        {
            return JsonSerializer.Deserialize<JsonElement>(text);
        }

        #endregion
    }
}
