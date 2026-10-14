namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// Rendered task prompt of one pipeline stage (P12.9 preview).
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
        /// Deployment used for the preview, or null when none could be chosen.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Deployment name, or null.
        /// </summary>
        public string? DeploymentName { get; set; } = null;

        /// <summary>
        /// Whether the stage compiled.
        /// </summary>
        public bool Success { get; set; } = true;

        /// <summary>
        /// Rendered task prompt the harness would receive (secrets cannot appear in prompts), or null on failure.
        /// </summary>
        public string? Prompt { get; set; } = null;

        /// <summary>
        /// Failure code, or null.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// Failure message, or null.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        #endregion

        #region Private-Members

        private string _StageName = String.Empty;
        private string _AgentName = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelinePreviewStage()
        {
        }

        #endregion
    }
}
