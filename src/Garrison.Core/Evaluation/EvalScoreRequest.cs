namespace Garrison.Core.Evaluation
{
    using System;

    /// <summary>
    /// What a scorer looks at (AA9.4). Not thread-safe.
    /// </summary>
    public class EvalScoreRequest
    {
        #region Public-Members

        /// <summary>
        /// Tenant the scored output belongs to, or null. The judge scorer runs its judge agent in this tenant.
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Input the output answered. Never null.
        /// </summary>
        public string Input
        {
            get
            {
                return _Input;
            }
            set
            {
                _Input = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Output being scored, or null when there was none.
        /// </summary>
        public string? Output { get; set; } = null;

        /// <summary>
        /// What the output is compared with: an eval case's expected text, or a reference output (for example the source
        /// deployment's answer in a shadow trial). Null when there is none.
        /// </summary>
        public string? Reference { get; set; } = null;

        /// <summary>
        /// The check's argument: the expected text or substring for ExactMatch and Contains (overriding Reference), the
        /// JSON Schema for JsonSchemaValid, and the grading criteria for Judge. Null when the check has none.
        /// </summary>
        public string? Argument { get; set; } = null;

        /// <summary>
        /// Stable key for this one scoring, unique within the tenant, or null. The judge scorer uses it as the idempotency
        /// key of its judge run, so scoring the same thing again after a restart reuses the earlier judge run.
        /// </summary>
        public string? CorrelationKey { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Input = String.Empty;

        #endregion
    }
}
