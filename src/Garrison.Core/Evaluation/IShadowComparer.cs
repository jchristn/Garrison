namespace Garrison.Core.Evaluation
{
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>
    /// Compares a shadow run's output with the source run's output for a shadow trial (AA9.7). The default
    /// <see cref="NormalizedTextShadowComparer"/> compares normalized text; an implementation can score with the trial's
    /// comparison eval set or a judge. Implementations must be thread-safe: the trial service calls them concurrently.
    /// </summary>
    public interface IShadowComparer
    {
        /// <summary>
        /// Compare one pair of outputs.
        /// </summary>
        /// <param name="trial">The trial the shadow run belongs to (its ComparisonEvalSetId and UseJudge say how it wants to be compared).</param>
        /// <param name="sourceOutput">The source run's output (structured output JSON when it has one, else its result text), or null.</param>
        /// <param name="candidateOutput">The shadow run's output, chosen the same way, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Whether the outputs agree, with an optional note; never null.</returns>
        /// <exception cref="System.ArgumentNullException">Thrown when trial is null.</exception>
        Task<ShadowComparison> CompareAsync(ShadowTrial trial, string? sourceOutput, string? candidateOutput, CancellationToken token = default);
    }
}
