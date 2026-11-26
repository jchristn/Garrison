namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A snapshot of an organization (AA7.4): its units with members, peer lines, and budgets, and the mandate revisions
    /// they pin. Snapshots never change; publishing one makes it live, and a rollback publishes a copy of an earlier one.
    /// Not thread-safe.
    /// </summary>
    public class OrgRevision
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix orv_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewOrgRevisionId() : value;
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
        /// Organization identifier.
        /// </summary>
        public string OrganizationId
        {
            get
            {
                return _OrganizationId;
            }
            set
            {
                _OrganizationId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Number, starting at 1 and unique in the organization. Set by the server.
        /// </summary>
        public int Number
        {
            get
            {
                return _Number;
            }
            set
            {
                _Number = Math.Max(0, value);
            }
        }

        /// <summary>
        /// State. Default Draft.
        /// </summary>
        public OrgRevisionStateEnum State { get; set; } = OrgRevisionStateEnum.Draft;

        /// <summary>
        /// Why the revision was made, at most 2000 characters, or null.
        /// </summary>
        public string? Note { get; set; } = null;

        /// <summary>
        /// For a rollback, the revision whose snapshot this one copies; otherwise null.
        /// </summary>
        public string? RollbackOfRevisionId { get; set; } = null;

        /// <summary>
        /// Principal type of the author.
        /// </summary>
        public PrincipalTypeEnum AuthorType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Author identifier (user or credential), or null.
        /// </summary>
        public string? AuthorId { get; set; } = null;

        /// <summary>
        /// Author display name, or null.
        /// </summary>
        public string? AuthorName { get; set; } = null;

        /// <summary>
        /// Units of the snapshot, root first. Filled in when one revision is read; empty on lists.
        /// </summary>
        public List<OrgUnit> Units
        {
            get
            {
                return _Units;
            }
            set
            {
                _Units = value ?? new List<OrgUnit>();
            }
        }

        /// <summary>
        /// Mandate revisions the snapshot pins. Filled in when one revision is read; empty on lists.
        /// </summary>
        public List<OrgRevisionMandate> Mandates
        {
            get
            {
                return _Mandates;
            }
            set
            {
                _Mandates = value ?? new List<OrgRevisionMandate>();
            }
        }

        /// <summary>
        /// When it was published (UTC), or null for a draft.
        /// </summary>
        public DateTime? PublishedUtc { get; set; } = null;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewOrgRevisionId();
        private string _TenantId = String.Empty;
        private string _OrganizationId = String.Empty;
        private int _Number = 0;
        private List<OrgUnit> _Units = new List<OrgUnit>();
        private List<OrgRevisionMandate> _Mandates = new List<OrgRevisionMandate>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public OrgRevision()
        {
        }

        #endregion
    }
}
