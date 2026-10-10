namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.Net;
    using System.Net.Http;
    using System.Net.Sockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Server;
    using Garrison.Server.Settings;
    using SyslogLogging;

    /// <summary>
    /// Starts an in-process Garrison server on free 127.0.0.1 ports with an isolated database, and provides an
    /// authenticated HTTP client. Dispose to stop.
    /// </summary>
    public sealed class TestServerHost : IAsyncDisposable
    {
        private static readonly HashSet<int> _IssuedPorts = new HashSet<int>();
        private static readonly object _IssuedPortsLock = new object();

        #region Public-Members

        /// <summary>
        /// Started server.
        /// </summary>
        public GarrisonServer Server { get; }

        /// <summary>
        /// REST base URL, for example http://127.0.0.1:51234.
        /// </summary>
        public string BaseUrl { get; }

        /// <summary>
        /// MCP base URL, for example http://127.0.0.1:51235.
        /// </summary>
        public string McpUrl { get; }

        /// <summary>
        /// Settings used.
        /// </summary>
        public ServerSettings Settings { get; }

        /// <summary>
        /// HTTP client with the administrator API key header.
        /// </summary>
        public HttpClient AdminClient { get; }

        /// <summary>
        /// Default tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return Server.Context.DefaultTenantId;
            }
        }

        #endregion

        #region Constructors-and-Factories

        private TestServerHost(GarrisonServer server, ServerSettings settings)
        {
            Server = server;
            Settings = settings;
            BaseUrl = "http://127.0.0.1:" + settings.Rest.Port;
            McpUrl = "http://127.0.0.1:" + settings.Mcp.Port;
            AdminClient = new HttpClient();
            AdminClient.BaseAddress = new Uri(BaseUrl);
            AdminClient.DefaultRequestHeaders.Add("x-api-key", settings.Auth.AdminApiKey);
            AdminClient.Timeout = TimeSpan.FromSeconds(60);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start a server.
        /// </summary>
        /// <param name="provider">Database provider.</param>
        /// <param name="configure">Optional settings customization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Host.</returns>
        public static async Task<TestServerHost> StartAsync(DatabaseTypeEnum provider = DatabaseTypeEnum.Sqlite, Action<ServerSettings>? configure = null, CancellationToken token = default)
        {
            ServerSettings settings = new ServerSettings();
            settings.NodeId = "test-command";
            settings.Rest.Hostname = "127.0.0.1";
            settings.Rest.Port = FreePort();
            settings.Mcp.Hostname = "127.0.0.1";
            settings.Mcp.Port = FreePort();
            settings.Database = TestEnvironment.IsolatedSettings(provider);
            settings.Logging.ConsoleLogging = Environment.GetEnvironmentVariable("GARRISON_TEST_LOGS") == "true";
            settings.Telemetry.Enabled = false;
            settings.RequestHistory.Enabled = true;
            settings.Auth.SigningKey = "test-signing-key";
            settings.Security.MasterKey = "test-master-key";
            configure?.Invoke(settings);

            LoggingModule logging = Bootstrapper.BuildLogging(settings.Logging);
            GarrisonServer server = await Bootstrapper.StartAsync(settings, logging, token).ConfigureAwait(false);
            return new TestServerHost(server, settings);
        }

        /// <summary>
        /// Create a client authenticated with a bearer token for a user login.
        /// </summary>
        /// <param name="email">Email.</param>
        /// <param name="password">Password.</param>
        /// <param name="tenantId">Tenant identifier, or null for the default tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Client.</returns>
        public async Task<HttpClient> UserClientAsync(string email, string password, string? tenantId = null, CancellationToken token = default)
        {
            using (HttpClient anonymous = new HttpClient())
            {
                string body = Serializer.Serialize(new { tenantId = tenantId ?? TenantId, email, password });
                HttpResponseMessage response = await anonymous.PostAsync(BaseUrl + "/v1.0/token", new StringContent(body, Encoding.UTF8, "application/json"), token).ConfigureAwait(false);
                string text = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                if (response.StatusCode != HttpStatusCode.OK) throw new TestAssertionException("Login failed for " + email + ": " + text);
                TokenResponse issued = Serializer.Deserialize<TokenResponse>(text) ?? throw new TestAssertionException("Empty token response.");
                HttpClient client = new HttpClient();
                client.BaseAddress = new Uri(BaseUrl);
                client.DefaultRequestHeaders.Add("Authorization", "Bearer " + issued.Token);
                client.Timeout = TimeSpan.FromSeconds(60);
                return client;
            }
        }

        /// <summary>
        /// Create a client authenticated with credential headers.
        /// </summary>
        /// <param name="accessKey">Access key.</param>
        /// <param name="secretKey">Secret key.</param>
        /// <returns>Client.</returns>
        public HttpClient CredentialClient(string accessKey, string secretKey)
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(BaseUrl);
            client.DefaultRequestHeaders.Add("x-access-key", accessKey);
            client.DefaultRequestHeaders.Add("x-secret-key", secretKey);
            client.Timeout = TimeSpan.FromSeconds(60);
            return client;
        }

        /// <summary>
        /// A free TCP port on 127.0.0.1 that this process has not handed out before. The operating system can return
        /// the same ephemeral port to two back-to-back probes (it is released between them), which made a server's REST
        /// and MCP ports collide; remembering issued ports rules that out. Thread-safe.
        /// </summary>
        /// <returns>Port.</returns>
        /// <exception cref="InvalidOperationException">Thrown when no unused port is found after many attempts.</exception>
        public static int FreePort()
        {
            for (int attempt = 0; attempt < 100; attempt++)
            {
                TcpListener listener = new TcpListener(IPAddress.Loopback, 0);
                listener.Start();
                int port = ((IPEndPoint)listener.LocalEndpoint).Port;
                listener.Stop();
                lock (_IssuedPortsLock)
                {
                    if (_IssuedPorts.Add(port)) return port;
                }
            }
            throw new InvalidOperationException("Could not find a free TCP port that was not already handed out.");
        }

        /// <summary>
        /// Stop the server and release resources.
        /// </summary>
        /// <returns>Value task.</returns>
        public async ValueTask DisposeAsync()
        {
            AdminClient.Dispose();
            using (CancellationTokenSource cts = new CancellationTokenSource(TimeSpan.FromSeconds(15)))
            {
                await Server.StopAsync(cts.Token).ConfigureAwait(false);
            }
            Server.Dispose();
            await Server.Context.Database.DisposeAsync().ConfigureAwait(false);
        }

        #endregion
    }
}
