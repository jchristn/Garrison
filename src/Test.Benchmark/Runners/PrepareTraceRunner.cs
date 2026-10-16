namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Globalization;
    using System.IO;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Datasets;

    /// <summary>Prepare finite arrival traces from offsetMs,count CSV without contacting a server.</summary>
    public static class PrepareTraceRunner
    {
        /// <summary>Convert ordered timestamp/count CSV to a trace, preserving simultaneous bursts.</summary>
        /// <param name="context">Arguments.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Zero on success; invalid input fails before writing output.</returns>
        public static async Task<int> RunAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            string inputOption = context.Args.GetString("input", String.Empty);
            if (String.IsNullOrWhiteSpace(inputOption)) throw new ArgumentException("prepare-trace requires --input with an offsetMs,count CSV file.");
            string input = context.ResolvePath(inputOption);
            string output = context.ResolvePath(context.Args.GetString("output", "benchmarks/.run/arrival-trace.json"));
            double scale = context.Args.GetDouble("time-scale", 1, 0.000001, 1000000);
            int maximum = context.Args.GetInt("max-arrivals", 1000000, 1, 1000000);
            if (new FileInfo(input).Length > 64 * 1024 * 1024) throw new InvalidDataException("Source CSV must be at most 64 MiB; select a trace window first.");
            byte[] bytes = await File.ReadAllBytesAsync(input, token).ConfigureAwait(false);
            ArrivalTrace trace = new ArrivalTrace { Source = input, SourceSha256 = DatasetLoader.Sha256Hex(bytes) };
            string[] lines = Encoding.UTF8.GetString(bytes).Split('\n');
            double prior = 0;
            for (int row = 0; row < lines.Length; row++)
            {
                token.ThrowIfCancellationRequested();
                string line = lines[row].Trim().TrimStart('\uFEFF');
                if (line.Length == 0 || line.StartsWith("#", StringComparison.Ordinal)) continue;
                string[] cells = line.Split(',');
                if (cells[0].Equals("offsetMs", StringComparison.OrdinalIgnoreCase)) continue;
                if (cells.Length < 1 || cells.Length > 2 || !Double.TryParse(cells[0], NumberStyles.Float, CultureInfo.InvariantCulture, out double offset) || !Double.IsFinite(offset) || offset < prior || offset < 0)
                    throw new InvalidDataException("Trace row " + (row + 1) + " needs a nonnegative, ordered offsetMs and optional count.");
                int count = 1;
                if (cells.Length == 2 && (!Int32.TryParse(cells[1].Trim(), NumberStyles.None, CultureInfo.InvariantCulture, out count) || count < 0))
                    throw new InvalidDataException("Trace row " + (row + 1) + " count must be a nonnegative integer.");
                if (count > maximum - trace.OffsetsMs.Count) throw new InvalidDataException("Trace exceeds --max-arrivals.");
                double scaled = offset * scale;
                if (!Double.IsFinite(scaled)) throw new InvalidDataException("Scaled trace offset exceeds the supported range.");
                for (int index = 0; index < count; index++) trace.OffsetsMs.Add(scaled);
                prior = offset;
            }
            if (trace.OffsetsMs.Count == 0) throw new InvalidDataException("Trace has no arrivals.");
            Directory.CreateDirectory(Path.GetDirectoryName(output)!);
            await File.WriteAllTextAsync(output, JsonSerializer.Serialize(trace, JsonDefaults.Indented), token).ConfigureAwait(false);
            BenchmarkContext.Log("Prepared " + trace.OffsetsMs.Count + " arrivals; source SHA-256 " + trace.SourceSha256 + "; output " + output);
            return 0;
        }
    }
}
