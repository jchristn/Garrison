namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A pipeline (P12.9): ordered agent stages with optional human review gates. Each stage runs in its own workspace and receives the earlier stages' results through a PipelineStage prompt template.
    /// </summary>
    public class Pipeline
    {
        #region Public-Members

        /// <summary>
        /// Identifier (ppl_). Assigned by the server.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
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
        /// Name, unique per tenant and DNS-safe. Required.
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
        /// Version; advances on every update. Started pipeline runs keep the version they started with.
        /// </summary>
        public int Version { get; set; } = 1;

        /// <summary>
        /// Most seconds a pipeline run may take, including review waits; 0 means no limit. Default 0.
        /// </summary>
        public int MaxDurationSeconds { get; set; } = 0;

        /// <summary>
        /// Whether the pipeline can be started. Default true.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Protected pipelines cannot be changed or deleted.
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
        /// Ordered stages (at least one).
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

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private List<PipelineStage> _Stages = new List<PipelineStage>();

        #endregion
    }
}
