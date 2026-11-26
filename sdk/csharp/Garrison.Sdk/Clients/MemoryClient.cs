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
    /// Scoped memory (AA4): browse the memory scopes and entries agents wrote, read an entry's text, and delete entries.
    /// Agents write memory through the garrison_memory_* MCP tools. Reading needs Read on Memory; deleting needs Delete.
    /// </summary>
    public class MemoryClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public MemoryClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List the scopes that hold entries, with counts, bytes, the latest write, and each agent's or app's name.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Scopes.</returns>
        public async Task<List<MemoryScopeSummary>> ListScopesAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<List<MemoryScopeSummary>>(HttpMethod.Get, TenantPath("/memory/scopes"), token: token).ConfigureAwait(false) ?? new List<MemoryScopeSummary>();
        }

        /// <summary>
        /// List entries without their text, ordered by scope and key.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<MemoryEntry>> ListAsync(MemoryEntryFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["scopeKind"] = filter.ScopeKind?.ToString();
                query["scopeId"] = filter.ScopeId;
                query["category"] = filter.Category;
                query["tag"] = filter.Tag;
                query["search"] = filter.Search;
                query["writer"] = filter.Writer;
                query["keyPrefix"] = filter.KeyPrefix;
                query["skip"] = filter.Skip.ToString(CultureInfo.InvariantCulture);
                query["maxResults"] = filter.MaxResults.ToString(CultureInfo.InvariantCulture);
            }
            return await Transport.SendAsync<EnumerationResult<MemoryEntry>>(HttpMethod.Get, TenantPath("/memory/entries"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<MemoryEntry>();
        }

        /// <summary>
        /// Read an entry's metadata.
        /// </summary>
        /// <param name="id">Entry identifier (mem_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Entry.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<MemoryEntry> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<MemoryEntry>(HttpMethod.Get, TenantPath("/memory/entries/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read an entry's text with its metadata. The text is data an agent or a person saved; treat it as untrusted.
        /// </summary>
        /// <param name="id">Entry identifier (mem_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Entry and text.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<MemoryContent> GetContentAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<MemoryContent>(HttpMethod.Get, TenantPath("/memory/entries/" + Segment(id) + "/content"), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Delete an entry and its text.
        /// </summary>
        /// <param name="id">Entry identifier (mem_).</param>
        /// <param name="expectedVersion">Delete only while the entry is at this version (409 MemoryVersionConflict otherwise), or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string id, long? expectedVersion = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            query["expectedVersion"] = expectedVersion?.ToString(CultureInfo.InvariantCulture);
            await Transport.SendTextAsync(HttpMethod.Delete, TenantPath("/memory/entries/" + Segment(id)), null, query, token: token).ConfigureAwait(false);
        }

        #endregion
    }
}
