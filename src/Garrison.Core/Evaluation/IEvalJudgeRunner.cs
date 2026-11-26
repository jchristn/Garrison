namespace Garrison.Core.Evaluation
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Runs the judge agent for <see cref="JudgeScorer"/> (AA9.4): starts one Garrison run of the judge agent with the
    /// rendered builtin/eval-judge prompt as its input and waits for it to finish. The control plane implements it; tests
    /// supply canned replies. Implementations are thread-safe.
    /// </summary>
    public interface IEvalJudgeRunner
    {
        /// <summary>
        /// Run the judge once and return its reply.
        /// </summary>
        /// <param name="prompt">Judge run input, rendered from the eval-judge template.</param>
        /// <param name="correlationKey">Stable key for this scoring (the run's idempotency key), or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The judge run's identifier, reply, cost, or the error that stopped it.</returns>
        /// <exception cref="ArgumentNullException">Thrown when prompt is null.</exception>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled.</exception>
        Task<EvalJudgeRunResult> RunAsync(string prompt, string? correlationKey, CancellationToken token = default);
    }
}
