namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;

    /// <summary>
    /// Messages between agents (AA6): list and read messages and threads, and write to an agent as a person. Agents send,
    /// reply, read their inbox, and acknowledge through the garrison_*_message MCP tools. Reading needs Read on
    /// AgentMessage; sending needs Create. A refused message raises a GarrisonException with status 409 and the rejection
    /// reason as its code.
    /// </summary>
    public class MessagesClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public MessagesClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List messages, newest first, with their artifacts.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<AgentMessage>> ListAsync(AgentMessageFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["sender"] = filter.Sender;
                query["recipient"] = filter.Recipient;
                query["agent"] = filter.Agent;
                query["status"] = filter.Status?.ToString();
                query["urgency"] = filter.Urgency?.ToString();
                query["reason"] = filter.Reason?.ToString();
                query["thread"] = filter.Thread;
                query["deliveredRunId"] = filter.DeliveredRunId;
                query["from"] = Iso(filter.FromUtc);
                query["to"] = Iso(filter.ToUtc);
                query["search"] = filter.Search;
                query["skip"] = filter.Skip.ToString(CultureInfo.InvariantCulture);
                query["maxResults"] = filter.MaxResults.ToString(CultureInfo.InvariantCulture);
            }
            return await Transport.SendAsync<EnumerationResult<AgentMessage>>(HttpMethod.Get, TenantPath("/messages"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<AgentMessage>();
        }

        /// <summary>
        /// Read a message.
        /// </summary>
        /// <param name="id">Message identifier (amg_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Message.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentMessage> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<AgentMessage>(HttpMethod.Get, TenantPath("/messages/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Every message in a thread, oldest first, rejected ones included.
        /// </summary>
        /// <param name="threadId">Thread identifier (the first message's identifier).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Messages.</returns>
        public async Task<List<AgentMessage>> ThreadAsync(string threadId, CancellationToken token = default)
        {
            return await Transport.SendAsync<List<AgentMessage>>(HttpMethod.Get, TenantPath("/message-threads/" + Segment(threadId)), token: token).ConfigureAwait(false) ?? new List<AgentMessage>();
        }

        /// <summary>
        /// Write to an agent. With an idempotency key, sending again returns the first message.
        /// </summary>
        /// <param name="request">Message to send.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentMessage> SendAsync(AgentMessageSendRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<AgentMessage>(HttpMethod.Post, TenantPath("/messages"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion

        #region Private-Methods

        private static string? Iso(DateTime? value)
        {
            return value?.ToUniversalTime().ToString("o", CultureInfo.InvariantCulture);
        }

        #endregion
    }
}
