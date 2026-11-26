namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A tree of org units in one tenant (AA7, AA-021): a mission, a root unit led by the CEO agent, per-unit budgets, and
    /// revisions. People edit the working tree through the unit routes; publishing a revision makes a snapshot of it live,
    /// and the chain of command, lines, and budgets follow the live revision only. Not thread-safe.
    /// </summary>
    public class Organization
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix org_).
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
        /// Name, 1 to 128 characters, unique in the tenant.
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
        /// Description for people, at most 2000 characters, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// What the organization exists to accomplish, at most 8000 characters, or null. Shown to member runs through
        /// builtin/org-context.
        /// </summary>
        public string? Mission { get; set; } = null;

        /// <summary>
        /// Lifecycle status. Default Draft; the first publish makes it Active.
        /// </summary>
        public OrganizationStatusEnum Status { get; set; } = OrganizationStatusEnum.Draft;

        /// <summary>
        /// Root unit of the working tree, or null before the first unit exists. Set by the server.
        /// </summary>
        public string? RootUnitId { get; set; } = null;

        /// <summary>
        /// Live (published) revision, or null before the first publish. Set by the server.
        /// </summary>
        public string? CurrentRevisionId { get; set; } = null;

        /// <summary>
        /// Number of the live revision, or 0 before the first publish. Set by the server.
        /// </summary>
        public int CurrentRevisionNumber
        {
            get
            {
                return _CurrentRevisionNumber;
            }
            set
            {
                _CurrentRevisionNumber = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Name of the person or credential that created it.
        /// </summary>
        public string? CreatedBy { get; set; } = null;

        /// <summary>
        /// Units of the working tree, filled in when one organization is read, root first; null on lists.
        /// </summary>
        public List<OrgUnit>? Units { get; set; } = null;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private int _CurrentRevisionNumber = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public Organization()
        {
        }

        #endregion
    }
}
