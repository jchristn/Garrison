namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Runtime.CompilerServices;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Runs: create, list, read, cancel, retry, events (poll and stream), children, delete.
    /// </summary>
    public class RunsClient : ClientBase
    {
        #region Public-Members

        /// <summary>
        /// Poll interval used by WaitForCompletionAsync, in milliseconds. Minimum 100, maximum 60000, default 500.
        /// </summary>
        public int PollIntervalMs
        {
            get
            {
                return _PollIntervalMs;
            }
            set
            {
                _PollIntervalMs = Math.Clamp(value, 100, 60000);
            }
        }

        #endregion

        #region Private-Members

        private int _PollIntervalMs = 500;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public RunsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Create a run.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Run (finished when Wait was set and it completed in time).</returns>
        public async Task<Run> CreateAsync(RunCreateRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<Run>(HttpMethod.Post, TenantPath("/runs"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read a run.
        /// </summary>
        /// <param name="id">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Run.</returns>
        public async Task<Run> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Run>(HttpMethod.Get, TenantPath("/runs/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// List runs.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Run>> ListAsync(RunFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["status"] = filter.Status?.ToString();
                query["agentId"] = filter.AgentId;
                query["deploymentId"] = filter.DeploymentId;
                query["harnessType"] = filter.HarnessType?.ToString();
                query["nodeId"] = filter.NodeId;
                query["parentRunId"] = filter.ParentRunId;
                query["rootRunId"] = filter.RootRunId;
                query["outcome"] = filter.Outcome?.ToString();
                query["callerId"] = filter.CallerId;
                query["conversationId"] = filter.ConversationId;
                query["triggerId"] = filter.TriggerId;
                query["fromUtc"] = QueryBuilder.Date(filter.FromUtc);
                query["toUtc"] = QueryBuilder.Date(filter.ToUtc);
                query["skip"] = filter.Skip.ToString();
                query["maxResults"] = filter.MaxResults.ToString();
                query["ordering"] = filter.Ordering.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<Run>>(HttpMethod.Get, TenantPath("/runs"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<Run>();
        }

        /// <summary>
        /// Cancel a run.
        /// </summary>
        /// <param name="id">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Updated run.</returns>
        public async Task<Run> CancelAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Run>(HttpMethod.Post, TenantPath("/runs/" + Segment(id) + "/cancel"), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Retry a finished run as a new run.
        /// </summary>
        /// <param name="id">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>New run.</returns>
        public async Task<Run> RetryAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Run>(HttpMethod.Post, TenantPath("/runs/" + Segment(id) + "/retry"), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read events after a sequence.
        /// </summary>
        /// <param name="id">Run identifier.</param>
        /// <param name="afterSequence">Exclusive lower bound.</param>
        /// <param name="limit">Maximum events.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Events.</returns>
        public async Task<RunEventsResponse> GetEventsAsync(string id, long afterSequence = 0, int limit = 500, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?> { { "afterSequence", afterSequence.ToString() }, { "limit", limit.ToString() } };
            return await Transport.SendAsync<RunEventsResponse>(HttpMethod.Get, TenantPath("/runs/" + Segment(id) + "/events"), null, query, token: token).ConfigureAwait(false) ?? new RunEventsResponse();
        }

        /// <summary>
        /// Stream a run's events until it finishes. The last item is run.completed with the final run.
        /// </summary>
        /// <param name="id">Run identifier.</param>
        /// <param name="afterSequence">Exclusive lower bound.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Stream items.</returns>
        public async IAsyncEnumerable<RunStreamEvent> StreamAsync(string id, long afterSequence = 0, [EnumeratorCancellation] CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?> { { "afterSequence", afterSequence.ToString() } };
            await foreach (SseMessage message in Transport.StreamAsync(TenantPath("/runs/" + Segment(id) + "/events/stream"), query, token).ConfigureAwait(false))
            {
                RunStreamEvent item = new RunStreamEvent();
                item.Name = message.Event ?? "message";
                item.Data = message.Data;
                if (item.Name == "run.event") item.Event = JsonSerializer.Deserialize<RunEvent>(message.Data, GarrisonTransport.JsonOptions);
                else if (item.Name == "run.completed") item.Run = JsonSerializer.Deserialize<Run>(message.Data, GarrisonTransport.JsonOptions);
                yield return item;
                if (item.Name == "run.completed") yield break;
            }
        }

        /// <summary>
        /// Runs delegated by a run.
        /// </summary>
        /// <param name="id">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Children.</returns>
        public async Task<EnumerationResult<Run>> ChildrenAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<EnumerationResult<Run>>(HttpMethod.Get, TenantPath("/runs/" + Segment(id) + "/children"), token: token).ConfigureAwait(false) ?? new EnumerationResult<Run>();
        }

        /// <summary>
        /// Delete a finished run.
        /// </summary>
        /// <param name="id">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, TenantPath("/runs/" + Segment(id)), token: token).ConfigureAwait(false);
        }

        /// <summary>
        /// Poll a run until it reaches a terminal status or the timeout elapses.
        /// </summary>
        /// <param name="id">Run identifier.</param>
        /// <param name="timeout">Maximum wait.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Latest run.</returns>
        public async Task<Run> WaitForCompletionAsync(string id, TimeSpan timeout, CancellationToken token = default)
        {
            DateTime deadline = DateTime.UtcNow + timeout;
            while (true)
            {
                Run run = await GetAsync(id, token).ConfigureAwait(false);
                if (IsTerminal(run.Status) || DateTime.UtcNow >= deadline) return run;
                await Task.Delay(_PollIntervalMs, token).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Whether a status is terminal.
        /// </summary>
        /// <param name="status">Status.</param>
        /// <returns>True when terminal.</returns>
        public static bool IsTerminal(RunStatusEnum status)
        {
            return status == RunStatusEnum.Succeeded || status == RunStatusEnum.Failed || status == RunStatusEnum.Cancelled || status == RunStatusEnum.TimedOut || status == RunStatusEnum.Rejected;
        }

        #endregion
    }
}
