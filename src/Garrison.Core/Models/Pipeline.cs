namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// An ordered list of agent stages run one after another, each optionally gated by a human review (P12.9).
    /// Tenant-scoped. Each stage hands its result text, structured output, and artifact references to the next stage through
    /// the PipelineStage prompt template; stages never share a workspace. Editing a pipeline bumps its version and never
    /// changes pipeline runs already started (each run keeps a snapshot of the stages).
    /// </summary>
    public class Pipeline
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix ppl_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewPipelineId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Name, unique per tenant: 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Optional description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Definition version, starting at 1 and increased by every change. Pipeline runs record the version they started from.
        /// </summary>
        public int Version { get; set; } = 1;

        /// <summary>
        /// Most seconds a pipeline run may take from start to finish, including time waiting for reviews. 0 (the default)
        /// means no limit; minimum 0, maximum 2592000 (30 days). A pipeline run past it ends TimedOut.
        /// </summary>
        public int MaxDurationSeconds { get; set; } = 0;

        /// <summary>
        /// Whether the pipeline can be started. Default true.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Whether the pipeline is protected from changes and deletion. Default false.
        /// </summary>
        public bool IsProtected { get; set; } = false;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Stages in run order (positions 1 to N). At least one, at most the cluster setting Runtime.PipelineMaxStages
        /// (default 20).
        /// </summary>
        public List<PipelineStage> Stages
        {
            get
            {
                return _Stages;
            }
            set
            {
                _Stages = value ?? new List<PipelineStage>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewPipelineId();
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private List<PipelineStage> _Stages = new List<PipelineStage>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public Pipeline()
        {
        }

        #endregion
    }
}
