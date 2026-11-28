namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One problem the organization validation dry run found in a working tree. Not thread-safe.
    /// </summary>
    public class OrganizationValidationProblem
    {
        /// <summary>
        /// Problem code.
        /// </summary>
        public OrganizationValidationProblemCodeEnum Code { get; set; } = OrganizationValidationProblemCodeEnum.UnitWithoutLead;

        /// <summary>
        /// Error (publishing refuses it) or Warning (publishes, but the organization is incomplete).
        /// </summary>
        public OrganizationValidationSeverityEnum Severity { get; set; } = OrganizationValidationSeverityEnum.Error;

        /// <summary>
        /// Unit the problem is about, or null.
        /// </summary>
        public string? UnitId { get; set; } = null;

        /// <summary>
        /// Agent the problem is about, or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Mandate the problem is about, or null.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// What is wrong and how to fix it, in plain words.
        /// </summary>
        public string Message { get; set; } = String.Empty;
    }
}
