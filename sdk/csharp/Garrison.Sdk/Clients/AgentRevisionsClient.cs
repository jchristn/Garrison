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
    /// Agent revisions: drafts, published snapshots, and diffs of an agent's content. Agents are addressed by
    /// identifier or name; revisions by identifier (arv_) or number. Thread-safe.
    /// </summary>
    public class AgentRevisionsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public AgentRevisionsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List an agent's revisions, newest first.
        /// </summary>
        /// <param name="agentId">Agent identifier or name.</param>
        /// <param name="query">Optional paging, ordering, and search.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<AgentRevision>> ListAsync(string agentId, EnumerationQuery? query = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<EnumerationResult<AgentRevision>>(HttpMethod.Get, Revisions(agentId), null, QueryBuilder.From(query), token: token).ConfigureAwait(false) ?? new EnumerationResult<AgentRevision>();
        }

        /// <summary>
        /// Create or replace the agent's single open draft.
        /// </summary>
        /// <param name="agentId">Agent identifier or name.</param>
        /// <param name="draft">Draft content.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when draft is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentRevision> SaveDraftAsync(string agentId, AgentRevision draft, CancellationToken token = default)
        {
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            return await Transport.SendAsync<AgentRevision>(HttpMethod.Post, Revisions(agentId), draft, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read a revision.
        /// </summary>
        /// <param name="agentId">Agent identifier or name.</param>
        /// <param name="revisionId">Revision identifier (arv_) or number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The revision.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentRevision> GetAsync(string agentId, string revisionId, CancellationToken token = default)
        {
            return await Transport.SendAsync<AgentRevision>(HttpMethod.Get, Revision(agentId, revisionId), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Discard a draft revision.
        /// </summary>
        /// <param name="agentId">Agent identifier or name.</param>
        /// <param name="revisionId">Draft revision identifier (arv_) or number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DiscardDraftAsync(string agentId, string revisionId, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, Revision(agentId, revisionId), token: token).ConfigureAwait(false);
        }

        /// <summary>
        /// Publish a draft revision.
        /// </summary>
        /// <param name="agentId">Agent identifier or name.</param>
        /// <param name="revisionId">Draft revision identifier (arv_) or number.</param>
        /// <param name="request">Optional change note; null sends no body.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The published revision.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentRevision> PublishAsync(string agentId, string revisionId, RevisionPublishRequest? request = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<AgentRevision>(HttpMethod.Post, Revision(agentId, revisionId) + "/publish", request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Compare two revisions field by field.
        /// </summary>
        /// <param name="agentId">Agent identifier or name.</param>
        /// <param name="from">Earlier revision identifier (arv_) or number.</param>
        /// <param name="to">Later revision identifier (arv_) or number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The diff.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentRevisionDiff> DiffAsync(string agentId, string from, string to, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            parameters["from"] = from;
            parameters["to"] = to;
            return await Transport.SendAsync<AgentRevisionDiff>(HttpMethod.Get, Revisions(agentId) + "/diff", null, parameters, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion

        #region Private-Methods

        private string Revisions(string agentId)
        {
            return TenantPath("/agents/" + Segment(agentId) + "/revisions");
        }

        private string Revision(string agentId, string revisionId)
        {
            return Revisions(agentId) + "/" + Segment(revisionId);
        }

        #endregion
    }
}
