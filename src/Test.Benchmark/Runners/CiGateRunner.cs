namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The ci-gate command: runs the deterministic subset (dataset validation, routing correctness, end-to-end
    /// correctness with the direct arm, and ingest correctness, on the synthetic and live datasets), then compares each
    /// report with its committed baseline in benchmarks/baselines/ with latency excluded. --update writes new
    /// baselines instead. Previous gate outputs (JSON and Markdown) are removed first.
    /// </summary>
    public static class CiGateRunner
    {
        #region Public-Methods

        /// <summary>
        /// Run the command.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>0 when nothing regressed, 1 on regression or error, 3 when a run was incomplete.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<int> RunAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            bool update = context.Args.GetBool("update", false);
            string baselines = context.ResolvePath(context.Args.GetString("baselines-dir", "benchmarks/baselines"));
            string url = context.Client.BaseUrl;
            string? adminKey = context.Args.GetOptional("admin-key", "GARRISON_BENCH_ADMIN_KEY");
            string stack = context.Stack;
            List<string> only = context.Args.GetList("jobs", String.Empty);

            Directory.CreateDirectory(context.ResultsDirectory);
            foreach (string old in Directory.GetFiles(context.ResultsDirectory, "*-ci-gate.*")) File.Delete(old);

            BenchmarkContext.Log("ci-gate: validating datasets");
            using (BenchmarkContext validate = Child(context, new List<string> { "validate" }, url, adminKey, stack))
            {
                if (ValidateRunner.Run(validate) != 0) return 1;
            }

            List<GateJob> jobs = new List<GateJob>
            {
                new GateJob("routing", "synthetic-fleet", new List<string> { "routing", "--dataset", "benchmarks/datasets/synthetic-fleet.json", "--deterministic", "true" }),
                new GateJob("e2e", "synthetic-fleet", new List<string> { "e2e", "--dataset", "benchmarks/datasets/synthetic-fleet.json", "--deterministic", "true", "--repeat", "1", "--warmup", "1" }),
                new GateJob("ingest", "synthetic-fleet", new List<string> { "ingest", "--dataset", "benchmarks/datasets/synthetic-fleet.json", "--deterministic", "true", "--batch-size", "100" }),
                new GateJob("e2e", "garrison-live", new List<string> { "e2e", "--dataset", "benchmarks/datasets/garrison-live.json", "--corpus", "live-e2e", "--deterministic", "true", "--repeat", "1", "--warmup", "0" }),
                new GateJob("ingest", "garrison-live", new List<string> { "ingest", "--dataset", "benchmarks/datasets/garrison-live.json", "--corpus", "live-ingest", "--deterministic", "true" }),
            };

            int exit = 0;
            List<string> summary = new List<string>();
            foreach (GateJob job in jobs.Where(j => only.Count == 0 || only.Contains(j.Kind + "-" + j.Dataset)))
            {
                token.ThrowIfCancellationRequested();
                BenchmarkContext.Log("ci-gate: " + job.Kind + " " + job.Dataset);
                int code;
                using (BenchmarkContext child = Child(context, job.Arguments, url, adminKey, stack))
                {
                    code = await Program.DispatchAsync(child, token).ConfigureAwait(false);
                }
                string? report = Directory.GetFiles(context.ResultsDirectory, "*-" + job.Kind + "-" + job.Dataset + "-ci-gate.json").OrderByDescending(f => f, StringComparer.Ordinal).FirstOrDefault();
                if (report == null)
                {
                    summary.Add(job.Kind + " " + job.Dataset + ": no report (exit " + code + ")");
                    exit = Math.Max(exit, code == 0 ? 1 : code);
                    continue;
                }
                if (code == 3)
                {
                    summary.Add(job.Kind + " " + job.Dataset + ": INCOMPLETE");
                    exit = 3;
                    continue;
                }
                string baseline = Path.Combine(baselines, "ci-" + job.Kind + "-" + job.Dataset + ".json");
                if (update)
                {
                    WriteBaseline(report, baseline, context.Root);
                    summary.Add(job.Kind + " " + job.Dataset + ": baseline updated (" + context.Relative(baseline) + ")");
                    continue;
                }
                if (!File.Exists(baseline))
                {
                    summary.Add(job.Kind + " " + job.Dataset + ": no committed baseline at " + context.Relative(baseline) + "; run ci-gate --update");
                    exit = Math.Max(exit, 1);
                    continue;
                }
                ComparisonOptions options = CompareRunner.Options(context);
                options.CompareLatency = false;
                CompareResult result = await CompareRunner.CompareFilesAsync(context, baseline, report, options, context.ResultsDirectory, token).ConfigureAwait(false);
                summary.Add(job.Kind + " " + job.Dataset + ": " + (result.Regression ? "REGRESSION" : "no regression"));
                if (result.Regression && exit == 0) exit = 1;
            }
            foreach (string line in summary) BenchmarkContext.Log("ci-gate: " + line);
            Console.Out.WriteLine(exit == 0 ? "RESULT: no regression" : (exit == 3 ? "RESULT: incomplete" : "RESULT: regression"));
            return exit;
        }

        #endregion

        #region Private-Methods

        private static BenchmarkContext Child(BenchmarkContext parent, List<string> arguments, string url, string? adminKey, string stack)
        {
            List<string> args = new List<string>(arguments);
            args.AddRange(new string[] { "--url", url, "--stack", stack, "--label", "ci-gate", "--results-dir", parent.ResultsDirectory, "--seed", parent.Seed.ToString(System.Globalization.CultureInfo.InvariantCulture) });
            if (!String.IsNullOrEmpty(adminKey))
            {
                args.Add("--admin-key");
                args.Add(adminKey);
            }
            string? fake = parent.Args.GetOptional("fake-harness");
            if (fake != null && arguments[0] == "e2e")
            {
                args.Add("--fake-harness");
                args.Add(fake);
            }
            string? note = parent.Args.GetOptional("shared-note");
            if (note != null && arguments[0] != "validate")
            {
                args.Add("--shared-note");
                args.Add(note);
            }
            return new BenchmarkContext(new BenchmarkArguments(args.ToArray()));
        }

        private static void WriteBaseline(string reportPath, string baselinePath, string root)
        {
            // Absolute paths name the machine's user and layout; committed baselines use <repo> instead.
            string text = File.ReadAllText(reportPath).Replace(JsonEncodedText.Encode(root).ToString(), "<repo>", StringComparison.Ordinal).Replace(root, "<repo>", StringComparison.Ordinal);
            BenchmarkReport report = JsonSerializer.Deserialize<BenchmarkReport>(text, JsonDefaults.Compact) ?? throw new InvalidDataException(reportPath + " is not a report.");
            // Committed baselines carry no private host or machine names.
            report.Provenance.MachineName = "scrubbed";
            report.Provenance.SutUrl = "http://127.0.0.1 (bench stack)";
            report.Provenance.SharedMachine = null;
            Directory.CreateDirectory(Path.GetDirectoryName(baselinePath)!);
            File.WriteAllText(baselinePath, JsonSerializer.Serialize(report, JsonDefaults.Indented) + "\n", ReportWriter.Utf8NoBom);
            File.WriteAllText(Path.ChangeExtension(baselinePath, ".md"), ReportWriter.Markdown(report), ReportWriter.Utf8NoBom);
        }

        #endregion
    }
}
