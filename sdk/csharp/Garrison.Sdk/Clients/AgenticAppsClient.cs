namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Agentic apps (AD6): groups of agents behind one chat UI, with the delegation policy their graph implies, app
    /// revisions, and promotion. List, get (by identifier or name), create, update, and delete need Read, Create, Update,
    /// and Delete on AgenticApp; taking a revision and applying delegation need Update; publishing needs Execute; promotion
    /// needs Execute on Promotion for the target environment. An agent that belongs to an app cannot be deleted (409
    /// AgentInUse). Thread-safe.
    /// </summary>
    public class AgenticAppsClient : ResourceClient<AgenticApp, AgenticApp>
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public AgenticAppsClient(GarrisonTransport transport) : base(transport, "apps")
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Compute each member's delegation policy from the app graph (allow list, mode, maximum depth) and compare it with
        /// the member's latest published revision.
        /// </summary>
        /// <param name="id">App identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The plan, with drifting members marked.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<AppDelegationPlan> GetDelegationAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<AppDelegationPlan>(HttpMethod.Get, AppItem(id) + "/delegation", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Write the graph's delegation policy into a draft revision of each drifting member. Nothing is published. A
        /// member whose open draft already changes its delegation another way is left alone with SkippedReason
        /// DraftConflict.
        /// </summary>
        /// <param name="id">App identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The plan with Applied true and each written draft's number.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<AppDelegationPlan> ApplyDelegationAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<AppDelegationPlan>(HttpMethod.Post, AppItem(id) + "/delegation", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// List an app's revisions, newest first.
        /// </summary>
        /// <param name="id">App identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revisions; empty when none were taken.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<List<AppRevision>> ListRevisionsAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<List<AppRevision>>(HttpMethod.Get, AppItem(id) + "/revisions", token: token).ConfigureAwait(false) ?? new List<AppRevision>();
        }

        /// <summary>
        /// Take a draft app revision pinning every member's latest published revision and copying the edges. Every member
        /// needs a published revision.
        /// </summary>
        /// <param name="id">App identifier or name.</param>
        /// <param name="request">Optional change note; null sends none.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<AppRevision> CreateRevisionAsync(string id, AppRevisionRequest? request = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<AppRevision>(HttpMethod.Post, AppItem(id) + "/revisions", request ?? new AppRevisionRequest(), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read an app revision.
        /// </summary>
        /// <param name="id">App identifier or name.</param>
        /// <param name="revision">Revision identifier (prefix apv_) or number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or revision is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<AppRevision> GetRevisionAsync(string id, string revision, CancellationToken token = default)
        {
            return await Transport.SendAsync<AppRevision>(HttpMethod.Get, RevisionItem(id, revision), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Publish a draft app revision.
        /// </summary>
        /// <param name="id">App identifier or name.</param>
        /// <param name="revision">Revision identifier (prefix apv_) or number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The published revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or revision is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<AppRevision> PublishRevisionAsync(string id, string revision, CancellationToken token = default)
        {
            return await Transport.SendAsync<AppRevision>(HttpMethod.Post, RevisionItem(id, revision) + "/publish", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Promote a published app revision from one environment to the next: every member's pinned revision goes to every
        /// deployment of that member in the target environment, in one transaction, under one promotion record. Fails with
        /// NoTargetDeployments, naming the member, when a member has no deployment in the target environment. Roll back with
        /// <see cref="PromotionsClient.RollbackAsync"/>.
        /// </summary>
        /// <param name="id">App identifier or name.</param>
        /// <param name="request">Source and optional target environment, revision, skip permission, and note.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The promotion record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 403 without Execute on Promotion for the target environment.</exception>
        public async Task<PromotionRecord> PromoteAsync(string id, AppPromotionRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<PromotionRecord>(HttpMethod.Post, AppItem(id) + "/promote", request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion

        #region Private-Methods

        private string AppItem(string id)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return Item(id);
        }

        private string RevisionItem(string id, string revision)
        {
            if (String.IsNullOrEmpty(revision)) throw new ArgumentNullException(nameof(revision));
            return AppItem(id) + "/revisions/" + Segment(revision);
        }

        #endregion
    }
}
