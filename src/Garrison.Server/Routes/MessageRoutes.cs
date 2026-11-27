namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Message routes (AA6.9): list and read messages between agents, read a thread, and let people write to an agent. Runs
    /// send and read mail through the MCP tools and the line policy, not through these routes. Every route filters by the
    /// request's tenant; another tenant's message answers 404.
    /// </summary>
    public class MessageRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly MessageService _Messages;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/messages";
        private static readonly string _Threads = "/v1.0/api/tenants/{tenantId}/message-threads";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="messages">Message service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public MessageRoutes(ServerContext server, MessageService messages)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Messages = messages ?? throw new ArgumentNullException(nameof(messages));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Route registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            const string tag = "Messages";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.AgentMessage, OperationTypeEnum.Read, ListAsync, "List messages between agents, newest first (query: sender, recipient, agent, status, urgency, reason, thread, deliveredRunId, from, to, search, maxResults, skip)", tag, null, typeof(EnumerationResult<AgentMessage>), "id", null, new RouteScopeOptions().Query("agent", ResourceTypeEnum.Agent).Query("sender", ResourceTypeEnum.Agent).Query("recipient", ResourceTypeEnum.Agent));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.AgentMessage, OperationTypeEnum.Create, SendAsync, "Write to an agent. People may write to any agent; loop guards and freezes still apply, and a refused message answers 409 with the reason as the code. idempotencyKey makes a retried send return the first message", tag, typeof(AgentMessageSendRequest), typeof(AgentMessage));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.AgentMessage, OperationTypeEnum.Read, ReadAsync, "Read a message with its artifacts", tag, null, typeof(AgentMessage));
            routes.Scoped(HttpMethod.GET, _Threads + "/{threadId}", ResourceTypeEnum.AgentMessage, OperationTypeEnum.Read, ThreadAsync, "Every message in a thread, oldest first, rejected ones included", tag, null, typeof(List<AgentMessage>));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationQuery query = RouteHelpers.Enumeration(http);
            string tenantId = RouteHelpers.Tenant(http);
            AgentMessageFilter filter = new AgentMessageFilter();
            filter.TenantId = tenantId;
            filter.SenderAgentId = await AgentAsync(http, tenantId, "sender").ConfigureAwait(false);
            filter.RecipientAgentId = await AgentAsync(http, tenantId, "recipient").ConfigureAwait(false);
            filter.AgentId = await AgentAsync(http, tenantId, "agent").ConfigureAwait(false);
            filter.Status = RouteHelpers.QueryEnum<MessageStatusEnum>(http, "status");
            filter.Urgency = RouteHelpers.QueryEnum<MessageUrgencyEnum>(http, "urgency");
            filter.RejectionReason = RouteHelpers.QueryEnum<MessageRejectionEnum>(http, "reason");
            filter.ThreadId = RouteHelpers.Query(http, "thread");
            filter.DeliveredRunId = RouteHelpers.Query(http, "deliveredRunId");
            filter.FromUtc = RouteHelpers.QueryDate(http, "from");
            filter.ToUtc = RouteHelpers.QueryDate(http, "to");
            filter.Search = query.Search;
            filter.MaxResults = query.MaxResults;
            filter.Skip = query.Skip;
            EnumerationResult<AgentMessage> page = await _Server.Database.AgentMessages.EnumerateAsync(filter, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task SendAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            AgentMessageSendRequest request = RouteHelpers.RequiredBody<AgentMessageSendRequest>(http);
            AgentMessage sent = await _Messages.SendFromPersonAsync(RouteHelpers.Context(http), tenantId, request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, sent).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            AgentMessage? message = String.IsNullOrEmpty(id) ? null : await _Server.Database.AgentMessages.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false);
            if (message == null) throw new NotFoundException("Message " + id + " not found.");
            await RouteHelpers.JsonAsync(http, 200, message).ConfigureAwait(false);
        }

        private async Task ThreadAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string threadId = RouteHelpers.Param(http, "threadId") ?? String.Empty;
            List<AgentMessage> thread = String.IsNullOrEmpty(threadId) ? new List<AgentMessage>() : await _Server.Database.AgentMessages.ListThreadAsync(tenantId, threadId, http.Token).ConfigureAwait(false);
            if (thread.Count == 0) throw new NotFoundException("Thread " + threadId + " not found.");
            await RouteHelpers.JsonAsync(http, 200, thread).ConfigureAwait(false);
        }

        private async Task<string?> AgentAsync(HttpContextBase http, string tenantId, string name)
        {
            string? value = RouteHelpers.Query(http, name);
            if (String.IsNullOrWhiteSpace(value)) return null;
            return await ReportRoutes.AgentIdAsync(_Server.Database, tenantId, value, http.Token).ConfigureAwait(false) ?? value.Trim();
        }

        #endregion
    }
}
