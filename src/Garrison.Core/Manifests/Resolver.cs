namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Services;

    /// <summary>
    /// Resolves manifest name references to identifiers (documents in the same apply first, then the database, tenant
    /// records before built-ins) and identifiers back to names for export. Lookups are memoized for the life of the
    /// resolver through a <see cref="ConfigurationReferenceCache"/> (I-06). Not thread-safe; one per apply.
    /// </summary>
    public class Resolver
    {
        #region Public-Members

        /// <summary>
        /// Reference cache used for name and identifier lookups.
        /// </summary>
        public ConfigurationReferenceCache Cache
        {
            get
            {
                return _Cache;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly string _TenantId;
        private readonly Dictionary<string, string> _Pending = new Dictionary<string, string>(StringComparer.Ordinal);
        private readonly Dictionary<string, string?> _Names = new Dictionary<string, string?>(StringComparer.Ordinal);
        private readonly ConfigurationReferenceCache _Cache;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public Resolver(DatabaseDriverBase database, string tenantId) : this(database, tenantId, null)
        {
        }

        /// <summary>
        /// Instantiate with a reference cache shared with the rest of the apply (I-06), so a record is read once per
        /// apply no matter how many documents reference it.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="cache">Reference cache for the same tenant, or null to create one for this resolver.</param>
        /// <exception cref="ArgumentNullException">Thrown when database or tenantId is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the cache belongs to another tenant.</exception>
        public Resolver(DatabaseDriverBase database, string tenantId, ConfigurationReferenceCache? cache)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _TenantId = tenantId ?? throw new ArgumentNullException(nameof(tenantId));
            if (cache != null && !String.Equals(cache.TenantId, tenantId, StringComparison.Ordinal)) throw new ArgumentException("The reference cache belongs to another tenant.", nameof(cache));
            _Cache = cache ?? new ConfigurationReferenceCache(database, tenantId);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Record a document planned in this apply.
        /// </summary>
        /// <param name="kind">Kind.</param>
        /// <param name="name">Name.</param>
        /// <param name="id">Identifier.</param>
        public void Add(string kind, string name, string id)
        {
            _Pending[kind + "/" + name] = id;
            _Pending["#" + kind + "/" + id] = name;
        }

        /// <summary>
        /// Resolve a name to an identifier.
        /// </summary>
        /// <param name="kind">Kind.</param>
        /// <param name="name">Name.</param>
        /// <param name="field">Field for error messages.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Identifier.</returns>
        /// <exception cref="ValidationException">Thrown when the reference cannot be resolved.</exception>
        public async Task<string> RequireAsync(string kind, string name, string field, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(name)) throw new ValidationException("Reference '" + field + "' to a " + kind + " is empty.");
            if (_Pending.TryGetValue(kind + "/" + name, out string? pending)) return pending;
            string? id = await _Cache.IdByNameAsync(kind, name, token).ConfigureAwait(false);
            if (id == null) throw new ValidationException("Reference '" + field + "' points to " + kind + " '" + name + "', which does not exist and is not defined earlier in this manifest.");
            return id;
        }

        /// <summary>
        /// Resolve an identifier back to a name.
        /// </summary>
        /// <param name="kind">Kind.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Name or null.</returns>
        public async Task<string?> NameAsync(string kind, string? id, CancellationToken token)
        {
            if (String.IsNullOrEmpty(id)) return null;
            if (_Pending.TryGetValue("#" + kind + "/" + id, out string? pending)) return pending;
            string? cached = _Cache.CachedName(kind, id);
            if (cached != null) return cached;
            string key = kind + "/" + id;
            if (_Names.TryGetValue(key, out string? known)) return known;
            string? name = await ReadNameAsync(kind, id, token).ConfigureAwait(false);
            _Names[key] = name;
            return name;
        }

        #endregion

        #region Private-Methods

        private async Task<string?> ReadNameAsync(string kind, string id, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            switch (kind)
            {
                case "Secret":
                    return (await _Database.Secrets.ReadAsync(id, token).ConfigureAwait(false))?.Name;
                case "PromptTemplate":
                    return (await _Database.PromptTemplates.ReadAsync(id, token).ConfigureAwait(false))?.Name;
                case "HarnessProfile":
                    return (await _Database.HarnessProfiles.ReadAsync(id, token).ConfigureAwait(false))?.Name;
                case "McpServer":
                    return (await _Database.McpServers.ReadAsync(id, token).ConfigureAwait(false))?.Name;
                case "WorkspaceTemplate":
                    return (await _Database.WorkspaceTemplates.ReadAsync(id, token).ConfigureAwait(false))?.Name;
                case "Agent":
                    return (await _Database.Agents.ReadAsync(id, token).ConfigureAwait(false))?.Name;
                case "Deployment":
                    return (await _Database.Deployments.ReadAsync(id, token).ConfigureAwait(false))?.Name;
                case "Pipeline":
                    return (await _Database.Pipelines.ReadAsync(id, token).ConfigureAwait(false))?.Name;
                default:
                    return null;
            }
        }

        #endregion
    }
}
