namespace Garrison.Server.Storage
{
    using System;
    using System.Net.Http;
    using Amazon.Runtime;
    using Garrison.Core.Security;

    /// <summary>
    /// HTTP clients for S3 artifact stores, whose endpoint a tenant chooses. Each client uses
    /// <see cref="OutboundAddressPolicy.CreateHandler"/>, so connections to link-local, metadata, unspecified, and
    /// multicast addresses are refused when the connection is made, whatever the endpoint name resolves to, and redirects
    /// are never followed (SR-07). Loopback and private ranges stay allowed for in-cluster object stores. Thread-safe.
    /// </summary>
    public class GuardedS3HttpClientFactory : HttpClientFactory
    {
        #region Public-Methods

        /// <summary>
        /// Create an HTTP client with the guarded handler and the SDK's configured timeout.
        /// </summary>
        /// <param name="clientConfig">SDK client configuration.</param>
        /// <returns>HTTP client that owns its handler.</returns>
        /// <exception cref="ArgumentNullException">Thrown when clientConfig is null.</exception>
        public override HttpClient CreateHttpClient(IClientConfig clientConfig)
        {
            if (clientConfig == null) throw new ArgumentNullException(nameof(clientConfig));
            HttpClient client = new HttpClient(OutboundAddressPolicy.CreateHandler(true), true);
            if (clientConfig.Timeout.HasValue) client.Timeout = clientConfig.Timeout.Value;
            return client;
        }

        #endregion
    }
}
