namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Voltaic.A2A;
    using Voltaic.Mcp;

    /// <summary>
    /// Invokes registered A2A endpoints and MCP tools without a subprocess or database access. Health checks precede
    /// dispatch, redirects and metadata addresses are refused at connect time, and calls are never automatically retried.
    /// Each invocation owns its HTTP clients; instances are thread-safe.
    /// </summary>
    public class RemoteRunExecutor : IRunExecutor
    {
        /// <inheritdoc />
        public async Task<RunCompleteRequest> ExecuteAsync(RunAssignment assignment, IRunReporter reporter, CancellationToken token)
        {
            if (assignment == null) throw new ArgumentNullException(nameof(assignment));
            if (reporter == null) throw new ArgumentNullException(nameof(reporter));
            ExecutionSpec spec = assignment.Spec;
            RunCompleteRequest complete = new RunCompleteRequest();
            using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromSeconds(Math.Max(1, spec.TimeoutSeconds))))
            using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(timeout.Token, token))
            {
                try
                {
                    linked.Token.ThrowIfCancellationRequested();
                    ExecutionRemoteAgent remote = spec.RemoteAgent ?? throw new InvalidOperationException("Remote invocation contract is missing.");
                    RequireUnexpired(remote);
                    if (!Uri.TryCreate(remote.EndpointUrl, UriKind.Absolute, out Uri? endpoint) || (endpoint.Scheme != "http" && endpoint.Scheme != "https") || endpoint.UserInfo.Length > 0 || endpoint.Fragment.Length > 0)
                        throw new InvalidOperationException("Remote endpoint must be an absolute HTTP URL without embedded credentials or a fragment.");
                    if (remote.Protocol == RemoteProtocolEnum.A2A && spec.Executor != RunExecutorEnum.RemoteA2A || remote.Protocol == RemoteProtocolEnum.Mcp && spec.Executor != RunExecutorEnum.RemoteMcp)
                        throw new InvalidOperationException("Remote protocol does not match executor.");
                    await reporter.StartedAsync(null, linked.Token).ConfigureAwait(false);
                    if (remote.Protocol == RemoteProtocolEnum.A2A) complete = await ExecuteA2AAsync(assignment, remote, reporter, linked.Token).ConfigureAwait(false);
                    else complete = await ExecuteMcpAsync(spec, remote, reporter, linked.Token).ConfigureAwait(false);
                    complete.ResultText = Clean(complete.ResultText, spec.ScrubValues);
                    complete.StructuredOutputJson = Clean(complete.StructuredOutputJson, spec.ScrubValues);
                    long bytes = System.Text.Encoding.UTF8.GetByteCount(complete.ResultText ?? String.Empty) + System.Text.Encoding.UTF8.GetByteCount(complete.StructuredOutputJson ?? String.Empty);
                    if (spec.MaxOutputBytes > 0 && bytes > spec.MaxOutputBytes)
                    {
                        complete.Status = RunStatusEnum.Failed;
                        complete.Outcome = RunOutcomeEnum.OutputLimitExceeded;
                        complete.ResultText = null;
                        complete.StructuredOutputJson = null;
                        complete.ErrorMessage = "Remote result exceeded the run output limit.";
                    }
                    else if (complete.Status == RunStatusEnum.Succeeded)
                        reporter.Emit(new RunEventReport { EventType = RunEventTypeEnum.Result, Text = complete.ResultText });
                }
                catch (OperationCanceledException)
                {
                    complete.Status = token.IsCancellationRequested ? RunStatusEnum.Cancelled : RunStatusEnum.TimedOut;
                    complete.Outcome = token.IsCancellationRequested ? RunOutcomeEnum.Cancelled : RunOutcomeEnum.TimedOut;
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    complete.Status = RunStatusEnum.Failed;
                    complete.Outcome = RunOutcomeEnum.HarnessFailed;
                    complete.ErrorMessage = Clean(e.Message, spec.ScrubValues);
                }
            }
            complete.CompletedUtc = DateTime.UtcNow;
            return complete;
        }

        /// <inheritdoc />
        public void Release(RunAssignment assignment, bool succeeded)
        {
            if (assignment == null) throw new ArgumentNullException(nameof(assignment));
        }

        private static async Task<RunCompleteRequest> ExecuteMcpAsync(ExecutionSpec spec, ExecutionRemoteAgent remote, IRunReporter reporter, CancellationToken token)
        {
            Dictionary<string, object?> arguments = JsonSerializer.Deserialize<Dictionary<string, object?>>(remote.Input, Serializer.Options)
                ?? throw new InvalidOperationException("Remote MCP input must be a JSON object.");
            if (String.IsNullOrWhiteSpace(remote.ToolName)) throw new InvalidOperationException("Remote MCP tool name is missing.");
            Uri endpoint = new Uri(remote.EndpointUrl);
            using (McpHttpClient client = new McpHttpClient(OutboundAddressPolicy.CreateHandler(), true))
            {
                if (!String.IsNullOrEmpty(remote.BearerToken)) client.SetRequestHeader("Authorization", "Bearer " + remote.BearerToken);
                if (!await client.ConnectStreamableAsync(endpoint.GetLeftPart(UriPartial.Authority), endpoint.PathAndQuery, token).ConfigureAwait(false))
                    throw new InvalidOperationException("Remote MCP health check could not initialize the endpoint.");
                bool found = false;
                string? cursor = null;
                for (int page = 0; page < 100; page++)
                {
                    RemoteMcpTools tools = await client.CallAsync<RemoteMcpTools>("tools/list", cursor == null ? new { } : (object)new { cursor }, Math.Max(1000, Math.Min(spec.TimeoutSeconds, 1800) * 1000), token).ConfigureAwait(false);
                    if (tools.Tools.Any(t => t.Name == remote.ToolName)) { found = true; break; }
                    cursor = tools.NextCursor;
                    if (String.IsNullOrEmpty(cursor)) break;
                }
                if (!found) throw new InvalidOperationException("Remote MCP health check did not advertise the registered tool.");
                reporter.Emit(new RunEventReport { EventType = RunEventTypeEnum.Lifecycle, Code = "RemoteHealthy", Text = "Remote MCP endpoint initialized and advertised the registered tool." });
                RequireUnexpired(remote);
                RemoteMcpResult result = await client.CallAsync<RemoteMcpResult>("tools/call", new { name = remote.ToolName, arguments }, Math.Max(1000, Math.Min(spec.TimeoutSeconds, 1800) * 1000), token).ConfigureAwait(false);
                return new RunCompleteRequest
                {
                    Status = result.IsError ? RunStatusEnum.Failed : RunStatusEnum.Succeeded,
                    Outcome = result.IsError ? RunOutcomeEnum.HarnessFailed : RunOutcomeEnum.Succeeded,
                    ResultText = String.Join("\n", result.Content.Where(c => c.Type == "text").Select(c => c.Text)),
                    StructuredOutputJson = result.StructuredContent == null ? null : Serializer.Serialize(result.StructuredContent),
                    ErrorMessage = result.IsError ? "Remote MCP tool reported an error." : null
                };
            }
        }

        private static async Task<RunCompleteRequest> ExecuteA2AAsync(RunAssignment assignment, ExecutionRemoteAgent remote, IRunReporter reporter, CancellationToken token)
        {
            using (HttpClient http = new HttpClient(OutboundAddressPolicy.CreateHandler(), true))
            using (A2AClient client = new A2AClient(remote.EndpointUrl, http))
            {
                http.Timeout = Timeout.InfiniteTimeSpan;
                if (!String.IsNullOrEmpty(remote.BearerToken)) http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", remote.BearerToken);
                using (A2ACardResolver resolver = new A2ACardResolver(http))
                    await resolver.GetAgentCardAsync(remote.EndpointUrl, token).ConfigureAwait(false);
                reporter.Emit(new RunEventReport { EventType = RunEventTypeEnum.Lifecycle, Code = "RemoteHealthy", Text = "Remote A2A endpoint returned its agent card." });
                AgentTask? task = null;
                try
                {
                    RequireUnexpired(remote);
                    SendMessageResponse response = await client.SendMessageAsync(new SendMessageRequest
                    {
                        Message = new Message { MessageId = assignment.RunId, Role = Role.User, Parts = new List<Part> { new Part { Text = remote.Input } } },
                        Configuration = new SendMessageConfiguration { ReturnImmediately = false }
                    }, token).ConfigureAwait(false);
                    task = response.Task;
                    while (task != null && (task.Status.State == TaskState.Submitted || task.Status.State == TaskState.Working))
                    {
                        await Task.Delay(250, token).ConfigureAwait(false);
                        task = await client.GetTaskAsync(new GetTaskRequest { Id = task.Id }, token).ConfigureAwait(false);
                    }
                    bool success = task == null ? response.Message != null : task.Status.State == TaskState.Completed;
                    IEnumerable<Part> parts = task?.Artifacts?.SelectMany(a => a.Parts)
                        ?? response.Message?.Parts ?? task?.Status.Message?.Parts ?? new List<Part>();
                    return new RunCompleteRequest
                    {
                        Status = success ? RunStatusEnum.Succeeded : task?.Status.State == TaskState.Canceled ? RunStatusEnum.Cancelled : RunStatusEnum.Failed,
                        Outcome = success ? RunOutcomeEnum.Succeeded : task?.Status.State == TaskState.Canceled ? RunOutcomeEnum.Cancelled : RunOutcomeEnum.HarnessFailed,
                        ResultText = String.Join("\n", parts.Where(p => p.Text != null).Select(p => p.Text)),
                        ErrorMessage = success ? null : "Remote A2A task ended in state " + task?.Status.State + "."
                    };
                }
                catch (OperationCanceledException) when (task != null)
                {
                    // If a task ID is known, ask the remote peer to cancel. The bounded best-effort call cannot guarantee
                    // rollback of already completed external effects. No request is replayed after a transport failure.
                    using (CancellationTokenSource cancel = new CancellationTokenSource(TimeSpan.FromSeconds(2)))
                    {
                        try { await client.CancelTaskAsync(new CancelTaskRequest { Id = task.Id }, cancel.Token).ConfigureAwait(false); }
                        catch (Exception) { }
                    }
                    throw;
                }
            }
        }

        private static void RequireUnexpired(ExecutionRemoteAgent remote)
        {
            if (remote.ExpiresUtc.HasValue && remote.ExpiresUtc.Value <= DateTime.UtcNow)
                throw new InvalidOperationException("RemoteRegistrationExpired: registration expired before dispatch.");
        }

        private static string? Clean(string? value, IEnumerable<string> secrets)
        {
            if (value == null) return null;
            foreach (string secret in secrets.Where(s => !String.IsNullOrEmpty(s)).OrderByDescending(s => s.Length)) value = value.Replace(secret, "[REDACTED]", StringComparison.Ordinal);
            return value;
        }
    }
}
