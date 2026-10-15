namespace Garrison.Core.Models
{
    using System;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One fire of a trigger (P12.5): when and why it fired, and the run or pipeline run it started or why it did not.
    /// Fire history is pruned after Triggers.FireRetentionDays. Webhook payloads are not stored here; the rendered input is
    /// the run's input.
    /// </summary>
    public class TriggerFire
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix tfr_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewTriggerFireId() : value;
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
        /// Trigger identifier.
        /// </summary>
        public string TriggerId
        {
            get
            {
                return _TriggerId;
            }
            set
            {
                _TriggerId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Trigger name at the time of the fire.
        /// </summary>
        public string TriggerName
        {
            get
            {
                return _TriggerName;
            }
            set
            {
                _TriggerName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Why the trigger fired: Cron, Webhook, or Manual.
        /// </summary>
        public TriggerFireSourceEnum Source { get; set; } = TriggerFireSourceEnum.Cron;

        /// <summary>
        /// Webhook delivery identifier from the X-Garrison-Delivery header, or null. A repeated delivery identifier returns
        /// this fire instead of starting another run.
        /// </summary>
        public string? DeliveryId { get; set; } = null;

        /// <summary>
        /// Cron occurrence this fire is for (UTC); the arrival time for webhook and manual fires.
        /// </summary>
        public DateTime ScheduledUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the fire was processed (UTC).
        /// </summary>
        public DateTime FiredUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Outcome: Started, Failed, or Skipped.
        /// </summary>
        public TriggerFireOutcomeEnum Outcome { get; set; } = TriggerFireOutcomeEnum.Started;

        /// <summary>
        /// Run started by this fire, or null.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Pipeline run started by this fire, or null.
        /// </summary>
        public string? PipelineRunId { get; set; } = null;

        /// <summary>
        /// Stable error code when the outcome is Failed or Skipped (for example TemplateRenderFailed, InputRequired,
        /// RunAsNotAuthorized, AgentInactive, NoActiveDeployment, MissedSchedule), or null.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// Error message when the outcome is Failed or Skipped, or null.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// True when this response repeats an earlier fire for the same webhook delivery identifier. Not stored.
        /// </summary>
        public bool Duplicate { get; set; } = false;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Uniqueness key within the trigger: cron:&lt;occurrence ticks&gt;, webhook:&lt;delivery identifier&gt;, or the
        /// fire identifier. Never serialized.
        /// </summary>
        [JsonIgnore]
        public string FireKey { get; set; } = String.Empty;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewTriggerFireId();
        private string _TenantId = String.Empty;
        private string _TriggerId = String.Empty;
        private string _TriggerName = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public TriggerFire()
        {
        }

        #endregion
    }
}
