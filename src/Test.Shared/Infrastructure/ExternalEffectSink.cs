namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Net.Http;
    using Garrison.Core.Serialization;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>An independent Node process recording non-deduplicated external HTTP mutations.</summary>
    public sealed class ExternalEffectSink : IAsyncDisposable
    {
        private readonly Process _Process;
        private readonly HttpClient _Client = new HttpClient();

        /// <summary>Loopback HTTP endpoint.</summary>
        public string BaseUrl { get; }

        private ExternalEffectSink(Process process, int port)
        {
            _Process = process;
            BaseUrl = "http://127.0.0.1:" + port;
        }

        /// <summary>Start a dedicated process and await its HTTP readiness.</summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Ready effect sink.</returns>
        public static async Task<ExternalEffectSink> StartAsync(CancellationToken token)
        {
            int port = TestServerHost.FreePort();
            ProcessStartInfo start = new ProcessStartInfo("node");
            start.ArgumentList.Add(Path.Combine(TelemetryCoverageDocument.RepositoryRoot(), "k8s", "tests", "effect-safety", "fixture.mjs"));
            foreach (string argument in new[] { "--mode", "sink", "--port", port.ToString(System.Globalization.CultureInfo.InvariantCulture), "--hostname", "127.0.0.1" }) start.ArgumentList.Add(argument);
            start.UseShellExecute = false;
            Process process = Process.Start(start) ?? throw new InvalidOperationException("Cannot start effect sink.");
            ExternalEffectSink sink = new ExternalEffectSink(process, port);
            try
            {
                DateTime deadline = DateTime.UtcNow.AddSeconds(10);
                while (DateTime.UtcNow < deadline)
                {
                    try { await sink.ReceiptsAsync(token).ConfigureAwait(false); return sink; }
                    catch (HttpRequestException) { await Task.Delay(50, token).ConfigureAwait(false); }
                }
                throw new InvalidOperationException("Effect sink readiness timed out.");
            }
            catch { await sink.DisposeAsync().ConfigureAwait(false); throw; }
        }

        /// <summary>Read independent committed mutation receipts.</summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Typed mutation receipts.</returns>
        public async Task<List<ExternalEffectReceipt>> ReceiptsAsync(CancellationToken token)
        {
            ExternalEffectState state = Serializer.Deserialize<ExternalEffectState>(await _Client.GetStringAsync(BaseUrl + "/state", token).ConfigureAwait(false)) ?? throw new InvalidOperationException("Effect sink returned no state.");
            return state.Receipts;
        }

        /// <inheritdoc />
        public async ValueTask DisposeAsync()
        {
            if (!_Process.HasExited) _Process.Kill(true);
            await _Process.WaitForExitAsync().ConfigureAwait(false);
            _Process.Dispose();
            _Client.Dispose();
        }
    }
}
