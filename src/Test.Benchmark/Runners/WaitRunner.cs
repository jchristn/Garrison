namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;

    /// <summary>
    /// The wait command: waits until the server is ready and at least --nodes worker nodes are Ready. The stack scripts
    /// use it, so the .sh and .bat versions wait the same way.
    /// </summary>
    public static class WaitRunner
    {
        /// <summary>
        /// Run the command.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>0 when ready, 1 on timeout.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<int> RunAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            int nodes = context.Args.GetInt("nodes", 0, 0, 10000);
            int timeoutSeconds = context.Args.GetInt("timeout-seconds", 180, 1, 3600);
            DateTime deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds);
            if (!await RunnerSupport.WaitReadyAsync(context.Client, TimeSpan.FromSeconds(timeoutSeconds), token).ConfigureAwait(false)) return 1;
            int ready = 0;
            while (DateTime.UtcNow < deadline)
            {
                List<Node> readyNodes = await RunnerSupport.ReadyNodesAsync(context.Client, token).ConfigureAwait(false);
                ready = readyNodes.Count;
                if (ready >= nodes)
                {
                    BenchmarkContext.Log("ready: " + context.Client.BaseUrl + " with " + ready + " Ready worker node(s)");
                    return 0;
                }
                await Task.Delay(1000, token).ConfigureAwait(false);
            }
            Console.Error.WriteLine("Only " + ready + " of " + nodes + " worker nodes became Ready within " + timeoutSeconds + " s.");
            return 1;
        }
    }
}
