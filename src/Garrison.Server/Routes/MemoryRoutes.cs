namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Memory;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Scoped memory routes (AA4.11): list scopes and entries with their provenance, read an entry's text, and delete an
    /// entry. Runs reach memory through the MCP tools and their access policy, not through these routes. Every route
    /// filters by the request's tenant; another tenant's entry answers 404.
    /// </summary>
    public class MemoryRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly MemoryService _Memory;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/memory";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="memory">Memory service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public MemoryRoutes(ServerContext server, MemoryService memory)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Memory = memory ?? throw new ArgumentNullException(nameof(memory));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Route registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            const string tag = "Memory";
            routes.Scoped(HttpMethod.GET, _Base + "/scopes", ResourceTypeEnum.Memory, OperationTypeEnum.Read, ScopesAsync, "List the memory scopes that hold entries, with entry counts, bytes, the latest write, and each agent's or app's name", tag, null, typeof(List<MemoryScopeSummary>));
            routes.Scoped(HttpMethod.GET, _Base + "/entries", ResourceTypeEnum.Memory, OperationTypeEnum.Read, ListAsync, "List memory entries without their text, ordered by scope and key (query: scopeKind, scopeId, category, tag, search, writer, keyPrefix, maxResults, skip)", tag, null, typeof(EnumerationResult<MemoryEntry>));
            routes.Scoped(HttpMethod.GET, _Base + "/entries/{id}", ResourceTypeEnum.Memory, OperationTypeEnum.Read, ReadAsync, "Read a memory entry's metadata and provenance", tag, null, typeof(MemoryEntry));
            routes.Scoped(HttpMethod.GET, _Base + "/entries/{id}/content", ResourceTypeEnum.Memory, OperationTypeEnum.Read, ContentAsync, "Read a memory entry's text with its metadata. The text is data an agent or a person saved", tag, null, typeof(MemoryReadResult));
            routes.Scoped(HttpMethod.DELETE, _Base + "/entries/{id}", ResourceTypeEnum.Memory, OperationTypeEnum.Delete, DeleteAsync, "Delete a memory entry and its text (query: expectedVersion deletes only while the entry is at that version)", tag, null, null);
        }

        #endregion

        #region Private-Methods

        private async Task ScopesAsync(HttpContextBase http)
        {
            List<MemoryScopeSummary> scopes = await _Memory.ListScopesAsync(RouteHelpers.Tenant(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, scopes).ConfigureAwait(false);
        }

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationQuery query = RouteHelpers.Enumeration(http);
            MemoryEntryFilter filter = new MemoryEntryFilter();
            filter.TenantId = RouteHelpers.Tenant(http);
            filter.ScopeKind = RouteHelpers.QueryEnum<MemoryScopeKindEnum>(http, "scopeKind");
            filter.ScopeId = RouteHelpers.Query(http, "scopeId");
            filter.Category = RouteHelpers.Query(http, "category");
            filter.Tag = RouteHelpers.Query(http, "tag");
            filter.Search = RouteHelpers.Query(http, "search");
            filter.WriterAgentId = RouteHelpers.Query(http, "writer");
            filter.KeyPrefix = RouteHelpers.Query(http, "keyPrefix");
            filter.MaxResults = query.MaxResults;
            filter.Skip = query.Skip;
            EnumerationResult<MemoryEntry> page = await _Memory.ListAsync(filter, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            MemoryEntry entry = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, entry).ConfigureAwait(false);
        }

        private async Task ContentAsync(HttpContextBase http)
        {
            MemoryEntry entry = await LoadAsync(http).ConfigureAwait(false);
            if (!_Server.Settings.AgentMemory.Enabled) throw new ConflictException("MemoryDisabled", "Agent memory is turned off on this server, so entry text cannot be read.");
            string? value = await _Memory.ReadContentAsync(entry, http.Token).ConfigureAwait(false);
            if (value == null) throw new NotFoundException("The text of memory entry " + entry.Id + " is missing from the content store.");
            MemoryReadResult result = new MemoryReadResult { Found = true, Entry = entry, Value = value };
            await RouteHelpers.JsonAsync(http, 200, result).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            MemoryEntry entry = await LoadAsync(http).ConfigureAwait(false);
            if (!_Server.Settings.AgentMemory.Enabled) throw new ConflictException("MemoryDisabled", "Agent memory is turned off on this server, so entries cannot be deleted.");
            Garrison.Core.Security.RequestContext ctx = RouteHelpers.Context(http);
            MemoryWriter writer = new MemoryWriter();
            writer.PrincipalType = ctx.PrincipalType;
            writer.PrincipalId = ctx.PrincipalId;
            writer.Name = ctx.PrincipalName;
            await _Memory.DeleteEntryAsync(entry, RouteHelpers.QueryLong(http, "expectedVersion"), writer, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task<MemoryEntry> LoadAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            MemoryEntry? entry = String.IsNullOrEmpty(id) ? null : await _Server.Database.MemoryEntries.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false);
            if (entry == null) throw new NotFoundException("Memory entry " + id + " not found.");
            return entry;
        }

        #endregion
    }
}
