namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Eval set data access (AA9.2). Each version of a set is its own row; tags live in a child table. Approved versions
    /// are immutable: <see cref="UpdateAsync"/> refuses them, and an edit goes through
    /// <see cref="Garrison.Core.Evaluation.EvalSetVersioning"/>, which creates the next version as a Draft with
    /// <see cref="CreateWithCasesAsync"/>. Every read filters by tenant. Implementations are thread-safe.
    /// </summary>
    public interface IEvalSetMethods
    {
        /// <summary>
        /// Insert a set version with its tags.
        /// </summary>
        /// <param name="obj">Set.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored set.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        /// <exception cref="ConflictException">Thrown with code EvalSetVersionExists when the tenant already has this name and version.</exception>
        Task<EvalSet> CreateAsync(EvalSet obj, CancellationToken token = default);

        /// <summary>
        /// Insert a set version with its tags and cases (with their checks and files) in one transaction. Each case's
        /// TenantId and SetId are set from the set.
        /// </summary>
        /// <param name="obj">Set.</param>
        /// <param name="cases">Cases, possibly empty.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored set, with CaseCount set.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj or cases is null.</exception>
        /// <exception cref="ConflictException">Thrown with code EvalSetVersionExists when the tenant already has this name and version.</exception>
        Task<EvalSet> CreateWithCasesAsync(EvalSet obj, List<EvalCase> cases, CancellationToken token = default);

        /// <summary>
        /// Replace a Draft version's description and tags. Name, version, state, origin, and authorship do not change.
        /// </summary>
        /// <param name="obj">Set.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored set as read back.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the set does not exist in the tenant.</exception>
        /// <exception cref="ConflictException">Thrown with code EvalSetImmutable when the stored version is Approved.</exception>
        Task<EvalSet> UpdateAsync(EvalSet obj, CancellationToken token = default);

        /// <summary>
        /// Approve a Draft version (compare-and-set from Draft). The caller checks that a person is approving (AA-024).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Set identifier.</param>
        /// <param name="approvedById">Approver identifier, or null for a system administrator.</param>
        /// <param name="approvedByName">Approver display name, or null.</param>
        /// <param name="utc">Approval time (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the version moved from Draft to Approved; false when it was missing or already Approved.</returns>
        Task<bool> ApproveAsync(string tenantId, string id, string? approvedById, string? approvedByName, DateTime utc, CancellationToken token = default);

        /// <summary>
        /// Read a set version in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Set identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The set with tags and CaseCount, or null.</returns>
        Task<EvalSet?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read one version of a set by name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Set name (exact).</param>
        /// <param name="version">Version number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The set, or null.</returns>
        Task<EvalSet?> ReadByNameAsync(string tenantId, string name, int version, CancellationToken token = default);

        /// <summary>
        /// Read the highest version of a set by name, whatever its state.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Set name (exact).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The set, or null.</returns>
        Task<EvalSet?> ReadLatestAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Read the highest Approved version of a set by name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Set name (exact).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The set, or null.</returns>
        Task<EvalSet?> ReadLatestApprovedAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Every version of a set by name, oldest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Set name (exact).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Versions.</returns>
        Task<List<EvalSet>> ListVersionsAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Enumerate set versions, newest first by default. Search matches the name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="state">State filter, or null.</param>
        /// <param name="origin">Origin filter, or null.</param>
        /// <param name="tag">Tag filter (exact), or null.</param>
        /// <param name="latestOnly">When true, only the highest version of each name (after the other filters).</param>
        /// <param name="query">Paging, ordering, and search.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        Task<EnumerationResult<EvalSet>> EnumerateAsync(string tenantId, EvalSetStateEnum? state, EvalSetOriginEnum? origin, string? tag, bool latestOnly, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Delete a set version with its tags and its cases (with their checks and files). Eval runs of the version are
        /// kept; the caller decides whether a version with runs may be deleted.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Set identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);
    }
}
