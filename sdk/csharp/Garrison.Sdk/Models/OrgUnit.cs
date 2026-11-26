namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A node in an organization's tree (AA7): a lead agent, members, an optional app, peer lines to other units, and
    /// budgets that cap the whole subtree's spend. The same shape holds a unit of the working tree and a unit in a
    /// revision's snapshot. An agent holds at most one position (lead or member) in an organization. Not thread-safe.
    /// </summary>
    public class OrgUnit
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix oun_). A unit keeps its identifier across revisions.
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
        /// Parent unit in the same organization, or null for the root. An organization has exactly one root.
        /// </summary>
        public string? ParentUnitId { get; set; } = null;

        /// <summary>
        /// Name, 1 to 128 characters, unique in the organization.
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
        /// What the unit is responsible for, at most 2000 characters, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Lead agent identifier, or null for a unit without a lead yet. A request may name the agent instead. The lead of
        /// the root unit is the organization's CEO.
        /// </summary>
        public string? LeadAgentId { get; set; } = null;

        /// <summary>
        /// Lead agent name, filled in on read.
        /// </summary>
        public string? LeadAgentName { get; set; } = null;

        /// <summary>
        /// The lead's title, at most 128 characters, or null.
        /// </summary>
        public string? LeadTitle { get; set; } = null;

        /// <summary>
        /// The lead's mandate (a keeper of the lead agent), or null. A request may name the mandate instead.
        /// </summary>
        public string? LeadMandateId { get; set; } = null;

        /// <summary>
        /// Agentic app the unit runs, or null. A request may name the app instead.
        /// </summary>
        public string? AppId { get; set; } = null;

        /// <summary>
        /// Members other than the lead, in order. At most 200.
        /// </summary>
        public List<OrgUnitMember> Members
        {
            get
            {
                return _Members;
            }
            set
            {
                _Members = value ?? new List<OrgUnitMember>();
            }
        }

        /// <summary>
        /// Peer lines to other units of the same organization. A peer line works in both directions. At most 50.
        /// </summary>
        public List<OrgUnitPeerLine> PeerLines
        {
            get
            {
                return _PeerLines;
            }
            set
            {
                _PeerLines = value ?? new List<OrgUnitPeerLine>();
            }
        }

        /// <summary>
        /// Spend caps on the whole subtree, at most one per period. A child's budget may not exceed its nearest ancestor's
        /// budget for the same period.
        /// </summary>
        public List<OrgUnitBudget> Budgets
        {
            get
            {
                return _Budgets;
            }
            set
            {
                _Budgets = value ?? new List<OrgUnitBudget>();
            }
        }

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
        private string _OrganizationId = String.Empty;
        private string _Name = String.Empty;
        private List<OrgUnitMember> _Members = new List<OrgUnitMember>();
        private List<OrgUnitPeerLine> _PeerLines = new List<OrgUnitPeerLine>();
        private List<OrgUnitBudget> _Budgets = new List<OrgUnitBudget>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public OrgUnit()
        {
        }

        #endregion
    }
}
