namespace Garrison.LoadGen
{
    using System;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Adds an Idempotency-Key header to outgoing requests while a key is set for the current async flow, so a run
    /// creation that is retried after a lost response returns the original run instead of creating a second one.
    /// Thread-safe: the key is stored per async flow.
    /// </summary>
    public class IdempotencyHandler : DelegatingHandler
    {
        #region Public-Members

        /// <summary>
        /// Header name. Default Idempotency-Key.
        /// </summary>
        public string HeaderName
        {
            get
            {
                return _HeaderName;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value)) throw new ArgumentNullException(nameof(HeaderName));
                _HeaderName = value;
            }
        }

        #endregion

        #region Private-Members

        private static readonly AsyncLocal<string?> _CurrentKey = new AsyncLocal<string?>();
        private string _HeaderName = "Idempotency-Key";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="inner">Inner handler.</param>
        /// <exception cref="ArgumentNullException">Thrown when inner is null.</exception>
        public IdempotencyHandler(HttpMessageHandler inner) : base(inner ?? throw new ArgumentNullException(nameof(inner)))
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Set the key for requests sent from the current async flow, or null to stop sending one.
        /// </summary>
        /// <param name="key">Key, or null.</param>
        public static void SetKey(string? key)
        {
            _CurrentKey.Value = key;
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Send a request, adding the header when a key is set.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Response.</returns>
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            string? key = _CurrentKey.Value;
            if (!String.IsNullOrEmpty(key) && request.Method == HttpMethod.Post)
            {
                request.Headers.Remove(_HeaderName);
                request.Headers.TryAddWithoutValidation(_HeaderName, key);
            }
            return base.SendAsync(request, cancellationToken);
        }

        #endregion
    }
}
