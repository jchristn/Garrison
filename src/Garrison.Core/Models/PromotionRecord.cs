namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A promotion or rollback (AD1.4): which revision moved from which environment to which, the deployments it
    /// repinned, and the pins they had before, so the change can be rolled back. Written in the same transaction as the
    /// repinning, and audited.
    /// </summary>
    public class PromotionRecord
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix pro_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewPromotionRecordId() : value;
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
        /// Kind: Promote or Rollback.
        /// </summary>
        public PromotionKindEnum Kind { get; set; } = PromotionKindEnum.Promote;

        /// <summary>
        /// Outcome. A promotion that was later rolled back reads RolledBack.
        /// </summary>
        public PromotionOutcomeEnum Outcome { get; set; } = PromotionOutcomeEnum.Applied;

        /// <summary>
        /// Agent promoted, for an agent promotion.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Agentic app promoted, for an app promotion (AD6.4).
        /// </summary>
        public string? AppId { get; set; } = null;

        /// <summary>
        /// App revision promoted, for an app promotion (AD6.4).
        /// </summary>
        public string? AppRevisionId { get; set; } = null;

        /// <summary>
        /// Agent revision promoted, for an agent promotion.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Environment the revision came from.
        /// </summary>
        public string SourceEnvironment { get; set; } = String.Empty;

        /// <summary>
        /// Environment whose deployments were repinned.
        /// </summary>
        public string TargetEnvironment { get; set; } = String.Empty;

        /// <summary>
        /// Whether the promotion skipped environments in the ordered list (allowSkip).
        /// </summary>
        public bool SkippedEnvironments { get; set; } = false;

        /// <summary>
        /// For a rollback, the promotion it reverted.
        /// </summary>
        public string? RollbackOfId { get; set; } = null;

        /// <summary>
        /// For a promotion that was rolled back, the rollback record.
        /// </summary>
        public string? RolledBackById { get; set; } = null;

        /// <summary>
        /// Principal type of the actor.
        /// </summary>
        public PrincipalTypeEnum ActorType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Actor identifier (user or credential).
        /// </summary>
        public string? ActorId { get; set; } = null;

        /// <summary>
        /// Actor display name.
        /// </summary>
        public string? ActorName { get; set; } = null;

        /// <summary>
        /// Optional note, at most 2000 characters.
        /// </summary>
        public string? Note { get; set; } = null;

        /// <summary>
        /// Deployments repinned, with their previous pins.
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
        /// Creation timestamp, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewPromotionRecordId();
        private string _TenantId = String.Empty;
        private List<PromotionRecordItem> _Items = new List<PromotionRecordItem>();

        #endregion
    }
}
