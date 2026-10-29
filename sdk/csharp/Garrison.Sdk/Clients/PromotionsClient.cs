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
    /// Tenant environments (the promotion ladder) and promotions of agent revisions between environments. Thread-safe.
    /// </summary>
    public class PromotionsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public PromotionsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Read the tenant's environment ladder (dev, staging, prod unless customized).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The environment list.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<TenantEnvironmentList> GetEnvironmentsAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<TenantEnvironmentList>(HttpMethod.Get, TenantPath("/environments"), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Replace the tenant's environment ladder.
        /// </summary>
        /// <param name="environments">Environments in promotion order.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The saved environment list.</returns>
        /// <exception cref="ArgumentNullException">Thrown when environments is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<TenantEnvironmentList> UpdateEnvironmentsAsync(TenantEnvironmentList environments, CancellationToken token = default)
        {
            if (environments == null) throw new ArgumentNullException(nameof(environments));
            return await Transport.SendAsync<TenantEnvironmentList>(HttpMethod.Put, TenantPath("/environments"), environments, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// List promotion records, newest first.
        /// </summary>
        /// <param name="agentId">Optional agent filter.</param>
        /// <param name="appId">Optional app filter.</param>
        /// <param name="query">Optional paging.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<PromotionRecord>> ListAsync(string? agentId = null, string? appId = null, EnumerationQuery? query = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = QueryBuilder.From(query);
            parameters["agentId"] = agentId;
            parameters["appId"] = appId;
            return await Transport.SendAsync<EnumerationResult<PromotionRecord>>(HttpMethod.Get, TenantPath("/promotions"), null, parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<PromotionRecord>();
        }

        /// <summary>
        /// Read a promotion record.
        /// </summary>
        /// <param name="id">Promotion record identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<PromotionRecord> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<PromotionRecord>(HttpMethod.Get, TenantPath("/promotions/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Promote an agent revision: pins the target environment's deployments of the agent to the revision.
        /// </summary>
        /// <param name="request">Promotion request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The promotion record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<PromotionRecord> PromoteAsync(PromotionRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<PromotionRecord>(HttpMethod.Post, TenantPath("/promotions"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Roll back a promotion, restoring each deployment's previous revision pin.
        /// </summary>
        /// <param name="id">Promotion record identifier.</param>
        /// <param name="request">Optional note; null sends an empty request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The rollback record.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<PromotionRecord> RollbackAsync(string id, PromotionRollbackRequest? request = null, CancellationToken token = default)
        {
            PromotionRollbackRequest body = request ?? new PromotionRollbackRequest();
            return await Transport.SendAsync<PromotionRecord>(HttpMethod.Post, TenantPath("/promotions/" + Segment(id) + "/rollback"), body, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
