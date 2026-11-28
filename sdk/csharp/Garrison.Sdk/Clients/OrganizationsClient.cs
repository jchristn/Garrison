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
    using Garrison.Sdk.Requests;

    /// <summary>
    /// Organizations (AA7): trees of org units with a mission, per-unit budgets, and revisions. List, get (by identifier
    /// or name), create, update, and delete need Read, Create, Update, and Delete on Organization; units, publishing, and
    /// rollback need Update. Unit edits change the working tree; the chain of command, lines, and budgets follow the live
    /// revision only, so publish a revision to make edits take effect. A refused change raises a GarrisonException with
    /// status 409 and a code such as OneRoot, Cycle, LeadsTwoUnits, BudgetExceedsParent, or NothingToRollBack. Proposals
    /// (AA8) are the studio drafts an organization's executives write for the units below them: listing and reading need
    /// Read on Organization, deciding needs Update on Approval.
    /// </summary>
    public class OrganizationsClient : ResourceClient<Organization, Organization>
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public OrganizationsClient(GarrisonTransport transport) : base(transport, "organizations")
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List the units of the working tree, root first.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Units.</returns>
        public async Task<List<OrgUnit>> ListUnitsAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<List<OrgUnit>>(HttpMethod.Get, Item(id) + "/units", token: token).ConfigureAwait(false) ?? new List<OrgUnit>();
        }

        /// <summary>
        /// Read a unit of the working tree.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="unitId">Unit identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The unit.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<OrgUnit> GetUnitAsync(string id, string unitId, CancellationToken token = default)
        {
            return await Transport.SendAsync<OrgUnit>(HttpMethod.Get, Item(id) + "/units/" + Segment(unitId), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Add a unit to the working tree. ParentUnitId, LeadAgentId, LeadMandateId, AppId, member agents, and peer units
        /// may be identifiers or names. The first unit without a parent is the root; a second answers 409 OneRoot.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="unit">The unit.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored unit.</returns>
        /// <exception cref="ArgumentNullException">Thrown when unit is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<OrgUnit> CreateUnitAsync(string id, OrgUnit unit, CancellationToken token = default)
        {
            if (unit == null) throw new ArgumentNullException(nameof(unit));
            return await Transport.SendAsync<OrgUnit>(HttpMethod.Post, Item(id) + "/units", unit, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Replace a unit of the working tree.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="unitId">Unit identifier or name.</param>
        /// <param name="unit">The unit.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored unit.</returns>
        /// <exception cref="ArgumentNullException">Thrown when unit is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<OrgUnit> UpdateUnitAsync(string id, string unitId, OrgUnit unit, CancellationToken token = default)
        {
            if (unit == null) throw new ArgumentNullException(nameof(unit));
            return await Transport.SendAsync<OrgUnit>(HttpMethod.Put, Item(id) + "/units/" + Segment(unitId), unit, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Remove a unit without children from the working tree, with the peer lines that point at it.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="unitId">Unit identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="GarrisonException">Thrown with 409 UnitHasChildren when the unit has children.</exception>
        public async Task DeleteUnitAsync(string id, string unitId, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, Item(id) + "/units/" + Segment(unitId), token: token).ConfigureAwait(false);
        }

        /// <summary>
        /// The organization chart of the live revision, or of the working tree before the first publish (Source tells
        /// which: Live or Working).
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The chart.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<OrgChart> ChartAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<OrgChart>(HttpMethod.Get, Item(id) + "/chart", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// List revisions, newest first, without snapshots.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revisions.</returns>
        public async Task<List<OrgRevision>> ListRevisionsAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<List<OrgRevision>>(HttpMethod.Get, Item(id) + "/revisions", token: token).ConfigureAwait(false) ?? new List<OrgRevision>();
        }

        /// <summary>
        /// Read a revision with its snapshot.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="revisionId">Revision identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The revision.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<OrgRevision> GetRevisionAsync(string id, string revisionId, CancellationToken token = default)
        {
            return await Transport.SendAsync<OrgRevision>(HttpMethod.Get, Item(id) + "/revisions/" + Segment(revisionId), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Snapshot the working tree as a Draft revision, pinning the current revision of every mandate it names.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="request">Optional note.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft revision.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<OrgRevision> CreateRevisionAsync(string id, OrgRevisionRequest? request = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<OrgRevision>(HttpMethod.Post, Item(id) + "/revisions", request ?? new OrgRevisionRequest(), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Make a Draft revision live. The chain of command, lines, and budgets follow it, its pinned mandate revisions
        /// become current, and a promotion record with subject Organization is written.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="revisionId">Draft revision identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The published revision.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown with 409 RevisionPublished when the revision is not a draft.</exception>
        public async Task<OrgRevision> PublishAsync(string id, string revisionId, CancellationToken token = default)
        {
            return await Transport.SendAsync<OrgRevision>(HttpMethod.Post, Item(id) + "/revisions/" + Segment(revisionId) + "/publish", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Return to an earlier live revision (RevisionId, or the one live before the current one). Publishes a copy of its
        /// snapshot, restores the working tree and pinned mandate revisions, and records the rollback.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="request">Optional revision, note, and what to do with ticks in flight (ActiveTicks, default Finish).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new live revision.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown with 409 NothingToRollBack or AlreadyLive.</exception>
        public async Task<OrgRevision> RollbackAsync(string id, OrgRollbackRequest? request = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<OrgRevision>(HttpMethod.Post, Item(id) + "/rollback", request ?? new OrgRollbackRequest(), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Cancel everything active in a unit's subtree of the live tree in one audited action (AA11.4): queued and
        /// running runs (running runs move to Cancelling), in-flight mandate ticks, open escalations the subtree's agents
        /// raised, and queued or undelivered messages addressed to them. It does not freeze the unit. Needs Execute on
        /// Organization.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="unitId">Unit identifier or name.</param>
        /// <param name="reason">Why, at most 1024 characters, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The counts and the cancelled run identifiers.</returns>
        /// <exception cref="ArgumentNullException">Thrown when unitId is null or empty.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when reason is longer than 1024 characters.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown with 404 when the unit is not in the organization and 409 OrganizationNotLive without a live revision.</exception>
        public async Task<CascadeCancelResult> CancelAllAsync(string id, string unitId, string? reason = null, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(unitId)) throw new ArgumentNullException(nameof(unitId));
            if (reason != null && reason.Length > 1024) throw new ArgumentOutOfRangeException(nameof(reason), "Reason must be at most 1024 characters.");
            CascadeCancelRequest request = new CascadeCancelRequest { Reason = reason };
            return await Transport.SendAsync<CascadeCancelResult>(HttpMethod.Post, Item(id) + "/units/" + Segment(unitId) + "/cancel-all", request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Validate the working tree without publishing it. Each problem has a code, a severity, the unit, agent, or
        /// mandate it is about, and a message. Error problems are the ones publishing would refuse; Warning problems
        /// publish but leave the organization incomplete. Valid is true when no problem is an Error. Writes nothing.
        /// Needs Read on Organization.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The result.</returns>
        /// <exception cref="GarrisonException">404 when the organization does not exist in the tenant.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<OrganizationValidationResult> ValidateOrganizationAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<OrganizationValidationResult>(HttpMethod.Post, Item(id) + "/validate", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Spend of each unit's subtree against its budgets in the current day and month windows (live revision).
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>One entry per unit and period.</returns>
        public async Task<List<OrgUnitSpend>> SpendAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<List<OrgUnitSpend>>(HttpMethod.Get, Item(id) + "/spend", token: token).ConfigureAwait(false) ?? new List<OrgUnitSpend>();
        }

        /// <summary>
        /// List the organization's executive proposals, newest change first, without diffs.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="status">Only proposals with this draft status, or null for all.</param>
        /// <param name="query">Optional paging (MaxResults and Skip).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<OrgProposal>> ListProposalsAsync(string id, StudioDraftStatusEnum? status = null, EnumerationQuery? query = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (query != null)
            {
                parameters["maxResults"] = query.MaxResults.ToString();
                parameters["skip"] = query.Skip.ToString();
            }
            parameters["status"] = status?.ToString();
            return await Transport.SendAsync<EnumerationResult<OrgProposal>>(HttpMethod.Get, Item(id) + "/proposals", null, parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<OrgProposal>();
        }

        /// <summary>
        /// Read a proposal. One not yet applied carries its diff, hard-limit refusals, and the change rule matching each
        /// change.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="draftId">Draft identifier (sdr_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The proposal.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<OrgProposal> GetProposalAsync(string id, string draftId, CancellationToken token = default)
        {
            return await Transport.SendAsync<OrgProposal>(HttpMethod.Get, Item(id) + "/proposals/" + Segment(draftId), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Decide a proposal waiting for approval: allow applies it (recorded as an org revision with a revert draft, so a
        /// rollback undoes it); deny sends it back to the executive.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="draftId">Draft identifier (sdr_).</param>
        /// <param name="request">The decision.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The proposal after the decision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<OrgProposal> DecideProposalAsync(string id, string draftId, OrgProposalDecisionRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<OrgProposal>(HttpMethod.Post, Item(id) + "/proposals/" + Segment(draftId) + "/decide", request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
