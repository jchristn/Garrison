namespace Garrison.Server.WebSockets
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Collections.Specialized;
    using System.Linq;
    using System.Net.WebSockets;
    using System.Security.Cryptography;
    using System.Text;
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

        /// <summary>
        /// Seconds between spend recomputations for an organization subscription (spend.updated). Minimum 5, maximum 3600,
        /// default 30.
        /// </summary>
        public int OrganizationSpendSeconds
        {
            get
            {
                return _OrganizationSpendSeconds;
            }
            set
            {
                _OrganizationSpendSeconds = Math.Clamp(value, 5, 3600);
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Context;
        private readonly RunEventService _Events;
        private readonly BlockedRunService _Blocked;
        private int _PollMs = 1000;
        private int _MaxSubscriptionsPerSession = 64;
        private int _OrganizationSpendSeconds = 30;

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
            if (channel == "escalations")
            {
                // Escalations of the tenant (AA2.11): raised, answered, expired, and the open count for a badge.
                AuthorizationDecision escalations = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.Escalation, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                return escalations.Permitted ? null : escalations.Reason;
            }
            if (channel == "freezes")
            {
                // Freezes and the kill switch of the tenant (AA3.5): applied, lifted, and kill switch changes.
                AuthorizationDecision freezes = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.Freeze, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                return freezes.Permitted ? null : freezes.Reason;
            }
            if (channel == "reports")
            {
                // Reports filed in the tenant (AA5.8): report.filed for each, in order. The organization channel carries the
                // same event for its members' reports.
                AuthorizationDecision reports = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.Report, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                return reports.Permitted ? null : reports.Reason;
            }
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
            if (channel.StartsWith("studio-draft:", StringComparison.Ordinal))
            {
                // One studio draft (AD7.9): studio-draft.changed with the version, status, changed items, and graph.
                string draftId = channel.Substring("studio-draft:".Length);
                AuthorizationDecision drafts = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.StudioDraft, OperationTypeEnum.Read, draftId, token).ConfigureAwait(false);
                if (!drafts.Permitted) return drafts.Reason;
                StudioDraft? draft = String.IsNullOrEmpty(draftId) ? null : await _Context.Database.StudioDrafts.ReadAsync(ctx.TenantId, draftId, token).ConfigureAwait(false);
                if (draft == null) return "Draft not found.";
                if (ctx.PrincipalType == PrincipalTypeEnum.Run)
                {
                    StudioService.Owner(ctx, out string? owner, out string? _);
                    if (draft.OwnerUserId != owner) return "Draft not found.";
                }
                return null;
            }
            if (channel.StartsWith("mandate:", StringComparison.Ordinal))
            {
                // One mandate (AA1.13): tick.started and tick.completed with the outcome and next wake.
                string mandateId = channel.Substring("mandate:".Length);
                AuthorizationDecision mandates = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.Mandate, OperationTypeEnum.Read, mandateId, token).ConfigureAwait(false);
                if (!mandates.Permitted) return mandates.Reason;
                if (String.IsNullOrEmpty(mandateId) || await _Context.Database.Mandates.ReadAsync(ctx.TenantId!, mandateId, token).ConfigureAwait(false) == null) return "Mandate not found.";
                return null;
            }
            if (channel.StartsWith("organization:", StringComparison.Ordinal))
            {
                // One organization (AA7.12): org.changed when it or its tree changes, report.filed for reports by its
                // members, and spend.updated when its units' spend against their budgets moves.
                string organizationId = channel.Substring("organization:".Length);
                AuthorizationDecision organizations = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                if (!organizations.Permitted) return organizations.Reason;
                if (String.IsNullOrEmpty(organizationId) || await _Context.Database.Organizations.ReadAsync(ctx.TenantId, organizationId, token).ConfigureAwait(false) == null) return "Organization not found.";
                return null;
            }
            if (channel.StartsWith("agent-inbox:", StringComparison.Ordinal))
            {
                // One agent's inbox (AA6.10): message.queued, message.delivered, message.acknowledged, message.expired, and
                // message.rejected for each change to a message addressed to the agent, in order.
                string agentId = channel.Substring("agent-inbox:".Length);
                AuthorizationDecision messages = await _Context.Authorization.AuthorizeAsync(ctx, ctx.TenantId, ResourceTypeEnum.AgentMessage, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                if (!messages.Permitted) return messages.Reason;
                if (String.IsNullOrEmpty(agentId) || await _Context.Database.Agents.ReadAsync(ctx.TenantId, agentId, token).ConfigureAwait(false) == null) return "Agent not found.";
                return null;
            }
            string? runId = channel.StartsWith("run:", StringComparison.Ordinal) ? channel.Substring(4) : null;
            if (channel != "runs" && runId == null) return "Unknown channel. Use runs, run:{id}, pipeline-run:{id}, conversation-files:{id}, fan-out:{id}, studio-draft:{id}, mandate:{id}, agent-inbox:{agentId}, organization:{orgId}, approvals, escalations, freezes, reports, or nodes.";
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
                            else if (subscription.Key == "escalations") await PumpEscalationsAsync(session, ctx, subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key == "freezes") await PumpFreezesAsync(session, ctx, subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key == "reports") await PumpReportsAsync(session, ctx, subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("organization:", StringComparison.Ordinal)) await PumpOrganizationAsync(session, ctx, subscription.Key.Substring("organization:".Length), subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("agent-inbox:", StringComparison.Ordinal)) await PumpAgentInboxAsync(session, ctx, subscription.Key.Substring("agent-inbox:".Length), subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("run:", StringComparison.Ordinal)) await PumpRunAsync(session, ctx, subscription.Key.Substring(4), subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("pipeline-run:", StringComparison.Ordinal)) await PumpPipelineRunAsync(session, ctx, subscription.Key.Substring("pipeline-run:".Length), subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("conversation-files:", StringComparison.Ordinal)) await PumpConversationFilesAsync(session, ctx, subscription.Key.Substring("conversation-files:".Length), subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("fan-out:", StringComparison.Ordinal)) await PumpFanOutAsync(session, ctx, subscription.Key.Substring("fan-out:".Length), subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("studio-draft:", StringComparison.Ordinal)) await PumpStudioDraftAsync(session, ctx, subscription.Key.Substring("studio-draft:".Length), subscription.Value, sendLock, token).ConfigureAwait(false);
                            else if (subscription.Key.StartsWith("mandate:", StringComparison.Ordinal)) await PumpMandateAsync(session, ctx, subscription.Key.Substring("mandate:".Length), subscription.Value, sendLock, token).ConfigureAwait(false);
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

        private async Task PumpEscalationsAsync(WebSocketSession session, RequestContext ctx, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            // The cursor is "<lastupdateutc ticks>|<id>" of the last change sent. A new subscription starts now and sends the
            // open count; later passes send one message per changed escalation, in order.
            long open = await _Context.Database.Escalations.CountOpenAsync(ctx.TenantId!, token).ConfigureAwait(false);
            if (state.Fingerprint == null)
            {
                state.Fingerprint = DateTime.UtcNow.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|";
                await SendAsync(session, sendLock, new { type = "escalations.open", open = open }, token).ConfigureAwait(false);
                return;
            }
            string[] cursor = state.Fingerprint.Split('|');
            DateTime afterUtc = new DateTime(Int64.Parse(cursor[0], System.Globalization.CultureInfo.InvariantCulture), DateTimeKind.Utc);
            List<Escalation> changed = await _Context.Database.Escalations.ListChangedAsync(ctx.TenantId!, afterUtc, cursor.Length > 1 ? cursor[1] : String.Empty, 100, token).ConfigureAwait(false);
            foreach (Escalation escalation in changed)
            {
                state.Fingerprint = escalation.LastUpdateUtc.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|" + escalation.Id;
                await SendAsync(session, sendLock, new { type = EscalationChangeType(escalation), open = open, escalation = escalation }, token).ConfigureAwait(false);
            }
        }

        private async Task PumpFreezesAsync(WebSocketSession session, RequestContext ctx, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            // Same cursor as the escalations channel. A new subscription sends the active count and the kill switch; later
            // passes send freeze.applied, freeze.lifted, or killswitch.changed for each change, in order.
            if (state.Fingerprint == null)
            {
                List<Freeze> active = await _Context.Database.Freezes.ListActiveAsync(ctx.TenantId!, token).ConfigureAwait(false);
                state.Fingerprint = DateTime.UtcNow.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|";
                await SendAsync(session, sendLock, new { type = "freezes.active", active = active.Count, killSwitch = active.Any(f => f.TargetKind == FreezeTargetKindEnum.TenantAutonomy) }, token).ConfigureAwait(false);
                return;
            }
            string[] cursor = state.Fingerprint.Split('|');
            DateTime afterUtc = new DateTime(Int64.Parse(cursor[0], System.Globalization.CultureInfo.InvariantCulture), DateTimeKind.Utc);
            List<Freeze> changed = await _Context.Database.Freezes.ListChangedAsync(ctx.TenantId!, afterUtc, cursor.Length > 1 ? cursor[1] : String.Empty, 100, token).ConfigureAwait(false);
            if (changed.Count == 0) return;
            List<Freeze> current = await _Context.Database.Freezes.ListActiveAsync(ctx.TenantId!, token).ConfigureAwait(false);
            bool killSwitch = current.Any(f => f.TargetKind == FreezeTargetKindEnum.TenantAutonomy);
            foreach (Freeze freeze in changed)
            {
                state.Fingerprint = freeze.LastUpdateUtc.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|" + freeze.Id;
                string type = freeze.TargetKind == FreezeTargetKindEnum.TenantAutonomy ? "killswitch.changed" : (freeze.Active ? "freeze.applied" : "freeze.lifted");
                await SendAsync(session, sendLock, new { type = type, active = current.Count, killSwitch = killSwitch, freeze = freeze }, token).ConfigureAwait(false);
            }
        }

        private async Task PumpReportsAsync(WebSocketSession session, RequestContext ctx, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            // Reports are immutable, so the cursor is (createdutc, id). A new subscription starts at now and sends
            // reports.subscribed; later passes send report.filed for each new report, in order.
            if (state.Fingerprint == null)
            {
                state.Fingerprint = DateTime.UtcNow.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|";
                await SendAsync(session, sendLock, new { type = "reports.subscribed" }, token).ConfigureAwait(false);
                return;
            }
            string[] cursor = state.Fingerprint.Split('|');
            DateTime afterUtc = new DateTime(Int64.Parse(cursor[0], System.Globalization.CultureInfo.InvariantCulture), DateTimeKind.Utc);
            List<Report> filed = await _Context.Database.Reports.ListFiledAfterAsync(ctx.TenantId!, afterUtc, cursor.Length > 1 ? cursor[1] : String.Empty, 100, token).ConfigureAwait(false);
            foreach (Report report in filed)
            {
                state.Fingerprint = report.CreatedUtc.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|" + report.Id;
                await SendAsync(session, sendLock, new { type = "report.filed", report = report }, token).ConfigureAwait(false);
            }
        }

        private async Task PumpOrganizationAsync(WebSocketSession session, RequestContext ctx, string organizationId, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            // Fingerprint: the organization's last update. SecondaryFingerprint: the report cursor (createdutc, id).
            // SummaryFingerprint: the spend last sent, recomputed at most every OrganizationSpendSeconds.
            Organization? organization = await _Context.Database.Organizations.ReadAsync(ctx.TenantId!, organizationId, token).ConfigureAwait(false);
            if (organization == null)
            {
                if (state.Fingerprint != "deleted")
                {
                    state.Fingerprint = "deleted";
                    await SendAsync(session, sendLock, new { type = "org.changed", organizationId = organizationId, deleted = true }, token).ConfigureAwait(false);
                }
                return;
            }
            string changed = organization.LastUpdateUtc.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture);
            if (state.SecondaryFingerprint == null)
            {
                state.Fingerprint = changed;
                state.SecondaryFingerprint = DateTime.UtcNow.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|";
                await SendAsync(session, sendLock, new { type = "organization.subscribed", organization = organization }, token).ConfigureAwait(false);
                return;
            }
            if (state.Fingerprint != changed)
            {
                state.Fingerprint = changed;
                await SendAsync(session, sendLock, new { type = "org.changed", organization = organization }, token).ConfigureAwait(false);
            }

            HashSet<string> units = new HashSet<string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in await _Context.Database.Organizations.ListUnitsAsync(ctx.TenantId!, organizationId, token).ConfigureAwait(false)) units.Add(unit.Id);
            Garrison.Core.Organizations.OrgTree? live = await _Context.Get<ChainOfCommand>().TreeAsync(organization, token).ConfigureAwait(false);
            if (live != null) foreach (OrgUnit unit in live.Units) units.Add(unit.Id);
            string[] cursor = state.SecondaryFingerprint.Split('|');
            DateTime afterUtc = new DateTime(Int64.Parse(cursor[0], System.Globalization.CultureInfo.InvariantCulture), DateTimeKind.Utc);
            List<Report> filed = await _Context.Database.Reports.ListFiledAfterAsync(ctx.TenantId!, afterUtc, cursor.Length > 1 ? cursor[1] : String.Empty, 100, token).ConfigureAwait(false);
            foreach (Report report in filed)
            {
                state.SecondaryFingerprint = report.CreatedUtc.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|" + report.Id;
                if (String.IsNullOrEmpty(report.OrgUnitId) || !units.Contains(report.OrgUnitId)) continue;
                await SendAsync(session, sendLock, new { type = "report.filed", organizationId = organizationId, report = report }, token).ConfigureAwait(false);
            }

            // AA8.10: proposal.changed for each executive proposal that changed since the last pass, oldest change first.
            long proposalCursor = state.TertiaryFingerprint == null ? DateTime.UtcNow.Ticks : Int64.Parse(state.TertiaryFingerprint, System.Globalization.CultureInfo.InvariantCulture);
            if (state.TertiaryFingerprint == null) state.TertiaryFingerprint = proposalCursor.ToString(System.Globalization.CultureInfo.InvariantCulture);
            EnumerationResult<StudioDraft> proposals = await _Context.Database.StudioDrafts.EnumerateProposalsAsync(ctx.TenantId!, organizationId, new EnumerationQuery { MaxResults = 50 }, null, token).ConfigureAwait(false);
            foreach (StudioDraft draft in proposals.Objects.Where(d => d.LastUpdateUtc.Ticks > proposalCursor).OrderBy(d => d.LastUpdateUtc).ThenBy(d => d.Id, StringComparer.Ordinal))
            {
                OrgProposal proposal = await _Context.Get<OrgProposalService>().SummaryAsync(draft, token).ConfigureAwait(false);
                await SendAsync(session, sendLock, new { type = "proposal.changed", organizationId = organizationId, proposal = proposal }, token).ConfigureAwait(false);
                state.TertiaryFingerprint = draft.LastUpdateUtc.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture);
            }

            DateTime now = DateTime.UtcNow;
            if (live == null || (now - state.SummaryCheckedUtc).TotalSeconds < OrganizationSpendSeconds) return;
            state.SummaryCheckedUtc = now;
            List<OrgUnitSpend> spend = await _Context.Get<OrganizationService>().SpendAsync(organization, now, token).ConfigureAwait(false);
            string fingerprint = String.Join(";", spend.Select(s => s.UnitId + ":" + s.Period + ":" + s.WindowStartUtc.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + ":" + s.SpentUsd.ToString("0.####", System.Globalization.CultureInfo.InvariantCulture)));
            if (fingerprint == state.SummaryFingerprint) return;
            bool first = state.SummaryFingerprint == null;
            state.SummaryFingerprint = fingerprint;
            if (!first || spend.Any(s => s.SpentUsd > 0)) await SendAsync(session, sendLock, new { type = "spend.updated", organizationId = organizationId, spend = spend }, token).ConfigureAwait(false);
        }

        private async Task PumpAgentInboxAsync(WebSocketSession session, RequestContext ctx, string agentId, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            // Same cursor as the escalations channel, over messages addressed to the agent. A new subscription starts now and
            // sends agent-inbox.subscribed with the queued count; later passes send one event per status change, in order.
            if (state.Fingerprint == null)
            {
                AgentMessageFilter filter = new AgentMessageFilter { TenantId = ctx.TenantId!, RecipientAgentId = agentId, Status = MessageStatusEnum.Queued, MaxResults = 1 };
                EnumerationResult<AgentMessage> queued = await _Context.Database.AgentMessages.EnumerateAsync(filter, token).ConfigureAwait(false);
                state.Fingerprint = DateTime.UtcNow.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|";
                await SendAsync(session, sendLock, new { type = "agent-inbox.subscribed", agentId = agentId, queued = queued.TotalRecords }, token).ConfigureAwait(false);
                return;
            }
            string[] cursor = state.Fingerprint.Split('|');
            DateTime afterUtc = new DateTime(Int64.Parse(cursor[0], System.Globalization.CultureInfo.InvariantCulture), DateTimeKind.Utc);
            List<AgentMessage> changed = await _Context.Database.AgentMessages.ListChangedAfterAsync(ctx.TenantId!, agentId, afterUtc, cursor.Length > 1 ? cursor[1] : String.Empty, 100, token).ConfigureAwait(false);
            foreach (AgentMessage message in changed)
            {
                state.Fingerprint = message.LastUpdateUtc.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|" + message.Id;
                await SendAsync(session, sendLock, new { type = "message." + message.Status.ToString().ToLowerInvariant(), message = message }, token).ConfigureAwait(false);
            }
        }

        private static string EscalationChangeType(Escalation escalation)
        {
            // Only state changes move lastUpdateUtc (routing and delivery bookkeeping do not), so every change is an event.
            switch (escalation.Status)
            {
                case EscalationStatusEnum.Answered: return "escalation.answered";
                case EscalationStatusEnum.Expired: return "escalation.expired";
                case EscalationStatusEnum.Cancelled: return "escalation.cancelled";
                case EscalationStatusEnum.Withdrawn: return "escalation.withdrawn";
                default: return !String.IsNullOrEmpty(escalation.EscalatedToId) ? "escalation.escalated" : "escalation.raised";
            }
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

        private async Task PumpStudioDraftAsync(WebSocketSession session, RequestContext ctx, string draftId, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            StudioDraft? draft = await _Context.Database.StudioDrafts.ReadAsync(ctx.TenantId!, draftId, token).ConfigureAwait(false);
            if (draft == null) return;
            List<string> items = draft.Items.Select(i => i.Kind + "/" + i.Name + "=" + i.Operation + ":" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(i.Document)))).ToList();
            string fingerprint = draft.Version + "|" + draft.Status + "|" + String.Join(";", items);
            if (fingerprint == state.Fingerprint) return;
            bool first = state.Fingerprint == null;
            string[] previous = (state.Fingerprint ?? String.Empty).Split('|');
            HashSet<string> before = new HashSet<string>(previous.Length > 2 ? previous[2].Split(';', StringSplitOptions.RemoveEmptyEntries) : Array.Empty<string>(), StringComparer.Ordinal);
            HashSet<string> now = new HashSet<string>(items, StringComparer.Ordinal);
            state.Fingerprint = fingerprint;
            List<object> changed = draft.Items.Where((i, n) => first || !before.Contains(items[n]))
                .Select(i => (object)new { kind = i.Kind, name = i.Name, operation = i.Operation.ToString(), removed = false }).ToList();
            foreach (string gone in before.Where(b => !now.Any(n => n.Substring(0, n.IndexOf('=')) == b.Substring(0, b.IndexOf('=')))))
            {
                string key = gone.Substring(0, gone.IndexOf('='));
                int slash = key.IndexOf('/');
                changed.Add(new { kind = key.Substring(0, slash), name = key.Substring(slash + 1), operation = (string?)null, removed = true });
            }
            await SendAsync(session, sendLock, new { type = "studio-draft.changed", draftId = draft.Id, version = draft.Version, status = draft.Status.ToString(), changed = changed, graph = StudioService.Graph(draft) }, token).ConfigureAwait(false);
        }

        private async Task PumpMandateAsync(WebSocketSession session, RequestContext ctx, string mandateId, SubscriptionState state, SemaphoreSlim sendLock, CancellationToken token)
        {
            Mandate? mandate = await _Context.Database.Mandates.ReadAsync(ctx.TenantId!, mandateId, token).ConfigureAwait(false);
            if (mandate == null) return;
            string lastTick = mandate.LastTickUtc.HasValue ? mandate.LastTickUtc.Value.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture) : String.Empty;
            string fingerprint = (mandate.ActiveRunId ?? String.Empty) + "|" + lastTick;
            if (fingerprint == state.Fingerprint) return;
            bool first = state.Fingerprint == null;
            string[] previous = (state.Fingerprint ?? "|").Split('|');
            state.Fingerprint = fingerprint;
            if (first) return;
            if (!String.IsNullOrEmpty(mandate.ActiveRunId) && mandate.ActiveRunId != previous[0])
            {
                await SendAsync(session, sendLock, new { type = "tick.started", mandateId = mandate.Id, tickId = mandate.ActiveTickId, runId = mandate.ActiveRunId }, token).ConfigureAwait(false);
            }
            if (lastTick.Length > 0 && lastTick != previous[1])
            {
                MandateTick? finished = (await _Context.Database.MandateTicks.ListRecentAsync(ctx.TenantId!, mandate.Id, 1, token).ConfigureAwait(false)).FirstOrDefault();
                await SendAsync(session, sendLock, new { type = "tick.completed", mandateId = mandate.Id, tickId = finished?.Id, runId = finished?.RunId, outcome = (finished?.Outcome ?? mandate.LastTickOutcome)?.ToString(), appliedIntervalSeconds = finished?.AppliedIntervalSeconds, nextWakeUtc = mandate.NextWakeUtc, status = mandate.Status.ToString() }, token).ConfigureAwait(false);
            }
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
