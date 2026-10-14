namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Output of an earlier pipeline stage as seen by a later stage's prompt (pipeline.previous and the items of
    /// pipeline.stages, P12.9).
    /// </summary>
    public class CompilationPipelineStage
    {
        #region Public-Members

        /// <summary>
        /// Stage position (position).
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Stage name (stageName).
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
        /// Agent name (agentName).
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
        /// Stage run status, for example Succeeded or Failed (status).
        /// </summary>
        public string Status
        {
            get
            {
                return _Status;
            }
            set
            {
                _Status = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Stage run outcome (outcome).
        /// </summary>
        public string? Outcome { get; set; } = null;

        /// <summary>
        /// Result text, cut to the reading stage's outputCharLimit (output).
        /// </summary>
        public string Output
        {
            get
            {
                return _Output;
            }
            set
            {
                _Output = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether the output was cut (outputTruncated).
        /// </summary>
        public bool OutputTruncated { get; set; } = false;

        /// <summary>
        /// Structured output JSON, or null (structured).
        /// </summary>
        public string? Structured { get; set; } = null;

        /// <summary>
        /// Artifacts the stage run produced (artifacts).
        /// </summary>
        public List<CompilationPipelineArtifact> Artifacts
        {
            get
            {
                return _Artifacts;
            }
            set
            {
                _Artifacts = value ?? new List<CompilationPipelineArtifact>();
            }
        }

        #endregion

        #region Private-Members

        private string _StageName = String.Empty;
        private string _AgentName = String.Empty;
        private string _Status = String.Empty;
        private string _Output = String.Empty;
        private List<CompilationPipelineArtifact> _Artifacts = new List<CompilationPipelineArtifact>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public CompilationPipelineStage()
        {
        }

        #endregion
    }
}
