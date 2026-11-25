namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;

    /// <summary>
    /// Keepers (AA1): mandates whose agent wakes on a schedule. List, get (by identifier or name), create, update, and
    /// delete need Read, Create, Update, and Delete on Mandate; create and update also need Execute on the agent, because
    /// the keeper's ticks run as the caller. Revisions are read with Read and drafted or published with Update; pause,
    /// resume, and wake need Execute. Create and update return Warnings when a revision value was clamped.
    /// </summary>
    public class MandatesClient : ResourceClient<Mandate, Mandate>
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public MandatesClient(GarrisonTransport transport) : base(transport, "mandates")
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List mandates, optionally by status, agent, and deployment.
        /// </summary>
        /// <param name="query">Optional paging, ordering, and search.</param>
        /// <param name="status">Optional status filter.</param>
        /// <param name="agentId">Optional agent identifier filter.</param>
        /// <param name="deploymentId">Optional deployment identifier filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Mandate>> ListAsync(EnumerationQuery? query, MandateStatusEnum? status, string? agentId = null, string? deploymentId = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = QueryBuilder.From(query);
            parameters["status"] = status?.ToString();
            parameters["agentId"] = agentId;
            parameters["deploymentId"] = deploymentId;
            return await Transport.SendAsync<EnumerationResult<Mandate>>(HttpMethod.Get, Collection(), null, parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<Mandate>();
        }

        /// <summary>
        /// Delete a mandate with its revisions and tick history.
        /// </summary>
        /// <param name="id">Mandate identifier or name.</param>
        /// <param name="force">True cancels the run of a tick in progress; false answers 409 MandateActive while one runs.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="GarrisonException">Thrown with 409 MandateActive when a tick runs and force is false.</exception>
        public async Task DeleteAsync(string id, bool force, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            parameters["force"] = force ? "true" : null;
            await Transport.SendTextAsync(HttpMethod.Delete, Item(id), null, parameters, token: token).ConfigureAwait(false);
        }

        /// <summary>
        /// List a mandate's revisions, newest first.
        /// </summary>
        /// <param name="id">Mandate identifier or name.</param>
        /// <param name="query">Optional paging.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<MandateRevision>> ListRevisionsAsync(string id, EnumerationQuery? query = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<EnumerationResult<MandateRevision>>(HttpMethod.Get, Item(id) + "/revisions", null, QueryBuilder.From(query), token: token).ConfigureAwait(false) ?? new EnumerationResult<MandateRevision>();
        }

        /// <summary>
        /// Read one revision of a mandate.
        /// </summary>
        /// <param name="id">Mandate identifier or name.</param>
        /// <param name="revisionId">Revision identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The revision.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<MandateRevision> GetRevisionAsync(string id, string revisionId, CancellationToken token = default)
        {
            return await Transport.SendAsync<MandateRevision>(HttpMethod.Get, Item(id) + "/revisions/" + Segment(revisionId), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Draft a new revision. It does not take effect until it is published.
        /// </summary>
        /// <param name="id">Mandate identifier or name.</param>
        /// <param name="revision">The revision to draft.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The drafted revision, with Warnings when a value was clamped.</returns>
        /// <exception cref="ArgumentNullException">Thrown when revision is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<MandateRevision> CreateRevisionAsync(string id, MandateRevision revision, CancellationToken token = default)
        {
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            return await Transport.SendAsync<MandateRevision>(HttpMethod.Post, Item(id) + "/revisions", revision, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Publish a draft revision: it becomes current, backoff resets, a Draft mandate becomes Active, and an Active
        /// mandate wakes now.
        /// </summary>
        /// <param name="id">Mandate identifier or name.</param>
        /// <param name="revisionId">Draft revision identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The mandate.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown with 409 RevisionPublished when the revision is not a draft.</exception>
        public async Task<Mandate> PublishRevisionAsync(string id, string revisionId, CancellationToken token = default)
        {
            return await Transport.SendAsync<Mandate>(HttpMethod.Post, Item(id) + "/revisions/" + Segment(revisionId) + "/publish", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Pause an Active mandate: no further wakes until it is resumed.
        /// </summary>
        /// <param name="id">Mandate identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The mandate.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown with 409 MandateNotActive when it is not Active or CapReached.</exception>
        public async Task<Mandate> PauseAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Mandate>(HttpMethod.Post, Item(id) + "/pause", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Resume a paused mandate: it wakes now with its interval reset.
        /// </summary>
        /// <param name="id">Mandate identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The mandate.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown with 409 MandateNotPaused or NoPublishedRevision.</exception>
        public async Task<Mandate> ResumeAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Mandate>(HttpMethod.Post, Item(id) + "/resume", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Wake an Active mandate now (after the running tick, if one is running). The server answers 202; the tick starts
        /// on the next scheduler sweep, so poll <see cref="ListTicksAsync"/> for it.
        /// </summary>
        /// <param name="id">Mandate identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The mandate, with PendingWakeSource set.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown with 409 MandateNotActive when it is not Active.</exception>
        public async Task<Mandate> WakeAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Mandate>(HttpMethod.Post, Item(id) + "/wake", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// List a mandate's ticks, newest first.
        /// </summary>
        /// <param name="id">Mandate identifier or name.</param>
        /// <param name="outcome">Optional outcome filter.</param>
        /// <param name="query">Optional paging.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<MandateTick>> ListTicksAsync(string id, TickOutcomeEnum? outcome = null, EnumerationQuery? query = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = QueryBuilder.From(query);
            parameters["outcome"] = outcome?.ToString();
            return await Transport.SendAsync<EnumerationResult<MandateTick>>(HttpMethod.Get, Item(id) + "/ticks", null, parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<MandateTick>();
        }

        /// <summary>
        /// Read one tick by identifier (authorized as Read on its mandate).
        /// </summary>
        /// <param name="tickId">Tick identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The tick.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<MandateTick> GetTickAsync(string tickId, CancellationToken token = default)
        {
            return await Transport.SendAsync<MandateTick>(HttpMethod.Get, TenantPath("/mandate-ticks/" + Segment(tickId)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
