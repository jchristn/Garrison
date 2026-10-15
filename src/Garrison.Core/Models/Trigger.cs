namespace Garrison.Core.Models
{
    using System;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A cron schedule or a signed webhook that starts a run of an agent or a pipeline run when it fires (P12.5).
    /// Tenant-scoped. The run input is rendered from a PromptTemplate (inputTemplateId, default builtin/trigger-input)
    /// with the trigger variables. A trigger runs as the principal that last created or changed it (runAsType, runAsId):
    /// every fire checks that principal still has Agent Execute (or Pipeline Execute) and fails the fire when it does not.
    /// Webhook triggers have a signing secret that is stored encrypted and returned only by create and rotate.
    /// </summary>
    public class Trigger
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix trg_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewTriggerId() : value;
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
        /// Name, unique per tenant: 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or
        /// digit.
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
        /// Optional description (at most 4000 characters).
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Trigger type: Cron or Webhook. Default Cron. Cannot be changed after creation.
        /// </summary>
        public TriggerTypeEnum Type { get; set; } = TriggerTypeEnum.Cron;

        /// <summary>
        /// What a fire starts: an Agent run (default) or a Pipeline run.
        /// </summary>
        public TriggerTargetTypeEnum TargetType { get; set; } = TriggerTargetTypeEnum.Agent;

        /// <summary>
        /// Agent to run when targetType is Agent. Required then, null otherwise.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Optional deployment of the agent to pin runs to. Null lets the agent's traffic weights choose.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Pipeline to start when targetType is Pipeline. Required then, null otherwise.
        /// </summary>
        public string? PipelineId { get; set; } = null;

        /// <summary>
        /// Prompt template that renders the run input, by identifier or name (a tenant template or a built-in). Null uses
        /// builtin/trigger-input. Variables: trigger.* (id, name, type, source, fireId, scheduledUtc, firedUtc, cron,
        /// timeZone) and webhook.* (body, json, contentType, deliveryId). The rendered input must not be empty.
        /// </summary>
        public string? InputTemplateId { get; set; } = null;

        /// <summary>
        /// Run priority of started runs (and pipeline stage runs). Default 0, minimum -100, maximum 100.
        /// </summary>
        public int Priority
        {
            get
            {
                return _Priority;
            }
            set
            {
                _Priority = Math.Clamp(value, -100, 100);
            }
        }

        /// <summary>
        /// Cron expression with five fields (minute, hour, day of month, month, day of week), required for Cron triggers
        /// and null for Webhook triggers. Example: "0 9 * * 1-5" runs at 09:00 on weekdays.
        /// </summary>
        public string? CronExpression { get; set; } = null;

        /// <summary>
        /// IANA time zone the cron expression is evaluated in, for example America/New_York. Default UTC. Daylight saving
        /// transitions follow the Cronos rules: a skipped local time fires at the transition, an ambiguous one fires once.
        /// </summary>
        public string TimeZone
        {
            get
            {
                return _TimeZone;
            }
            set
            {
                _TimeZone = String.IsNullOrWhiteSpace(value) ? "UTC" : value.Trim();
            }
        }

        /// <summary>
        /// Whether the trigger fires. Default true. An inactive cron trigger does not catch up when activated again; an
        /// inactive webhook trigger answers 409 TriggerInactive to correctly signed deliveries.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// The webhook signing secret. Returned only in the response to create and rotate-secret; never stored in
        /// plaintext and never returned again. Null otherwise.
        /// </summary>
        public string? SigningSecret { get; set; } = null;

        /// <summary>
        /// Last four characters of the webhook signing secret, for recognizing it. Null for Cron triggers.
        /// </summary>
        public string? SigningSecretLast4 { get; set; } = null;

        /// <summary>
        /// When the webhook signing secret was last set (UTC). Null for Cron triggers.
        /// </summary>
        public DateTime? SigningSecretRotatedUtc { get; set; } = null;

        /// <summary>
        /// Type of the principal fires run as: User, Credential, or Administrator. Set from the caller on create and
        /// update; supplied values are ignored.
        /// </summary>
        public PrincipalTypeEnum RunAsType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Identifier of the principal fires run as (user or credential). Null for a system administrator key.
        /// </summary>
        public string? RunAsId { get; set; } = null;

        /// <summary>
        /// Display name of the principal fires run as.
        /// </summary>
        public string? RunAsName { get; set; } = null;

        /// <summary>
        /// Scheduled time of the last fire (UTC), or null before the first fire.
        /// </summary>
        public DateTime? LastFireUtc { get; set; } = null;

        /// <summary>
        /// Outcome of the last fire, or null before the first fire.
        /// </summary>
        public TriggerFireOutcomeEnum? LastFireOutcome { get; set; } = null;

        /// <summary>
        /// Next cron occurrence (UTC) for an active Cron trigger; null for Webhook and inactive triggers.
        /// </summary>
        public DateTime? NextFireUtc { get; set; } = null;

        /// <summary>
        /// Number of fires recorded, including failed and skipped ones. Minimum 0.
        /// </summary>
        public long FireCount
        {
            get
            {
                return _FireCount;
            }
            set
            {
                _FireCount = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Encrypted webhook signing secret. Never serialized.
        /// </summary>
        [JsonIgnore]
        public string? SecretEncrypted { get; set; } = null;

        /// <summary>
        /// Key version the signing secret was encrypted with. Never serialized.
        /// </summary>
        [JsonIgnore]
        public int SecretKeyVersion { get; set; } = 1;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewTriggerId();
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _TimeZone = "UTC";
        private int _Priority = 0;
        private long _FireCount = 0;

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
