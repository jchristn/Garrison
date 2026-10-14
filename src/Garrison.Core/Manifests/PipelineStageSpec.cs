namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// One stage of a Pipeline manifest (P12.9). Null numeric fields take the stage defaults.
    /// </summary>
    public class PipelineStageSpec
    {
        /// <summary>
        /// Stage name, unique within the pipeline.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string Agent { get; set; } = String.Empty;

        /// <summary>
        /// Deployment name, or null for the agent's weighted deployment selection.
        /// </summary>
        public string? Deployment { get; set; } = null;

        /// <summary>
        /// Handoff (PipelineStage) Task template name, optionally pinned as name@version, or null.
        /// </summary>
        public string? HandoffTemplate { get; set; } = null;

        /// <summary>
        /// Most characters of each earlier output rendered into the prompt (1000 to 200000, default 16000).
        /// </summary>
        public int? OutputCharLimit { get; set; } = null;

        /// <summary>
        /// Executions before a failure counts (1 to 5, default 1).
        /// </summary>
        public int? MaxAttempts { get; set; } = null;

        /// <summary>
        /// Whether the pipeline continues after this stage fails (default false).
        /// </summary>
        public bool? ContinueOnFailure { get; set; } = null;

        /// <summary>
        /// Whether a person reviews the stage result (default false).
        /// </summary>
        public bool? RequiresReview { get; set; } = null;

        /// <summary>
        /// Review timeout in seconds; 0 or null waits indefinitely.
        /// </summary>
        public int? ReviewTimeoutSeconds { get; set; } = null;

        /// <summary>
        /// Decision applied when the review times out: Approve or Reject (default Reject).
        /// </summary>
        public PipelineReviewDecisionEnum? ReviewTimeoutAction { get; set; } = null;

        /// <summary>
        /// Most RequestChanges decisions (0 to 10, default 3).
        /// </summary>
        public int? MaxRevisions { get; set; } = null;

        /// <summary>
        /// Run parameter overrides (allowed run overrides of the named deployment).
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();
    }
}
