namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Keepers;
    using Garrison.Core.Messaging;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Core.Templates;
    using SyslogLogging;

    /// <summary>
    /// Messages between agents (AA6, AA-020). Runs send along allowed lines (MessageLinePolicy); people with Create on
    /// AgentMessage write to any agent. Every send passes the loop guards (recipient freeze, line, hop limit, thread budget,
    /// per-line rate) and a refused message is stored as Rejected with its reason. Normal mail waits for the recipient
    /// keeper's next tick or garrison_read_inbox; urgent mail wakes the recipient's keeper now, or starts a Message run when
    /// the recipient has no keeper. A replayed send returns the first message. Thread-safe.
    /// </summary>
    public class MessageService
    {
        #region Public-Members

        /// <summary>
        /// Freezes (AA3). When set, a message to a frozen agent is rejected with Frozen, and urgent mail waits while the
        /// autonomy kill switch is on. Null when freezes are not wired.
        /// </summary>
        public FreezeService? Freezes { get; set; } = null;

        /// <summary>
        /// Clock, for tests that move time. Default DateTime.UtcNow.
        /// </summary>
        public Func<DateTime> Now
        {
            get
            {
                return _Now;
            }
            set
            {
                _Now = value ?? (() => DateTime.UtcNow);
            }
        }

        /// <summary>
        /// Seconds a delivery claim may stay unresolved before the sweep releases it (a replica stopped while starting a
        /// run). Minimum 60, maximum 3600, default 600.
        /// </summary>
        public int StaleClaimSeconds
        {
            get
            {
                return _StaleClaimSeconds;
            }
            set
            {
                _StaleClaimSeconds = Math.Clamp(value, 60, 3600);
            }
        }

        /// <summary>
        /// Most artifacts one message may reference.
        /// </summary>
        public static readonly int MaxArtifacts = 20;

        #endregion

        #region Private-Members

        private static readonly string _Header = "[Messages] ";
        private readonly DatabaseDriverBase _Database;
        private readonly AuditService _Audit;
        private readonly MessagingOptions _Options;
        private readonly MessageLinePolicy _Lines;
        private readonly RunService _Runs;
        private readonly RunAsAuthorization _RunAs;
        private readonly LoggingModule _Logging;
        private readonly KeeperTemplateResolver _Templates;
        private Func<DateTime> _Now = () => DateTime.UtcNow;
        private int _StaleClaimSeconds = 600;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="audit">Audit writer.</param>
        /// <param name="options">Messaging options.</param>
        /// <param name="lines">Line policy.</param>
        /// <param name="runs">Run service, for Message runs.</param>
        /// <param name="runAs">Run-as checks, for Message runs.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public MessageService(DatabaseDriverBase database, AuditService audit, MessagingOptions options, MessageLinePolicy lines, RunService runs, RunAsAuthorization runAs, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Lines = lines ?? throw new ArgumentNullException(nameof(lines));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _RunAs = runAs ?? throw new ArgumentNullException(nameof(runAs));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            _Templates = new KeeperTemplateResolver(database);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Send a message from a run as its own agent, along an allowed line. The hop count is one more than the largest hop
        /// of the message replied to and the messages delivered to the run. Sending the same content again from the same run
        /// returns the first message.
        /// </summary>
        /// <param name="run">The sending run.</param>
        /// <param name="request">Recipient (identifier or name), subject, body, urgency, parent, artifacts, and expiry.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or request is null.</exception>
        /// <exception cref="ValidationException">Thrown when the message is out of bounds or names something that does not exist.</exception>
        /// <exception cref="NotFoundException">Thrown when the parent message is not addressed to the run's agent.</exception>
        /// <exception cref="ConflictException">Thrown with RunNotActive, or with the rejection reason as the code when a guard refuses the message.</exception>
        public async Task<AgentMessage> SendFromRunAsync(Run run, AgentMessageSendRequest request, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (RunService.IsTerminal(run.Status)) throw new ConflictException("RunNotActive", "Run " + run.Id + " has finished; it cannot send messages.");
            AgentMessage? parent = await ParentForRunAsync(run, request.ParentMessageId, token).ConfigureAwait(false);
            string recipientId;
            if (parent != null && String.IsNullOrWhiteSpace(request.Recipient))
            {
                if (String.IsNullOrEmpty(parent.SenderAgentId)) throw new ConflictException("ReplyToPerson", "Message " + parent.Id + " came from a person, not an agent, so there is no agent to reply to.");
                recipientId = parent.SenderAgentId;
            }
            else
            {
                recipientId = await RecipientIdAsync(run.TenantId, request.Recipient, token).ConfigureAwait(false);
            }

            AgentMessage message = await BuildAsync(run.TenantId, recipientId, request, parent, token).ConfigureAwait(false);
            int delivered = await _Database.AgentMessages.MaxDeliveredHopAsync(run.TenantId, run.Id, token).ConfigureAwait(false) ?? 0;
            message.HopCount = Math.Max(delivered, parent?.HopCount ?? 0) + 1;
            message.SenderAgentId = run.AgentId;
            message.SenderAgentName = run.AgentName;
            message.SenderRunId = run.Id;
            message.SenderPrincipalType = PrincipalTypeEnum.Run;
            message.SenderPrincipalId = run.Id;
            message.SenderName = run.AgentName;
            message.SendKey = Digest("run|" + run.Id + "|" + Canonical(message));
            RequestContext ctx = new RequestContext { TenantId = run.TenantId, PrincipalType = PrincipalTypeEnum.Run, RunId = run.Id, PrincipalName = run.AgentName };
            WakeCaller caller = new WakeCaller(run.CallerType, run.CallerId, run.CallerName);
            return await StoreAsync(ctx, message, parent, true, caller, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Reply from a run to a message its agent received. The reply goes to the agent that sent it, in the same thread.
        /// </summary>
        /// <param name="run">The replying run.</param>
        /// <param name="request">ParentMessageId is required; subject defaults to the parent's.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored reply.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or request is null.</exception>
        /// <exception cref="ValidationException">Thrown when ParentMessageId is missing or the reply is out of bounds.</exception>
        /// <exception cref="NotFoundException">Thrown when the parent message is not addressed to the run's agent.</exception>
        /// <exception cref="ConflictException">Thrown with ReplyToPerson, RunNotActive, or a rejection reason.</exception>
        public async Task<AgentMessage> ReplyFromRunAsync(Run run, AgentMessageSendRequest request, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (String.IsNullOrWhiteSpace(request.ParentMessageId)) throw Invalid("messageId", "The message to reply to is required.", "Required");
            request.Recipient = null;
            return await SendFromRunAsync(run, request, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Send a message from a person or an API credential to any agent. The line policy does not apply; the freeze,
        /// thread budget, and per-line rate guards do. With an idempotency key, sending again with the same key returns the
        /// first message.
        /// </summary>
        /// <param name="ctx">The sending principal (the caller checked Create on AgentMessage).</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">Recipient, subject, body, urgency, parent, artifacts, expiry, and idempotency key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or request is null, or tenantId is null or empty.</exception>
        /// <exception cref="ValidationException">Thrown when the message is out of bounds or names something that does not exist.</exception>
        /// <exception cref="ConflictException">Thrown with the rejection reason as the code when a guard refuses the message.</exception>
        public async Task<AgentMessage> SendFromPersonAsync(RequestContext ctx, string tenantId, AgentMessageSendRequest request, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (request.IdempotencyKey != null && request.IdempotencyKey.Length > 256) throw Invalid("idempotencyKey", "An idempotency key holds at most 256 characters.", "TooLong");
            AgentMessage? parent = null;
            if (!String.IsNullOrWhiteSpace(request.ParentMessageId))
            {
                parent = await _Database.AgentMessages.ReadAsync(tenantId, request.ParentMessageId.Trim(), token).ConfigureAwait(false)
                    ?? throw Invalid("parentMessageId", "Message " + request.ParentMessageId.Trim() + " does not exist.", "ReferenceNotFound");
            }
            string recipientId;
            if (String.IsNullOrWhiteSpace(request.Recipient) && parent != null && !String.IsNullOrEmpty(parent.SenderAgentId)) recipientId = parent.SenderAgentId;
            else recipientId = await RecipientIdAsync(tenantId, request.Recipient, token).ConfigureAwait(false);

            AgentMessage message = await BuildAsync(tenantId, recipientId, request, parent, token).ConfigureAwait(false);
            message.HopCount = parent?.HopCount ?? 0;
            message.SenderPrincipalType = ctx.PrincipalType;
            message.SenderPrincipalId = ctx.PrincipalId;
            message.SenderName = ctx.PrincipalName;
            message.SendKey = String.IsNullOrWhiteSpace(request.IdempotencyKey) ? null : Digest("person|" + ctx.PrincipalType + "|" + ctx.PrincipalId + "|" + request.IdempotencyKey.Trim());
            WakeCaller caller = new WakeCaller(ctx.PrincipalType, ctx.PrincipalId, ctx.PrincipalName);
            return await StoreAsync(ctx, message, parent, false, caller, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Deliver an escalation to its target agent as an urgent message linked to it (AA6.7). The escalation stays the
        /// source of truth: the recipient answers it with garrison_answer_escalation. The line policy does not apply, since
        /// the raiser chose the target; the freeze guard does. Delivering the same escalation again returns the first message.
        /// </summary>
        /// <param name="escalation">The escalation, with an Agent target.</param>
        /// <param name="callerType">Principal a Message run would run as.</param>
        /// <param name="callerId">Principal identifier, or null.</param>
        /// <param name="callerName">Principal name, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when escalation is null.</exception>
        /// <exception cref="ValidationException">Thrown when the target agent does not exist.</exception>
        /// <exception cref="ConflictException">Thrown with Frozen when the target agent is frozen.</exception>
        public async Task<AgentMessage> SendForEscalationAsync(Escalation escalation, PrincipalTypeEnum callerType, string? callerId, string? callerName, CancellationToken token = default)
        {
            if (escalation == null) throw new ArgumentNullException(nameof(escalation));
            AgentMessageSendRequest request = new AgentMessageSendRequest();
            request.Subject = "Escalation " + escalation.Id;
            request.Body = String.IsNullOrWhiteSpace(escalation.Context) ? escalation.Question : escalation.Question + Environment.NewLine + Environment.NewLine + escalation.Context;
            request.Urgency = MessageUrgencyEnum.Urgent;
            string recipientId = await RecipientIdAsync(escalation.TenantId, escalation.TargetId, token).ConfigureAwait(false);
            AgentMessage message = await BuildAsync(escalation.TenantId, recipientId, request, null, token).ConfigureAwait(false);
            int delivered = String.IsNullOrEmpty(escalation.RaisingRunId) ? 0 : await _Database.AgentMessages.MaxDeliveredHopAsync(escalation.TenantId, escalation.RaisingRunId, token).ConfigureAwait(false) ?? 0;
            message.HopCount = delivered + 1;
            message.EscalationId = escalation.Id;
            message.SenderAgentId = escalation.AgentId;
            message.SenderAgentName = escalation.AgentName;
            message.SenderRunId = escalation.RaisingRunId;
            message.SenderPrincipalType = String.IsNullOrEmpty(escalation.RaisingRunId) ? callerType : PrincipalTypeEnum.Run;
            message.SenderPrincipalId = escalation.RaisingRunId ?? callerId;
            message.SenderName = escalation.AgentName ?? callerName;
            message.SendKey = Digest("escalation|" + escalation.Id);
            RequestContext ctx = new RequestContext { TenantId = escalation.TenantId, PrincipalType = message.SenderPrincipalType, RunId = escalation.RaisingRunId, PrincipalName = message.SenderName };
            if (message.SenderPrincipalType == PrincipalTypeEnum.Credential) ctx.CredentialId = callerId;
            else if (message.SenderPrincipalType != PrincipalTypeEnum.Run) ctx.UserId = callerId;
            return await StoreAsync(ctx, message, null, false, new WakeCaller(callerType, callerId, callerName), token).ConfigureAwait(false);
        }

        /// <summary>
        /// Deliver a run's agent's queued messages to the run (garrison_read_inbox): up to Messaging.MaxMessagesPerDelivery,
        /// oldest first, marked Delivered to the run. The rest stay queued.
        /// </summary>
        /// <param name="run">The reading run.</param>
        /// <param name="maxResults">Most messages to deliver, or null for Messaging.MaxMessagesPerDelivery.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The messages delivered by this call and how many stay queued.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task<MessageInbox> ReadInboxForRunAsync(Run run, int? maxResults, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            int max = Math.Clamp(maxResults ?? _Options.MaxMessagesPerDelivery, 1, _Options.MaxMessagesPerDelivery);
            MessageInbox inbox = new MessageInbox();
            MessageDelivery? delivery = await ClaimAsync(run.TenantId, run.AgentId, max, false, token).ConfigureAwait(false);
            if (delivery != null)
            {
                await CompleteDeliveryAsync(delivery, run.Id, token).ConfigureAwait(false);
                inbox.Messages = delivery.Messages;
            }
            inbox.Remaining = await QueuedCountAsync(run.TenantId, run.AgentId, token).ConfigureAwait(false);
            return inbox;
        }

        /// <summary>
        /// Acknowledge a delivered message on behalf of its recipient run. Acknowledging again returns the message unchanged.
        /// </summary>
        /// <param name="run">The acknowledging run.</param>
        /// <param name="messageId">Message identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the message does not exist or is not addressed to the run's agent.</exception>
        /// <exception cref="ConflictException">Thrown with MessageNotDelivered when the message has not been delivered.</exception>
        public async Task<AgentMessage> AcknowledgeForRunAsync(Run run, string messageId, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            AgentMessage message = await ReadForRecipientAsync(run, messageId, token).ConfigureAwait(false);
            if (message.Status == MessageStatusEnum.Acknowledged) return message;
            if (message.Status != MessageStatusEnum.Delivered) throw new ConflictException("MessageNotDelivered", "Message " + message.Id + " is " + message.Status + "; only a delivered message can be acknowledged.");
            if (await _Database.AgentMessages.AcknowledgeAsync(run.TenantId, message.Id, run.AgentId, Now(), token).ConfigureAwait(false))
                GarrisonMetrics.Count(GarrisonMetricCatalog.Messages, "urgency", Label(message.Urgency), "outcome", "acknowledged");
            return await _Database.AgentMessages.ReadAsync(run.TenantId, message.Id, token).ConfigureAwait(false) ?? message;
        }

        /// <summary>
        /// Earlier messages a run's agent sent or received (garrison_read_thread, AA12.7), rendered through message-history.
        /// With a thread or a message, that thread's messages; with neither, the agent's most recent messages across its
        /// threads. Messages still queued for the agent are left out (garrison_read_inbox delivers them), and so are messages
        /// between other agents in the same thread. Reading changes nothing.
        /// </summary>
        /// <param name="run">The reading run.</param>
        /// <param name="threadId">Thread identifier, or null.</param>
        /// <param name="messageId">A message whose thread to read, or null.</param>
        /// <param name="maxResults">Most messages, 1 to 100, default 20; the newest are kept.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The rendered history.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the message, or every message of the thread, belongs to other agents or another tenant.</exception>
        /// <exception cref="TemplateException">Thrown when message-history does not render.</exception>
        public async Task<MessageHistory> ReadHistoryForRunAsync(Run run, string? threadId, string? messageId, int? maxResults, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            string? thread = String.IsNullOrWhiteSpace(threadId) ? null : threadId.Trim();
            if (!String.IsNullOrWhiteSpace(messageId))
            {
                AgentMessage anchor = await ReadForRunAsync(run, messageId, token).ConfigureAwait(false);
                thread = anchor.ThreadId;
            }
            int max = Math.Clamp(maxResults ?? 20, 1, 100);
            AgentMessageFilter filter = new AgentMessageFilter { TenantId = run.TenantId, AgentId = run.AgentId, ThreadId = thread, Skip = 0, MaxResults = 100 };
            EnumerationResult<AgentMessage> page = await _Database.AgentMessages.EnumerateAsync(filter, token).ConfigureAwait(false);
            List<AgentMessage> visible = page.Objects
                .Where(m => !(m.Status == MessageStatusEnum.Queued && m.RecipientAgentId == run.AgentId))
                .OrderByDescending(m => m.CreatedUtc).ThenByDescending(m => m.Id, StringComparer.Ordinal)
                .ToList();
            if (thread != null && visible.Count == 0) throw new NotFoundException("Thread not found.");
            bool more = visible.Count > max || page.TotalRecords > page.Objects.Count;
            List<AgentMessage> shown = visible.Take(max).OrderBy(m => m.CreatedUtc).ThenBy(m => m.Id, StringComparer.Ordinal).ToList();
            PromptTemplate template = await _Templates.ResolveAsync(run.TenantId, MessageHistoryRenderer.TemplateName, PromptTemplateKindEnum.Fragment, token).ConfigureAwait(false);
            MessageHistory history = new MessageHistory();
            history.ThreadId = thread;
            history.Count = shown.Count;
            history.More = more;
            history.Text = MessageHistoryRenderer.Render(template.Content, template.Name, run.AgentId, thread, shown, more);
            return history;
        }

        /// <summary>
        /// Read a message addressed to a run's agent or sent by it.
        /// </summary>
        /// <param name="run">The reading run.</param>
        /// <param name="messageId">Message identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the message does not exist or the run's agent neither sent nor received it.</exception>
        public async Task<AgentMessage> ReadForRunAsync(Run run, string messageId, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            AgentMessage? message = String.IsNullOrWhiteSpace(messageId) ? null : await _Database.AgentMessages.ReadAsync(run.TenantId, messageId.Trim(), token).ConfigureAwait(false);
            if (message == null || (message.RecipientAgentId != run.AgentId && message.SenderAgentId != run.AgentId)) throw new NotFoundException("Message not found.");
            return message;
        }

        /// <summary>
        /// Claim a keeper's queued messages for its next tick (AA6.5) and render them through inbox-delivery. Returns null
        /// when nothing is queued. The caller completes the delivery with the tick's run or releases it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">The keeper's agent.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The delivery, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or agentId is null or empty.</exception>
        /// <exception cref="TemplateException">Thrown when inbox-delivery does not render; the claim is released first.</exception>
        public async Task<MessageDelivery?> ClaimDeliveryAsync(string tenantId, string agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            return await ClaimAsync(tenantId, agentId, _Options.MaxMessagesPerDelivery, true, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Mark a delivery's messages Delivered to a run.
        /// </summary>
        /// <param name="delivery">Delivery.</param>
        /// <param name="runId">The run whose input carried the messages.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when delivery is null or runId is null or empty.</exception>
        public async Task CompleteDeliveryAsync(MessageDelivery delivery, string runId, CancellationToken token = default)
        {
            if (delivery == null) throw new ArgumentNullException(nameof(delivery));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            DateTime now = Now();
            using (Activity? span = GarrisonTracing.Start("message deliver", ActivityKind.Internal))
            {
                span?.SetTag("garrison.tenant", delivery.TenantId);
                span?.SetTag("garrison.run.id", runId);
                span?.SetTag("garrison.message.count", delivery.Messages.Count);
                int marked = await _Database.AgentMessages.MarkDeliveredAsync(delivery.TenantId, delivery.Claim, runId, now, token).ConfigureAwait(false);
                if (marked < delivery.Messages.Count)
                {
                    span?.SetStatus(ActivityStatusCode.Error, "claim lost");
                    _Logging.Warn(_Header + "delivery claim " + delivery.Claim + " marked " + marked + " of " + delivery.Messages.Count + " messages for run " + runId);
                }
                else
                {
                    GarrisonTracing.Ok(span);
                }
            }
            foreach (AgentMessage message in delivery.Messages)
            {
                message.Status = MessageStatusEnum.Delivered;
                message.DeliveredRunId = runId;
                message.DeliveredUtc = now;
                GarrisonMetrics.Count(GarrisonMetricCatalog.Messages, "urgency", Label(message.Urgency), "outcome", "delivered");
                GarrisonMetrics.Observe(GarrisonMetricCatalog.MessageDeliveryLag, Math.Max(0, (now - message.CreatedUtc).TotalSeconds), "urgency", Label(message.Urgency));
            }
        }

        /// <summary>
        /// Release a delivery whose run could not start, leaving its messages queued.
        /// </summary>
        /// <param name="delivery">Delivery.</param>
        /// <returns>Task.</returns>
        public async Task ReleaseDeliveryAsync(MessageDelivery? delivery)
        {
            if (delivery == null) return;
            try
            {
                await _Database.AgentMessages.ReleaseClaimAsync(delivery.TenantId, delivery.Claim, CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception e)
            {
                // The sweep releases stale claims later.
                _Logging.Warn(_Header + "could not release delivery claim " + delivery.Claim + ": " + e.Message);
            }
        }

        /// <summary>
        /// Expire queued messages past their expiry and release stale delivery claims. Called by the leader every pass.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a message expired or a claim was released.</returns>
        public async Task<bool> SweepAsync(CancellationToken token = default)
        {
            DateTime now = Now();
            int released = await _Database.AgentMessages.ReleaseStaleClaimsAsync(now.AddSeconds(-_StaleClaimSeconds), token).ConfigureAwait(false);
            if (released > 0) _Logging.Warn(_Header + "released " + released + " message(s) from stale delivery claims");
            List<AgentMessage> expired = await _Database.AgentMessages.ExpireAsync(now, 500, token).ConfigureAwait(false);
            foreach (AgentMessage message in expired)
            {
                GarrisonMetrics.Count(GarrisonMetricCatalog.Messages, "urgency", Label(message.Urgency), "outcome", "expired");
                _Logging.Info(_Header + message.Id + " to agent " + message.RecipientAgentId + " expired undelivered " + GarrisonTracing.LogFields("tenant", message.TenantId));
            }
            return released > 0 || expired.Count > 0;
        }

        #endregion

        #region Private-Methods

        private async Task<AgentMessage> StoreAsync(RequestContext ctx, AgentMessage message, AgentMessage? parent, bool checkLine, WakeCaller caller, CancellationToken token)
        {
            if (!String.IsNullOrEmpty(message.SendKey))
            {
                AgentMessage? earlier = await _Database.AgentMessages.ReadBySendKeyAsync(message.TenantId, message.SendKey, token).ConfigureAwait(false);
                if (earlier != null)
                {
                    if (earlier.Status == MessageStatusEnum.Rejected) throw Rejection(earlier);
                    return earlier;
                }
            }

            string? detail = null;
            MessageRejectionEnum? reason = null;
            Freeze? freeze = Freezes != null ? await Freezes.FindAsync(message.TenantId, message.RecipientAgentId, null, null, null, false, token).ConfigureAwait(false) : null;
            if (freeze != null)
            {
                reason = MessageRejectionEnum.Frozen;
                detail = "Agent " + (message.RecipientAgentName ?? message.RecipientAgentId) + " is frozen by " + freeze.Id + ".";
            }
            else if (checkLine && !String.IsNullOrEmpty(message.SenderAgentId)
                && await _Lines.LineAsync(message.TenantId, message.SenderAgentId, message.RecipientAgentId, parent, token).ConfigureAwait(false) == null)
            {
                reason = MessageRejectionEnum.NoLine;
                detail = "No line connects agent " + (message.SenderAgentName ?? message.SenderAgentId) + " to agent " + (message.RecipientAgentName ?? message.RecipientAgentId) + ": they share no app edge, neither manages the other, their organization units have no peer line, and this is not a reply to a message from it.";
            }
            else if (message.HopCount > _Options.MaxHops)
            {
                reason = MessageRejectionEnum.HopLimit;
                detail = "The message would be hop " + message.HopCount + "; Messaging.MaxHops allows " + _Options.MaxHops + ".";
            }
            else if (parent != null && await _Database.AgentMessages.CountThreadAsync(message.TenantId, message.ThreadId, token).ConfigureAwait(false) >= _Options.ThreadBudget)
            {
                reason = MessageRejectionEnum.ThreadBudget;
                detail = "Thread " + message.ThreadId + " already holds Messaging.ThreadBudget (" + _Options.ThreadBudget + ") messages.";
            }
            else if (await _Database.AgentMessages.CountLineAsync(message.TenantId, message.SenderAgentId, message.SenderPrincipalId, message.RecipientAgentId, Now().AddSeconds(-60), token).ConfigureAwait(false) >= _Options.LineRatePerMinute)
            {
                reason = MessageRejectionEnum.LineRate;
                detail = "The sender already sent Messaging.LineRatePerMinute (" + _Options.LineRatePerMinute + ") messages to this agent in the last minute.";
            }

            if (reason.HasValue)
            {
                message.Status = MessageStatusEnum.Rejected;
                message.RejectionReason = reason.Value;
                message.RejectionDetail = detail;
            }

            AgentMessage stored = await InsertAsync(message, token).ConfigureAwait(false);
            if (!ReferenceEquals(stored, message))
            {
                // A racing replay inserted first.
                if (stored.Status == MessageStatusEnum.Rejected) throw Rejection(stored);
                return stored;
            }

            string parties = (message.SenderAgentId != null ? "agent " + message.SenderAgentId : message.SenderPrincipalType + " " + (message.SenderPrincipalId ?? "unknown")) + " to agent " + message.RecipientAgentId;
            if (reason.HasValue)
            {
                GarrisonMetrics.Count(GarrisonMetricCatalog.MessageLoopGuard, "reason", Snake(reason.Value));
                GarrisonMetrics.Count(GarrisonMetricCatalog.Messages, "urgency", Label(message.Urgency), "outcome", "rejected");
                // Subjects and bodies are written by senders and never go to the audit log or the server log.
                await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "AgentMessage", message.Id, "Rejected message " + message.Id + " from " + parties + " (" + reason.Value + ").", message.TenantId, token).ConfigureAwait(false);
                _Logging.Info(_Header + message.Id + " from " + parties + " rejected: " + reason.Value + " " + GarrisonTracing.LogFields("tenant", message.TenantId));
                throw Rejection(message);
            }

            GarrisonMetrics.Count(GarrisonMetricCatalog.Messages, "urgency", Label(message.Urgency), "outcome", "queued");
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "AgentMessage", message.Id, "Sent message " + message.Id + " (" + message.Urgency + ", hop " + message.HopCount.ToString(CultureInfo.InvariantCulture) + ") from " + parties + ".", message.TenantId, token).ConfigureAwait(false);
            _Logging.Info(_Header + message.Id + " queued from " + parties + ", " + message.Urgency + ", hop " + message.HopCount + " " + GarrisonTracing.LogFields("tenant", message.TenantId));
            if (message.Urgency == MessageUrgencyEnum.Urgent) await WakeAsync(message, caller, token).ConfigureAwait(false);
            return await _Database.AgentMessages.ReadAsync(message.TenantId, message.Id, token).ConfigureAwait(false) ?? message;
        }

        private async Task<AgentMessage> InsertAsync(AgentMessage message, CancellationToken token)
        {
            try
            {
                await _Database.AgentMessages.CreateAsync(message, token).ConfigureAwait(false);
                return message;
            }
            catch (Exception) when (!String.IsNullOrEmpty(message.SendKey))
            {
                // Two replays racing: the unique send key lets one insert win; the other returns it.
                AgentMessage? winner = await _Database.AgentMessages.ReadBySendKeyAsync(message.TenantId, message.SendKey!, CancellationToken.None).ConfigureAwait(false);
                if (winner != null) return winner;
                throw;
            }
        }

        private async Task WakeAsync(AgentMessage message, WakeCaller caller, CancellationToken token)
        {
            try
            {
                // The kill switch makes urgent mail wait like normal mail (AA3.4).
                if (Freezes != null)
                {
                    IReadOnlyList<Freeze> active = await Freezes.ActiveAsync(message.TenantId, token).ConfigureAwait(false);
                    if (active.Any(f => f.TargetKind == FreezeTargetKindEnum.TenantAutonomy))
                    {
                        _Logging.Info(_Header + message.Id + " is urgent but the autonomy kill switch is on; it waits in the inbox");
                        return;
                    }
                }
                if (_Options.UrgentWakesPerHour == 0
                    || await _Database.AgentMessages.CountWakesAsync(message.TenantId, message.RecipientAgentId, Now().AddHours(-1), token).ConfigureAwait(false) >= _Options.UrgentWakesPerHour)
                {
                    _Logging.Info(_Header + message.Id + " is urgent but agent " + message.RecipientAgentId + " reached Messaging.UrgentWakesPerHour; it waits in the inbox");
                    return;
                }

                EnumerationResult<Mandate> mandates = await _Database.Mandates.EnumerateAsync(message.TenantId, null, message.RecipientAgentId, null, new EnumerationQuery { MaxResults = 100 }, token).ConfigureAwait(false);
                if (mandates.Objects.Count > 0)
                {
                    // A keeper drains its inbox at its next tick; an urgent message brings that tick forward. Single-flight
                    // holds: a running tick finishes first, and the compare-and-set claim starts exactly one tick.
                    Mandate? keeper = mandates.Objects.Where(m => m.Status == MandateStatusEnum.Active).OrderBy(m => m.CreatedUtc).ThenBy(m => m.Id, StringComparer.Ordinal).FirstOrDefault();
                    if (keeper == null) return;
                    if (await _Database.Mandates.RequestWakeAsync(message.TenantId, keeper.Id, WakeSourceEnum.Message, Now(), token).ConfigureAwait(false))
                    {
                        await WokeAsync(message, "keeper " + keeper.Id, token).ConfigureAwait(false);
                    }
                    return;
                }

                if (await StartMessageRunAsync(message, caller, token).ConfigureAwait(false)) await WokeAsync(message, "a Message run", token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                // The message is stored and queued; a failed wake leaves it for the next tick or garrison_read_inbox.
                _Logging.Warn(_Header + message.Id + " is queued but its urgent wake failed: " + e.Message);
            }
        }

        private async Task WokeAsync(AgentMessage message, string what, CancellationToken token)
        {
            await _Database.AgentMessages.SetWokeAsync(message.TenantId, message.Id, token).ConfigureAwait(false);
            message.WokeRecipient = true;
            GarrisonMetrics.Count(GarrisonMetricCatalog.Messages, "urgency", Label(message.Urgency), "outcome", "woke");
            _Logging.Info(_Header + message.Id + " woke " + what + " of agent " + message.RecipientAgentId);
        }

        private async Task<bool> StartMessageRunAsync(AgentMessage message, WakeCaller caller, CancellationToken token)
        {
            Agent? agent = await _Database.Agents.ReadAsync(message.TenantId, message.RecipientAgentId, token).ConfigureAwait(false);
            if (agent == null) return false;
            string? denied = await _RunAs.DeniedAsync(message.TenantId, caller.Type, caller.Id, caller.Name, agent.Id, "Message " + message.Id, token).ConfigureAwait(false);
            if (denied != null)
            {
                _Logging.Info(_Header + message.Id + " waits in the inbox: " + denied);
                return false;
            }

            MessageDelivery? delivery = null;
            try
            {
                delivery = await ClaimAsync(message.TenantId, agent.Id, _Options.MaxMessagesPerDelivery, true, token).ConfigureAwait(false);
                if (delivery == null) return false;
                PromptTemplate template = await _Templates.ResolveAsync(message.TenantId, InboxDeliveryRenderer.WakeTemplateName, PromptTemplateKindEnum.Task, token).ConfigureAwait(false);
                TemplateContext context = new TemplateContext();
                Dictionary<string, object?> agentMap = TemplateContext.NewMap();
                agentMap["id"] = agent.Id;
                agentMap["name"] = agent.Name;
                context.Set("agent", agentMap);
                context.Set("tenant.id", message.TenantId);
                context.Set("now", Now());
                string header = TemplateRenderer.Render(template.Content, context, new TemplateRenderOptions { TemplateName = template.Name, AllowSecrets = false }).Trim();
                string input = header + Environment.NewLine + Environment.NewLine + delivery.Text;

                RunCreateContext create = new RunCreateContext();
                create.TenantId = message.TenantId;
                create.Agent = agent;
                create.Input = input;
                create.InputContentType = "text/plain";
                create.Kind = RunKindEnum.Message;
                create.CallerType = caller.Type;
                create.CallerId = caller.Id;
                create.CallerName = "message:" + message.Id;
                create.IdempotencyKey = "message:" + delivery.Messages[0].Id;
                create.Surface = "message";
                Run run = await _Runs.CreateAsync(create, token).ConfigureAwait(false);
                await CompleteDeliveryAsync(delivery, run.Id, token).ConfigureAwait(false);
                _Logging.Info(_Header + "Message run " + run.Id + " of agent " + agent.Name + " carries " + delivery.Messages.Count + " message(s)");
                return true;
            }
            catch (Exception e) when (e is ConflictException || e is ValidationException || e is NotFoundException || e is TemplateException)
            {
                await ReleaseDeliveryAsync(delivery).ConfigureAwait(false);
                _Logging.Warn(_Header + message.Id + " could not start a Message run of agent " + agent.Name + "; it waits in the inbox: " + e.Message);
                return false;
            }
        }

        private async Task<MessageDelivery?> ClaimAsync(string tenantId, string agentId, int max, bool render, CancellationToken token)
        {
            // Most ticks find no mail. Looking first is a read, so an empty inbox never waits for a write (on Sqlite every
            // UPDATE takes the database's one write lock, even when it matches nothing); the claim below stays the
            // compare-and-set that decides which run gets the messages.
            if (await QueuedCountAsync(tenantId, agentId, token).ConfigureAwait(false) < 1) return null;
            string claim = "dlv_" + Guid.NewGuid().ToString("N");
            List<AgentMessage> messages = await _Database.AgentMessages.ClaimQueuedAsync(tenantId, agentId, claim, max, Now(), token).ConfigureAwait(false);
            if (messages.Count == 0) return null;
            MessageDelivery delivery = new MessageDelivery();
            delivery.TenantId = tenantId;
            delivery.Claim = claim;
            delivery.Messages = messages;
            delivery.More = await QueuedCountAsync(tenantId, agentId, token).ConfigureAwait(false) > messages.Count;
            if (render)
            {
                try
                {
                    PromptTemplate template = await _Templates.ResolveAsync(tenantId, InboxDeliveryRenderer.TemplateName, PromptTemplateKindEnum.Fragment, token).ConfigureAwait(false);
                    delivery.Text = InboxDeliveryRenderer.Render(template.Content, template.Name, messages, delivery.More);
                }
                catch (Exception)
                {
                    await ReleaseDeliveryAsync(delivery).ConfigureAwait(false);
                    throw;
                }
            }
            return delivery;
        }

        private async Task<long> QueuedCountAsync(string tenantId, string agentId, CancellationToken token)
        {
            AgentMessageFilter filter = new AgentMessageFilter { TenantId = tenantId, RecipientAgentId = agentId, Status = MessageStatusEnum.Queued, MaxResults = 1 };
            EnumerationResult<AgentMessage> page = await _Database.AgentMessages.EnumerateAsync(filter, token).ConfigureAwait(false);
            return page.TotalRecords;
        }

        private async Task<AgentMessage> BuildAsync(string tenantId, string recipientId, AgentMessageSendRequest request, AgentMessage? parent, CancellationToken token)
        {
            Agent recipient = await _Database.Agents.ReadAsync(tenantId, recipientId, token).ConfigureAwait(false)
                ?? throw Invalid("recipient", "Agent " + recipientId + " does not exist.", "ReferenceNotFound");
            AgentMessage message = new AgentMessage();
            message.TenantId = tenantId;
            message.RecipientAgentId = recipient.Id;
            message.RecipientAgentName = recipient.Name;
            bool defaulted = String.IsNullOrWhiteSpace(request.Subject) && parent != null;
            string? subject = defaulted ? (parent!.Subject.StartsWith("Re: ", StringComparison.Ordinal) ? parent.Subject : "Re: " + parent.Subject) : request.Subject;
            if (String.IsNullOrWhiteSpace(subject)) throw Invalid("subject", "A subject is required.", "Required");
            subject = subject.Trim();
            if (defaulted && subject.Length > 256) subject = subject.Substring(0, 256);
            try
            {
                message.Subject = subject;
            }
            catch (ArgumentException e)
            {
                throw Invalid("subject", e.Message, "OutOfRange");
            }
            message.Body = request.Body ?? String.Empty;
            if (Encoding.UTF8.GetByteCount(message.Body) > _Options.MaxBodyBytes) throw Invalid("body", "A message body holds at most Messaging.MaxBodyBytes (" + _Options.MaxBodyBytes + ") UTF-8 bytes.", "TooLarge");
            message.Urgency = request.Urgency;
            if (parent != null)
            {
                message.ParentMessageId = parent.Id;
                message.ThreadId = parent.ThreadId;
            }
            else
            {
                message.ThreadId = message.Id;
            }
            if (request.TtlSeconds.HasValue)
            {
                if (request.TtlSeconds.Value < 1 || request.TtlSeconds.Value > 31536000) throw Invalid("ttlSeconds", "ttlSeconds is 1 to 31536000.", "OutOfRange");
                message.ExpiresUtc = Now().AddSeconds(request.TtlSeconds.Value);
            }
            List<string> artifactIds = request.ArtifactIds.Where(a => !String.IsNullOrWhiteSpace(a)).Select(a => a.Trim()).Distinct(StringComparer.Ordinal).ToList();
            if (artifactIds.Count > MaxArtifacts) throw Invalid("artifactIds", "A message references at most " + MaxArtifacts + " artifacts.", "TooMany");
            foreach (string artifactId in artifactIds)
            {
                Artifact artifact = await _Database.Artifacts.ReadAsync(tenantId, artifactId, token).ConfigureAwait(false)
                    ?? throw Invalid("artifactIds", "Artifact " + artifactId + " does not exist.", "ReferenceNotFound");
                AgentMessageArtifact reference = new AgentMessageArtifact();
                reference.ArtifactId = artifact.Id;
                reference.Name = artifact.Name;
                reference.MediaType = artifact.MediaType;
                reference.SizeBytes = artifact.SizeBytes;
                message.Artifacts.Add(reference);
            }
            return message;
        }

        private async Task<AgentMessage?> ParentForRunAsync(Run run, string? parentMessageId, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(parentMessageId)) return null;
            // A run replies only to mail its own agent received; anything else answers NotFound, so a run cannot probe
            // another agent's inbox.
            return await ReadForRecipientAsync(run, parentMessageId, token).ConfigureAwait(false);
        }

        private async Task<AgentMessage> ReadForRecipientAsync(Run run, string messageId, CancellationToken token)
        {
            AgentMessage? message = String.IsNullOrWhiteSpace(messageId) ? null : await _Database.AgentMessages.ReadAsync(run.TenantId, messageId.Trim(), token).ConfigureAwait(false);
            if (message == null || message.RecipientAgentId != run.AgentId) throw new NotFoundException("Message not found.");
            return message;
        }

        private async Task<string> RecipientIdAsync(string tenantId, string? recipient, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(recipient)) throw Invalid("recipient", "A recipient agent is required.", "Required");
            string value = recipient.Trim();
            Agent? agent = await _Database.Agents.ReadAsync(tenantId, value, token).ConfigureAwait(false)
                ?? await _Database.Agents.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
            if (agent == null) throw Invalid("recipient", "Agent " + value + " does not exist.", "ReferenceNotFound");
            return agent.Id;
        }

        private static ConflictException Rejection(AgentMessage message)
        {
            string reason = message.RejectionReason?.ToString() ?? "Rejected";
            return new ConflictException(reason, (message.RejectionDetail ?? "The message was rejected.") + " The rejected message is recorded as " + message.Id + ".");
        }

        private static ValidationException Invalid(string field, string message, string code)
        {
            return new ValidationException("The message is invalid.", new Dictionary<string, string> { [field] = message }, new Dictionary<string, string> { [field] = code });
        }

        private static string Canonical(AgentMessage message)
        {
            Dictionary<string, object?> map = new Dictionary<string, object?>(StringComparer.Ordinal);
            map["recipient"] = message.RecipientAgentId;
            map["parent"] = message.ParentMessageId;
            map["urgency"] = message.Urgency.ToString();
            map["subject"] = message.Subject;
            map["body"] = message.Body;
            map["artifacts"] = message.Artifacts.Select(a => a.ArtifactId).ToList();
            map["expires"] = message.ExpiresUtc.HasValue;
            return Serializer.Serialize(map);
        }

        private static string Digest(string value)
        {
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
        }

        private static string Label(MessageUrgencyEnum urgency)
        {
            return urgency.ToString().ToLowerInvariant();
        }

        private static string Snake(MessageRejectionEnum reason)
        {
            switch (reason)
            {
                case MessageRejectionEnum.HopLimit: return "hop_limit";
                case MessageRejectionEnum.LineRate: return "line_rate";
                case MessageRejectionEnum.ThreadBudget: return "thread_budget";
                case MessageRejectionEnum.NoLine: return "no_line";
                default: return "frozen";
            }
        }

        #endregion
    }
}
