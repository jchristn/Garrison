namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A cron schedule or signed webhook that starts an agent run or a pipeline run (P12.5). Fires run as the principal that last created or changed the trigger.
    /// </summary>
    public class Trigger
    {
        #region Public-Members

        /// <summary>
        /// Identifier (trg_). Empty on create.
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
        /// Name, unique per tenant: 1 to 64 lowercase letters, digits, and hyphens.
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
        /// Cron or Webhook. Cannot change after creation.
        /// </summary>
        public TriggerTypeEnum Type { get; set; } = TriggerTypeEnum.Cron;

        /// <summary>
        /// Agent (default) or Pipeline.
        /// </summary>
        public TriggerTargetTypeEnum TargetType { get; set; } = TriggerTargetTypeEnum.Agent;

        /// <summary>
        /// Agent identifier or name when targetType is Agent.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Optional deployment to pin runs to.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Pipeline identifier or name when targetType is Pipeline.
        /// </summary>
        public string? PipelineId { get; set; } = null;

        /// <summary>
        /// Task prompt template that renders the run input; null uses builtin/trigger-input.
        /// </summary>
        public string? InputTemplateId { get; set; } = null;

        /// <summary>
        /// Run priority, -100 to 100. Default 0.
        /// </summary>
        public int Priority { get; set; } = 0;

        /// <summary>
        /// Five-field cron expression (Cron triggers only).
        /// </summary>
        public string? CronExpression { get; set; } = null;

        /// <summary>
        /// IANA time zone of the cron expression. Default UTC.
        /// </summary>
        public string TimeZone { get; set; } = "UTC";

        /// <summary>
        /// Whether the trigger fires. Default true.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Webhook signing secret: returned only by create and rotate-secret, null otherwise.
        /// </summary>
        public string? SigningSecret { get; set; } = null;

        /// <summary>
        /// Last four characters of the signing secret (Webhook triggers).
        /// </summary>
        public string? SigningSecretLast4 { get; set; } = null;

        /// <summary>
        /// When the signing secret was last set (UTC).
        /// </summary>
        public DateTime? SigningSecretRotatedUtc { get; set; } = null;

        /// <summary>
        /// Type of the principal fires run as. Set by the server.
        /// </summary>
        public PrincipalTypeEnum RunAsType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Identifier of the principal fires run as. Set by the server.
        /// </summary>
        public string? RunAsId { get; set; } = null;

        /// <summary>
        /// Display name of the principal fires run as. Set by the server.
        /// </summary>
        public string? RunAsName { get; set; } = null;

        /// <summary>
        /// Scheduled time of the last fire (UTC).
        /// </summary>
        public DateTime? LastFireUtc { get; set; } = null;

        /// <summary>
        /// Outcome of the last fire.
        /// </summary>
        public TriggerFireOutcomeEnum? LastFireOutcome { get; set; } = null;

        /// <summary>
        /// Next cron occurrence (UTC) for an active Cron trigger.
        /// </summary>
        public DateTime? NextFireUtc { get; set; } = null;

        /// <summary>
        /// Fires recorded, including failed and skipped ones.
        /// </summary>
        public long FireCount { get; set; } = 0;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public Trigger()
        {
        }

        #endregion
    }
}
