namespace Garrison.Core.Evaluation
{
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Compares a shadow run's output with the source run's output for a shadow trial (AA9.7). The default
    /// <see cref="NormalizedTextShadowComparer"/> compares normalized text; the control plane's comparer scores with the
    /// trial's comparison eval set and its judge. Implementations must be thread-safe: the trial service calls them
    /// concurrently.
    /// </summary>
    public interface IShadowComparer
    {
        /// <summary>
        /// Compare one pair of outputs.
        /// </summary>
        /// <param name="request">The trial, the input, and both outputs.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Whether the outputs agree, with an optional note; never null.</returns>
        /// <exception cref="System.ArgumentNullException">Thrown when request is null.</exception>
        Task<ShadowComparison> CompareAsync(ShadowComparisonRequest request, CancellationToken token = default);
    }
}
