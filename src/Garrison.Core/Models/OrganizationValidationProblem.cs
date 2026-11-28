namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One problem the organization validation dry run found in a working tree (LP3.7a). Not thread-safe.
    /// </summary>
    public class OrganizationValidationProblem
    {
        #region Public-Members

        /// <summary>
        /// What is wrong.
        /// </summary>
        public OrganizationValidationProblemCodeEnum Code { get; set; } = OrganizationValidationProblemCodeEnum.UnitWithoutLead;

        /// <summary>
        /// Error when publishing refuses it, Warning when publishing succeeds but the organization is incomplete. Default
        /// Error.
        /// </summary>
        public OrganizationValidationSeverityEnum Severity { get; set; } = OrganizationValidationSeverityEnum.Error;

        /// <summary>
        /// Unit the problem is in, or null when it concerns the whole tree.
        /// </summary>
        public string? UnitId { get; set; } = null;

        /// <summary>
        /// Agent the problem concerns, or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Mandate the problem concerns, or null.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// A sentence for people that names the unit and the fix. Never null.
        /// </summary>
        public string Message
        {
            get
            {
                return _Message;
            }
            set
            {
                _Message = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _Message = String.Empty;

        #endregion
    }
}
