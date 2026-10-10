namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using WatsonWebserver;
    using WatsonWebserver.Core;

    /// <summary>
    /// Answers health probes on the REST port while the replica starts (waiting for the startup lock, migrating, and
    /// seeding), before the real listener is up (P10.9). Liveness (/v1.0/api/health/live) answers 200 so a long migration
    /// is not killed; readiness and every other path answer 503 with status starting. Stopped just before the REST
    /// listener starts on the same port. Thread-safe.
    /// </summary>
    public class StartupHealthListener : IDisposable
    {
        #region Private-Members

        private readonly Webserver _Server;
        private readonly string _NodeId;
        private bool _Started = false;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="hostname">Bind hostname.</param>
        /// <param name="port">REST port.</param>
        /// <param name="nodeId">Node identifier reported in answers.</param>
        /// <exception cref="ArgumentNullException">Thrown when hostname is null or empty.</exception>
        public StartupHealthListener(string hostname, int port, string nodeId)
        {
            if (String.IsNullOrEmpty(hostname)) throw new ArgumentNullException(nameof(hostname));
            _NodeId = nodeId ?? String.Empty;
            WebserverSettings settings = new WebserverSettings();
            settings.Hostname = hostname;
            settings.Port = port;
            settings.Headers.DefaultHeaders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            _Server = new Webserver(settings, AnswerAsync);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start answering. A failure to bind is ignored: probes then simply see no listener, as before.
        /// </summary>
        /// <returns>True when listening.</returns>
        public bool Start()
        {
            try
            {
                _Server.Start();
                _Started = true;
            }
            catch (Exception)
            {
                _Started = false;
            }
            return _Started;
        }

        /// <summary>
        /// Stop answering and release the port.
        /// </summary>
        public void Stop()
        {
            if (!_Started) return;
            _Started = false;
            try
            {
                _Server.Stop();
            }
            catch (Exception)
            {
                // The port is released either way.
            }
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
                Stop();
                if (_Server is IDisposable disposable) disposable.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task AnswerAsync(HttpContextBase context)
        {
            bool live = String.Equals(context.Request.Url.RawWithoutQuery.TrimEnd('/'), "/v1.0/api/health/live", StringComparison.OrdinalIgnoreCase);
            HealthResponse health = new HealthResponse();
            health.Node = _NodeId;
            health.Version = Constants.ProductVersion;
            health.Status = "starting";
            health.Database = "unchecked";
            context.Response.StatusCode = live ? 200 : 503;
            context.Response.ContentType = "application/json";
            await context.Response.Send(Serializer.Serialize(health)).ConfigureAwait(false);
        }

        #endregion
    }
}
