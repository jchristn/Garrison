namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Start a pipeline. Send an idempotency key through the start method to make a repeated start return the same pipeline run.
    /// </summary>
    public class PipelineStartRequest
    {
        #region Public-Members

        /// <summary>
        /// Input given to every stage as the caller's task. Required.
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
        /// Media type of the input, or null for text/plain.
        /// </summary>
        public string? InputContentType { get; set; } = null;

        /// <summary>
        /// Priority of the stage runs. Default 0.
        /// </summary>
        public int Priority { get; set; } = 0;

        /// <summary>
        /// Wait until the pipeline run ends or waits for a review. Default false.
        /// </summary>
        public bool Wait { get; set; } = false;

        /// <summary>
        /// Most seconds to wait when Wait is true (0 to 600). Default 60.
        /// </summary>
        public int WaitSeconds { get; set; } = 60;

        #endregion

        #region Private-Members

        private string _Input = String.Empty;

        #endregion
    }
}
