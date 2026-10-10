namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// Inputs for compiling a structured output repair: the run is compiled again with the Repair prompt role as the
    /// task prompt and with <c>run.resumeSessionId</c> set so the harness profile resumes the session. Exposed to
    /// templates as <c>repair.error</c>, <c>repair.schema</c>, <c>repair.attempt</c>, <c>repair.sessionId</c>, and
    /// <c>repair.previousOutput</c>.
    /// </summary>
    public class CompilationRepair
    {
        #region Public-Members

        /// <summary>
        /// Validation errors that the repair must fix. Never null.
        /// </summary>
        public string Error
        {
            get
            {
                return _Error;
            }
            set
            {
                _Error = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Harness session to resume. Required.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when the value is null or empty.</exception>
        public string SessionId
        {
            get
            {
                return _SessionId;
            }
            set
            {
                if (String.IsNullOrEmpty(value)) throw new ArgumentNullException(nameof(SessionId));
                _SessionId = value;
            }
        }

        /// <summary>
        /// Repair attempt number, starting at 1. Minimum 1, default 1.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the value is below 1.</exception>
        public int Attempt
        {
            get
            {
                return _Attempt;
            }
            set
            {
                if (value < 1) throw new ArgumentOutOfRangeException(nameof(Attempt), "Attempt must be at least 1.");
                _Attempt = value;
            }
        }

        /// <summary>
        /// The output that failed validation (structured output or result text), or null.
        /// </summary>
        public string? PreviousOutput { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Error = String.Empty;
        private string _SessionId = "session";
        private int _Attempt = 1;

        #endregion
    }
}
