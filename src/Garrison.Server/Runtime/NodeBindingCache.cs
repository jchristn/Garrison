namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Concurrent;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;

    /// <summary>
    /// Confirms that the node named in a run lifecycle report (started, events, complete) belongs to the calling
    /// credential (SR-16), with a short-lived per-replica cache of node-to-credential bindings so event ingestion, which is
    /// on the claim-path budget, does not read the node row for every batch. Lease fencing then ties the run to that node.
    /// Thread-safe.
    /// </summary>
    public class NodeBindingCache
    {
        #region Public-Members

        /// <summary>
        /// Seconds a confirmed binding is reused before the node row is read again. A node re-bound to another credential
        /// (only possible once its old credential is gone or deactivated, or by a system administrator) is seen after at
        /// most this long. 0 reads the node on every report. Default 30, minimum 0, maximum 300.
        /// </summary>
        public int CacheSeconds
        {
            get
            {
                return _CacheSeconds;
            }
            set
            {
                _CacheSeconds = Math.Clamp(value, 0, 300);
                _Bindings.Clear();
            }
        }

        /// <summary>
        /// Maximum cached bindings; the cache empties when it grows past this. Default 10000, minimum 16, maximum 1000000.
        /// </summary>
        public int MaxEntries
        {
            get
            {
                return _MaxEntries;
            }
            set
            {
                _MaxEntries = Math.Clamp(value, 16, 1000000);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly ConcurrentDictionary<string, NodeBindingCacheEntry> _Bindings = new ConcurrentDictionary<string, NodeBindingCacheEntry>(StringComparer.Ordinal);
        private int _CacheSeconds = 30;
        private int _MaxEntries = 10000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public NodeBindingCache(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Require that a node exists and is bound to the caller's credential. System administrators, and nodes registered
        /// without a credential (by the administrator API key), pass.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="nodeId">Node identifier from the report.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx is null.</exception>
        /// <exception cref="ValidationException">Thrown when nodeId is missing.</exception>
        /// <exception cref="NotFoundException">Thrown when the node is not registered.</exception>
        /// <exception cref="ConflictException">Thrown with code NodeIdentityMismatch when the node belongs to another credential.</exception>
        public async Task RequireAsync(RequestContext ctx, string? nodeId, CancellationToken token)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(nodeId)) throw new ValidationException("nodeId is required.");
            if (ctx.IsAdmin) return;

            if (_CacheSeconds > 0 && _Bindings.TryGetValue(nodeId, out NodeBindingCacheEntry? cached) && cached.ExpiresUtc > DateTime.UtcNow)
            {
                Check(cached.CredentialId, cached.NodeName, ctx);
                return;
            }

            token.ThrowIfCancellationRequested();
            Node? node = await _Database.Nodes.ReadAsync(nodeId, token).ConfigureAwait(false);
            if (node == null) throw new NotFoundException("Node " + nodeId + " is not registered; register again.");
            if (_CacheSeconds > 0)
            {
                if (_Bindings.Count >= _MaxEntries) _Bindings.Clear();
                NodeBindingCacheEntry entry = new NodeBindingCacheEntry();
                entry.CredentialId = node.CredentialId;
                entry.NodeName = node.Name;
                entry.ExpiresUtc = DateTime.UtcNow.AddSeconds(_CacheSeconds);
                _Bindings[nodeId] = entry;
            }
            Check(node.CredentialId, node.Name, ctx);
        }

        /// <summary>
        /// Forget a node's cached binding, for example after it registers again.
        /// </summary>
        /// <param name="nodeId">Node identifier; null or empty is ignored.</param>
        public void Forget(string? nodeId)
        {
            if (String.IsNullOrEmpty(nodeId)) return;
            _Bindings.TryRemove(nodeId, out NodeBindingCacheEntry? _);
        }

        #endregion

        #region Private-Methods

        private static void Check(string? credentialId, string nodeName, RequestContext ctx)
        {
            if (String.IsNullOrEmpty(credentialId) || credentialId == ctx.CredentialId) return;
            throw new ConflictException("NodeIdentityMismatch", "Node " + nodeName + " is registered to a different credential.");
        }

        #endregion
    }
}
