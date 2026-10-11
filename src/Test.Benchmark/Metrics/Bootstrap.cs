namespace Garrison.Benchmark.Metrics
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// Percentile bootstrap with a fixed seed. Resampling uses <see cref="Random"/> constructed with an explicit seed,
    /// whose sequence is stable across processes and runtime versions, so the same report always yields the same
    /// interval. Stateless and thread-safe.
    /// </summary>
    public static class Bootstrap
    {
        /// <summary>
        /// Groups smaller than this are marked indicative.
        /// </summary>
        public static readonly int IndicativeBelow = 20;

        /// <summary>
        /// 95% interval for the mean of a sample.
        /// </summary>
        /// <param name="values">Values (for pass or fail probes, 1 and 0).</param>
        /// <param name="resamples">Resamples, 100 to 100000.</param>
        /// <param name="seed">Seed.</param>
        /// <returns>Interval.</returns>
        /// <exception cref="ArgumentNullException">Thrown when values is null.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when resamples is out of range.</exception>
        public static ConfidenceInterval MeanCi(IReadOnlyList<double> values, int resamples, int seed)
        {
            if (values == null) throw new ArgumentNullException(nameof(values));
            if (resamples < 100 || resamples > 100000) throw new ArgumentOutOfRangeException(nameof(resamples));
            ConfidenceInterval ci = new ConfidenceInterval();
            ci.N = values.Count;
            ci.Indicative = values.Count < IndicativeBelow;
            if (values.Count == 0) return ci;
            ci.Estimate = values.Average();
            Random random = new Random(seed);
            double[] means = new double[resamples];
            for (int r = 0; r < resamples; r++)
            {
                double sum = 0;
                for (int i = 0; i < values.Count; i++) sum += values[random.Next(values.Count)];
                means[r] = sum / values.Count;
            }
            Array.Sort(means);
            ci.Lower = means[(int)Math.Floor(0.025 * (resamples - 1))];
            ci.Upper = means[(int)Math.Ceiling(0.975 * (resamples - 1))];
            return ci;
        }

        /// <summary>
        /// 95% interval for a nearest-rank percentile of a sample.
        /// </summary>
        /// <param name="sorted">Ascending samples.</param>
        /// <param name="percentile">Percentile, 0 to 100.</param>
        /// <param name="resamples">Resamples, 100 to 100000.</param>
        /// <param name="seed">Seed.</param>
        /// <returns>Interval.</returns>
        /// <exception cref="ArgumentNullException">Thrown when sorted is null.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when resamples is out of range.</exception>
        public static ConfidenceInterval PercentileCi(IReadOnlyList<double> sorted, double percentile, int resamples, int seed)
        {
            if (sorted == null) throw new ArgumentNullException(nameof(sorted));
            if (resamples < 100 || resamples > 100000) throw new ArgumentOutOfRangeException(nameof(resamples));
            ConfidenceInterval ci = new ConfidenceInterval();
            ci.N = sorted.Count;
            ci.Indicative = sorted.Count < IndicativeBelow;
            if (sorted.Count == 0) return ci;
            ci.Estimate = LatencyStatistics.Percentile(sorted, percentile);
            Random random = new Random(seed);
            double[] estimates = new double[resamples];
            double[] sample = new double[sorted.Count];
            for (int r = 0; r < resamples; r++)
            {
                for (int i = 0; i < sample.Length; i++) sample[i] = sorted[random.Next(sorted.Count)];
                Array.Sort(sample);
                estimates[r] = LatencyStatistics.Percentile(sample, percentile);
            }
            Array.Sort(estimates);
            ci.Lower = estimates[(int)Math.Floor(0.025 * (resamples - 1))];
            ci.Upper = estimates[(int)Math.Ceiling(0.975 * (resamples - 1))];
            return ci;
        }

        /// <summary>
        /// Paired bootstrap of the mean difference (candidate minus baseline) with a two-sided p-value: twice the
        /// share of resampled means on the other side of zero from the observed difference, capped at 1.
        /// </summary>
        /// <param name="baseline">Baseline values, paired by index with candidate.</param>
        /// <param name="candidate">Candidate values.</param>
        /// <param name="resamples">Resamples, 100 to 100000.</param>
        /// <param name="seed">Seed.</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the lists differ in length.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when resamples is out of range.</exception>
        public static PairedDifference PairedDiff(IReadOnlyList<double> baseline, IReadOnlyList<double> candidate, int resamples, int seed)
        {
            if (baseline == null) throw new ArgumentNullException(nameof(baseline));
            if (candidate == null) throw new ArgumentNullException(nameof(candidate));
            if (baseline.Count != candidate.Count) throw new ArgumentException("Paired samples must have the same length.", nameof(candidate));
            List<double> diffs = new List<double>(baseline.Count);
            for (int i = 0; i < baseline.Count; i++) diffs.Add(candidate[i] - baseline[i]);
            ConfidenceInterval ci = MeanCi(diffs, resamples, seed);
            PairedDifference result = new PairedDifference();
            result.Interval = ci;
            if (diffs.Count == 0 || diffs.All(d => d == 0))
            {
                result.PValue = 1.0;
                return result;
            }
            Random random = new Random(seed + 7919);
            int opposite = 0;
            for (int r = 0; r < resamples; r++)
            {
                double sum = 0;
                for (int i = 0; i < diffs.Count; i++) sum += diffs[random.Next(diffs.Count)];
                double mean = sum / diffs.Count;
                if (ci.Estimate >= 0 ? mean <= 0 : mean >= 0) opposite++;
            }
            result.PValue = Math.Min(1.0, 2.0 * opposite / resamples);
            return result;
        }
    }
}
