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
    /// Eval sets (AA9): versioned, named sets of eval cases. A Draft version changes in place; an Approved version is
    /// immutable, and editing it or its cases creates the next version as a Draft. Only people approve a set. Needs Read,
    /// Create, Update, and Delete on EvalSet. A refused field raises a GarrisonException with status 400 and a field code
    /// such as InputRequired, ArgumentRequired, UnknownScorer, InvalidJsonSchema, or TooManyCases.
    /// </summary>
    public class EvalSetsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public EvalSetsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List eval set versions, newest first.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<EvalSet>> ListAsync(EvalSetFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["state"] = filter.State?.ToString();
                query["origin"] = filter.Origin?.ToString();
                query["tag"] = filter.Tag;
                query["latestOnly"] = filter.LatestOnly ? "true" : null;
                query["search"] = filter.Search;
                query["skip"] = filter.Skip.ToString();
                query["maxResults"] = filter.MaxResults.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<EvalSet>>(HttpMethod.Get, TenantPath("/eval-sets"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<EvalSet>();
        }

        /// <summary>
        /// Read an eval set version by identifier, or the newest version of a set by name.
        /// </summary>
        /// <param name="idOrName">Set version identifier (evs_) or set name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The version.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalSet> GetAsync(string idOrName, CancellationToken token = default)
        {
            return await Transport.SendAsync<EvalSet>(HttpMethod.Get, TenantPath("/eval-sets/" + Segment(idOrName)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Create version 1 of an eval set, optionally with its cases. A name already in use answers 409 EvalSetExists.
        /// </summary>
        /// <param name="request">Name, description, origin, judge agent, tags, and cases.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The Draft version.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalSet> CreateAsync(EvalSetRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<EvalSet>(HttpMethod.Post, TenantPath("/eval-sets"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Edit a set's description, judge agent, and tags. A Draft changes in place; an Approved version answers with its
        /// next version, a Draft.
        /// </summary>
        /// <param name="idOrName">Set version identifier (evs_) or set name.</param>
        /// <param name="request">The edit.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The edited Draft version.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalSet> UpdateAsync(string idOrName, EvalSetRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<EvalSet>(HttpMethod.Put, TenantPath("/eval-sets/" + Segment(idOrName)), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Delete a Draft version. Approved versions are kept (409 EvalSetImmutable).
        /// </summary>
        /// <param name="idOrName">Set version identifier (evs_) or set name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string idOrName, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, TenantPath("/eval-sets/" + Segment(idOrName)), token: token).ConfigureAwait(false);
        }

        /// <summary>
        /// Approve a Draft version so it can gate promotions, change rules, and canary steps. People only: a run token is
        /// refused with 403 ApprovalIsPeopleOnly. An approved version answers 409 AlreadyApproved and an empty one 409
        /// EvalSetEmpty.
        /// </summary>
        /// <param name="idOrName">Set version identifier (evs_) or set name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The Approved version.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalSet> ApproveAsync(string idOrName, CancellationToken token = default)
        {
            return await Transport.SendAsync<EvalSet>(HttpMethod.Post, TenantPath("/eval-sets/" + Segment(idOrName) + "/approve"), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// List a set version's cases in order. Run tokens see hidden cases redacted to their scorers.
        /// </summary>
        /// <param name="idOrName">Set version identifier (evs_) or set name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Cases.</returns>
        public async Task<List<EvalCase>> ListCasesAsync(string idOrName, CancellationToken token = default)
        {
            return await Transport.SendAsync<List<EvalCase>>(HttpMethod.Get, TenantPath("/eval-sets/" + Segment(idOrName) + "/cases"), token: token).ConfigureAwait(false) ?? new List<EvalCase>();
        }

        /// <summary>
        /// Add a case at the end of a set. On an Approved version the case lands on the next version, a Draft, and the
        /// returned case's SetId names that version.
        /// </summary>
        /// <param name="idOrName">Set version identifier (evs_) or set name.</param>
        /// <param name="item">The case.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored case.</returns>
        /// <exception cref="ArgumentNullException">Thrown when item is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalCase> CreateCaseAsync(string idOrName, EvalCase item, CancellationToken token = default)
        {
            if (item == null) throw new ArgumentNullException(nameof(item));
            return await Transport.SendAsync<EvalCase>(HttpMethod.Post, TenantPath("/eval-sets/" + Segment(idOrName) + "/cases"), item, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read a case.
        /// </summary>
        /// <param name="idOrName">Set version identifier (evs_) or set name.</param>
        /// <param name="caseId">Case identifier (evc_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The case.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalCase> GetCaseAsync(string idOrName, string caseId, CancellationToken token = default)
        {
            return await Transport.SendAsync<EvalCase>(HttpMethod.Get, TenantPath("/eval-sets/" + Segment(idOrName) + "/cases/" + Segment(caseId)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Replace a case. On an Approved version the same case of the next version changes.
        /// </summary>
        /// <param name="idOrName">Set version identifier (evs_) or set name.</param>
        /// <param name="caseId">Case identifier (evc_).</param>
        /// <param name="item">The replacement.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored case.</returns>
        /// <exception cref="ArgumentNullException">Thrown when item is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalCase> UpdateCaseAsync(string idOrName, string caseId, EvalCase item, CancellationToken token = default)
        {
            if (item == null) throw new ArgumentNullException(nameof(item));
            return await Transport.SendAsync<EvalCase>(HttpMethod.Put, TenantPath("/eval-sets/" + Segment(idOrName) + "/cases/" + Segment(caseId)), item, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Remove a case. On an Approved version it is removed from the next version, a Draft.
        /// </summary>
        /// <param name="idOrName">Set version identifier (evs_) or set name.</param>
        /// <param name="caseId">Case identifier (evc_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The Draft version the case was removed from.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalSet> DeleteCaseAsync(string idOrName, string caseId, CancellationToken token = default)
        {
            return await Transport.SendAsync<EvalSet>(HttpMethod.Delete, TenantPath("/eval-sets/" + Segment(idOrName) + "/cases/" + Segment(caseId)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
