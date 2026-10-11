namespace Garrison.Benchmark.Stub
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reference;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The stub command: runs the stub dependency (the fake harness, which stands in for Claude Code, Codex, and Mux
    /// at no cost) on its own, for manual testing and to see what the direct arm measures. Harness options are passed
    /// as --harness-args name=value,flag (for example format=claude,delay-ms=20,fail).
    /// </summary>
    public static class StubRunner
    {
        /// <summary>
        /// Run the command.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>0 when every invocation exited 0, 1 otherwise.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<int> RunAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            string? dll = DirectInvoker.Locate(context.Root, context.Args.GetOptional("fake-harness"));
            if (dll == null)
            {
                Console.Error.WriteLine("garrison-fake-harness.dll not found; build src/Garrison.FakeHarness or pass --fake-harness <path>.");
                return 1;
            }
            List<string> arguments = new List<string>();
            foreach (string part in context.Args.GetList("harness-args", "format=claude"))
            {
                int eq = part.IndexOf('=');
                arguments.Add("--" + (eq > 0 ? part.Substring(0, eq) : part));
                if (eq > 0) arguments.Add(part.Substring(eq + 1));
            }
            string input = context.Args.GetString("input", "Hello from the Garrison benchmark stub command.");
            int repeat = context.Args.GetInt("repeat", 5, 1, 10000);
            DirectInvoker invoker = new DirectInvoker(dll);
            List<double> times = new List<double>();
            int failures = 0;
            Console.Out.WriteLine("stub: dotnet " + context.Relative(dll) + " " + String.Join(" ", arguments));
            for (int i = 0; i < repeat; i++)
            {
                DirectResult result = await invoker.RunAsync(arguments, input, 120000, token).ConfigureAwait(false);
                times.Add(result.ElapsedMs);
                if (result.ExitCode != 0 || result.Error != null) failures++;
                Console.Out.WriteLine("  #" + i + ": exit " + result.ExitCode + ", " + ReportWriter.N(result.ElapsedMs, "F1") + " ms, result: " + (result.ResultText ?? result.Error ?? "(none)"));
            }
            LatencyStatistics stats = LatencyStatistics.From(times, repeat > 1 ? context.Resamples : 0, context.Seed);
            Console.Out.WriteLine("wall time ms: p50 " + ReportWriter.N(stats.P50, "F1") + ", p95 " + ReportWriter.N(stats.P95, "F1") + ", mean " + ReportWriter.N(stats.Mean, "F1") + ", max " + ReportWriter.N(stats.Max, "F1"));
            return failures == 0 ? 0 : 1;
        }
    }
}
