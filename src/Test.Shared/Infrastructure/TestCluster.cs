namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Worker.Hosting;
    using Garrison.Worker.Settings;
    using SyslogLogging;

    /// <summary>
    /// In-process control plane plus worker nodes on 127.0.0.1, with garrison-fake-harness on PATH. Dispose to stop.
    /// </summary>
    public sealed class TestCluster : IAsyncDisposable
    {
        #region Public-Members

        /// <summary>
        /// Control plane.
        /// </summary>
        public TestServerHost Server { get; }

        /// <summary>
        /// Worker hosts.
        /// </summary>
        public List<WorkerHost> Workers { get; } = new List<WorkerHost>();

        #endregion

        #region Private-Members

        private static readonly object _PathLock = new object();
        private static string? _WrapperDirectory = null;

        #endregion

        #region Constructors-and-Factories

        private TestCluster(TestServerHost server)
        {
            Server = server;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start a cluster.
        /// </summary>
        /// <param name="provider">Database provider.</param>
        /// <param name="workers">Number of workers (0 to 8).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Cluster.</returns>
        public static async Task<TestCluster> StartAsync(DatabaseTypeEnum provider = DatabaseTypeEnum.Sqlite, int workers = 1, CancellationToken token = default)
        {
            EnsureFakeHarnessOnPath();
            TestServerHost server = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false);
            TestCluster cluster = new TestCluster(server);
            for (int i = 0; i < Math.Clamp(workers, 0, 8); i++) await cluster.AddWorkerAsync("test-worker-" + i + "-" + Guid.NewGuid().ToString("N").Substring(0, 4), token).ConfigureAwait(false);
            return cluster;
        }

        /// <summary>
        /// Start one more worker and wait until it registers.
        /// </summary>
        /// <param name="name">Node name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Worker.</returns>
        public async Task<WorkerHost> AddWorkerAsync(string name, CancellationToken token = default)
        {
            WorkerHost worker = await StartWorkerAsync(Server.BaseUrl, name, null, token).ConfigureAwait(false);
            Workers.Add(worker);
            return worker;
        }

        /// <summary>
        /// Start a worker against any control-plane URL (for example one replica of a multi-replica test) and wait until
        /// it registers. The caller disposes it.
        /// </summary>
        /// <param name="serverUrl">Control-plane REST base URL.</param>
        /// <param name="name">Node name.</param>
        /// <param name="configure">Optional settings customization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <param name="executor">Optional executor replacing the process executor (for example a recording one).</param>
        /// <returns>Worker.</returns>
        /// <exception cref="TestAssertionException">Thrown when the worker does not register within 20 seconds.</exception>
        public static async Task<WorkerHost> StartWorkerAsync(string serverUrl, string name, Action<WorkerSettings>? configure, CancellationToken token = default, Garrison.Worker.Execution.IRunExecutor? executor = null)
        {
            EnsureFakeHarnessOnPath();
            WorkerSettings settings = new WorkerSettings();
            settings.Telemetry.Enabled = false;
            settings.ServerUrl = serverUrl;
            settings.NodeName = name;
            settings.WorkRoot = Path.Combine(Path.GetTempPath(), "garrison-test-work", Guid.NewGuid().ToString("N"));
            settings.MaxConcurrentRuns = 4;
            settings.EventFlushIntervalMs = 50;
            settings.LeaseWaitMs = 2000;
            settings.HeartbeatIntervalMs = 1000;
            settings.DrainTimeoutSeconds = 5;
            settings.ProbeIntervalSeconds = 0;
            settings.HealthPort = TestServerHost.FreePort();
            settings.Probes = WorkerSettings.DefaultProbes().Where(p => p.Label == "fake").ToList();
            settings.Logging.ConsoleLogging = Environment.GetEnvironmentVariable("GARRISON_TEST_LOGS") == "true";
            settings.EnvironmentAllowlist = new List<string> { "PATH", "DOTNET_ROOT", "TMPDIR", "LANG" };
            configure?.Invoke(settings);

            LoggingModule logging = new LoggingModule();
            logging.Settings.EnableConsole = settings.Logging.ConsoleLogging;
            WorkerHost worker = new WorkerHost(settings, logging, executor);
            await worker.StartAsync(false).ConfigureAwait(false);

            DateTime deadline = DateTime.UtcNow.AddSeconds(20);
            while (!worker.Registered || !worker.Leasing)
            {
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Worker " + name + " did not register within 20 seconds.");
                await Task.Delay(100, token).ConfigureAwait(false);
            }
            return worker;
        }

        /// <summary>
        /// Create an agent and a deployment on a harness profile.
        /// </summary>
        /// <param name="agentName">Agent name.</param>
        /// <param name="harnessProfileName">Harness profile name, default builtin/fake.</param>
        /// <param name="configure">Optional agent customization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <param name="configureDeployment">Optional deployment customization (for example parameters).</param>
        /// <returns>Agent.</returns>
        public async Task<Agent> CreateAgentAsync(string agentName, string harnessProfileName = "builtin/fake", Action<Agent>? configure = null, CancellationToken token = default, Action<Deployment>? configureDeployment = null)
        {
            string tenant = Server.TenantId;
            Agent agent = new Agent();
            agent.Name = agentName;
            agent.Description = "Test agent " + agentName;
            agent.ExposeA2A = true;
            configure?.Invoke(agent);
            Agent created = await HttpTestHelpers.SendAsync<Agent>(Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents", agent, 201, token).ConfigureAwait(false);

            HarnessProfile profile = Server.Server.Context.Database.HarnessProfiles.ReadByNameAsync(tenant, harnessProfileName, token).GetAwaiter().GetResult()
                ?? throw new TestAssertionException("Harness profile " + harnessProfileName + " not found.");
            Deployment deployment = new Deployment();
            deployment.AgentId = created.Id;
            deployment.Name = agentName + "-default";
            deployment.HarnessProfileId = profile.Id;
            deployment.TimeoutSeconds = 120;
            configureDeployment?.Invoke(deployment);
            await HttpTestHelpers.SendAsync<Deployment>(Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/deployments", deployment, 201, token).ConfigureAwait(false);
            return created;
        }

        /// <summary>
        /// Stop workers and the server.
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
            await Server.DisposeAsync().ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private static void EnsureFakeHarnessOnPath()
        {
            lock (_PathLock)
            {
                if (_WrapperDirectory != null) return;
                string dll = Path.Combine(AppContext.BaseDirectory, "garrison-fake-harness.dll");
                if (!File.Exists(dll)) throw new TestAssertionException("garrison-fake-harness.dll was not found next to the test assembly.");
                string directory = Path.Combine(Path.GetTempPath(), "garrison-test-bin-" + Environment.ProcessId);
                Directory.CreateDirectory(directory);
                string dotnet = Environment.ProcessPath != null && Path.GetFileNameWithoutExtension(Environment.ProcessPath) == "dotnet" ? Environment.ProcessPath : "dotnet";
                if (OperatingSystem.IsWindows())
                {
                    File.WriteAllText(Path.Combine(directory, "garrison-fake-harness.cmd"), "@echo off\r\n\"" + dotnet + "\" \"" + dll + "\" %*\r\n");
                }
                else
                {
                    string script = Path.Combine(directory, "garrison-fake-harness");
                    File.WriteAllText(script, "#!/bin/sh\nexec \"" + dotnet + "\" \"" + dll + "\" \"$@\"\n");
                    File.SetUnixFileMode(script, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute | UnixFileMode.GroupRead | UnixFileMode.GroupExecute);
                }
                Environment.SetEnvironmentVariable("PATH", directory + Path.PathSeparator + Environment.GetEnvironmentVariable("PATH"));
                _WrapperDirectory = directory;
            }
        }

        #endregion
    }
}
