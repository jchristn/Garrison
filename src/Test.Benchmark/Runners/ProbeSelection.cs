namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Benchmark.Datasets;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Seeded, stratified probe sampling for --limit: probes are shuffled within each type with a seed derived from
    /// the base seed and the type (FNV-1a, never string.GetHashCode), then taken round-robin across types, so a small
    /// run still covers every type. Stateless and thread-safe.
    /// </summary>
    public static class ProbeSelection
    {
        /// <summary>
        /// Select up to limit probes.
        /// </summary>
        /// <param name="probes">Probes in dataset order.</param>
        /// <param name="limit">Most probes; 0 or less keeps all in dataset order.</param>
        /// <param name="seed">Base seed.</param>
        /// <returns>Selected probes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when probes is null.</exception>
        public static List<BenchmarkProbe> Select(IReadOnlyList<BenchmarkProbe> probes, int limit, int seed)
        {
            if (probes == null) throw new ArgumentNullException(nameof(probes));
            if (limit <= 0 || limit >= probes.Count) return probes.ToList();
            List<Queue<BenchmarkProbe>> byType = new List<Queue<BenchmarkProbe>>();
            foreach (IGrouping<string, BenchmarkProbe> type in probes.GroupBy(p => p.Type).OrderBy(g => g.Key, StringComparer.Ordinal))
            {
                List<BenchmarkProbe> list = type.ToList();
                Random random = new Random(StableHash.Seed(seed, type.Key));
                for (int i = list.Count - 1; i > 0; i--)
                {
                    int j = random.Next(i + 1);
                    BenchmarkProbe swap = list[i];
                    list[i] = list[j];
                    list[j] = swap;
                }
                byType.Add(new Queue<BenchmarkProbe>(list));
            }
            List<BenchmarkProbe> selected = new List<BenchmarkProbe>();
            while (selected.Count < limit && byType.Any(q => q.Count > 0))
            {
                foreach (Queue<BenchmarkProbe> queue in byType)
                {
                    if (selected.Count >= limit) break;
                    if (queue.Count > 0) selected.Add(queue.Dequeue());
                }
            }
            HashSet<string> chosen = new HashSet<string>(selected.Select(p => p.Id), StringComparer.Ordinal);
            return probes.Where(p => chosen.Contains(p.Id)).ToList();
        }
    }
}
