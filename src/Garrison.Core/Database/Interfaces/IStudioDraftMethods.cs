namespace Garrison.Core.Database.Interfaces
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Studio draft data access (AD7.1). Every change is a compare-and-set on the draft version and adds one to it; a
    /// change against another version, or to a draft that is not Open, changes nothing and returns false. Thread-safe.
    /// </summary>
    public interface IStudioDraftMethods
    {
        /// <summary>
        /// Insert a draft with its items and layout.
        /// </summary>
        /// <param name="draft">Draft.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored draft.</returns>
        Task<StudioDraft> CreateAsync(StudioDraft draft, CancellationToken token = default);

        /// <summary>
        /// Read a tenant's draft with its items and layout.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Draft or null.</returns>
        Task<StudioDraft?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// A page of a tenant's drafts, newest change first, without items; optionally one owner's.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="ownerUserId">Owner, or null for all.</param>
        /// <param name="query">Paging and search on the title.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        Task<EnumerationResult<StudioDraft>> EnumerateAsync(string tenantId, string? ownerUserId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Create or replace one item of an Open draft at the expected version.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="expectedVersion">Version the caller read.</param>
        /// <param name="item">Item.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when written.</returns>
        Task<bool> PutItemAsync(string tenantId, string draftId, int expectedVersion, StudioDraftItem item, CancellationToken token = default);

        /// <summary>
        /// Remove one item of an Open draft at the expected version.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="expectedVersion">Version the caller read.</param>
        /// <param name="kind">Item kind.</param>
        /// <param name="name">Item name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the version moved (whether or not the item existed).</returns>
        Task<bool> RemoveItemAsync(string tenantId, string draftId, int expectedVersion, string kind, string name, CancellationToken token = default);

        /// <summary>
        /// Replace the layout of an Open draft at the expected version.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="expectedVersion">Version the caller read.</param>
        /// <param name="nodes">Node positions.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when written.</returns>
        Task<bool> SetLayoutAsync(string tenantId, string draftId, int expectedVersion, List<StudioDraftNode> nodes, CancellationToken token = default);

        /// <summary>
        /// Move a draft from one status to another at the expected version, setting its approval and apply record.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="expectedVersion">Version the caller read.</param>
        /// <param name="from">Required current status.</param>
        /// <param name="to">New status.</param>
        /// <param name="approvalId">Approval to record, or null to clear.</param>
        /// <param name="manifestApplyId">Manifest apply record, or null to keep.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when moved.</returns>
        Task<bool> TransitionAsync(string tenantId, string draftId, int expectedVersion, StudioDraftStatusEnum from, StudioDraftStatusEnum to, string? approvalId, string? manifestApplyId, CancellationToken token = default);

        /// <summary>
        /// Link a draft to its architect conversation (AD7.10) when it has none, without changing its version.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="conversationId">Conversation identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when linked; false when the draft already has a conversation or does not exist.</returns>
        Task<bool> LinkConversationAsync(string tenantId, string draftId, string conversationId, CancellationToken token = default);

        /// <summary>
        /// The draft linked to a conversation, without items, or null.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="conversationId">Conversation identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Draft or null.</returns>
        Task<StudioDraft?> ReadByConversationAsync(string tenantId, string conversationId, CancellationToken token = default);

        /// <summary>
        /// Delete a draft with its items and layout.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);
    }
}
