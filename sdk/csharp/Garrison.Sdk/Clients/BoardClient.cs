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
    /// The board (AA10): the people who direct an autonomous organization. Read the board view of an organization, give
    /// its CEO direction, and talk to the CEO. Reading needs Read on Organization; direction and messages need Update.
    /// The BoardMember role grants what a board needs and can be scoped to one organization. Briefs and CEO replies are
    /// agent output: treat them as untrusted content.
    /// </summary>
    public class BoardClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public BoardClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Read the board view of an organization.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="limit">Most escalations, proposals, and unhealthy reports to return, 1 to 100, or null for the server default of 20.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The board.</returns>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when limit is outside 1 to 100.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Board> GetAsync(string id, int? limit = null, CancellationToken token = default)
        {
            if (limit != null && (limit.Value < 1 || limit.Value > 100)) throw new ArgumentOutOfRangeException(nameof(limit), "Limit must be from 1 to 100.");
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (limit != null) query["limit"] = limit.Value.ToString();
            return await Transport.SendAsync<Board>(HttpMethod.Get, Path(id, "/board"), null, query, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Give the CEO direction. The server publishes a new revision of the CEO's mandate with the direction and source
        /// Board, which its next tick reads as the board's instruction. Allowed while the organization is frozen. An
        /// organization whose root unit has no lead, or whose lead has no mandate, answers 409 BoardCeoMissing.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="request">The direction.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The published mandate revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<MandateRevision> DirectAsync(string id, BoardDirectionRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<MandateRevision>(HttpMethod.Post, Path(id, "/direction"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Send the CEO a message. The server starts a run on the CEO mandate's deployment as the calling person and
        /// answers 202 with it; follow it with the run stream and continue with its ConversationId. Answers 409
        /// BoardCeoMissing without a CEO mandate and 409 BoardCeoUnavailable when the mandate has no deployment.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="request">The message.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Run> SendMessageAsync(string id, BoardMessageRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<Run>(HttpMethod.Post, Path(id, "/board/messages"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// List the conversations the board started with the CEO of an organization, newest first.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Conversation>> ListConversationsAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<EnumerationResult<Conversation>>(HttpMethod.Get, Path(id, "/board/conversations"), token: token).ConfigureAwait(false) ?? new EnumerationResult<Conversation>();
        }

        #endregion

        #region Private-Methods

        private string Path(string id, string suffix)
        {
            return TenantPath("/organizations/" + Segment(id) + suffix);
        }

        #endregion
    }
}
