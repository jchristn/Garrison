namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;

    /// <summary>
    /// Report data access (AA5). Reports are insert-only (AA-019): there is no update method, and rows leave only with
    /// their tenant. Every method that takes a tenant filters by it.
    /// </summary>
    public interface IReportMethods
    {
        /// <summary>
        /// Insert a report with its metrics, issues, and decisions in one transaction.
        /// </summary>
        /// <param name="obj">Report.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The report.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Report> CreateAsync(Report obj, CancellationToken token = default);

        /// <summary>
        /// Read a report with its metrics, issues, and decisions.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Report identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The report, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task<Report?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read the report with a filing key, so a replayed filing returns it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="filingKey">Filing key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The report, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or filingKey is null or empty.</exception>
        Task<Report?> ReadByFilingKeyAsync(string tenantId, string filingKey, CancellationToken token = default);

        /// <summary>
        /// Enumerate reports with their children, newest first.
        /// </summary>
        /// <param name="filter">Filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter or its tenant is null.</exception>
        Task<EnumerationResult<Report>> EnumerateAsync(ReportFilter filter, CancellationToken token = default);

        /// <summary>
        /// Metric points by author and name, oldest first; the newest MaxPoints when there are more.
        /// </summary>
        /// <param name="filter">Filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Points.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter or its tenant is null.</exception>
        Task<List<ReportMetricPoint>> MetricSeriesAsync(ReportMetricFilter filter, CancellationToken token = default);

        /// <summary>
        /// Reports filed in a tenant after a position, ordered by (createdutc, id), for the reports channel.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="afterUtc">Position time.</param>
        /// <param name="afterId">Position identifier; empty for the start of afterUtc.</param>
        /// <param name="limit">Most reports to return.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Reports with their children.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        Task<List<Report>> ListFiledAfterAsync(string tenantId, DateTime afterUtc, string afterId, int limit, CancellationToken token = default);
    }
}
