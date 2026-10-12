namespace Garrison.Core.Services
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// Calculates USD estimates from operator-configured token rates and explicit cache/reasoning conventions.
    /// Uses decimal arithmetic internally; never contacts a provider or infers model aliases. Thread-safe.
    /// </summary>
    public static class RunCostCalculator
    {
        /// <summary>
        /// Estimate cost for one execution report. Negative token counts are treated as zero. Included cached and
        /// reasoning counts are capped at their input/output totals to avoid charging the same token twice.
        /// Null cache/reasoning rates use the corresponding input/output rate. No rounding is applied.
        /// </summary>
        /// <param name="price">Configured price.</param>
        /// <param name="inputTokens">Reported input tokens.</param>
        /// <param name="outputTokens">Reported output tokens.</param>
        /// <param name="cachedTokens">Reported cache-read tokens.</param>
        /// <param name="reasoningTokens">Reported reasoning tokens.</param>
        /// <returns>Estimated USD.</returns>
        /// <exception cref="ArgumentNullException">Thrown when price is null.</exception>
        public static double Estimate(ModelPrice price, long inputTokens, long outputTokens, long cachedTokens, long reasoningTokens)
        {
            if (price == null) throw new ArgumentNullException(nameof(price));
            long input = Math.Max(0, inputTokens);
            long output = Math.Max(0, outputTokens);
            long cached = Math.Max(0, cachedTokens);
            long reasoning = Math.Max(0, reasoningTokens);
            if (price.InputIncludesCachedTokens)
            {
                cached = Math.Min(cached, input);
                input -= cached;
            }
            if (price.OutputIncludesReasoningTokens)
            {
                reasoning = Math.Min(reasoning, output);
                output -= reasoning;
            }
            decimal cost = (decimal)input * (decimal)price.InputUsdPerMillion
                + (decimal)cached * (decimal)(price.CachedInputUsdPerMillion ?? price.InputUsdPerMillion)
                + (decimal)output * (decimal)price.OutputUsdPerMillion
                + (decimal)reasoning * (decimal)(price.ReasoningUsdPerMillion ?? price.OutputUsdPerMillion);
            return (double)(cost / 1000000m);
        }
    }
}
