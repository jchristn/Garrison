namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A human-written pre-authorization (AA8.4, AA-023): an executive's draft applies without a person when every change
    /// in it falls inside this rule's unit subtree, has only classes the rule lists, and stays within its limits. Only
    /// people create, update, or delete rules; hard limits (AA-022) are checked before any rule is consulted and no rule
    /// lifts them. Not thread-safe.
    /// </summary>
    public class ChangeRule
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix cru_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewChangeRuleId() : value;
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
        /// Organization the rule belongs to.
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
        /// Organization name (computed on read; ignored on write).
        /// </summary>
        public string? OrganizationName { get; set; } = null;

        /// <summary>
        /// Unit whose subtree the rule covers: a change matches only when it falls inside this unit or below it.
        /// </summary>
        public string UnitId
        {
            get
            {
                return _UnitId;
            }
            set
            {
                _UnitId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Unit name (computed on read; ignored on write).
        /// </summary>
        public string? UnitName { get; set; } = null;

        /// <summary>
        /// Short name, 1 to 128 characters.
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
        /// Why the rule exists, at most 2000 characters, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Whether the rule is in force. Default true.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// When the rule stops applying (UTC), or null for no expiry (the default; AA8.4 settles open question Q2).
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// Classes the rule pre-authorizes, at least one, each at most once.
        /// </summary>
        public List<ChangeRuleClass> Classes
        {
            get
            {
                return _Classes;
            }
            set
            {
                _Classes = value ?? new List<ChangeRuleClass>();
            }
        }

        /// <summary>
        /// Bounds on the changes the rule covers, at most one per class and name.
        /// </summary>
        public List<ChangeRuleLimit> Limits
        {
            get
            {
                return _Limits;
            }
            set
            {
                _Limits = value ?? new List<ChangeRuleLimit>();
            }
        }

        /// <summary>
        /// Principal type of the person who created the rule (User or Credential; never Run).
        /// </summary>
        public PrincipalTypeEnum CreatedByType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Identifier of the person who created the rule, or null for a system administrator.
        /// </summary>
        public string? CreatedById { get; set; } = null;

        /// <summary>
        /// Name of the person who created the rule.
        /// </summary>
        public string? CreatedByName { get; set; } = null;

        /// <summary>
        /// Name of the person who last changed the rule.
        /// </summary>
        public string? UpdatedByName { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last change time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewChangeRuleId();
        private string _TenantId = String.Empty;
        private string _OrganizationId = String.Empty;
        private string _UnitId = String.Empty;
        private string _Name = String.Empty;
        private List<ChangeRuleClass> _Classes = new List<ChangeRuleClass>();
        private List<ChangeRuleLimit> _Limits = new List<ChangeRuleLimit>();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether the rule is active and not expired at a time.
        /// </summary>
        /// <param name="utc">Time (UTC).</param>
        /// <returns>True when in force.</returns>
        public bool InForce(DateTime utc)
        {
            return Active && (!ExpiresUtc.HasValue || ExpiresUtc.Value > utc);
        }

        #endregion
    }
}
