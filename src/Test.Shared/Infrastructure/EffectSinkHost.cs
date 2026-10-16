namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using WatsonWebserver;
    using WatsonWebserver.Core;

    /// <summary>HTTP effect sink. Records every mutation, including duplicates, with operation identity and attempt.</summary>
    public class EffectSinkHost : IDisposable
    {
        private readonly Webserver _Server;
        private readonly ConcurrentQueue<EffectSinkReceipt> _Receipts = new ConcurrentQueue<EffectSinkReceipt>();
        private bool _Disposed;

        /// <summary>Loopback mutation endpoint.</summary>
        public string Url { get; }

        /// <summary>Mutations in arrival order.</summary>
        public List<EffectSinkReceipt> Receipts { get { return _Receipts.ToList(); } }

        /// <summary>Start the external destination.</summary>
        public EffectSinkHost()
        {
            int port = TestServerHost.FreePort();
            Url = "http://127.0.0.1:" + port + "/mutate";
            _Server = new Webserver(new WebserverSettings { Hostname = "127.0.0.1", Port = port }, HandleAsync);
            _Server.Start();
        }

        /// <summary>Stop the effect sink.</summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>Release the listener.</summary>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                _Server.Stop();
                if (_Server is IDisposable disposable) disposable.Dispose();
            }
            _Disposed = true;
        }

        private async Task HandleAsync(HttpContextBase context)
        {
            string? operationId = context.Request.Headers["Idempotency-Key"];
            string? attempt = context.Request.Headers["X-Garrison-Attempt"];
            if (String.IsNullOrEmpty(operationId) || String.IsNullOrEmpty(attempt))
            {
                context.Response.StatusCode = 400;
                await context.Response.Send("Operation ID and attempt are required.").ConfigureAwait(false);
                return;
            }
            _Receipts.Enqueue(new EffectSinkReceipt { OperationId = operationId, Attempt = attempt });
            context.Response.StatusCode = 200;
            await context.Response.Send("sink:" + operationId).ConfigureAwait(false);
        }
    }
}
