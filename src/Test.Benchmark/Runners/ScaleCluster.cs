namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// One client per control-plane replica for a scale sweep: submissions go round robin across them, and metrics are
    /// scraped from every replica and summed, because each replica counts only what it handled. Thread-safe after
    /// construction (the clients are thread-safe).
    /// </summary>
    public class ScaleCluster : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Server base URLs, in round-robin order.
        /// </summary>
        public IReadOnlyList<string> Urls
        {
            get
            {
                return _Clients.Select(c => c.BaseUrl).ToList();
            }
        }

        /// <summary>
        /// Number of replicas.
        /// </summary>
        public int Count
        {
            get
            {
                return _Clients.Count;
            }
        }

        #endregion

        #region Private-Members

        private readonly List<GarrisonClient> _Clients = new List<GarrisonClient>();
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="urls">Server base URLs (at least one).</param>
        /// <param name="adminApiKey">Admin API key.</param>
        /// <param name="maxConnectionsPerServer">Connection pool size per replica.</param>
        /// <param name="requestTimeoutSeconds">Per-request timeout in seconds.</param>
        /// <exception cref="ArgumentNullException">Thrown when urls or the key is null.</exception>
        /// <exception cref="ArgumentException">Thrown when urls is empty.</exception>
        public ScaleCluster(IEnumerable<string> urls, string adminApiKey, int maxConnectionsPerServer, int requestTimeoutSeconds)
        {
            if (urls == null) throw new ArgumentNullException(nameof(urls));
            if (adminApiKey == null) throw new ArgumentNullException(nameof(adminApiKey));
            foreach (string url in urls) _Clients.Add(new GarrisonClient(url, adminApiKey, maxConnectionsPerServer, requestTimeoutSeconds, 30));
            if (_Clients.Count == 0) throw new ArgumentException("At least one server URL is required.", nameof(urls));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Client of one replica, wrapping the index round robin.
        /// </summary>
        /// <param name="index">Any non-negative index.</param>
        /// <returns>Client.</returns>
        public GarrisonClient Client(int index)
        {
            return _Clients[Math.Abs(index) % _Clients.Count];
        }

        /// <summary>
        /// Scrape /metrics on every replica in parallel and concatenate the samples. Replicas that do not answer are left
        /// out (see <see cref="PrometheusSamples.Scrapes"/>).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Samples of every replica that answered.</returns>
        public async Task<PrometheusSamples> ScrapeAsync(CancellationToken token)
        {
            List<Task<string?>> scrapes = _Clients.Select(c => c.GetMetricsTextAsync(token)).ToList();
            string?[] texts = await Task.WhenAll(scrapes).ConfigureAwait(false);
            return PrometheusSamples.Parse(texts);
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
        /// Dispose.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                foreach (GarrisonClient client in _Clients) client.Dispose();
                _Clients.Clear();
            }
            _Disposed = true;
        }

        #endregion
    }
}
