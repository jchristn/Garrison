namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One fire of a trigger (P12.5) and the run or pipeline run it started.
    /// </summary>
    public class TriggerFire
    {
        #region Public-Members

        /// <summary>
        /// Identifier (tfr_).
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
        /// Cron, Webhook, or Manual.
        /// </summary>
        public TriggerFireSourceEnum Source { get; set; } = TriggerFireSourceEnum.Cron;

        /// <summary>
        /// Webhook delivery identifier (X-Garrison-Delivery), or null.
        /// </summary>
        public string? DeliveryId { get; set; } = null;

        /// <summary>
        /// Cron occurrence, or the arrival time (UTC).
        /// </summary>
        public DateTime ScheduledUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the fire was processed (UTC).
        /// </summary>
        public DateTime FiredUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Started, Failed, or Skipped.
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
        /// Stable error code for Failed or Skipped fires.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// Error message for Failed or Skipped fires.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// True when this answer repeats an earlier fire for the same webhook delivery identifier.
        /// </summary>
        public bool Duplicate { get; set; } = false;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
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
