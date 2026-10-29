namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A studio draft (AD7): manifest documents, one per resource, that a person or the agent architect edits before asking
    /// for them to be applied. Every change raises Version by one; each change names the version the caller read and fails
    /// with 409 DraftVersionConflict when the draft moved on. Not thread-safe.
    /// </summary>
    public class StudioDraft
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix sdr_). Never null.
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
        /// Owning tenant. Never null.
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
        /// Title. Never null.
        /// </summary>
        public string Title
        {
            get
            {
                return _Title;
            }
            set
            {
                _Title = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The person who started the draft (user or credential identifier; for an architect run, the person the run works
        /// for), or null.
        /// </summary>
        public string? OwnerUserId { get; set; } = null;

        /// <summary>
        /// Display name of the owner, or null.
        /// </summary>
        public string? OwnerName { get; set; } = null;

        /// <summary>
        /// The conversation the draft was started from, or null.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// The app graph operations act on when they name no app, or null.
        /// </summary>
        public string? TargetApp { get; set; } = null;

        /// <summary>
        /// Version, starting at 1 and raised by one on every change. Pass it back with the next change.
        /// </summary>
        public int Version { get; set; } = 1;

        /// <summary>
        /// Status. Only an Open draft changes (409 DraftNotOpen otherwise).
        /// </summary>
        public StudioDraftStatusEnum Status { get; set; } = StudioDraftStatusEnum.Open;

        /// <summary>
        /// The DraftApply approval of the latest apply request, or null.
        /// </summary>
        public string? ApprovalId { get; set; } = null;

        /// <summary>
        /// Whether applying also publishes a revision of each agent the draft creates or updates. Default true.
        /// </summary>
        public bool PublishOnApply { get; set; } = true;

        /// <summary>
        /// The manifest apply record once the draft is Applied, or null.
        /// </summary>
        public string? ManifestApplyId { get; set; } = null;

        /// <summary>
        /// Items, one manifest document per resource. Never null.
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
        /// Canvas positions of graph nodes. Never null.
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
        /// Creation time, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last change, UTC.
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Title = String.Empty;
        private List<StudioDraftItem> _Items = new List<StudioDraftItem>();
        private List<StudioDraftNode> _Layout = new List<StudioDraftNode>();

        #endregion
    }
}
