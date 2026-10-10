namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Machine-readable payload stored in the raw JSON of the Warning run event written each time a run's output fails
    /// validation against the agent's output schema.
    /// </summary>
    public class SchemaValidationNotice
    {
        #region Public-Members

        /// <summary>
        /// Notice kind written by Garrison.
        /// </summary>
        public static string KindName
        {
            get
            {
                return "SchemaValidationFailed";
            }
        }

        /// <summary>
        /// Notice kind. Garrison writes <see cref="KindName"/>.
        /// </summary>
        public string Notice
        {
            get
            {
                return _Notice;
            }
            set
            {
                _Notice = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Execution that failed: 0 for the original execution, 1 for the repair.
        /// </summary>
        public int RepairAttempt { get; set; } = 0;

        /// <summary>
        /// Where the validated document came from: structuredOutput, resultText, or null.
        /// </summary>
        public string? Source { get; set; } = null;

        /// <summary>
        /// The first few validation errors. Never null.
        /// </summary>
        public List<string> Errors
        {
            get
            {
                return _Errors;
            }
            set
            {
                _Errors = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Total number of validation errors found.
        /// </summary>
        public int TotalErrors { get; set; } = 0;

        /// <summary>
        /// Whether a repair attempt was started after this failure.
        /// </summary>
        public bool RepairStarted { get; set; } = false;

        /// <summary>
        /// Why no repair was started, or null when one was.
        /// </summary>
        public string? NoRepairReason { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Notice = String.Empty;
        private List<string> _Errors = new List<string>();

        #endregion
    }
}
