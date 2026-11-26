namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A mandate revision pinned by an organization revision (AA7.4): publishing or rolling back to the organization
    /// revision makes this the mandate's current revision. Not thread-safe.
    /// </summary>
    public class OrgRevisionMandate
    {
        /// <summary>
        /// Mandate identifier.
        /// </summary>
        public string MandateId { get; set; } = String.Empty;

        /// <summary>
        /// Mandate name, filled in on read.
        /// </summary>
        public string? MandateName { get; set; } = null;

        /// <summary>
        /// Pinned mandate revision identifier.
        /// </summary>
        public string MandateRevisionId { get; set; } = String.Empty;

        /// <summary>
        /// Pinned mandate revision number, filled in on read.
        /// </summary>
        public int? MandateRevisionNumber { get; set; } = null;
    }
}
