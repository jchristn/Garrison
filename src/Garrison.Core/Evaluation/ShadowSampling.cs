namespace Garrison.Core.Evaluation
{
    using System;
    using System.Buffers.Binary;
    using System.Security.Cryptography;
    using System.Text;
    using Garrison.Core.Models;

    /// <summary>
    /// Sampling and linking rules for shadow runs (AA9.7). The sample decision is a hash of the trial and source run, so
    /// every replica that sees the source run finish makes the same choice, and the shadow run's idempotency key names its
    /// source run, so a source run is copied at most once per trial. Thread-safe.
    /// </summary>
    public static class ShadowSampling
    {
        #region Public-Members

        /// <summary>
        /// Prefix of every shadow run's idempotency key: shadow:{trialId}:{sourceRunId}.
        /// </summary>
        public static readonly string KeyPrefix = "shadow:";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a source run falls in the trial's sample. Deterministic for a trial and run.
        /// </summary>
        /// <param name="trialId">Trial identifier.</param>
        /// <param name="sourceRunId">Source run identifier.</param>
        /// <param name="samplePercent">Percent of runs sampled, 1 to 100 (values outside are clamped).</param>
        /// <returns>True when the run is sampled; always true at 100.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an identifier is null or empty.</exception>
        public static bool Sampled(string trialId, string sourceRunId, int samplePercent)
        {
            if (String.IsNullOrEmpty(trialId)) throw new ArgumentNullException(nameof(trialId));
            if (String.IsNullOrEmpty(sourceRunId)) throw new ArgumentNullException(nameof(sourceRunId));
            int percent = Math.Clamp(samplePercent, 1, 100);
            if (percent >= 100) return true;
            byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(trialId + ":" + sourceRunId));
            uint bucket = BinaryPrimitives.ReadUInt32BigEndian(hash) % 100U;
            return bucket < (uint)percent;
        }

        /// <summary>
        /// The idempotency key of the shadow run that copies a source run for a trial.
        /// </summary>
        /// <param name="trialId">Trial identifier.</param>
        /// <param name="sourceRunId">Source run identifier.</param>
        /// <returns>Key.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an identifier is null or empty.</exception>
        public static string IdempotencyKey(string trialId, string sourceRunId)
        {
            if (String.IsNullOrEmpty(trialId)) throw new ArgumentNullException(nameof(trialId));
            if (String.IsNullOrEmpty(sourceRunId)) throw new ArgumentNullException(nameof(sourceRunId));
            return KeyPrefix + trialId + ":" + sourceRunId;
        }

        /// <summary>
        /// The source run a shadow run copies, read from its idempotency key.
        /// </summary>
        /// <param name="shadowRun">Shadow run.</param>
        /// <returns>Source run identifier, or null when the run is not a shadow copy.</returns>
        /// <exception cref="ArgumentNullException">Thrown when shadowRun is null.</exception>
        public static string? SourceRunId(Run shadowRun)
        {
            if (shadowRun == null) throw new ArgumentNullException(nameof(shadowRun));
            if (String.IsNullOrEmpty(shadowRun.ShadowTrialId) || String.IsNullOrEmpty(shadowRun.IdempotencyKey)) return null;
            string prefix = KeyPrefix + shadowRun.ShadowTrialId + ":";
            if (!shadowRun.IdempotencyKey.StartsWith(prefix, StringComparison.Ordinal)) return null;
            string id = shadowRun.IdempotencyKey.Substring(prefix.Length);
            return id.Length > 0 ? id : null;
        }

        /// <summary>
        /// The output a comparison reads from a run: its structured output JSON when it has one, else its result text.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <returns>Output, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public static string? Output(Run run)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            return !String.IsNullOrWhiteSpace(run.StructuredOutputJson) ? run.StructuredOutputJson : run.ResultText;
        }

        #endregion
    }
}
