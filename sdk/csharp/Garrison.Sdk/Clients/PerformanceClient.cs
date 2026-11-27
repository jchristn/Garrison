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

    /// <summary>
    /// Organization performance (AA11): run outcomes, cost, latency, escalations, loop-guard rejections, and eval scores
    /// per unit and per agent over a window, plus the scheduled checks on the organization's deployments. Reading needs
    /// Read on Organization. Thread-safe.
    /// </summary>
    public class PerformanceClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public PerformanceClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Read an organization's performance. The default window is the last 7 days ending now; the span is at most 90
        /// days.
        /// </summary>
        /// <param name="id">Organization identifier or name.</param>
        /// <param name="query">Optional window and unit; null uses the server defaults.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The organization's performance.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Status 400 when the span is longer than 90 days or the window is invalid; 404 when the organization or unit is not found.</exception>
        public async Task<OrgPerformance> GetAsync(string id, PerformanceQuery? query = null, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (query != null)
            {
                parameters["fromUtc"] = QueryBuilder.Date(query.FromUtc);
                parameters["toUtc"] = QueryBuilder.Date(query.ToUtc);
                parameters["unitId"] = query.UnitId;
            }
            return await Transport.SendAsync<OrgPerformance>(HttpMethod.Get, TenantPath("/organizations/" + Segment(id) + "/performance"), null, parameters, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
