namespace Garrison.Sdk.Test
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
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

                await CheckAsync("manifest dry run", async () =>
                {
                    string yaml = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: sdk-cs-manifest-" + suffix + "\nspec:\n  description: Dry run only.\n";
                    ManifestApply result = await client.Manifests.ApplyAsync(yaml, true, false, token).ConfigureAwait(false);
                    Require(result.DryRun, "not a dry run");
                    Require(result.FailedCount == 0, "failed documents " + result.FailedCount);
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
                    Require(deployment.ApprovalDefaultAction == ApprovalRuleActionEnum.Ask, "approvalDefaultAction " + deployment.ApprovalDefaultAction);
                    Require(deployment.ApprovalTimeoutSeconds == 300, "approvalTimeoutSeconds " + deployment.ApprovalTimeoutSeconds);
                    Require(deployment.ApprovalTimeoutDecision == ApprovalDecisionEnum.Deny, "approvalTimeoutDecision " + deployment.ApprovalTimeoutDecision);

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

        private static void Require(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }

        #endregion
    }
}
