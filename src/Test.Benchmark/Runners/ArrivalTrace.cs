namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text.Json;
    using Garrison.Benchmark.Client;

    /// <summary>Portable, finite open-loop arrival trace. Offsets are milliseconds from the measured window's start.</summary>
    public class ArrivalTrace
    {
        /// <summary>Source label or original input path.</summary>
        public string Source { get; set; } = String.Empty;
        /// <summary>SHA-256 of the source CSV, for provenance.</summary>
        public string SourceSha256 { get; set; } = String.Empty;
        /// <summary>Nonnegative, nondecreasing millisecond offsets. Equal offsets preserve simultaneous bursts.</summary>
        public List<double> OffsetsMs { get; set; } = new List<double>();

        /// <summary>Load and validate a trace without sorting or dropping malformed entries.</summary>
        /// <param name="path">Trace JSON path.</param>
        /// <returns>Validated trace.</returns>
        /// <exception cref="InvalidDataException">Trace is invalid or exceeds one million arrivals.</exception>
        public static ArrivalTrace Load(string path)
        {
            FileInfo file = new FileInfo(path);
            if (file.Length > 64 * 1024 * 1024) throw new InvalidDataException("Arrival trace must be at most 64 MiB.");
            ArrivalTrace trace;
            try { trace = JsonSerializer.Deserialize<ArrivalTrace>(File.ReadAllBytes(path), JsonDefaults.Compact) ?? throw new InvalidDataException("Arrival trace is empty."); }
            catch (JsonException e) { throw new InvalidDataException("Arrival trace is invalid JSON: " + e.Message, e); }
            if (trace.OffsetsMs == null || trace.OffsetsMs.Count == 0 || trace.OffsetsMs.Count > 1000000) throw new InvalidDataException("Arrival trace needs 1 to 1000000 offsets.");
            double prior = 0;
            foreach (double offset in trace.OffsetsMs)
            {
                if (!Double.IsFinite(offset) || offset < prior || offset < 0) throw new InvalidDataException("Arrival offsets must be finite, nonnegative and nondecreasing.");
                prior = offset;
            }
            return trace;
        }
    }
}
