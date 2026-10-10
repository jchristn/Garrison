namespace Garrison.Server.Runtime
{
    using System;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Result of checking a successful execution's output against the agent's output schema, with the repair decision.
    /// </summary>
    public class StructuredOutputCheck
    {
        #region Public-Members

        /// <summary>
        /// Agent whose output schema was used.
        /// </summary>
        public Agent Agent
        {
            get
            {
                return _Agent;
            }
            set
            {
                _Agent = value ?? throw new ArgumentNullException(nameof(Agent));
            }
        }

        /// <summary>
        /// Validation result.
        /// </summary>
        public OutputSchemaValidationResult Validation
        {
            get
            {
                return _Validation;
            }
            set
            {
                _Validation = value ?? throw new ArgumentNullException(nameof(Validation));
            }
        }

        /// <summary>
        /// Whether a repair attempt may start (only meaningful when validation failed).
        /// </summary>
        public bool CanRepair { get; set; } = false;

        /// <summary>
        /// Why no repair may start, or null when one may.
        /// </summary>
        public string? NoRepairReason { get; set; } = null;

        #endregion

        #region Private-Members

        private Agent _Agent = new Agent();
        private OutputSchemaValidationResult _Validation = new OutputSchemaValidationResult();

        #endregion
    }
}
