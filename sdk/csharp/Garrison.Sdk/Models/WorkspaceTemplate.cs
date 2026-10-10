namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Defines how a run workspace is prepared.
    /// </summary>
    public class WorkspaceTemplate
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
                _Id = String.IsNullOrWhiteSpace(value) ? String.Empty : value;
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
        /// Template name.
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
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Workspace kind.
        /// </summary>
        public WorkspaceKindEnum Kind { get; set; } = WorkspaceKindEnum.Empty;

        /// <summary>
        /// Repository URL for GitRepository workspaces.
        /// </summary>
        public string? GitUrl { get; set; } = null;

        /// <summary>
        /// Branch, tag, or commit.
        /// </summary>
        public string? GitRef { get; set; } = null;

        /// <summary>
        /// Clone depth. Minimum 0 (full), maximum 10000, default 1.
        /// </summary>
        public int GitDepth
        {
            get
            {
                return _GitDepth;
            }
            set
            {
                _GitDepth = Math.Clamp(value, 0, 10000);
            }
        }

        /// <summary>
        /// Secret holding git credentials.
        /// </summary>
        public string? GitCredentialSecretId { get; set; } = null;

        /// <summary>
        /// Retention policy.
        /// </summary>
        public WorkspaceRetentionEnum Retention { get; set; } = WorkspaceRetentionEnum.Delete;

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
                _CreatedUtc = value;
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
                _LastUpdateUtc = value;
            }
        }

        /// <summary>
        /// Seeded files.
        /// </summary>
        public List<WorkspaceFile> Files
        {
            get
            {
                return _Files;
            }
            set
            {
                _Files = value ?? new List<WorkspaceFile>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private int _GitDepth = 1;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<WorkspaceFile> _Files = new List<WorkspaceFile>();

        #endregion
    }
}
