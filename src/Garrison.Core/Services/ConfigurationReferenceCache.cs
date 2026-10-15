namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;

    /// <summary>
    /// Memoizes the tenant-scoped reads one batch of configuration work makes for the records it references (I-06): a
    /// manifest apply resolves the same built-in harness profile, prompt templates, and agents for many documents, and
    /// validating each deployment reads them again. Each record is read once by identifier or name and served from
    /// memory afterwards; misses are remembered too. Call <see cref="Forget"/> after writing a record of a kind so
    /// later reads see the new values. Kinds: Secret, PromptTemplate, HarnessProfile, McpServer, WorkspaceTemplate,
    /// Agent, Deployment. Records are shared between callers and must not be modified. Not thread-safe: use one per
    /// apply.
    /// </summary>
    public class ConfigurationReferenceCache
    {
        #region Public-Members

        /// <summary>
        /// Tenant whose records are read. Built-in records visible to the tenant are included.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
        }

        /// <summary>
        /// Reads that went to the database. Starts at 0.
        /// </summary>
        public long DatabaseReads
        {
            get
            {
                return _DatabaseReads;
            }
        }

        /// <summary>
        /// Reads answered from memory. Starts at 0.
        /// </summary>
        public long CacheHits
        {
            get
            {
                return _CacheHits;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly string _TenantId;
        private readonly Dictionary<string, object?> _ById = new Dictionary<string, object?>(StringComparer.Ordinal);
        private readonly Dictionary<string, object?> _ByName = new Dictionary<string, object?>(StringComparer.Ordinal);
        private bool _TenantLoaded = false;
        private Tenant? _Tenant = null;
        private long _DatabaseReads = 0;
        private long _CacheHits = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <exception cref="ArgumentNullException">Thrown when database or tenantId is null.</exception>
        public ConfigurationReferenceCache(DatabaseDriverBase database, string tenantId)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _TenantId = tenantId ?? throw new ArgumentNullException(nameof(tenantId));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Read a record visible to the tenant by identifier.
        /// </summary>
        /// <param name="kind">Kind (see the class summary).</param>
        /// <param name="id">Identifier; null or empty returns null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null when it does not exist or is not visible to the tenant.</returns>
        /// <exception cref="ArgumentException">Thrown for an unknown kind.</exception>
        public async Task<object?> ReadAsync(string kind, string? id, CancellationToken token)
        {
            if (String.IsNullOrEmpty(id)) return null;
            string key = kind + "/" + id;
            if (_ById.TryGetValue(key, out object? cached))
            {
                _CacheHits++;
                return cached;
            }
            token.ThrowIfCancellationRequested();
            _DatabaseReads++;
            object? record = await LoadByIdAsync(kind, id, token).ConfigureAwait(false);
            _ById[key] = record;
            return record;
        }

        /// <summary>
        /// Read a record visible to the tenant by name (tenant records before built-ins, as the database does).
        /// </summary>
        /// <param name="kind">Kind (see the class summary).</param>
        /// <param name="name">Name; null or empty returns null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null when no record of that name is visible to the tenant.</returns>
        /// <exception cref="ArgumentException">Thrown for an unknown kind.</exception>
        public async Task<object?> ReadByNameAsync(string kind, string? name, CancellationToken token)
        {
            if (String.IsNullOrEmpty(name)) return null;
            string key = kind + "/" + name;
            if (_ByName.TryGetValue(key, out object? cached))
            {
                _CacheHits++;
                return cached;
            }
            token.ThrowIfCancellationRequested();
            _DatabaseReads++;
            object? record = await LoadByNameAsync(kind, name, token).ConfigureAwait(false);
            _ByName[key] = record;
            if (record != null)
            {
                string? id = IdOf(record);
                if (id != null) _ById[kind + "/" + id] = record;
            }
            return record;
        }

        /// <summary>
        /// Resolve a name to the identifier of the record visible to the tenant.
        /// </summary>
        /// <param name="kind">Kind (see the class summary).</param>
        /// <param name="name">Name; null or empty returns null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Identifier, or null when no record of that name is visible to the tenant.</returns>
        /// <exception cref="ArgumentException">Thrown for an unknown kind.</exception>
        public async Task<string?> IdByNameAsync(string kind, string? name, CancellationToken token)
        {
            object? record = await ReadByNameAsync(kind, name, token).ConfigureAwait(false);
            return record == null ? null : IdOf(record);
        }

        /// <summary>
        /// Read an agent visible to the tenant by identifier.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Agent or null.</returns>
        public async Task<Agent?> AgentAsync(string? id, CancellationToken token)
        {
            return await ReadAsync("Agent", id, token).ConfigureAwait(false) as Agent;
        }

        /// <summary>
        /// Read a harness profile visible to the tenant (its own or a built-in) by identifier.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Profile or null.</returns>
        public async Task<HarnessProfile?> HarnessProfileAsync(string? id, CancellationToken token)
        {
            return await ReadAsync("HarnessProfile", id, token).ConfigureAwait(false) as HarnessProfile;
        }

        /// <summary>
        /// Read a prompt template visible to the tenant (its own or a built-in) by identifier.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Template or null.</returns>
        public async Task<PromptTemplate?> PromptTemplateAsync(string? id, CancellationToken token)
        {
            return await ReadAsync("PromptTemplate", id, token).ConfigureAwait(false) as PromptTemplate;
        }

        /// <summary>
        /// Read the tenant record once.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tenant or null.</returns>
        public async Task<Tenant?> TenantAsync(CancellationToken token)
        {
            if (_TenantLoaded)
            {
                _CacheHits++;
                return _Tenant;
            }
            token.ThrowIfCancellationRequested();
            _DatabaseReads++;
            _Tenant = await _Database.Tenants.ReadAsync(_TenantId, token).ConfigureAwait(false);
            _TenantLoaded = true;
            return _Tenant;
        }

        /// <summary>
        /// The name of a record already read by identifier or name, without touching the database.
        /// </summary>
        /// <param name="kind">Kind.</param>
        /// <param name="id">Identifier.</param>
        /// <returns>Name, or null when the record has not been read (or does not exist).</returns>
        public string? CachedName(string kind, string? id)
        {
            if (String.IsNullOrEmpty(id)) return null;
            if (!_ById.TryGetValue(kind + "/" + id, out object? record) || record == null) return null;
            _CacheHits++;
            return NameOf(record);
        }

        /// <summary>
        /// Drop every remembered record and miss of a kind, after a record of that kind was created or updated.
        /// </summary>
        /// <param name="kind">Kind; Tenant drops the tenant record.</param>
        public void Forget(string kind)
        {
            if (String.IsNullOrEmpty(kind)) return;
            if (kind == "Tenant")
            {
                _TenantLoaded = false;
                _Tenant = null;
                return;
            }
            string prefix = kind + "/";
            foreach (string key in new List<string>(_ById.Keys)) if (key.StartsWith(prefix, StringComparison.Ordinal)) _ById.Remove(key);
            foreach (string key in new List<string>(_ByName.Keys)) if (key.StartsWith(prefix, StringComparison.Ordinal)) _ByName.Remove(key);
        }

        #endregion

        #region Private-Methods

        private async Task<object?> LoadByIdAsync(string kind, string id, CancellationToken token)
        {
            switch (kind)
            {
                case "Secret":
                    return await _Database.Secrets.ReadAsync(_TenantId, id, token).ConfigureAwait(false);
                case "PromptTemplate":
                    return await _Database.PromptTemplates.ReadAsync(_TenantId, id, token).ConfigureAwait(false);
                case "HarnessProfile":
                    return await _Database.HarnessProfiles.ReadAsync(_TenantId, id, token).ConfigureAwait(false);
                case "McpServer":
                    return await _Database.McpServers.ReadAsync(_TenantId, id, token).ConfigureAwait(false);
                case "WorkspaceTemplate":
                    return await _Database.WorkspaceTemplates.ReadAsync(_TenantId, id, token).ConfigureAwait(false);
                case "Agent":
                    return await _Database.Agents.ReadAsync(_TenantId, id, token).ConfigureAwait(false);
                case "Deployment":
                    return await _Database.Deployments.ReadAsync(_TenantId, id, token).ConfigureAwait(false);
                case "Pipeline":
                    return await _Database.Pipelines.ReadAsync(_TenantId, id, token).ConfigureAwait(false);
                default:
                    throw new ArgumentException("Unknown reference kind '" + kind + "'.", nameof(kind));
            }
        }

        private async Task<object?> LoadByNameAsync(string kind, string name, CancellationToken token)
        {
            switch (kind)
            {
                case "Secret":
                    return await _Database.Secrets.ReadByNameAsync(_TenantId, name, token).ConfigureAwait(false);
                case "PromptTemplate":
                    return await _Database.PromptTemplates.ReadByNameAsync(_TenantId, name, token).ConfigureAwait(false);
                case "HarnessProfile":
                    return await _Database.HarnessProfiles.ReadByNameAsync(_TenantId, name, token).ConfigureAwait(false);
                case "McpServer":
                    return await _Database.McpServers.ReadByNameAsync(_TenantId, name, token).ConfigureAwait(false);
                case "WorkspaceTemplate":
                    return await _Database.WorkspaceTemplates.ReadByNameAsync(_TenantId, name, token).ConfigureAwait(false);
                case "Agent":
                    return await _Database.Agents.ReadByNameAsync(_TenantId, name, token).ConfigureAwait(false);
                case "Deployment":
                    return await _Database.Deployments.ReadByNameAsync(_TenantId, name, token).ConfigureAwait(false);
                case "Pipeline":
                    return await _Database.Pipelines.ReadByNameAsync(_TenantId, name, token).ConfigureAwait(false);
                default:
                    throw new ArgumentException("Unknown reference kind '" + kind + "'.", nameof(kind));
            }
        }

        private static string? IdOf(object record)
        {
            switch (record)
            {
                case Secret secret:
                    return secret.Id;
                case PromptTemplate template:
                    return template.Id;
                case HarnessProfile profile:
                    return profile.Id;
                case McpServer server:
                    return server.Id;
                case WorkspaceTemplate workspace:
                    return workspace.Id;
                case Agent agent:
                    return agent.Id;
                case Deployment deployment:
                    return deployment.Id;
                case Pipeline pipeline:
                    return pipeline.Id;
                default:
                    return null;
            }
        }

        private static string? NameOf(object record)
        {
            switch (record)
            {
                case Secret secret:
                    return secret.Name;
                case PromptTemplate template:
                    return template.Name;
                case HarnessProfile profile:
                    return profile.Name;
                case McpServer server:
                    return server.Name;
                case WorkspaceTemplate workspace:
                    return workspace.Name;
                case Agent agent:
                    return agent.Name;
                case Deployment deployment:
                    return deployment.Name;
                case Pipeline pipeline:
                    return pipeline.Name;
                default:
                    return null;
            }
        }

        #endregion
    }
}
