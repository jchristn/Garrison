namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// The rendered prompt of one pipeline stage, or why it could not be rendered.
    /// </summary>
    public class PipelinePreviewStage
    {
        #region Public-Members

        /// <summary>
        /// Stage position.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Stage name.
        /// </summary>
        public string StageName
        {
            get
            {
                return _StageName;
            }
            set
            {
                _StageName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Agent name.
        /// </summary>
        public string AgentName
        {
            get
            {
                return _AgentName;
            }
            set
            {
                _AgentName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Deployment used for the preview, or null.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Deployment name, or null.
        /// </summary>
        public string? DeploymentName { get; set; } = null;

        /// <summary>
        /// Whether the prompt rendered.
        /// </summary>
        public bool Success { get; set; } = true;

        /// <summary>
        /// Rendered prompt with secrets redacted, or null.
        /// </summary>
        public string? Prompt { get; set; } = null;

        /// <summary>
        /// Error code when it did not render, or null.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// Error message when it did not render, or null.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        #endregion

        #region Private-Members

        private string _StageName = String.Empty;
        private string _AgentName = String.Empty;

        #endregion
    }
}
