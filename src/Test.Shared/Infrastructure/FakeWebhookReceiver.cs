namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using WatsonWebserver;
    using WatsonWebserver.Core;

    /// <summary>
    /// In-process notification receiver on 127.0.0.1 (P12.14 tests). Records every request with its Garrison headers.
    /// Each path answers 200 unless statuses were queued for it with <see cref="Script"/>; the path /redirect answers 302
    /// to /redirect-target. Thread-safe.
    /// </summary>
    public sealed class FakeWebhookReceiver : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Base URL, for example http://127.0.0.1:12345.
        /// </summary>
        public string BaseUrl { get; }

        /// <summary>
        /// Port.
        /// </summary>
        public int Port { get; }

        #endregion

        #region Private-Members

        private readonly Webserver _Server;
        private readonly ConcurrentQueue<WebhookReceipt> _Receipts = new ConcurrentQueue<WebhookReceipt>();
        private readonly ConcurrentDictionary<string, ConcurrentQueue<int>> _Scripts = new ConcurrentDictionary<string, ConcurrentQueue<int>>(StringComparer.Ordinal);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Start the receiver on a free 127.0.0.1 port.
        /// </summary>
        public FakeWebhookReceiver()
        {
            Port = TestServerHost.FreePort();
            BaseUrl = "http://127.0.0.1:" + Port;
            WebserverSettings settings = new WebserverSettings();
            settings.Hostname = "127.0.0.1";
            settings.Port = Port;
            _Server = new Webserver(settings, HandleAsync);
            _Server.Start();
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Queue statuses for the next requests to a path, answered in order; afterwards the path answers 200.
        /// </summary>
        /// <param name="path">Path, for example /hook.</param>
        /// <param name="statuses">Statuses.</param>
        public void Script(string path, params int[] statuses)
        {
            ConcurrentQueue<int> queue = _Scripts.GetOrAdd(path, _ => new ConcurrentQueue<int>());
            foreach (int status in statuses) queue.Enqueue(status);
        }

        /// <summary>
        /// Requests received on a path, in arrival order.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <returns>Receipts.</returns>
        public List<WebhookReceipt> For(string path)
        {
            return _Receipts.Where(r => r.Path == path).ToList();
        }

        /// <summary>
        /// Wait until a path received at least a number of requests.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <param name="count">Requests to wait for.</param>
        /// <param name="seconds">Most seconds to wait.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Receipts on the path.</returns>
        /// <exception cref="TestAssertionException">Thrown when the requests did not arrive in time.</exception>
        public async Task<List<WebhookReceipt>> WaitForAsync(string path, int count, int seconds, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(seconds);
            while (true)
            {
                List<WebhookReceipt> received = For(path);
                if (received.Count >= count) return received;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException(path + " received " + received.Count + " of " + count + " notification(s) in " + seconds + " seconds.");
                await Task.Delay(50, token).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Stop the receiver.
        /// </summary>
        public void Dispose()
        {
            _Server.Stop();
            if (_Server is IDisposable disposable) disposable.Dispose();
        }

        #endregion

        #region Private-Methods

        private async Task HandleAsync(HttpContextBase context)
        {
            string path = context.Request.Url.RawWithoutQuery;
            WebhookReceipt receipt = new WebhookReceipt();
            receipt.Path = path;
            receipt.Body = context.Request.DataAsBytes ?? Array.Empty<byte>();
            receipt.Signature = context.Request.Headers["X-Garrison-Signature"];
            receipt.Event = context.Request.Headers["X-Garrison-Event"];
            receipt.Delivery = context.Request.Headers["X-Garrison-Delivery"];
            receipt.ContentType = context.Request.ContentType;
            int status = 200;
            if (path == "/redirect")
            {
                status = 302;
                context.Response.Headers.Add("Location", BaseUrl + "/redirect-target");
            }
            else if (_Scripts.TryGetValue(path, out ConcurrentQueue<int>? queue) && queue.TryDequeue(out int scripted))
            {
                status = scripted;
            }
            receipt.StatusCode = status;
            _Receipts.Enqueue(receipt);
            context.Response.StatusCode = status;
            context.Response.ContentType = "text/plain";
            await context.Response.Send("ok").ConfigureAwait(false);
        }

        #endregion
    }
}
