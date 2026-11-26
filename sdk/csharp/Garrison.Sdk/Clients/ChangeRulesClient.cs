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
    /// Change rules (AA8): people pre-authorize narrow classes of executive change for a unit's subtree, so an
    /// executive's draft whose every change a rule covers applies without a person. Read, Create, Update, and Delete on
    /// ChangeRule; run tokens can never create, change, or delete a rule (403 RulesArePeopleOnly). A refused field raises a
    /// GarrisonException with status 400 and a field code such as UnknownLimit, ClassNotInRule, UnitNotFound,
    /// BoundRequired, MinimumAboveMaximum, or ExpiryInPast.
    /// </summary>
    public class ChangeRulesClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public ChangeRulesClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List change rules, newest first.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<ChangeRule>> ListAsync(ChangeRuleFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["organization"] = filter.Organization;
                query["unit"] = filter.Unit;
                query["activeOnly"] = filter.ActiveOnly ? "true" : null;
                query["search"] = filter.Search;
                query["skip"] = filter.Skip.ToString();
                query["maxResults"] = filter.MaxResults.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<ChangeRule>>(HttpMethod.Get, TenantPath("/change-rules"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<ChangeRule>();
        }

        /// <summary>
        /// Read a change rule.
        /// </summary>
        /// <param name="id">Rule identifier (cru_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The rule.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<ChangeRule> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<ChangeRule>(HttpMethod.Get, TenantPath("/change-rules/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Create a change rule. OrganizationId and UnitId may be identifiers or names.
        /// </summary>
        /// <param name="rule">The rule.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored rule.</returns>
        /// <exception cref="ArgumentNullException">Thrown when rule is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<ChangeRule> CreateAsync(ChangeRule rule, CancellationToken token = default)
        {
            if (rule == null) throw new ArgumentNullException(nameof(rule));
            return await Transport.SendAsync<ChangeRule>(HttpMethod.Post, TenantPath("/change-rules"), rule, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Replace a change rule's unit, name, description, active flag, expiry, classes, and limits. Its organization does
        /// not change (400 OrganizationNotSettable).
        /// </summary>
        /// <param name="id">Rule identifier (cru_).</param>
        /// <param name="rule">The replacement.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored rule.</returns>
        /// <exception cref="ArgumentNullException">Thrown when rule is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<ChangeRule> UpdateAsync(string id, ChangeRule rule, CancellationToken token = default)
        {
            if (rule == null) throw new ArgumentNullException(nameof(rule));
            return await Transport.SendAsync<ChangeRule>(HttpMethod.Put, TenantPath("/change-rules/" + Segment(id)), rule, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Delete a change rule.
        /// </summary>
        /// <param name="id">Rule identifier (cru_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, TenantPath("/change-rules/" + Segment(id)), token: token).ConfigureAwait(false);
        }

        #endregion
    }
}
