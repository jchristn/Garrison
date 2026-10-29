namespace Garrison.Server.WebSockets
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Collections.Specialized;
    using System.Linq;
    using System.Net.WebSockets;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.WebSockets;

    /// <summary>
    /// WebSocket live updates at /v1.0/ws (documented in WEBSOCKETS_API.md). Clients authenticate with a token query
    /// parameter or a first auth message, then subscribe to runs, run:{id}, or nodes. The server tails the database, so
    /// updates made on any replica are delivered. Thread-safe.
    /// </summary>
    public class LiveUpdatesHandler
    {
        #region Public-Members

        /// <summary>
        /// Poll interval for subscriptions in milliseconds. Minimum 200, maximum 30000, default 1000.
        /// </summary>
        public int PollMs
        {
            get
            {
                return _PollMs;
            }
            set
            {
                _PollMs = Math.Clamp(value, 200, 30000);
            }
        }

        /// <summary>
        /// Most subscriptions one WebSocket session may hold at a time; each one polls the database. A subscribe beyond the
        /// cap answers an error with code TooManySubscriptions. Minimum 1, maximum 1024, default 64.
        /// </summary>
        public int MaxSubscriptionsPerSession
        {
            get
            {
                return _MaxSubscriptionsPerSession;
            }
            set
            {
                _MaxSubscriptionsPerSession = Math.Clamp(value, 1, 1024);
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Context;
        private readonly RunEventService _Events;
        private readonly BlockedRunService _Blocked;
        private int _PollMs = 1000;
        private int _MaxSubscriptionsPerSession = 64;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <param name="events">Run event service.</param>
        /// <param name="blocked">Blocked-run evaluator (fills blockedReason on pushed runs).</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public LiveUpdatesHandler(ServerContext context, RunEventService events, BlockedRunService blocked)
        {
            _Blocked = blocked ?? throw new ArgumentNullException(nameof(blocked));
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _Events = events ?? throw new ArgumentNullException(nameof(events));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Handle one WebSocket session.
        /// </summary>
        /// <param name="http">HTTP context of the upgrade request.</param>
        /// <param name="session">Session.</param>
        /// <returns>Task.</returns>
        public async Task HandleAsync(HttpContextBase http, WebSocketSession session)
        {
            // The socket closes when the client leaves or when the replica starts draining; the dashboard reconnects
            // (to another replica) by itself.
            _Context.Activity.StreamOpened();
            StreamTelemetry.WebSocketOpened();
            try
            {
                using (CancellationTokenSource lifetime = CancellationTokenSource.CreateLinkedTokenSource(http.Token, _Context.Stopping))
                {
                    await HandleSessionAsync(http, session, lifetime.Token).ConfigureAwait(false);
                }
            }
            finally
            {
                _Context.Activity.StreamClosed();
                StreamTelemetry.WebSocketClosed();
            }
        }

        #endregion

        #region Private-Methods

        private async Task HandleSessionAsync(HttpContextBase http, WebSocketSession session, CancellationToken token)
        {
            RequestContext? ctx = null;
            string? queryToken = QueryValue(http.Request.Url.RawWithQuery, "token");
            if (!String.IsNullOrEmpty(queryToken)) ctx = await AuthenticateAsync(queryToken, http.Request.Source.IpAddress, token).ConfigureAwait(false);

            ConcurrentDictionary<string, SubscriptionState> subscriptions = new ConcurrentDictionary<string, SubscriptionState>(StringComparer.Ordinal);
            SemaphoreSlim sendLock = new SemaphoreSlim(1, 1);
            using (CancellationTokenSource pumpCts = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                Task pump = Task.Run(() => PumpAsync(session, () => ctx, subscriptions, sendLock, pumpCts.Token));
                try
                {
                    if (ctx != null) await SendAsync(session, sendLock, new { type = "welcome", principal = ctx.PrincipalName, tenantId = ctx.TenantId }, token).ConfigureAwait(false);

                    await foreach (WebSocketMessage message in session.ReadMessagesAsync(token).ConfigureAwait(false))
                    {
                        StreamTelemetry.WebSocketMessage("received");
                        if (message.MessageType != WebSocketMessageType.Text || String.IsNullOrEmpty(message.Text)) continue;
                        ClientMessage? request;
                        try
                        {
                            request = Serializer.Deserialize<ClientMessage>(message.Text);
                        }
                        catch (JsonException)
                        {
                            await SendAsync(session, sendLock, new { type = "error", code = "InvalidJson", message = "Messages must be JSON objects with a type." }, token).ConfigureAwait(false);
                            continue;
                        }
                        if (request == null) continue;

                        if (request.Type == "auth")
                        {
                            ctx = await AuthenticateAsync(request.Token, http.Request.Source.IpAddress, token).ConfigureAwait(false);
                            if (ctx == null) await SendAsync(session, sendLock, new { type = "error", code = "AuthenticationRequired", message = "Token is invalid." }, token).ConfigureAwait(false);
                            else await SendAsync(session, sendLock, new { type = "welcome", principal = ctx.PrincipalName, tenantId = ctx.TenantId }, token).ConfigureAwait(false);
                            continue;
                        }
                        if (request.Type == "ping")
                        {
                            await SendAsync(session, sendLock, new { type = "pong" }, token).ConfigureAwait(false);
                            continue;
                        }
                        if (ctx == null)
                        {
                            await SendAsync(session, sendLock, new { type = "error", code = "AuthenticationRequired", message = "Send an auth message or connect with ?token=." }, token).ConfigureAwait(false);
                            continue;
                        }
                        if (request.Type == "subscribe" && !String.IsNullOrEmpty(request.Channel))
                        {
                            if (!subscriptions.ContainsKey(request.Channel) && subscriptions.Count >= _MaxSubscriptionsPerSession)
                            {
                                await SendAsync(session, sendLock, new { type = "error", code = "TooManySubscriptions", channel = request.Channel, message = "This session already holds " + _MaxSubscriptionsPerSession + " subscriptions. Unsubscribe from one first." }, token).ConfigureAwait(false);
                                continue;
                            }
                            string? denial = await AuthorizeChannelAsync(ctx, request.Channel, token).ConfigureAwait(false);
                            if (denial != null)
                            {
                                await SendAsync(session, sendLock, new { type = "error", code = "SubscriptionDenied", channel = request.Channel, message = denial }, token).ConfigureAwait(false);
                                continue;
                            }
                            subscriptions[request.Channel] = new SubscriptionState();
                            await SendAsync(session, sendLock, new { type = "subscribed", channel = request.Channel }, token).ConfigureAwait(false);
                        }
                        else if (request.Type == "unsubscribe" && !String.IsNullOrEmpty(request.Channel))
                        {
                            subscriptions.TryRemove(request.Channel, out SubscriptionState? _);
                            await SendAsync(session, sendLock, new { type = "unsubscribed", channel = request.Channel }, token).ConfigureAwait(false);
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                }
                catch (WebSocketException)
                {
                }
                finally
                {
                    pumpCts.Cancel();
                    try
                    {
                        await pump.ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                    }
                    sendLock.Dispose();
                }
            }
        }


        private async Task<RequestContext?> AuthenticateAsync(string? token, string? sourceIp, CancellationToken cancel)
        {
            if (String.IsNullOrEmpty(token)) return null;
            NameValueCollection headers = new NameValueCollection();
            headers["Authorization"] = "Bearer " + token;
            RequestContext ctx = await _Context.Authentication.ResolveAsync(headers, "GET", "/v1.0/ws", null, null, sourceIp, cancel).ConfigureAwait(false);
            return ctx.IsAuthenticated ? ctx : null;
        }

        private async Task<string?> AuthorizeChannelAsync(RequestContext ctx, string channel, CancellationToken token)
        {
            if (channel == "nodes")
            {
                AuthorizationDecision nodes = await _Context.Authorization.AuthorizeAsync(ctx, null, ResourceTypeEnum.Node, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                return nodes.Permitted ? null : nodes.Reason;
            }
            if (String.IsNullOrEmpty(ctx.TenantId)) return "Subscriptions to runs require a tenant-bound session.";
            if (channel == "approvals")
            {
                AuthorizationDecision approvals = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.Approval, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                return approvals.Permitted ? null : approvals.Reason;
            }
            if (channel.StartsWith("pipeline-run:", StringComparison.Ordinal))
            {
                // One pipeline run's status, stages, stage runs, and reviews (P12.9).
                string pipelineRunId = channel.Substring("pipeline-run:".Length);
                AuthorizationDecision pipelineRuns = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.PipelineRun, OperationTypeEnum.Read, pipelineRunId, token).ConfigureAwait(false);
                if (!pipelineRuns.Permitted) return pipelineRuns.Reason;
                if (String.IsNullOrEmpty(pipelineRunId) || await _Context.Database.PipelineRuns.ReadAsync(ctx.TenantId, pipelineRunId, token).ConfigureAwait(false) == null) return "Pipeline run not found.";
                return null;
            }
            if (channel.StartsWith("conversation-files:", StringComparison.Ordinal))
            {
                // One conversation's file space (AD3.6): files.changed with the changed paths and versions.
                string conversationId = channel.Substring("conversation-files:".Length);
                AuthorizationDecision conversations = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.Conversation, OperationTypeEnum.Read, conversationId, token).ConfigureAwait(false);
                if (!conversations.Permitted) return conversations.Reason;
                if (String.IsNullOrEmpty(conversationId) || await _Context.Database.Conversations.ReadAsync(ctx.TenantId, conversationId, token).ConfigureAwait(false) == null) return "Conversation not found.";
                return null;
            }
            if (channel.StartsWith("fan-out:", StringComparison.Ordinal))
            {
                // One fan-out group (AD5.7): fan-out.status with members and statuses; Read on the parent run decides.
                string groupId = channel.Substring("fan-out:".Length);
                FanOutGroup? group = String.IsNullOrEmpty(groupId) ? null : await _Context.Database.FanOuts.ReadAsync(ctx.TenantId, groupId, token).ConfigureAwait(false);
                if (group == null) return "Fan-out group not found.";
                AuthorizationDecision parent = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.Run, OperationTypeEnum.Read, group.ParentRunId, token).ConfigureAwait(false);
                if (!parent.Permitted) return parent.Reason;
                if (ctx.PrincipalType == PrincipalTypeEnum.Run && ctx.RunId != group.ParentRunId) return "Fan-out group not found.";
                return null;
            }
            string? runId = channel.StartsWith("run:", StringComparison.Ordinal) ? channel.Substring(4) : null;
            if (channel != "runs" && runId == null) return "Unknown channel. Use runs, run:{id}, pipeline-run:{id}, conversation-files:{id}, fan-out:{id}, approvals, or nodes.";
            AuthorizationDecision runs = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.Run, OperationTypeEnum.Read, runId, token).ConfigureAwait(false);
            if (!runs.Permitted) return runs.Reason;
            if (runId != null && await _Context.Database.Runs.ReadAsync(ctx.TenantId, runId, token).ConfigureAwait(false) == null) return "Run not found.";
            return null;
        }

        private async Task PumpAsync(WebSocketSession session, Func<RequestContext?> context, ConcurrentDictionary<string, SubscriptionState> subscriptions, SemaphoreSlim sendLock, CancellationToken token)
        {
            while (!token.IsCancellationRequested && session.IsConnected)
            {
                try
                {
                    RequestContext? ctx = context();
                    if (ctx != null)
                    {
                        foreach (KeyValuePair<string, SubscriptionState> subscription in subscriptions.ToList())
                        {
                            if (subscription.Key == "runs") await PumpRunsAsync(session, ctx, subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key == "nodes") await PumpNodesAsync(session, subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key == "approvals") await PumpApprovalsAsync(session, ctx, subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("run:", StringComparison.Ordinal)) await PumpRunAsync(session, ctx, subscription.Key.Substring(4), subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("pipeline-run:", StringComparison.Ordinal)) await PumpPipelineRunAsync(session, ctx, subscription.Key.Substring("pipeline-run:".Length), subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("conversation-files:", StringComparison.Ordinal)) await PumpConversationFilesAsync(session, ctx, subscription.Key.Substring("conversation-files:".Length), subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("fan-out:", StringComparison.Ordinal)) await PumpFanOutAsync(session, ctx, subscription.Key.Substring("fan-out:".Length), subscription.Value, sendLock, token).ConfigureAwait(false);
                        }
                    }
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Context.Logging.Debug("[LiveUpdates] pump error: " + e.Message);
                }
                await Task.Delay(_PollMs, token).ConfigureAwait(false);
            }
        }

        private async Task PumpRunsAsync(WebSocketSession session, RequestContext ctx, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            RunFilter filter = new RunFilter();
            filter.TenantId = ctx.TenantId;
            filter.MaxResults = 25;
            EnumerationResult<Run> page = await _Context.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
            string fingerprint = String.Join("|", page.Objects.Select(r => r.Id + ":" + r.Status + ":" + r.LastEventSequence + ":" + r.PendingApprovals));
            await _Blocked.AnnotateManyAsync(page.Objects, token).ConfigureAwait(false);
            fingerprint += "|" + String.Join(",", page.Objects.Where(r => r.BlockedReason != null).Select(r => r.Id + ":" + r.BlockedReason));
            if (fingerprint == state.Fingerprint) return;
            state.Fingerprint = fingerprint;
            await SendAsync(session, sendLock, new { type = "runs.changed", runs = page.Objects }, token).ConfigureAwait(false);
        }

        private async Task PumpApprovalsAsync(WebSocketSession session, RequestContext ctx, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            // Pending permission approvals of the tenant (P12.3): pushed whenever the set changes, so an inbox or a hook can
            // react without polling REST.
            ApprovalFilter filter = new ApprovalFilter();
            filter.TenantId = ctx.TenantId;
            filter.Status = ApprovalStatusEnum.Pending;
            filter.MaxResults = 100;
            EnumerationResult<Approval> page = await _Context.Database.Approvals.EnumerateAsync(filter, token).ConfigureAwait(false);

            // Pending pipeline stage reviews (P12.9) share the Approvals inbox and its badge, so their count rides along.
            long reviewsPending = await _Context.Database.PipelineReviews.CountPendingAsync(ctx.TenantId, token).ConfigureAwait(false);
            string fingerprint = page.TotalRecords + "|" + reviewsPending + "|" + String.Join("|", page.Objects.Select(a => a.Id));
            if (fingerprint == state.Fingerprint) return;
            state.Fingerprint = fingerprint;
            await SendAsync(session, sendLock, new { type = "approvals.changed", pending = page.TotalRecords, reviewsPending = reviewsPending, approvals = page.Objects }, token).ConfigureAwait(false);
        }

        private async Task PumpNodesAsync(WebSocketSession session, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = 500;
            EnumerationResult<Node> page = await _Context.Database.Nodes.EnumerateAsync(query, token).ConfigureAwait(false);
            string fingerprint = String.Join("|", page.Objects.Select(n => n.Id + ":" + n.Status + ":" + n.ActiveRuns));
            if (fingerprint == state.Fingerprint) return;
            state.Fingerprint = fingerprint;
            await SendAsync(session, sendLock, new { type = "nodes", nodes = page.Objects }, token).ConfigureAwait(false);
        }

        private async Task PumpRunAsync(WebSocketSession session, RequestContext ctx, string runId, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            Run? run = await _Context.Database.Runs.ReadAsync(ctx.TenantId!, runId, token).ConfigureAwait(false);
            if (run == null) return;
            Garrison.Core.Responses.RunEventsResponse batch = await _Events.ReadAsync(run, state.LastSequence, 500, token).ConfigureAwait(false);
            foreach (RunEvent evt in batch.Events)
            {
                await SendAsync(session, sendLock, new { type = "run.event", runId = run.Id, @event = evt }, token).ConfigureAwait(false);
                state.LastSequence = evt.Sequence;
            }
            string status = run.Status + ":" + run.PendingApprovals;
            if (status != state.Fingerprint)
            {
                state.Fingerprint = status;
                await SendAsync(session, sendLock, new { type = "run.status", run }, token).ConfigureAwait(false);
            }
        }

        private async Task PumpPipelineRunAsync(WebSocketSession session, RequestContext ctx, string pipelineRunId, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            PipelineRun? run = await _Context.Database.PipelineRuns.ReadAsync(ctx.TenantId!, pipelineRunId, token).ConfigureAwait(false);
            if (run == null) return;
            PipelineService? pipelines = _Context.TryGet<PipelineService>();
            if (pipelines != null) await pipelines.DetailAsync(run, token).ConfigureAwait(false);
            string fingerprint = run.Status + ":" + run.CasVersion + ":" + String.Join(",", run.Stages.Select(s => s.Status + "/" + s.Executions + "/" + s.CurrentRunId))
                + ":" + String.Join(",", run.Runs.Select(r => r.RunId + "/" + r.Status)) + ":" + String.Join(",", run.Reviews.Select(r => r.Id + "/" + r.Status));
            if (fingerprint == state.Fingerprint) return;
            state.Fingerprint = fingerprint;
            await SendAsync(session, sendLock, new { type = "pipeline-run.status", pipelineRun = run }, token).ConfigureAwait(false);
        }

        private async Task PumpFanOutAsync(WebSocketSession session, RequestContext ctx, string groupId, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            FanOutGroup? group = await _Context.Database.FanOuts.ReadAsync(ctx.TenantId!, groupId, token).ConfigureAwait(false);
            FanOutService? fanOuts = _Context.TryGet<FanOutService>();
            if (group == null || fanOuts == null) return;
            Garrison.Core.Responses.FanOutGroupView view = await fanOuts.ViewAsync(group, false, token).ConfigureAwait(false);
            string fingerprint = view.Status + ":" + view.CostUsd.ToString(System.Globalization.CultureInfo.InvariantCulture) + ":" + view.Tokens + ":" + String.Join(",", view.Members.Select(m => m.RunId + "/" + m.Status));
            if (fingerprint == state.Fingerprint) return;
            state.Fingerprint = fingerprint;
            await SendAsync(session, sendLock, new { type = "fan-out.status", fanOutGroup = view }, token).ConfigureAwait(false);
        }

        private async Task PumpConversationFilesAsync(WebSocketSession session, RequestContext ctx, string conversationId, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            ConversationFileSpace? space = await _Context.Database.FileSpaces.ReadByOwnerAsync(ctx.TenantId!, "cnv:" + conversationId, token).ConfigureAwait(false);
            if (space == null) return;
            List<ConversationFile> files = await _Context.Database.FileSpaces.ListFilesAsync(ctx.TenantId!, space.Id, true, token).ConfigureAwait(false);
            string fingerprint = String.Join("|", files.Select(f => f.Path + "=" + f.CurrentVersion + (f.Deleted ? "d" : String.Empty)));
            if (fingerprint == state.Fingerprint) return;
            HashSet<string> before = new HashSet<string>((state.Fingerprint ?? String.Empty).Split('|', StringSplitOptions.RemoveEmptyEntries), StringComparer.Ordinal);
            bool first = state.Fingerprint == null;
            state.Fingerprint = fingerprint;
            List<object> changed = files.Where(f => first || !before.Contains(f.Path + "=" + f.CurrentVersion + (f.Deleted ? "d" : String.Empty)))
                .Select(f => (object)new { path = f.Path, version = f.CurrentVersion, deleted = f.Deleted, sha256 = f.Sha256, sizeBytes = f.SizeBytes }).ToList();
            await SendAsync(session, sendLock, new { type = "files.changed", conversationId = conversationId, fileSpaceId = space.Id, changed = changed }, token).ConfigureAwait(false);
        }

        private static async Task SendAsync(WebSocketSession session, SemaphoreSlim sendLock, object message, CancellationToken token)
        {
            await sendLock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                if (session.IsConnected)
                {
                    await session.SendTextAsync(Serializer.Serialize(message), token).ConfigureAwait(false);
                    StreamTelemetry.WebSocketMessage("sent");
                }
            }
            finally
            {
                sendLock.Release();
            }
        }

        private static string? QueryValue(string? rawWithQuery, string key)
        {
            if (String.IsNullOrEmpty(rawWithQuery)) return null;
            int index = rawWithQuery.IndexOf('?');
            if (index < 0) return null;
            foreach (string pair in rawWithQuery.Substring(index + 1).Split('&'))
            {
                int eq = pair.IndexOf('=');
                if (eq <= 0) continue;
                if (Uri.UnescapeDataString(pair.Substring(0, eq)) == key) return Uri.UnescapeDataString(pair.Substring(eq + 1));
            }
            return null;
        }

        #endregion
    }
}
