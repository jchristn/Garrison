namespace Garrison.Core.Telemetry
{
    using System;
    using System.Diagnostics;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Measures gateway-owned authorization, fencing and journaling time, excluding awaited tool dispatch. The metric
    /// includes database and lock waits in those stages, not transport or tool execution. Each call owns its timer.
    /// </summary>
    public static class GatewayOperation
    {
        private static readonly AsyncLocal<Stopwatch?> _Timer = new AsyncLocal<Stopwatch?>();

        /// <summary>Measure one gateway invocation.</summary>
        /// <typeparam name="T">Result type.</typeparam>
        /// <param name="work">Gateway work.</param>
        /// <param name="token">Cancellation token.</param>
        /// <param name="mode">Bounded principal mode: run or operator.</param>
        /// <returns>Work result.</returns>
        public static async Task<T> MeasureAsync<T>(Func<CancellationToken, Task<T>> work, CancellationToken token = default, string mode = "run")
        {
            Stopwatch? previous = _Timer.Value;
            Stopwatch timer = Stopwatch.StartNew();
            _Timer.Value = timer;
            string result = "ok";
            try { return await work(token).ConfigureAwait(false); }
            catch (OperationCanceledException) { result = "cancelled"; throw; }
            catch (Exception) { result = "error"; throw; }
            finally
            {
                timer.Stop();
                _Timer.Value = previous;
                try { GarrisonMetrics.Observe(GarrisonMetricCatalog.GatewayOverheadDuration, timer.Elapsed.TotalSeconds, "mode", mode == "run" ? "run" : "operator", "result", result); }
                catch (Exception) { }
            }
        }

        /// <summary>Await a tool dispatch while excluding its wall time from the owning gateway timer.</summary>
        /// <typeparam name="T">Result type.</typeparam>
        /// <param name="work">Tool dispatch.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tool result.</returns>
        public static async Task<T> DispatchAsync<T>(Func<CancellationToken, Task<T>> work, CancellationToken token = default)
        {
            Stopwatch? timer = _Timer.Value;
            timer?.Stop();
            try { return await ApplicationOperation.MeasureAsync("gateway", "tool_dispatch", work, token).ConfigureAwait(false); }
            finally { timer?.Start(); }
        }
    }
}
