namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Pipeline manifest spec (kind: Pipeline, P12.9). Stages reference agents, deployments, and handoff templates by
    /// name; a template may be pinned with name@version.
    /// </summary>
    public class PipelineSpec
    {
        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Most seconds a pipeline run may take, including review waits; 0 or null means no limit (maximum 2592000).
        /// </summary>
        public int? MaxDurationSeconds { get; set; } = null;

        /// <summary>
        /// Whether the pipeline can be started; null means true.
        /// </summary>
        public bool? Active { get; set; } = null;

        /// <summary>
        /// Stages in run order.
        /// </summary>
        public List<PipelineStageSpec> Stages { get; set; } = new List<PipelineStageSpec>();
    }
}
