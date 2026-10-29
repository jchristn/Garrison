namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A studio draft (AD7, AD-002): a manifest bundle being designed, by a person or by the agent architect on their
    /// behalf, that changes nothing live until a person approves applying it. Every change increments the version; a
    /// change sent with a stale version is refused (DraftVersionConflict).
    /// </summary>
    public class StudioDraft
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix sdr_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewStudioDraftId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Title, up to 256 characters.
        /// </summary>
        public string Title { get; set; } = String.Empty;

        /// <summary>
        /// The person the draft belongs to: their user identifier.
        /// </summary>
        public string? OwnerUserId { get; set; } = null;

        /// <summary>
        /// The owner's name.
        /// </summary>
        public string? OwnerName { get; set; } = null;

        /// <summary>
        /// The architect conversation working on the draft, or null.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// The app the draft builds or changes, by name, or null.
        /// </summary>
        public string? TargetApp { get; set; } = null;

        /// <summary>
        /// Version, from 1; every change adds one.
        /// </summary>
        public int Version { get; set; } = 1;

        /// <summary>
        /// State.
        /// </summary>
        public StudioDraftStatusEnum Status { get; set; } = StudioDraftStatusEnum.Open;

        /// <summary>
        /// The DraftApply approval while PendingApproval, or the one that applied it, or null.
        /// </summary>
        public string? ApprovalId { get; set; } = null;

        /// <summary>
        /// Whether applying also publishes the revisions the draft writes. Default true.
        /// </summary>
        public bool PublishOnApply { get; set; } = true;

        /// <summary>
        /// The manifest apply record of the applied draft, or null.
        /// </summary>
        public string? ManifestApplyId { get; set; } = null;

        /// <summary>
        /// Items (manifest documents), in kind and name order.
        /// </summary>
        public List<StudioDraftItem> Items
        {
            get
            {
                return _Items;
            }
            set
            {
                _Items = value ?? new List<StudioDraftItem>();
            }
        }

        /// <summary>
        /// Graph layout of the visual editor.
        /// </summary>
        public List<StudioDraftNode> Layout
        {
            get
            {
                return _Layout;
            }
            set
            {
                _Layout = value ?? new List<StudioDraftNode>();
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

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewStudioDraftId();
        private List<StudioDraftItem> _Items = new List<StudioDraftItem>();
        private List<StudioDraftNode> _Layout = new List<StudioDraftNode>();

        #endregion
    }
}
