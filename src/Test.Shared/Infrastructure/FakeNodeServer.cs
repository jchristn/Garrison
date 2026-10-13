namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Protocol;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using WatsonWebserver;
    using WatsonWebserver.Core;

    /// <summary>
    /// Minimal in-process control plane implementing the node protocol for worker tests. Hands out queued assignments,
    /// records events and completions, and can fail the first N event calls to exercise buffering.
    /// </summary>
    public sealed class FakeNodeServer : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Base URL.
        /// </summary>
        public string BaseUrl { get; }

        /// <summary>
        /// Assignments waiting to be leased.
        /// </summary>
        public ConcurrentQueue<RunAssignment> Pending { get; } = new ConcurrentQueue<RunAssignment>();

        /// <summary>
        /// Events received, in arrival order.
        /// </summary>
        public ConcurrentQueue<RunEventReport> Events { get; } = new ConcurrentQueue<RunEventReport>();

        /// <summary>Event requests including failed delivery attempts, for replay assertions.</summary>
        public ConcurrentQueue<RunEventsRequest> EventAttempts { get; } = new ConcurrentQueue<RunEventsRequest>();

        /// <summary>
        /// Completions received keyed by run identifier.
        /// </summary>
        public ConcurrentDictionary<string, RunCompleteRequest> Completions { get; } = new ConcurrentDictionary<string, RunCompleteRequest>();

        /// <summary>
        /// Runs reported as started.
        /// </summary>
        public ConcurrentDictionary<string, RunStartedRequest> Started { get; } = new ConcurrentDictionary<string, RunStartedRequest>();

        /// <summary>
        /// Registrations received.
        /// </summary>
        public ConcurrentQueue<NodeRegisterRequest> Registrations { get; } = new ConcurrentQueue<NodeRegisterRequest>();

        /// <summary>
        /// Run identifiers whose run-scoped calls return 409.
        /// </summary>
        public ConcurrentDictionary<string, bool> StaleRuns { get; } = new ConcurrentDictionary<string, bool>();

        /// <summary>
        /// Run identifiers returned as CancelRunIds on the next heartbeat.
        /// </summary>
        public ConcurrentQueue<string> CancelRequests { get; } = new ConcurrentQueue<string>();

        #endregion

        #region Private-Members

        private readonly Webserver _Server;
        private int _FailEventCalls = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Start the server on a free 127.0.0.1 port.
        /// </summary>
        public FakeNodeServer()
        {
            int port = TestServerHost.FreePort();
            BaseUrl = "http://127.0.0.1:" + port;
            WebserverSettings settings = new WebserverSettings();
            settings.Hostname = "127.0.0.1";
            settings.Port = port;
            _Server = new Webserver(settings, NotFoundAsync);
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.POST, "/v1.0/token", TokenAsync);
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.POST, "/v1.0/api/node/register", RegisterAsync);
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.POST, "/v1.0/api/node/heartbeat", HeartbeatAsync);
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.POST, "/v1.0/api/node/lease", LeaseAsync);
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.POST, "/v1.0/api/node/drain", AckAsync);
            _Server.Routes.PreAuthentication.Parameter.Add(HttpMethod.POST, "/v1.0/api/node/runs/{runId}/started", StartedAsync);
            _Server.Routes.PreAuthentication.Parameter.Add(HttpMethod.POST, "/v1.0/api/node/runs/{runId}/events", EventsAsync);
            _Server.Routes.PreAuthentication.Parameter.Add(HttpMethod.POST, "/v1.0/api/node/runs/{runId}/complete", CompleteAsync);
            _Server.Start();
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Wait until a completion arrives for a run.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="timeout">Timeout.</param>
        /// <returns>Completion.</returns>
        /// <exception cref="TestAssertionException">Thrown on timeout.</exception>
        public async Task<RunCompleteRequest> WaitForCompletionAsync(string runId, TimeSpan timeout)
        {
            DateTime deadline = DateTime.UtcNow + timeout;
            while (DateTime.UtcNow < deadline)
            {
                if (Completions.TryGetValue(runId, out RunCompleteRequest? complete)) return complete;
                await Task.Delay(100).ConfigureAwait(false);
            }
            throw new TestAssertionException("No completion for run " + runId + " within " + timeout.TotalSeconds + " seconds.");
        }

        /// <summary>
        /// Fail the next event calls with 503 to exercise worker buffering.
        /// </summary>
        /// <param name="count">Number of calls to fail.</param>
        public void FailNextEventCalls(int count)
        {
            Interlocked.Exchange(ref _FailEventCalls, count);
        }

        /// <summary>
        /// Stop the server.
        /// </summary>
        public void Dispose()
        {
            _Server.Stop();
            if (_Server is IDisposable disposable) disposable.Dispose();
        }

        #endregion

        #region Private-Methods

        private static Task TokenAsync(HttpContextBase context)
        {
            TokenResponse token = new TokenResponse();
            token.Token = "fake-token";
            token.ExpiresUtc = DateTime.UtcNow.AddHours(1);
            return JsonAsync(context, 200, token);
        }

        private Task RegisterAsync(HttpContextBase context)
        {
            NodeRegisterRequest? request = Serializer.Deserialize<NodeRegisterRequest>(context.Request.DataAsString);
            if (request != null) Registrations.Enqueue(request);
            NodeRegisterResponse response = new NodeRegisterResponse();
            response.NodeId = "nod_fake";
            response.HeartbeatIntervalMs = 500;
            response.LeaseWaitMs = 500;
            return JsonAsync(context, 200, response);
        }

        private Task HeartbeatAsync(HttpContextBase context)
        {
            NodeHeartbeatResponse response = new NodeHeartbeatResponse();
            while (CancelRequests.TryDequeue(out string? runId)) response.CancelRunIds.Add(runId);
            return JsonAsync(context, 200, response);
        }

        private async Task LeaseAsync(HttpContextBase context)
        {
            NodeLeaseResponse response = new NodeLeaseResponse();
            DateTime deadline = DateTime.UtcNow.AddMilliseconds(500);
            while (DateTime.UtcNow < deadline)
            {
                if (Pending.TryDequeue(out RunAssignment? assignment))
                {
                    response.Assignments.Add(assignment);
                    break;
                }
                await Task.Delay(50).ConfigureAwait(false);
            }
            await JsonAsync(context, 200, response).ConfigureAwait(false);
        }

        private Task AckAsync(HttpContextBase context)
        {
            return JsonAsync(context, 200, new NodeAckResponse());
        }

        private Task StartedAsync(HttpContextBase context)
        {
            string runId = context.Request.Url.Parameters["runId"] ?? String.Empty;
            if (StaleRuns.ContainsKey(runId)) return JsonAsync(context, 409, new NodeAckResponse { Accepted = false });
            RunStartedRequest? request = Serializer.Deserialize<RunStartedRequest>(context.Request.DataAsString);
            if (request != null) Started[runId] = request;
            return JsonAsync(context, 200, new NodeAckResponse());
        }

        private Task EventsAsync(HttpContextBase context)
        {
            string runId = context.Request.Url.Parameters["runId"] ?? String.Empty;
            if (StaleRuns.ContainsKey(runId)) return JsonAsync(context, 409, new NodeAckResponse { Accepted = false });
            RunEventsRequest? request = Serializer.Deserialize<RunEventsRequest>(context.Request.DataAsString);
            if (request != null) EventAttempts.Enqueue(request);
            if (Interlocked.Decrement(ref _FailEventCalls) >= 0) return JsonAsync(context, 503, new NodeAckResponse { Accepted = false });
            if (request != null)
            {
                foreach (RunEventReport report in request.Events) Events.Enqueue(report);
            }
            return JsonAsync(context, 200, new NodeAckResponse());
        }

        private Task CompleteAsync(HttpContextBase context)
        {
            string runId = context.Request.Url.Parameters["runId"] ?? String.Empty;
            if (StaleRuns.ContainsKey(runId)) return JsonAsync(context, 409, new NodeAckResponse { Accepted = false });
            RunCompleteRequest? request = Serializer.Deserialize<RunCompleteRequest>(context.Request.DataAsString);
            if (request != null) Completions[runId] = request;
            return JsonAsync(context, 200, new NodeAckResponse());
        }

        private static async Task NotFoundAsync(HttpContextBase context)
        {
            await JsonAsync(context, 404, new NodeAckResponse { Accepted = false }).ConfigureAwait(false);
        }

        private static async Task JsonAsync(HttpContextBase context, int status, object body)
        {
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            await context.Response.Send(Serializer.Serialize(body)).ConfigureAwait(false);
        }

        #endregion
    }
}
