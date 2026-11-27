namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Keepers;
    using Garrison.Core.Models;

    /// <summary>
    /// Reads shared by the ticks of one keeper sweep: each agent, deployment, and tenant tick template is read once and
    /// reused by every tick the sweep starts, instead of once per tick. A cache lives for one sweep only, so a change made
    /// while a sweep runs reaches the next sweep, a few seconds later. A failed read is not kept; the next tick that needs
    /// it reads again. Thread-safe: the ticks of a sweep start in parallel.
    /// </summary>
    public class KeeperSweepCache
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly KeeperTemplateResolver _Templates;
        private readonly ConcurrentDictionary<string, Task<Agent?>> _Agents = new ConcurrentDictionary<string, Task<Agent?>>(StringComparer.Ordinal);
        private readonly ConcurrentDictionary<string, Task<Deployment?>> _Deployments = new ConcurrentDictionary<string, Task<Deployment?>>(StringComparer.Ordinal);
        private readonly ConcurrentDictionary<string, Task<PromptTemplate>> _TickTemplates = new ConcurrentDictionary<string, Task<PromptTemplate>>(StringComparer.Ordinal);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate an empty cache for one sweep.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="templates">Keeper template resolver.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public KeeperSweepCache(DatabaseDriverBase database, KeeperTemplateResolver templates)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Templates = templates ?? throw new ArgumentNullException(nameof(templates));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Read an agent of a tenant, once per sweep.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The agent, or null when it does not exist.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or agentId is null or empty.</exception>
        public async Task<Agent?> AgentAsync(string tenantId, string agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            return await GetAsync(_Agents, tenantId + "/" + agentId, () => _Database.Agents.ReadAsync(tenantId, agentId, token)).ConfigureAwait(false);
        }

        /// <summary>
        /// Read a deployment of a tenant, once per sweep.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deploymentId">Deployment identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The deployment, or null when it does not exist.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or deploymentId is null or empty.</exception>
        public async Task<Deployment?> DeploymentAsync(string tenantId, string deploymentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(deploymentId)) throw new ArgumentNullException(nameof(deploymentId));
            return await GetAsync(_Deployments, tenantId + "/" + deploymentId, () => _Database.Deployments.ReadAsync(tenantId, deploymentId, token)).ConfigureAwait(false);
        }

        /// <summary>
        /// Resolve a tenant's keeper-tick template, once per sweep.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The template.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<PromptTemplate> TickTemplateAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            return await GetAsync(_TickTemplates, tenantId, () => _Templates.ResolveAsync(tenantId, KeeperTemplateResolver.TickTemplateName, PromptTemplateKindEnum.Task, token)).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private static async Task<T> GetAsync<T>(ConcurrentDictionary<string, Task<T>> cache, string key, Func<Task<T>> read)
        {
            Task<T> pending = cache.GetOrAdd(key, _ => read());
            try
            {
                return await pending.ConfigureAwait(false);
            }
            catch (Exception)
            {
                // Keep only successful reads, so one failure does not fail every later tick of the sweep.
                cache.TryRemove(new KeyValuePair<string, Task<T>>(key, pending));
                throw;
            }
        }

        #endregion
    }
}
