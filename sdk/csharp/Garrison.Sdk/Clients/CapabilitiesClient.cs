namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;

    /// <summary>
    /// Capability catalog: agents (from their latest published revision), MCP server tools, and harness built-ins
    /// described the same way, plus manual descriptors. Derived descriptors follow their source and cannot be changed or
    /// deleted (409 CapabilityDerived). Thread-safe.
    /// </summary>
    public class CapabilitiesClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public CapabilitiesClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List the catalog visible to the tenant, ordered by kind and name. The result holds every match in one page.
        /// </summary>
        /// <param name="kind">Only this kind, or null for every kind.</param>
        /// <param name="tag">Only descriptors with this tag, or null.</param>
        /// <param name="search">Case-insensitive text to find in the name or summary, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptors.</returns>
        public async Task<EnumerationResult<CapabilityDescriptor>> ListAsync(CapabilityKindEnum? kind = null, string? tag = null, string? search = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (kind != null) parameters["kind"] = kind.Value.ToString();
            if (!String.IsNullOrEmpty(tag)) parameters["tag"] = tag;
            if (!String.IsNullOrEmpty(search)) parameters["search"] = search;
            return await Transport.SendAsync<EnumerationResult<CapabilityDescriptor>>(HttpMethod.Get, Base(), null, parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<CapabilityDescriptor>();
        }

        /// <summary>
        /// Read a descriptor by identifier (cap_...) or by name. A name matches the first descriptor in kind order (Agent,
        /// McpTool, HarnessBuiltIn), the tenant's own before shared ones.
        /// </summary>
        /// <param name="idOrName">Identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The descriptor.</returns>
        /// <exception cref="ArgumentNullException">Thrown when idOrName is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<CapabilityDescriptor> GetAsync(string idOrName, CancellationToken token = default)
        {
            return await Transport.SendAsync<CapabilityDescriptor>(HttpMethod.Get, Item(idOrName), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Create a manual descriptor. The server uses name, kind, summary, schemas, tags, requirements, and the optional
        /// source fields, and sets the rest.
        /// </summary>
        /// <param name="descriptor">Descriptor content.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created descriptor.</returns>
        /// <exception cref="ArgumentNullException">Thrown when descriptor is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 400 (code InvalidJsonSchema for a schema that is not JSON Schema) or 409 NameConflict.</exception>
        public async Task<CapabilityDescriptor> CreateAsync(CapabilityDescriptor descriptor, CancellationToken token = default)
        {
            if (descriptor == null) throw new ArgumentNullException(nameof(descriptor));
            return await Transport.SendAsync<CapabilityDescriptor>(HttpMethod.Post, Base(), descriptor, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Replace a manual descriptor's content.
        /// </summary>
        /// <param name="id">Descriptor identifier.</param>
        /// <param name="descriptor">New content.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The saved descriptor.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or descriptor is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 400 InvalidJsonSchema, 404, or 409 (CapabilityDerived, NameConflict).</exception>
        public async Task<CapabilityDescriptor> UpdateAsync(string id, CapabilityDescriptor descriptor, CancellationToken token = default)
        {
            if (descriptor == null) throw new ArgumentNullException(nameof(descriptor));
            return await Transport.SendAsync<CapabilityDescriptor>(HttpMethod.Put, Item(id), descriptor, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Delete a manual descriptor.
        /// </summary>
        /// <param name="id">Descriptor identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 404 or 409 CapabilityDerived.</exception>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, Item(id), token: token).ConfigureAwait(false);
        }

        /// <summary>
        /// Refresh derived descriptors now: agents, harness built-ins, MCP server tools (stdio servers through a worker),
        /// and hints. Servers whose header secrets the caller may not use are skipped with an error entry.
        /// </summary>
        /// <param name="mcpServerId">Refresh only this MCP server's tools, or null for every active server.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Counts per source.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404 when mcpServerId names no active server.</exception>
        public async Task<CapabilityRefreshResult> RefreshAsync(string? mcpServerId = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (!String.IsNullOrEmpty(mcpServerId)) parameters["mcpServerId"] = mcpServerId;
            return await Transport.SendAsync<CapabilityRefreshResult>(HttpMethod.Post, Base() + "/refresh", null, parameters, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion

        #region Private-Methods

        private string Base()
        {
            return TenantPath("/capabilities");
        }

        private string Item(string idOrName)
        {
            if (String.IsNullOrEmpty(idOrName)) throw new ArgumentNullException(nameof(idOrName));
            return Base() + "/" + Segment(idOrName);
        }

        #endregion
    }
}
