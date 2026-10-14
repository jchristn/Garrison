namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Pipeline inputs of a stage run (P12.9), exposed to prompt templates as the pipeline.* root. Built by the
    /// control plane at claim time from the pipeline run snapshot and earlier stage runs; outputs are already cut to the
    /// stage's outputCharLimit. The stage run's Task (or DelegatedTask) prompt renders first as pipeline.task, then the
    /// PipelineStage prompt (the stage's handoff template, else the deployment's PipelineStage binding, else
    /// builtin/pipeline-stage) renders around it.
    /// </summary>
    public class CompilationPipeline
    {
        #region Public-Members

        /// <summary>
        /// Pipeline identifier (pipeline.id).
        /// </summary>
        public string PipelineId
        {
            get
            {
                return _PipelineId;
            }
            set
            {
                _PipelineId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pipeline name (pipeline.name).
        /// </summary>
        public string PipelineName
        {
            get
            {
                return _PipelineName;
            }
            set
            {
                _PipelineName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pipeline run identifier (pipeline.runId).
        /// </summary>
        public string PipelineRunId
        {
            get
            {
                return _PipelineRunId;
            }
            set
            {
                _PipelineRunId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Position of this stage, starting at 1 (pipeline.position).
        /// </summary>
        public int Position { get; set; } = 1;

        /// <summary>
        /// Name of this stage (pipeline.stageName).
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
        /// Number of stages (pipeline.stageCount).
        /// </summary>
        public int StageCount { get; set; } = 1;

        /// <summary>
        /// The stage before this one (pipeline.previous), or null for the first stage (pipeline.hasPrevious is false).
        /// </summary>
        public CompilationPipelineStage? Previous { get; set; } = null;

        /// <summary>
        /// Every earlier stage, oldest first (pipeline.stages).
        /// </summary>
        public List<CompilationPipelineStage> Stages
        {
            get
            {
                return _Stages;
            }
            set
            {
                _Stages = value ?? new List<CompilationPipelineStage>();
            }
        }

        /// <summary>
        /// Notes of the reviewer who approved the previous stage (pipeline.reviewNotes), or null.
        /// </summary>
        public string? ReviewNotes { get; set; } = null;

        /// <summary>
        /// Review feedback when this execution re-runs the stage after RequestChanges (pipeline.revision), or null
        /// (pipeline.isRevision is false).
        /// </summary>
        public CompilationPipelineRevision? Revision { get; set; } = null;

        /// <summary>
        /// Stage handoff template override, or null to use the deployment binding and then builtin/pipeline-stage.
        /// </summary>
        public string? HandoffTemplateId { get; set; } = null;

        /// <summary>
        /// Pinned handoff template version, or null for the current version.
        /// </summary>
        public int? HandoffTemplateVersion { get; set; } = null;

        #endregion

        #region Private-Members

        private string _PipelineId = String.Empty;
        private string _PipelineName = String.Empty;
        private string _PipelineRunId = String.Empty;
        private string _StageName = String.Empty;
        private List<CompilationPipelineStage> _Stages = new List<CompilationPipelineStage>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public CompilationPipeline()
        {
        }

        #endregion
    }
}
