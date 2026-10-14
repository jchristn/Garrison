namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Review feedback for a stage execution that re-runs after RequestChanges (pipeline.revision, P12.9).
    /// </summary>
    public class CompilationPipelineRevision
    {
        #region Public-Members

        /// <summary>
        /// Revision number, starting at 1 (number).
        /// </summary>
        public int Number { get; set; } = 1;

        /// <summary>
        /// Reviewer comment (feedback).
        /// </summary>
        public string Feedback
        {
            get
            {
                return _Feedback;
            }
            set
            {
                _Feedback = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Reviewer display name (reviewer).
        /// </summary>
        public string? Reviewer { get; set; } = null;

        /// <summary>
        /// Output of the reviewed execution, cut to the stage's outputCharLimit (previousOutput).
        /// </summary>
        public string PreviousOutput
        {
            get
            {
                return _PreviousOutput;
            }
            set
            {
                _PreviousOutput = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether the previous output was cut (previousOutputTruncated).
        /// </summary>
        public bool PreviousOutputTruncated { get; set; } = false;

        #endregion

        #region Private-Members

        private string _Feedback = String.Empty;
        private string _PreviousOutput = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public CompilationPipelineRevision()
        {
        }

        #endregion
    }
}
