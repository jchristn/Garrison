namespace Test.Shared.Infrastructure
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using WatsonWebserver;
    using WatsonWebserver.Core;

    /// <summary>
    /// In-process stand-in for Grafana, Prometheus, Loki, and Tempo answering the health, readiness, and build
    /// information endpoints the server probes. Counts requests so tests can check caching. Thread-safe.
    /// </summary>
    public sealed class FakeObservabilityServer : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Base URL, for example http://127.0.0.1:12345.
        /// </summary>
        public string BaseUrl { get; }

        /// <summary>
        /// Requests received.
        /// </summary>
        public int Requests
        {
            get
            {
                return Volatile.Read(ref _Requests);
            }
        }

        #endregion

        #region Private-Members

        private readonly Webserver _Server;
        private int _Requests = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Start the server on a free 127.0.0.1 port.
        /// </summary>
        public FakeObservabilityServer()
        {
            int port = TestServerHost.FreePort();
            BaseUrl = "http://127.0.0.1:" + port;
            WebserverSettings settings = new WebserverSettings();
            settings.Hostname = "127.0.0.1";
            settings.Port = port;
            _Server = new Webserver(settings, NotFoundAsync);
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.GET, "/api/health", (ctx) => SendAsync(ctx, 200, "application/json", "{\"commit\":\"abc\",\"database\":\"ok\",\"version\":\"11.3.0\"}"));
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.GET, "/-/ready", (ctx) => SendAsync(ctx, 200, "text/plain", "Prometheus Server is Ready."));
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.GET, "/api/v1/status/buildinfo", (ctx) => SendAsync(ctx, 200, "application/json", "{\"status\":\"success\",\"data\":{\"version\":\"3.1.0\",\"revision\":\"x\"}}"));
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.GET, "/ready", (ctx) => SendAsync(ctx, 200, "text/plain", "ready"));
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.GET, "/loki/api/v1/status/buildinfo", (ctx) => SendAsync(ctx, 200, "application/json", "{\"version\":\"3.4.2\",\"revision\":\"y\"}"));
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.GET, "/api/status/buildinfo", (ctx) => SendAsync(ctx, 200, "application/json", "{\"version\":\"2.7.1\",\"revision\":\"z\"}"));
            _Server.Start();
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Stop the server.
        /// </summary>
        public void Dispose()
        {
            _Server.Stop();
            if (_Server is IDisposable disposable) disposable.Dispose();
        }

        #endregion

        #region Private-Methods

        private async Task SendAsync(HttpContextBase context, int status, string contentType, string body)
        {
            Interlocked.Increment(ref _Requests);
            context.Response.StatusCode = status;
            context.Response.ContentType = contentType;
            await context.Response.Send(body).ConfigureAwait(false);
        }

        private async Task NotFoundAsync(HttpContextBase context)
        {
            Interlocked.Increment(ref _Requests);
            context.Response.StatusCode = 404;
            await context.Response.Send().ConfigureAwait(false);
        }

        #endregion
    }
}
