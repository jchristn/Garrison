namespace Test.Automated
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Test.Shared;
    using Test.Shared.Infrastructure;
    using Touchstone.Cli;
    using Touchstone.Core;

    /// <summary>
    /// Console runner for the Garrison shared suites.
    /// </summary>
    public static class Program
    {
        /// <summary>
        /// Entry point. Supports --results &lt;path&gt; to export JSON results, --providers sqlite,postgresql, and
        /// --suites prefix1,prefix2 to run only suites whose identifier starts with one of the prefixes.
        /// --executor-conformance-manifests writes credential-free Kubernetes conformance fixtures to a directory.
        /// --event-insert-benchmark emits CSV for P10.22; --benchmark-events (default 1000) and --benchmark-rounds (default 3) adjust its workload.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <returns>Exit code: 0 when every test passed.</returns>
        public static async Task<int> Main(string[] args)
        {
            string? resultsPath = null;
            string? conformanceDirectory = null;
            List<string> prefixes = new List<string>();
            bool eventBenchmark = false;
            int benchmarkEvents = 1000;
            int benchmarkRounds = 3;
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "--executor-conformance-manifests" && i + 1 < args.Length) conformanceDirectory = args[i + 1];
                if (args[i] == "--event-insert-benchmark") eventBenchmark = true;
                if (args[i] == "--benchmark-events" && i + 1 < args.Length) benchmarkEvents = Int32.Parse(args[i + 1], System.Globalization.CultureInfo.InvariantCulture);
                if (args[i] == "--benchmark-rounds" && i + 1 < args.Length) benchmarkRounds = Int32.Parse(args[i + 1], System.Globalization.CultureInfo.InvariantCulture);
                if (args[i] == "--results" && i + 1 < args.Length) resultsPath = args[i + 1];
                if (args[i] == "--providers" && i + 1 < args.Length) Environment.SetEnvironmentVariable("GARRISON_TEST_PROVIDERS", args[i + 1]);
                if (args[i] == "--suites" && i + 1 < args.Length) prefixes.AddRange(args[i + 1].Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
            }

            if (args.Contains("--telemetry-collector-conformance"))
            {
                using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromMinutes(2)))
                    Console.WriteLine(await TelemetryCollectorConformance.RunAsync(
                        Environment.GetEnvironmentVariable("GARRISON_TEST_OTLP_ENDPOINT") ?? "http://127.0.0.1:14317",
                        Environment.GetEnvironmentVariable("GARRISON_TEST_PROMETHEUS_URL") ?? "http://127.0.0.1:39090",
                        Environment.GetEnvironmentVariable("GARRISON_TEST_TEMPO_URL") ?? "http://127.0.0.1:39200",
                        Int32.Parse(Environment.GetEnvironmentVariable("GARRISON_TEST_METRICS_PORT") ?? "39464"), timeout.Token).ConfigureAwait(false));
                return 0;
            }

            if (args.Contains("--clutch-conformance"))
            {
                string endpoint = Environment.GetEnvironmentVariable("GARRISON_TEST_CLUTCH_ENDPOINT") ?? throw new InvalidOperationException("A temporary Clutch endpoint is required.");
                string access = Environment.GetEnvironmentVariable("GARRISON_TEST_CLUTCH_ACCESS_KEY") ?? "clutch-default-access-key";
                using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromMinutes(2)))
                    await ClutchLeaseConformance.RunAsync(endpoint, access, timeout.Token).ConfigureAwait(false);
                Console.WriteLine("PASS Clutch contention, explicit renewal/expiry, disconnect fencing, outage, and database default.");
                return 0;
            }

            if (args.Contains("--artifact-s3-conformance"))
            {
                string endpoint = Environment.GetEnvironmentVariable("GARRISON_TEST_S3_ENDPOINT") ?? throw new InvalidOperationException("A temporary S3 endpoint is required.");
                string access = Environment.GetEnvironmentVariable("GARRISON_TEST_S3_ACCESS_KEY") ?? "default";
                string secret = Environment.GetEnvironmentVariable("GARRISON_TEST_S3_SECRET_KEY") ?? "default";
                string bucket = Environment.GetEnvironmentVariable("GARRISON_TEST_S3_BUCKET") ?? "default";
                string region = Environment.GetEnvironmentVariable("GARRISON_TEST_S3_REGION") ?? "us-west-1";
                using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromMinutes(2)))
                    await Test.Shared.Suites.ArtifactSuite.S3ConformanceAsync(endpoint, access, secret, bucket, region, timeout.Token).ConfigureAwait(false);
                Console.WriteLine("PASS S3 worker collection, signed downloads, ticket scope, and deletion.");
                using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromMinutes(2)))
                    await Test.Shared.Suites.AssetSuite.S3ConformanceAsync(endpoint, access, secret, bucket, region, timeout.Token).ConfigureAwait(false);
                Console.WriteLine("PASS S3 agent asset storage under .garrison-assets/, verified reads, and deletion.");
                return 0;
            }

            if (args.Contains("--warm-conformance"))
            {
                string kubeconfig = Environment.GetEnvironmentVariable("GARRISON_CONFORMANCE_KUBECONFIG") ?? throw new InvalidOperationException("A temporary kubeconfig is required.");
                string image = Environment.GetEnvironmentVariable("GARRISON_CONFORMANCE_IMAGE") ?? "garrison-worker:warm-test";
                using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromMinutes(10)))
                    Console.WriteLine(await WarmPodConformance.RunAsync(kubeconfig, image, timeout.Token).ConfigureAwait(false));
                return 0;
            }

            if (conformanceDirectory != null)
            {
                await ExecutorConformanceManifests.WriteAsync(conformanceDirectory).ConfigureAwait(false);
                return 0;
            }

            if (eventBenchmark)
            {
                Console.Write(await RunEventInsertBenchmark.RunAsync(benchmarkEvents, benchmarkRounds, CancellationToken.None).ConfigureAwait(false));
                return 0;
            }

            IReadOnlyList<TestSuiteDescriptor> suites = GarrisonSuites.All;
            if (prefixes.Count > 0) suites = suites.Where(s => prefixes.Any(p => s.SuiteId.StartsWith(p, StringComparison.OrdinalIgnoreCase))).ToList();
            return await ConsoleRunner.RunAsync(suites, resultsPath: resultsPath).ConfigureAwait(false);
        }
    }
}
