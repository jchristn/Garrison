namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Eval case result data access (AA9.2). Insert-only; check results live in a child table. One result per eval run
    /// and order. Every read filters by tenant. Implementations are thread-safe.
    /// </summary>
    public interface IEvalCaseResultMethods
    {
        /// <summary>
        /// Insert a result with its check results.
        /// </summary>
        /// <param name="obj">Result.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        /// <exception cref="ConflictException">Thrown with code EvalResultExists when the eval run already has a result at this order.</exception>
        Task<EvalCaseResult> CreateAsync(EvalCaseResult obj, CancellationToken token = default);

        /// <summary>
        /// Read a result in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Result identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The result with check results, or null.</returns>
        Task<EvalCaseResult?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read the result at an order in an eval run.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="evalRunId">Eval run identifier.</param>
        /// <param name="order">Order of the result in the run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The result, or null.</returns>
        Task<EvalCaseResult?> ReadByOrderAsync(string tenantId, string evalRunId, int order, CancellationToken token = default);

        /// <summary>
        /// Every result of an eval run, by order, with check results.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="evalRunId">Eval run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Results.</returns>
        Task<List<EvalCaseResult>> ListByEvalRunAsync(string tenantId, string evalRunId, CancellationToken token = default);
    }
}
