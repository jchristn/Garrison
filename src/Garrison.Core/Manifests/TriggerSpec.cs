namespace Garrison.Core.Manifests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Trigger manifest spec (kind: Trigger, P12.5). The agent, deployment, pipeline, and input template are referenced by
    /// name. A webhook signing secret is never exported; a document may set signingSecret only when the apply allows
    /// secret values, and a new webhook trigger without one gets a generated secret that is read by rotating it.
    /// Applied triggers run as the principal that applied the manifest.
    /// </summary>
    public class TriggerSpec
    {
        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Cron or Webhook; null means Cron. Cannot change after creation.
        /// </summary>
        public TriggerTypeEnum? Type { get; set; } = null;

        /// <summary>
        /// Agent name (runs an agent). Exactly one of agent and pipeline.
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// Optional deployment name of the agent to pin runs to.
        /// </summary>
        public string? Deployment { get; set; } = null;

        /// <summary>
        /// Pipeline name (starts a pipeline run). Exactly one of agent and pipeline.
        /// </summary>
        public string? Pipeline { get; set; } = null;

        /// <summary>
        /// Input prompt template name (a Task template); null uses builtin/trigger-input.
        /// </summary>
        public string? InputTemplate { get; set; } = null;

        /// <summary>
        /// Run priority (-100 to 100); null means 0.
        /// </summary>
        public int? Priority { get; set; } = null;

        /// <summary>
        /// Five-field cron expression (Cron triggers).
        /// </summary>
        public string? Cron { get; set; } = null;

        /// <summary>
        /// IANA time zone of the cron expression; null means UTC.
        /// </summary>
        public string? TimeZone { get; set; } = null;

        /// <summary>
        /// Whether the trigger fires; null means true.
        /// </summary>
        public bool? Active { get; set; } = null;

        /// <summary>
        /// Webhook signing secret (Webhook triggers), accepted only when the apply allows secret values.
        /// </summary>
        public string? SigningSecret { get; set; } = null;
    }
}
