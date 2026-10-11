namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using Garrison.Benchmark.Datasets;

    /// <summary>
    /// The validate command: checks dataset files against the schema and their own internal consistency.
    /// </summary>
    public static class ValidateRunner
    {
        /// <summary>
        /// Run the command. Without --dataset, every *.json directly under benchmarks/datasets is validated.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <returns>0 when every dataset is valid, 1 otherwise.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static int Run(BenchmarkContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            string? given = context.Args.GetOptional("dataset");
            List<string> paths = given != null
                ? given.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Select(context.ResolvePath).ToList()
                : Directory.GetFiles(Path.Combine(context.Root, "benchmarks", "datasets"), "*.json").OrderBy(p => p, StringComparer.Ordinal).ToList();
            if (paths.Count == 0)
            {
                Console.Error.WriteLine("No datasets found.");
                return 1;
            }
            int invalid = 0;
            foreach (string path in paths)
            {
                LoadedDataset loaded;
                try
                {
                    loaded = DatasetLoader.Load(path);
                }
                catch (Exception e) when (e is FileNotFoundException || e is InvalidDataException)
                {
                    Console.Error.WriteLine("INVALID " + context.Relative(path) + ": " + e.Message);
                    invalid++;
                    continue;
                }
                List<ValidationIssue> issues = DatasetValidator.Validate(loaded.Dataset);
                int items = loaded.Dataset.Corpora.Sum(c => c.Items.Count);
                int probes = loaded.Dataset.Corpora.Sum(c => c.Probes.Count);
                int negatives = loaded.Dataset.Corpora.Sum(c => c.Probes.Count(p => p.Negative));
                string summary = loaded.Dataset.Name + " (" + loaded.Dataset.Tier + "): " + loaded.Dataset.Corpora.Count + " corpora, " + items + " items, " + probes + " probes (" + negatives + " negative), sha256 " + loaded.Sha256;
                if (issues.Count == 0)
                {
                    Console.Out.WriteLine("ok      " + context.Relative(path) + "  " + summary);
                    continue;
                }
                invalid++;
                Console.Out.WriteLine("INVALID " + context.Relative(path) + "  " + summary);
                foreach (ValidationIssue issue in issues) Console.Out.WriteLine("  " + issue);
            }
            return invalid == 0 ? 0 : 1;
        }
    }
}
