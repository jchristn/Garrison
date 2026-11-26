namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>Typed arguments of the organization tools (AA7.8, AA7.11). Tenant identity comes from the authenticated caller.</summary>
    public class McpOrganizationArguments
    {
        /// <summary>Organization identifier or name. Runs may omit it when their agent belongs to one organization.</summary>
        public string? Organization { get; set; } = null;

        /// <summary>People only (whoami): the agent whose place to describe, by identifier or name.</summary>
        public string? Agent { get; set; } = null;

        /// <summary>Name (create, update).</summary>
        public string? Name { get; set; } = null;

        /// <summary>Description (create, update).</summary>
        public string? Description { get; set; } = null;

        /// <summary>Mission (create, update).</summary>
        public string? Mission { get; set; } = null;

        /// <summary>Status: Retired, or Active to bring a retired organization back (update).</summary>
        public string? Status { get; set; } = null;

        /// <summary>Units of the working tree; when given, they replace the whole tree (create, update).</summary>
        public List<OrgUnit>? Units { get; set; } = null;

        /// <summary>Revision to publish or roll back to; publish without it snapshots the working tree first.</summary>
        public string? RevisionId { get; set; } = null;

        /// <summary>Why (publish, rollback), at most 2000 characters.</summary>
        public string? Note { get; set; } = null;

        /// <summary>Part of a name (list).</summary>
        public string? Search { get; set; } = null;

        /// <summary>Results to skip (list).</summary>
        public int? Skip { get; set; } = null;

        /// <summary>Most results, 1 to 100 (list).</summary>
        public int? MaxResults { get; set; } = null;
    }
}
