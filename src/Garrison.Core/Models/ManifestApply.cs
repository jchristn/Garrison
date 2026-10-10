namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Record of a declarative manifest apply.
    /// </summary>
    public class ManifestApply
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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewManifestApplyId() : value;
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
        /// Principal that applied.
        /// </summary>
        public string? PrincipalName { get; set; } = null;

        /// <summary>
        /// Whether the apply was a dry run.
        /// </summary>
        public bool DryRun { get; set; } = false;

        /// <summary>
        /// Documents submitted.
        /// </summary>
        public int DocumentCount { get; set; } = 0;

        /// <summary>
        /// Documents created.
        /// </summary>
        public int CreatedCount { get; set; } = 0;

        /// <summary>
        /// Documents updated.
        /// </summary>
        public int UpdatedCount { get; set; } = 0;

        /// <summary>
        /// Documents unchanged.
        /// </summary>
        public int UnchangedCount { get; set; } = 0;

        /// <summary>
        /// Documents failed.
        /// </summary>
        public int FailedCount { get; set; } = 0;

        /// <summary>
        /// Whether the record is active.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Whether the record is protected from deletion.
        /// </summary>
        public bool IsProtected { get; set; } = false;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc
        {
            get
            {
                return _CreatedUtc;
            }
            set
            {
                _CreatedUtc = TimestampHelper.Normalize(value);
            }
        }

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc
        {
            get
            {
                return _LastUpdateUtc;
            }
            set
            {
                _LastUpdateUtc = TimestampHelper.Normalize(value);
            }
        }

        /// <summary>
        /// Per-document results.
        /// </summary>
        public List<ManifestApplyItem> Items
        {
            get
            {
                return _Items;
            }
            set
            {
                _Items = value ?? new List<ManifestApplyItem>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewManifestApplyId();
        private string _TenantId = String.Empty;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<ManifestApplyItem> _Items = new List<ManifestApplyItem>();

        #endregion
    }
}
