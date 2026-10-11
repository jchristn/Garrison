namespace Garrison.Benchmark.Runners
{
    using System;
    using System.IO;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Datasets;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The generate command: builds a committed dataset from its committed sources (--kind synthetic or live). The
    /// output is validated before it is written; an invalid dataset is not written.
    /// </summary>
    public static class GenerateRunner
    {
        /// <summary>
        /// Run the command.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>0 when written, 1 on error, 2 on bad usage.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<int> RunAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            string kind = context.Args.GetString("kind", "synthetic");
            string sourcesPath;
            string outputPath;
            BenchmarkDataset dataset;
            try
            {
                if (kind == "synthetic")
                {
                    sourcesPath = context.ResolvePath(context.Args.GetString("sources", "benchmarks/datasets/synthetic/sources.json"));
                    outputPath = context.ResolvePath(context.Args.GetString("out", "benchmarks/datasets/synthetic-fleet.json"));
                    SyntheticSources? sources = JsonSerializer.Deserialize<SyntheticSources>(await File.ReadAllTextAsync(sourcesPath, token).ConfigureAwait(false), JsonDefaults.Compact);
                    if (sources == null) throw new InvalidDataException(sourcesPath + " is empty.");
                    int? agents = context.Args.Has("agents") ? context.Args.GetInt("agents", 200, 1, 100000) : (int?)null;
                    if (agents.HasValue) sources.IngestScale.Agents = agents.Value;
                    dataset = DatasetGenerator.Synthetic(sources);
                }
                else if (kind == "live")
                {
                    sourcesPath = context.ResolvePath(context.Args.GetString("sources", "benchmarks/datasets/live/sources.json"));
                    outputPath = context.ResolvePath(context.Args.GetString("out", "benchmarks/datasets/garrison-live.json"));
                    LiveSources? sources = JsonSerializer.Deserialize<LiveSources>(await File.ReadAllTextAsync(sourcesPath, token).ConfigureAwait(false), JsonDefaults.Compact);
                    if (sources == null) throw new InvalidDataException(sourcesPath + " is empty.");
                    dataset = DatasetGenerator.Live(sources, context.Root);
                }
                else
                {
                    Console.Error.WriteLine("--kind must be synthetic or live.");
                    return 2;
                }
            }
            catch (Exception e) when (e is IOException || e is JsonException || e is InvalidDataException || e is ArgumentException)
            {
                Console.Error.WriteLine("generate failed: " + e.Message);
                return 1;
            }

            System.Collections.Generic.List<ValidationIssue> issues = DatasetValidator.Validate(dataset);
            if (issues.Count > 0)
            {
                Console.Error.WriteLine("The generated dataset is invalid; nothing was written:");
                foreach (ValidationIssue issue in issues) Console.Error.WriteLine("  " + issue);
                return 1;
            }
            await File.WriteAllTextAsync(outputPath, DatasetGenerator.Serialize(dataset), ReportWriter.Utf8NoBom, token).ConfigureAwait(false);
            LoadedDataset written = DatasetLoader.Load(outputPath);
            BenchmarkContext.Log("wrote " + context.Relative(outputPath) + " (" + dataset.Corpora.Count + " corpora, sha256 " + written.Sha256 + ")");
            return 0;
        }
    }
}
