namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// An audit record of a promotion or rollback between environments.
    /// </summary>
    public class PromotionRecord
    {
        #region Public-Members

        /// <summary>
        /// Identifier.
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
        /// Promote or Rollback.
        /// </summary>
        public PromotionKindEnum Kind { get; set; } = PromotionKindEnum.Promote;

        /// <summary>
        /// Applied or RolledBack.
        /// </summary>
        public PromotionOutcomeEnum Outcome { get; set; } = PromotionOutcomeEnum.Applied;

        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// App identifier.
        /// </summary>
        public string? AppId { get; set; } = null;

        /// <summary>
        /// App revision identifier.
        /// </summary>
        public string? AppRevisionId { get; set; } = null;

        /// <summary>
        /// Agent revision identifier that was promoted.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Source environment.
        /// </summary>
        public string? SourceEnvironment { get; set; } = null;

        /// <summary>
        /// Target environment.
        /// </summary>
        public string? TargetEnvironment { get; set; } = null;

        /// <summary>
        /// True when the promotion skipped intermediate environments.
        /// </summary>
        public bool SkippedEnvironments { get; set; } = false;

        /// <summary>
        /// For a rollback, the promotion record it reverses.
        /// </summary>
        public string? RollbackOfId { get; set; } = null;

        /// <summary>
        /// The rollback record that reversed this promotion, if any.
        /// </summary>
        public string? RolledBackById { get; set; } = null;

        /// <summary>
        /// Type of the principal that acted.
        /// </summary>
        public PrincipalTypeEnum ActorType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Actor identifier.
        /// </summary>
        public string? ActorId { get; set; } = null;

        /// <summary>
        /// Actor name.
        /// </summary>
        public string? ActorName { get; set; } = null;

        /// <summary>
        /// Note.
        /// </summary>
        public string? Note { get; set; } = null;

        /// <summary>
        /// Deployments changed.
        /// </summary>
        public List<PromotionRecordItem> Items
        {
            get
            {
                return _Items;
            }
            set
            {
                _Items = value ?? new List<PromotionRecordItem>();
            }
        }

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private List<PromotionRecordItem> _Items = new List<PromotionRecordItem>();

        #endregion
    }
}
