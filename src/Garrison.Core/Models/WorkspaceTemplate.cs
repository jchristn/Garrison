namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Defines how a run workspace is prepared.
    /// </summary>
    public class WorkspaceTemplate
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values in the request that created or updated this record and were not stored as given (I-08),
        /// for example a number outside its range that was clamped (code ValueClamped). Present only on create and
        /// update responses when there is something to report; null and omitted otherwise, including on reads.
        /// Read-only: ignored in request bodies, and never stored.
        /// </summary>
        public List<FieldWarning>? Warnings
        {
            get
            {
                return _ClampWarnings.Count > 0 ? _ClampWarnings : null;
            }
        }

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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewWorkspaceTemplateId() : value;
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
                _GitDepth = ValueClamp.Int(value, 0, 10000, "gitDepth", _ClampWarnings);
            }
        }

        /// <summary>
        /// Secret holding git credentials.
        /// </summary>
        public string? GitCredentialSecretId { get; set; } = null;

        /// <summary>
        /// Name of the Kubernetes PersistentVolumeClaim mounted at the workspace path for PersistentVolume workspaces
        /// (a DNS-1123 name in the worker's run namespace). The claim must exist; Garrison does not create it. Its
        /// contents persist across runs and are never deleted by retention. Ignored for other kinds.
        /// </summary>
        public string? PersistentVolumeClaim { get; set; } = null;

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

        private readonly List<FieldWarning> _ClampWarnings = new List<FieldWarning>();

        private string _Id = IdGenerator.NewWorkspaceTemplateId();
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private int _GitDepth = 1;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<WorkspaceFile> _Files = new List<WorkspaceFile>();

        #endregion
    }
}
