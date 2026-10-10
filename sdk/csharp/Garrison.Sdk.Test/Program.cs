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

                await CheckAsync("health", async () =>
                {
                    HealthResponse health = await client.HealthAsync(token).ConfigureAwait(false);
                    Require(health.Status == "healthy", "status " + health.Status);
                }).ConfigureAwait(false);

                await CheckAsync("token auth", async () =>
                {
                    TokenResponse issued = await client.LoginWithKeysAsync(accessKey, secretKey, token).ConfigureAwait(false);
                    Require(!String.IsNullOrEmpty(issued.Token), "empty token");
                    tenantId = issued.TenantId;
                    TokenDetailsResponse details = await client.GetTokenDetailsAsync(token).ConfigureAwait(false);
                    Require(details.PrincipalType == PrincipalTypeEnum.Credential, "principal " + details.PrincipalType);
                }).ConfigureAwait(false);

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

                await CheckAsync("invoke with wait", async () =>
                {
                    InvokeRequest request = new InvokeRequest();
                    request.Input = "Hello from the C# SDK";
                    request.Wait = true;
                    request.WaitSeconds = 90;
                    Run run = await client.Agents.InvokeAsync(agentId ?? throw new InvalidOperationException("no agent"), request, token).ConfigureAwait(false);
                    Require(run.Status == RunStatusEnum.Succeeded, "status " + run.Status + " " + run.ErrorMessage);
                    Require((run.ResultText ?? String.Empty).StartsWith("Echo:", StringComparison.Ordinal), "result " + run.ResultText);
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

                await CheckAsync("cleanup", async () =>
                {
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
