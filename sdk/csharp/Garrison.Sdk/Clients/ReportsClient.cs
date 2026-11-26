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
    /// Reports (AA5): list and read the reports runs filed upward, chart a metric over time, and file a report as a
    /// person. Agents file through the garrison_file_report MCP tool. Reading needs Read on Report; filing needs Create.
    /// Reports are immutable, so there is no update or delete.
    /// </summary>
    public class ReportsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public ReportsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List reports, newest first, with their metrics, issues, and decisions.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Report>> ListAsync(ReportFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["author"] = filter.Author;
                query["app"] = filter.App;
                query["unit"] = filter.Unit;
                query["kind"] = filter.Kind?.ToString();
                query["health"] = filter.Health?.ToString();
                query["runId"] = filter.RunId;
                query["from"] = Iso(filter.FromUtc);
                query["to"] = Iso(filter.ToUtc);
                query["search"] = filter.Search;
                query["skip"] = filter.Skip.ToString(CultureInfo.InvariantCulture);
                query["maxResults"] = filter.MaxResults.ToString(CultureInfo.InvariantCulture);
            }
            return await Transport.SendAsync<EnumerationResult<Report>>(HttpMethod.Get, TenantPath("/reports"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<Report>();
        }

        /// <summary>
        /// Read a report.
        /// </summary>
        /// <param name="id">Report identifier (rpt_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Report.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Report> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Report>(HttpMethod.Get, TenantPath("/reports/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// A metric series from reports, oldest first.
        /// </summary>
        /// <param name="filter">Optional filter: author, metric name, time range, and most points.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Points.</returns>
        public async Task<List<ReportMetricPoint>> MetricSeriesAsync(ReportMetricFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["author"] = filter.Author;
                query["name"] = filter.Name;
                query["from"] = Iso(filter.FromUtc);
                query["to"] = Iso(filter.ToUtc);
                query["maxPoints"] = filter.MaxPoints?.ToString(CultureInfo.InvariantCulture);
            }
            return await Transport.SendAsync<List<ReportMetricPoint>>(HttpMethod.Get, TenantPath("/reports/metrics"), null, query, token: token).ConfigureAwait(false) ?? new List<ReportMetricPoint>();
        }

        /// <summary>
        /// File a report in your own name or an agent's. With an idempotency key, filing again returns the first report.
        /// </summary>
        /// <param name="request">Report to file.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The filed report.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Report> FileAsync(ReportFileRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<Report>(HttpMethod.Post, TenantPath("/reports"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
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
