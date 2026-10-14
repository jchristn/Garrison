namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// Pipeline definitions with their stages and stage run parameters (P12.9). Every read that takes a tenant filters by
    /// it. Writes replace the child rows in one transaction.
    /// </summary>
    public interface IPipelineMethods
    {
        /// <summary>
        /// Insert a pipeline with its stages and parameters.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Pipeline> CreateAsync(Pipeline obj, CancellationToken token = default);

        /// <summary>
        /// Read a pipeline in any tenant (internal use).
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task<Pipeline?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a pipeline in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record, or null when it does not exist in the tenant.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<Pipeline?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read a pipeline by name in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<Pipeline?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Replace a pipeline and its stages and parameters.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Pipeline> UpdateAsync(Pipeline obj, CancellationToken token = default);

        /// <summary>
        /// Delete a pipeline with its stages and parameters. Pipeline runs are kept.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate a tenant's pipelines (with stages). Search matches the name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="query">Query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<EnumerationResult<Pipeline>> EnumerateAsync(string tenantId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Names of the tenant's pipelines with a stage that runs an agent.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pipeline names, ordered by name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<List<string>> NamesByAgentAsync(string tenantId, string agentId, CancellationToken token = default);

        /// <summary>
        /// Names of the tenant's pipelines with a stage pinned to a deployment.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deploymentId">Deployment identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pipeline names, ordered by name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<List<string>> NamesByDeploymentAsync(string tenantId, string deploymentId, CancellationToken token = default);
    }
}
