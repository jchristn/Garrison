namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Conversation routes (plan P12.1): list, read, delete, and list a conversation's turns. Conversations are created
    /// by invoking an agent with startConversation (REST, MCP) or by any A2A message, and continued by invoking with
    /// conversationId (REST, MCP) or the A2A contextId.
    /// </summary>
    public class ConversationRoutes
    {
        #region Private-Members

        private readonly ServerContext _Context;
        private readonly ConversationService _Conversations;
        private readonly BlockedRunService _Blocked;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <param name="conversations">Conversation service.</param>
        /// <param name="blocked">Blocked-run evaluator (fills blockedReason on the turns).</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public ConversationRoutes(ServerContext context, ConversationService conversations, BlockedRunService blocked)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _Conversations = conversations ?? throw new ArgumentNullException(nameof(conversations));
            _Blocked = blocked ?? throw new ArgumentNullException(nameof(blocked));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            const string tag = "Conversations";
            const string baseConversations = "/v1.0/api/tenants/{tenantId}/conversations";
            routes.Scoped(HttpMethod.GET, baseConversations, ResourceTypeEnum.Conversation, OperationTypeEnum.Read, ListAsync, "List conversations", tag, null, typeof(EnumerationResult<Conversation>));
            routes.Scoped(HttpMethod.GET, baseConversations + "/{id}", ResourceTypeEnum.Conversation, OperationTypeEnum.Read, ReadAsync, "Read a conversation", tag, null, typeof(Conversation));
            routes.Scoped(HttpMethod.DELETE, baseConversations + "/{id}", ResourceTypeEnum.Conversation, OperationTypeEnum.Delete, DeleteAsync, "Delete a conversation that has no unfinished turn (its runs are kept)", tag);
            routes.Scoped(HttpMethod.GET, baseConversations + "/{id}/runs", ResourceTypeEnum.Conversation, OperationTypeEnum.Read, RunsAsync, "List a conversation's turns (runs), oldest first", tag, null, typeof(EnumerationResult<Run>));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase context)
        {
            ConversationFilter filter = new ConversationFilter();
            filter.TenantId = RouteHelpers.Tenant(context);
            filter.AgentId = RouteHelpers.Query(context, "agentId");
            filter.ContextId = RouteHelpers.Query(context, "contextId");
            filter.CallerId = RouteHelpers.Query(context, "callerId");
            EnumerationQuery query = RouteHelpers.Enumeration(context);
            filter.Search = query.Search;
            filter.Skip = query.Skip;
            filter.MaxResults = query.MaxResults;
            filter.Ordering = query.Ordering;
            EnumerationResult<Conversation> page = await _Context.Database.Conversations.EnumerateAsync(filter, context.Token).ConfigureAwait(false);
            foreach (Conversation conversation in page.Objects) await _Conversations.AnnotateAsync(conversation, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, page).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase context)
        {
            Conversation conversation = await RequireAsync(context).ConfigureAwait(false);
            await _Conversations.AnnotateAsync(conversation, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, conversation).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase context)
        {
            Conversation conversation = await RequireAsync(context).ConfigureAwait(false);
            if (await _Conversations.IsBusyAsync(conversation, context.Token).ConfigureAwait(false))
            {
                throw new ConflictException("ConversationBusy", "Conversation " + conversation.Id + " has an unfinished turn (run " + conversation.ActiveRunId + "). Cancel it or wait for it to finish, then delete the conversation.");
            }
            await _Context.Database.Conversations.DeleteAsync(conversation.Id, context.Token).ConfigureAwait(false);
            await _Context.Audit.WriteAsync(RouteHelpers.Context(context), AuditEventTypeEnum.ConversationDeleted, "Conversation", conversation.Id, "Deleted conversation " + conversation.Id + " with agent " + conversation.AgentName + " after " + conversation.TurnCount + " turn(s).", conversation.TenantId, context.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(context).ConfigureAwait(false);
        }

        private async Task RunsAsync(HttpContextBase context)
        {
            Conversation conversation = await RequireAsync(context).ConfigureAwait(false);
            EnumerationQuery query = RouteHelpers.Enumeration(context);
            RunFilter filter = new RunFilter();
            filter.TenantId = conversation.TenantId;
            filter.ConversationId = conversation.Id;
            filter.Skip = query.Skip;
            filter.MaxResults = query.MaxResults;
            filter.Ordering = RouteHelpers.Query(context, "ordering") == null ? EnumerationOrderEnum.CreatedAscending : query.Ordering;
            EnumerationResult<Run> page = await _Context.Database.Runs.EnumerateAsync(filter, context.Token).ConfigureAwait(false);
            await _Blocked.AnnotateManyAsync(page.Objects, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, page).ConfigureAwait(false);
        }

        private async Task<Conversation> RequireAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            string id = RouteHelpers.Param(context, "id") ?? String.Empty;
            return await _Context.Database.Conversations.ReadAsync(tenantId, id, context.Token).ConfigureAwait(false) ?? throw new NotFoundException("Conversation " + id + " not found.");
        }

        #endregion
    }
}
