namespace Garrison.Worker.Hosting
{
    using System;
    using System.Threading.Tasks;
    using Garrison.Core.Serialization;
    using WatsonWebserver;
    using WatsonWebserver.Core;

    /// <summary>
    /// Worker health listener for Kubernetes probes: GET /health/live (process up) and GET /health/ready (registered
    /// and leasing). Thread-safe.
    /// </summary>
    public class HealthServer : IDisposable
    {
        #region Private-Members

        private readonly Webserver _Server;
        private readonly Func<WorkerHealth> _Health;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="hostname">Bind hostname.</param>
        /// <param name="port">Port.</param>
        /// <param name="health">Health snapshot provider.</param>
        /// <exception cref="ArgumentNullException">Thrown when health is null.</exception>
        public HealthServer(string hostname, int port, Func<WorkerHealth> health)
        {
            _Health = health ?? throw new ArgumentNullException(nameof(health));
            WebserverSettings settings = new WebserverSettings();
            settings.Hostname = hostname;
            settings.Port = port;
            _Server = new Webserver(settings, NotFoundAsync);
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.GET, "/health/live", LiveAsync);
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.GET, "/health/ready", ReadyAsync);
            _Server.Routes.PreAuthentication.Static.Add(HttpMethod.GET, "/health", ReadyAsync);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start listening.
        /// </summary>
        public void Start()
        {
            _Server.Start();
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
                try
                {
                    _Server.Stop();
                }
                catch (InvalidOperationException)
                {
                }
                if (_Server is IDisposable disposable) disposable.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task LiveAsync(HttpContextBase context)
        {
            WorkerHealth health = _Health();
            health.Status = "alive";
            await SendAsync(context, 200, health).ConfigureAwait(false);
        }

        private async Task ReadyAsync(HttpContextBase context)
        {
            WorkerHealth health = _Health();
            await SendAsync(context, health.Ready ? 200 : 503, health).ConfigureAwait(false);
        }

        private static async Task NotFoundAsync(HttpContextBase context)
        {
            context.Response.StatusCode = 404;
            context.Response.ContentType = "application/json";
            await context.Response.Send("{\"error\":\"NotFound\"}").ConfigureAwait(false);
        }

        private static async Task SendAsync(HttpContextBase context, int status, WorkerHealth health)
        {
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            await context.Response.Send(Serializer.Serialize(health)).ConfigureAwait(false);
        }

        #endregion
    }
}
