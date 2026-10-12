namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;

    /// <summary>
    /// Conversations: list, read, delete, and list turns. Conversations are started and continued by invoking an agent,
    /// creating a run, or testing a deployment with StartConversation or ConversationId set. Thread-safe.
    /// </summary>
    public class ConversationsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public ConversationsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List conversations.
        /// </summary>
        /// <param name="filter">Optional filter; null lists the first page with server defaults.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Conversation>> ListAsync(ConversationFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["agentId"] = filter.AgentId;
                query["contextId"] = filter.ContextId;
                query["callerId"] = filter.CallerId;
                query["search"] = filter.Search;
                query["skip"] = filter.Skip.ToString();
                query["maxResults"] = filter.MaxResults.ToString();
                query["ordering"] = filter.Ordering.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<Conversation>>(HttpMethod.Get, TenantPath("/conversations"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<Conversation>();
        }

        /// <summary>
        /// Read a conversation.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Conversation.</returns>
        /// <exception cref="GarrisonException">404 when the conversation does not exist.</exception>
        public async Task<Conversation> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Conversation>(HttpMethod.Get, TenantPath("/conversations/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Delete a conversation. Its runs are kept.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="GarrisonException">409 ConversationBusy when a turn is unfinished; 404 when it does not exist.</exception>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, TenantPath("/conversations/" + Segment(id)), token: token).ConfigureAwait(false);
        }

        /// <summary>
        /// List a conversation's turns (runs), oldest first.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="maxResults">Page size. Minimum 1, maximum 1000, default 25.</param>
        /// <param name="skip">Records to skip. Minimum 0, default 0.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page of runs.</returns>
        /// <exception cref="GarrisonException">404 when the conversation does not exist.</exception>
        public async Task<EnumerationResult<Run>> ListRunsAsync(string id, int maxResults = 25, int skip = 0, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            query["maxResults"] = Math.Clamp(maxResults, 1, 1000).ToString();
            query["skip"] = Math.Max(0, skip).ToString();
            return await Transport.SendAsync<EnumerationResult<Run>>(HttpMethod.Get, TenantPath("/conversations/" + Segment(id) + "/runs"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<Run>();
        }

        #endregion
    }
}
