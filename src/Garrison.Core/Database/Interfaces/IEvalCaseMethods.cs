namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Eval case data access (AA9.2). Checks and files live in child tables keyed by case and position. Cases of an
    /// Approved set are immutable: create, update, and delete refuse them. Every read filters by tenant. Implementations
    /// are thread-safe.
    /// </summary>
    public interface IEvalCaseMethods
    {
        /// <summary>
        /// Insert a case with its checks and files into a Draft set.
        /// </summary>
        /// <param name="obj">Case.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored case.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the set does not exist in the tenant.</exception>
        /// <exception cref="ConflictException">Thrown with code EvalSetImmutable when the set is Approved.</exception>
        Task<EvalCase> CreateAsync(EvalCase obj, CancellationToken token = default);

        /// <summary>
        /// Replace a case's order, name, input, hidden flag, expected text, source run, checks, and files. The set does
        /// not change.
        /// </summary>
        /// <param name="obj">Case.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored case.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the case or its set does not exist in the tenant.</exception>
        /// <exception cref="ConflictException">Thrown with code EvalSetImmutable when the set is Approved.</exception>
        Task<EvalCase> UpdateAsync(EvalCase obj, CancellationToken token = default);

        /// <summary>
        /// Read a case in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Case identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The case with checks and files, or null.</returns>
        Task<EvalCase?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Every case of a set version, by order then identifier, with checks and files.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="setId">Set identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Cases.</returns>
        Task<List<EvalCase>> ListBySetAsync(string tenantId, string setId, CancellationToken token = default);

        /// <summary>
        /// Number of cases in a set version.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="setId">Set identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        Task<int> CountBySetAsync(string tenantId, string setId, CancellationToken token = default);

        /// <summary>
        /// Delete a case of a Draft set with its checks and files.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Case identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted; false when it did not exist.</returns>
        /// <exception cref="ConflictException">Thrown with code EvalSetImmutable when the set is Approved.</exception>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);
    }
}
