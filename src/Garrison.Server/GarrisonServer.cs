namespace Garrison.Server
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Server.Backplane;
    using Garrison.Server.Modules;
    using Garrison.Server.Routes;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Radiant;
    using WatsonWebserver;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.OpenApi;

    /// <summary>
    /// Control-plane host ("Command"). Owns the Watson listener, wires authentication, CORS, OpenAPI, and request
    /// observation, and composes the feature modules.
    /// </summary>
    public class GarrisonServer : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Server context.
        /// </summary>
        public ServerContext Context
        {
            get
            {
                return _Context;
            }
        }

        /// <summary>
        /// Modules in initialization order.
        /// </summary>
        public IReadOnlyList<IServerModule> Modules
        {
            get
            {
                return _Modules;
            }
        }

        /// <summary>
        /// Event backplane connecting this replica to the others.
        /// </summary>
        public IEventBackplane Backplane
        {
            get
            {
                return _Backplane;
            }
        }

        /// <summary>
        /// Milliseconds <see cref="StopAsync"/> waits for in-flight requests after it starts draining. Long polls, SSE and
        /// WebSocket streams, and synchronous waits end as soon as draining starts, so this mostly covers ordinary
        /// requests. Minimum 0, maximum 120000, default 15000 (inside a 30-second pod grace period).
        /// </summary>
        public int ShutdownGraceMs
        {
            get
            {
                return _ShutdownGraceMs;
            }
            set
            {
                _ShutdownGraceMs = Math.Clamp(value, 0, 120000);
            }
        }

        /// <summary>
        /// Requests currently being handled.
        /// </summary>
        public int InFlightRequests
        {
            get
            {
                return _InFlight.Count;
            }
        }

        /// <summary>
        /// This replica's control node registration and heartbeat (P10.19).
        /// </summary>
        public ControlNodeService ControlNode
        {
            get
            {
                return _ControlNode;
            }
        }

        /// <summary>
        /// Invoked just before the REST listener starts (the bootstrapper uses it to stop its startup health listener).
        /// Null by default.
        /// </summary>
        public Action? BeforeListen { get; set; } = null;

        /// <summary>
        /// Route registrar (exposes the operation scope map).
        /// </summary>
        public RouteRegistrar Routes
        {
            get
            {
                return _Routes;
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Context;
        private readonly Webserver _Server;
        private readonly RouteRegistrar _Routes;
        private readonly List<IServerModule> _Modules;
        private readonly IEventBackplane _Backplane;
        private readonly ControlNodeService _ControlNode;
        private readonly bool _OwnsBackplane = false;
        private readonly CancellationTokenSource _Stopping = new CancellationTokenSource();
        private readonly string _Header = "[GarrisonServer] ";
        private string _CorsOrigin = "*";
        private int _ShutdownGraceMs = 15000;
        private int _StopRequested = 0;
        private readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, DateTime> _InFlight = new System.Collections.Concurrent.ConcurrentDictionary<Guid, DateTime>();
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <param name="modules">Modules; null uses the standard set.</param>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public GarrisonServer(ServerContext context, List<IServerModule>? modules = null)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _Modules = modules ?? new List<IServerModule>
            {
                new IdentityModule(),
                new ConfigurationModule(),
                new RuntimeModule(),
                new ProtocolModule()
            };

            WebserverSettings settings = new WebserverSettings();
            settings.Hostname = context.Settings.Rest.Hostname;
            settings.Port = context.Settings.Rest.Port;
            settings.Ssl.Enable = context.Settings.Rest.Ssl;
            settings.WebSockets.Enable = true;
            _Server = new Webserver(settings, DefaultRouteAsync);
            context.Register(_Server);

            IEventBackplane? backplane = context.TryGet<IEventBackplane>();
            if (backplane == null)
            {
                string instanceId = context.NodeId + ":" + Guid.NewGuid().ToString("N").Substring(0, 8);
                backplane = BackplaneFactory.Create(context.Settings.Cluster.Backplane, context.Database, instanceId, context.Settings.Cluster.BackplanePollMs, context.Logging);
                context.Register<IEventBackplane>(backplane);
                _OwnsBackplane = true;
            }
            _Backplane = backplane;

            _ControlNode = new ControlNodeService(context, _Backplane.Name);
            _ControlNode.ActiveRequests = () => _InFlight.Count;
            context.Register(_ControlNode);

            _Routes = new RouteRegistrar(_Server, context.Authorization, context.Database, context.Scopes, context.Logging);
            if (context.Settings.Rest.CorsOrigins.Count > 0) _CorsOrigin = String.Join(" ", context.Settings.Rest.CorsOrigins);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Initialize modules, register routes, start the listener, and start background work.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task StartAsync(CancellationToken token = default)
        {
            ConfigureServer();

            // The control node row shows Starting until the replica serves, then Ready (P10.19).
            await _ControlNode.RegisterAsync(token).ConfigureAwait(false);

            foreach (IServerModule module in _Modules)
            {
                await module.InitializeAsync(_Context, token).ConfigureAwait(false);
                _Context.Logging.Debug(_Header + "initialized " + module.Name);
            }

            new CoreRoutes(_Context).Register(_Routes);
            foreach (IServerModule module in _Modules) module.RegisterRoutes(_Context, _Routes);

            await _Backplane.StartAsync(_Stopping.Token).ConfigureAwait(false);
            _Context.Logging.Info(_Header + "backplane " + _Backplane.Name + " started as " + _Backplane.InstanceId);

            BeforeListen?.Invoke();
            _Server.Start();
            _Context.Logging.Info(_Header + "listening on " + _Context.Settings.Rest.Hostname + ":" + _Context.Settings.Rest.Port + " with " + _Context.Scopes.All().Count + " routes");

            foreach (IServerModule module in _Modules)
            {
                await module.StartAsync(_Context, _Stopping.Token).ConfigureAwait(false);
            }

            RuntimeOptions? options = _Context.TryGet<RuntimeOptions>();
            if (options != null) _ControlNode.HeartbeatIntervalMs = () => options.ControlNodeHeartbeatMs;
            await _ControlNode.StartAsync(_Stopping.Token).ConfigureAwait(false);
        }

        /// <summary>
        /// Drain (readiness off, long polls and streams end, in-flight requests get <see cref="ShutdownGraceMs"/>), then stop background work and the listener. Calls after the first return at once.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task StopAsync(CancellationToken token = default)
        {
            if (Interlocked.Exchange(ref _StopRequested, 1) == 1) return;

            // Drain: readiness turns 503, long polls and streams end, and in-flight requests get a grace period before
            // background work and the listener stop.
            _Context.BeginShutdown();
            _Context.Logging.Info(_Header + "draining (" + _InFlight.Count + " requests in flight)");
            await _ControlNode.MarkDrainingAsync(token).ConfigureAwait(false);
            DateTime graceEnds = DateTime.UtcNow.AddMilliseconds(_ShutdownGraceMs);
            while (!_InFlight.IsEmpty && DateTime.UtcNow < graceEnds && !token.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(50, token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
            _Stopping.Cancel();
            foreach (IServerModule module in Enumerable.Reverse(_Modules))
            {
                try
                {
                    await module.StopAsync(token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Context.Logging.Warn(_Header + "error stopping " + module.Name + ": " + e.Message);
                }
            }
            _Server.Stop();
            try
            {
                await _Backplane.StopAsync(token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                _Context.Logging.Warn(_Header + "error stopping the backplane: " + e.Message);
            }

            // A clean stop leaves the control node row Offline; the leader deletes it after the retention period.
            await _ControlNode.StopAsync(token).ConfigureAwait(false);
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                _Stopping.Dispose();
                _ControlNode.Dispose();
                if (_Server is IDisposable disposable) disposable.Dispose();
                if (_OwnsBackplane) _Backplane.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private void ConfigureServer()
        {
            _Server.Routes.AuthenticateRequest = _Context.Authentication.AuthenticateRequestAsync;
            _Server.Routes.Preflight = PreflightAsync;
            _Server.Routes.PreRouting = PreRoutingAsync;
            _Server.Routes.PostRouting = PostRoutingAsync;
            _Server.UseOpenApi(openApi =>
            {
                openApi.Info.Title = "Garrison API";
                openApi.Info.Version = Constants.ProductVersion;
                openApi.Info.Description = "Garrison control plane: agents, deployments, harness profiles, prompt templates, runs, nodes, and administration.";
            });
        }

        private async Task PreflightAsync(HttpContextBase context)
        {
            context.Response.StatusCode = 200;
            AddCors(context);
            context.Response.Headers.Add("Access-Control-Max-Age", "86400");
            await context.Response.Send().ConfigureAwait(false);
        }

        private Task PreRoutingAsync(HttpContextBase context)
        {
            _InFlight[context.Request.Guid] = DateTime.UtcNow;
            return Task.CompletedTask;
        }

        private async Task PostRoutingAsync(HttpContextBase context)
        {
            _InFlight.TryRemove(context.Request.Guid, out DateTime _);
            context.Timestamp.End = DateTime.UtcNow;
            AddCors(context);

            _Context.Logging.Debug(_Header + context.Request.Method + " " + context.Request.Url.RawWithQuery + " " + context.Response.StatusCode + " (" + (context.Timestamp.TotalMs.HasValue ? context.Timestamp.TotalMs.Value.ToString("F2") : "?") + "ms)");

            _Context.Telemetry.Increment("garrison.http.requests", new RadiantTag("method", context.Request.Method.ToString()), new RadiantTag("status_class", (context.Response.StatusCode / 100) + "xx"));

            // Prometheus scrapes of the relayed /metrics endpoint are not request history.
            IRequestObserver? observer = _Context.TryGet<IRequestObserver>();
            if (observer != null && !String.Equals(context.Request.Url.RawWithoutQuery, "/metrics", StringComparison.Ordinal))
            {
                try
                {
                    observer.Observe(context);
                }
                catch (Exception e)
                {
                    _Context.Logging.Debug(_Header + "request observer failed: " + e.Message);
                }
            }

            await Task.CompletedTask.ConfigureAwait(false);
        }

        private void AddCors(HttpContextBase context)
        {
            context.Response.Headers.Add("Access-Control-Allow-Origin", _CorsOrigin);
            context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
            context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept-Language, Idempotency-Key, x-api-key, x-token, x-tenant-id, x-email, x-password, x-access-key, x-secret-key, x-date, x-nonce, x-signature, x-request-id");
            context.Response.Headers.Add("Access-Control-Expose-Headers", "x-request-id");
        }

        private static async Task DefaultRouteAsync(HttpContextBase context)
        {
            context.Response.StatusCode = 404;
            context.Response.ContentType = "application/json";
            await context.Response.Send("{\"error\":\"NotFound\",\"code\":\"RouteNotFound\",\"message\":\"No route matches the request.\"}").ConfigureAwait(false);
        }

        #endregion
    }
}
