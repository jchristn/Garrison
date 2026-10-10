namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Server.Backplane;
    using Garrison.Server.Settings;
    using Garrison.Worker.Hosting;
    using Garrison.Worker.Settings;

    /// <summary>
    /// Several in-process control-plane replicas sharing one database (one Postgresql schema), plus workers attached to
    /// chosen replicas: the multi-replica test mode (Phase 10). Dispose to stop everything.
    /// </summary>
    public sealed class TestReplicaCluster : IAsyncDisposable
    {
        #region Public-Members

        /// <summary>
        /// Replicas, in start order.
        /// </summary>
        public List<TestServerHost> Replicas { get; } = new List<TestServerHost>();

        /// <summary>
        /// Workers.
        /// </summary>
        public List<WorkerHost> Workers { get; } = new List<WorkerHost>();

        /// <summary>
        /// Database settings every replica shares.
        /// </summary>
        public DatabaseSettings Database { get; }

        /// <summary>
        /// Default tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return Replicas[0].TenantId;
            }
        }

        #endregion

        #region Constructors-and-Factories

        private TestReplicaCluster(DatabaseSettings database)
        {
            Database = database;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start replicas against one fresh database. Replicas start concurrently, as they would in a rollout.
        /// </summary>
        /// <param name="provider">Provider (Postgresql for real multi-replica tests).</param>
        /// <param name="replicas">Number of replicas (1 to 5).</param>
        /// <param name="backplane">Backplane mode.</param>
        /// <param name="configure">Optional settings customization applied to every replica.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Cluster.</returns>
        public static async Task<TestReplicaCluster> StartAsync(DatabaseTypeEnum provider, int replicas, BackplaneModeEnum backplane = BackplaneModeEnum.Auto, Action<ServerSettings>? configure = null, CancellationToken token = default)
        {
            DatabaseSettings shared = TestEnvironment.IsolatedSettings(provider);
            TestReplicaCluster cluster = new TestReplicaCluster(shared);
            int count = Math.Clamp(replicas, 1, 5);
            List<Task<TestServerHost>> starting = new List<Task<TestServerHost>>();
            for (int i = 0; i < count; i++)
            {
                int index = i;
                starting.Add(TestServerHost.StartAsync(provider, settings =>
                {
                    settings.NodeId = "replica-" + (char)('a' + index);
                    settings.Database = shared.Clone();
                    settings.Cluster.ExpectedReplicas = provider == DatabaseTypeEnum.Postgresql ? count : 1;
                    settings.Cluster.Backplane = backplane;
                    settings.Cluster.BackplanePollMs = 100;
                    configure?.Invoke(settings);
                }, token));
            }
            try
            {
                TestServerHost[] started = await Task.WhenAll(starting).ConfigureAwait(false);
                cluster.Replicas.AddRange(started);
            }
            catch (Exception)
            {
                foreach (Task<TestServerHost> task in starting.Where(t => t.Status == TaskStatus.RanToCompletion))
                {
                    await task.Result.DisposeAsync().ConfigureAwait(false);
                }
                throw;
            }
            return cluster;
        }

        /// <summary>
        /// Start a worker attached to one replica.
        /// </summary>
        /// <param name="replica">Replica index.</param>
        /// <param name="configure">Optional worker settings customization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Worker.</returns>
        public async Task<WorkerHost> AddWorkerAsync(int replica, Action<WorkerSettings>? configure = null, CancellationToken token = default)
        {
            WorkerHost worker = await TestCluster.StartWorkerAsync(Replicas[replica].BaseUrl, "replica-worker-" + replica + "-" + Guid.NewGuid().ToString("N").Substring(0, 4), configure, token).ConfigureAwait(false);
            Workers.Add(worker);
            return worker;
        }

        /// <summary>
        /// Create an agent and a deployment on a harness profile through one replica.
        /// </summary>
        /// <param name="replica">Replica index.</param>
        /// <param name="agentName">Agent name.</param>
        /// <param name="configureDeployment">Optional deployment customization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Agent.</returns>
        public async Task<Agent> CreateAgentAsync(int replica, string agentName, Action<Deployment>? configureDeployment = null, CancellationToken token = default)
        {
            TestServerHost host = Replicas[replica];
            Agent agent = new Agent();
            agent.Name = agentName;
            agent.Description = "Test agent " + agentName;
            Agent created = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + TenantId + "/agents", agent, 201, token).ConfigureAwait(false);

            HarnessProfile profile = await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(TenantId, "builtin/fake", token).ConfigureAwait(false)
                ?? throw new TestAssertionException("Harness profile builtin/fake not found.");
            Deployment deployment = new Deployment();
            deployment.AgentId = created.Id;
            deployment.Name = agentName + "-default";
            deployment.HarnessProfileId = profile.Id;
            deployment.TimeoutSeconds = 120;
            configureDeployment?.Invoke(deployment);
            await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + TenantId + "/deployments", deployment, 201, token).ConfigureAwait(false);
            return created;
        }

        /// <summary>
        /// Stop workers, then replicas.
        /// </summary>
        /// <returns>Value task.</returns>
        public async ValueTask DisposeAsync()
        {
            foreach (WorkerHost worker in Workers)
            {
                try
                {
                    await worker.DisposeAsync().ConfigureAwait(false);
                }
                catch (Exception)
                {
                }
            }
            foreach (TestServerHost replica in Replicas)
            {
                try
                {
                    await replica.DisposeAsync().ConfigureAwait(false);
                }
                catch (Exception)
                {
                }
            }
        }

        #endregion
    }
}
