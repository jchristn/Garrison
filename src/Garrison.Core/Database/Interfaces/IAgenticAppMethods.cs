namespace Garrison.Core.Database.Interfaces
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// Agentic app and app revision data access (AD6). Writes replace an app with its members, edges, and environments
    /// in one transaction. Thread-safe.
    /// </summary>
    public interface IAgenticAppMethods
    {
        /// <summary>
        /// Insert an app with its children.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored app.</returns>
        Task<AgenticApp> CreateAsync(AgenticApp app, CancellationToken token = default);

        /// <summary>
        /// Replace an app and its children.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored app.</returns>
        Task<AgenticApp> UpdateAsync(AgenticApp app, CancellationToken token = default);

        /// <summary>
        /// Read a tenant's app by identifier, with children.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">App identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>App or null.</returns>
        Task<AgenticApp?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read a tenant's app by name, with children.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">App name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>App or null.</returns>
        Task<AgenticApp?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Read an app by its cluster-wide slug, with children, for the app gateway.
        /// </summary>
        /// <param name="slug">Slug.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>App or null.</returns>
        Task<AgenticApp?> ReadBySlugAsync(string slug, CancellationToken token = default);

        /// <summary>
        /// Whether a slug is taken by any app, optionally other than one.
        /// </summary>
        /// <param name="slug">Slug.</param>
        /// <param name="exceptId">App to ignore, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when taken.</returns>
        Task<bool> SlugTakenAsync(string slug, string? exceptId, CancellationToken token = default);

        /// <summary>
        /// A page of a tenant's apps, newest first, with children. Search matches the name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="query">Paging and search.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        Task<EnumerationResult<AgenticApp>> EnumerateAsync(string tenantId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Names of the tenant's apps that have an agent as a member.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>App names.</returns>
        Task<List<string>> AppsWithMemberAsync(string tenantId, string agentId, CancellationToken token = default);

        /// <summary>
        /// Delete an app with its children and revisions.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">App identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Insert an app revision with the next number for its app.
        /// </summary>
        /// <param name="revision">Revision; its number is assigned.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored revision.</returns>
        Task<AppRevision> CreateRevisionAsync(AppRevision revision, CancellationToken token = default);

        /// <summary>
        /// An app's revisions, newest first, with children.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="appId">App identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revisions.</returns>
        Task<List<AppRevision>> ListRevisionsAsync(string tenantId, string appId, CancellationToken token = default);

        /// <summary>
        /// Read one app revision by identifier, with children.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Revision identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revision or null.</returns>
        Task<AppRevision?> ReadRevisionAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Publish a draft app revision and make it the app's latest, in one transaction.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="revisionId">Revision identifier.</param>
        /// <param name="publishedByName">Who published it.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a draft was published.</returns>
        Task<bool> PublishRevisionAsync(string tenantId, string revisionId, string? publishedByName, CancellationToken token = default);

        /// <summary>
        /// Store a new app session.
        /// </summary>
        /// <param name="session">Session with its token hash.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored session.</returns>
        Task<AppSession> CreateSessionAsync(AppSession session, CancellationToken token = default);

        /// <summary>
        /// Read a session by its token hash, whether or not it is expired or revoked.
        /// </summary>
        /// <param name="tokenHash">SHA-256 of the token, lowercase hex.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Session or null.</returns>
        Task<AppSession?> ReadSessionByHashAsync(string tokenHash, CancellationToken token = default);

        /// <summary>
        /// Revoke a session.
        /// </summary>
        /// <param name="id">Session identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when revoked.</returns>
        Task<bool> RevokeSessionAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Delete sessions that expired before a time (retention).
        /// </summary>
        /// <param name="beforeUtc">Cutoff (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Sessions deleted.</returns>
        Task<int> DeleteExpiredSessionsAsync(System.DateTime beforeUtc, CancellationToken token = default);
    }
}
