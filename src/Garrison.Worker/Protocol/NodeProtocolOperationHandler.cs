namespace Garrison.Worker.Protocol
{
    using System;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Telemetry;

    /// <summary>Preserves named node-protocol telemetry when requests are built by the SDK transport.</summary>
    public sealed class NodeProtocolOperationHandler : DelegatingHandler
    {
        /// <summary>Instantiate.</summary>
        /// <param name="innerHandler">Telemetry and network handler chain.</param>
        public NodeProtocolOperationHandler(HttpMessageHandler innerHandler) : base(innerHandler)
        {
        }

        /// <inheritdoc />
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            string path = request.RequestUri?.AbsolutePath ?? String.Empty;
            request.Options.Set(TelemetryHttpHandler.OperationKey, path.Substring(path.LastIndexOf('/') + 1));
            return base.SendAsync(request, cancellationToken);
        }
    }
}
