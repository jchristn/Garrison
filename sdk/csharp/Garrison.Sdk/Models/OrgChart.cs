namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// An organization drawn as a chart (AA7.3, AA7.8): units with their leads, members, titles, one-line mandate
    /// summaries, and peer lines. Computed from the live revision, or from the working tree before the first publish.
    /// Never stored. Not thread-safe.
    /// </summary>
    public class OrgChart
    {
        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// Organization name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Mission, or null.
        /// </summary>
        public string? Mission { get; set; } = null;

        /// <summary>
        /// Live revision the chart shows, or null when it shows the working tree.
        /// </summary>
        public string? RevisionId { get; set; } = null;

        /// <summary>
        /// Number of the live revision, or 0 for the working tree.
        /// </summary>
        public int RevisionNumber { get; set; } = 0;

        /// <summary>
        /// Live when the chart shows the published revision, Working when it shows the unpublished working tree.
        /// </summary>
        public string Source { get; set; } = "Live";

        /// <summary>
        /// Units, root first, then breadth first.
        /// </summary>
        public List<OrgChartUnit> Units { get; set; } = new List<OrgChartUnit>();
    }
}
