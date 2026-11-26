namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A person's pre-authorization of narrow classes of executive change (AA8.4): an executive's draft applies without a
    /// person when every change in it falls inside the rule's unit subtree, has only classes the rule lists, and stays
    /// within its limits. Hard limits are checked first and no rule lifts them. Not thread-safe.
    /// </summary>
    public class ChangeRule
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix cru_), assigned by the server.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Tenant identifier, assigned by the server.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Organization the rule belongs to. A request may name the organization instead. It cannot change on update.
        /// Never null.
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
        /// Organization name, filled in on read.
        /// </summary>
        public string? OrganizationName { get; set; } = null;

        /// <summary>
        /// Unit whose subtree the rule covers. A request may name the unit instead; an unknown unit is refused with field
        /// code UnitNotFound. Never null.
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
        /// Unit name, filled in on read.
        /// </summary>
        public string? UnitName { get; set; } = null;

        /// <summary>
        /// Short name, 1 to 128 characters. Never null.
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
        /// When the rule stops applying (UTC), or null for no expiry (the default). Must be in the future when set
        /// (otherwise field code ExpiryInPast).
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// Classes the rule pre-authorizes, at least one, each at most once. Never null.
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
        /// Bounds on the changes the rule covers, at most one per class and name, at most 32. Never null.
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

        private string _OrganizationId = String.Empty;
        private string _UnitId = String.Empty;
        private string _Name = String.Empty;
        private List<ChangeRuleClass> _Classes = new List<ChangeRuleClass>();
        private List<ChangeRuleLimit> _Limits = new List<ChangeRuleLimit>();

        #endregion
    }
}
