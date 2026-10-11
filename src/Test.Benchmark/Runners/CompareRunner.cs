namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Globalization;
    using System.IO;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The compare command: the paired, significance-gated regression gate. Prints the comparison, saves it as
    /// &lt;utc&gt;-compare-&lt;kind&gt;-&lt;dataset&gt;.md and .json next to the candidate, and ends with RESULT: regression
    /// or RESULT: no regression.
    /// </summary>
    public static class CompareRunner
    {
        /// <summary>
        /// Run the command.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>0 with no regression, 1 on regression or error, 2 on bad usage.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<int> RunAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            string? baselinePath = context.Args.GetOptional("baseline");
            string? candidatePath = context.Args.GetOptional("candidate");
            if (baselinePath == null || candidatePath == null)
            {
                Console.Error.WriteLine("compare needs --baseline <report.json> and --candidate <report.json>.");
                return 2;
            }
            ComparisonOptions options = Options(context);
            CompareResult result;
            try
            {
                result = await CompareFilesAsync(context, context.ResolvePath(baselinePath), context.ResolvePath(candidatePath), options, null, token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is FileNotFoundException || e is InvalidDataException)
            {
                Console.Error.WriteLine(e.Message);
                return 1;
            }
            return result.Regression ? 1 : 0;
        }

        /// <summary>
        /// Read compare options from the arguments.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <returns>Options.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static ComparisonOptions Options(BenchmarkContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            ComparisonOptions options = new ComparisonOptions();
            options.Tolerance = context.Args.GetDouble("tolerance", 0.01, 0, 1);
            options.Alpha = context.Args.GetDouble("alpha", 0.05, 0.0001, 0.5);
            options.LatencyTolerance = context.Args.GetDouble("latency-tolerance", 0.2, 0, 100);
            options.ThroughputTolerance = context.Args.GetDouble("throughput-tolerance", 0.1, 0, 1);
            options.AllowPartial = context.Args.GetBool("allow-partial", false);
            options.CompareLatency = !context.Args.GetBool("no-latency", false);
            options.Resamples = context.Resamples;
            options.Seed = context.Seed;
            return options;
        }

        /// <summary>
        /// Compare two report files, print the result, and save it next to the candidate (or in outputDirectory).
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="baselinePath">Baseline report.</param>
        /// <param name="candidatePath">Candidate report.</param>
        /// <param name="options">Options.</param>
        /// <param name="outputDirectory">Where to save, or null for the candidate's directory.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result.</returns>
        /// <exception cref="FileNotFoundException">Thrown when a report does not exist.</exception>
        /// <exception cref="InvalidDataException">Thrown when a file is not a report.</exception>
        public static async Task<CompareResult> CompareFilesAsync(BenchmarkContext context, string baselinePath, string candidatePath, ComparisonOptions options, string? outputDirectory, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            BenchmarkReport baseline = ReportWriter.Read(baselinePath);
            BenchmarkReport candidate = ReportWriter.Read(candidatePath);
            CompareResult result = ReportComparer.Compare(baseline, candidate, options);
            result.Baseline = context.Relative(baselinePath);
            result.Candidate = context.Relative(candidatePath);
            string markdown = ReportComparer.Markdown(result);
            Console.Out.WriteLine(markdown);
            string directory = outputDirectory ?? Path.GetDirectoryName(Path.GetFullPath(candidatePath)) ?? context.ResultsDirectory;
            Directory.CreateDirectory(directory);
            string name = result.ComparedUtc.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture) + "-compare-" + candidate.Kind + "-" + candidate.Dataset + (String.IsNullOrEmpty(candidate.Label) ? String.Empty : "-" + candidate.Label);
            await File.WriteAllTextAsync(Path.Combine(directory, name + ".md"), markdown, ReportWriter.Utf8NoBom, token).ConfigureAwait(false);
            await File.WriteAllTextAsync(Path.Combine(directory, name + ".json"), JsonSerializer.Serialize(result, JsonDefaults.Indented), ReportWriter.Utf8NoBom, token).ConfigureAwait(false);
            return result;
        }
    }
}
