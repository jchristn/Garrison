namespace Garrison.Server.Protocols
{
    /// <summary>Typed agent revision tool arguments (AD1.6). Tenant identity comes from the authenticated caller.</summary>
    public class McpAgentRevisionArguments
    {
        /// <summary>Agent identifier or name. Required.</summary>
        public string? Agent { get; set; } = null;

        /// <summary>Revision identifier (arv_...) or number. Required for get and publish.</summary>
        public string? Revision { get; set; } = null;

        /// <summary>Optional change note for publish, at most 2000 characters.</summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>Most revisions to list, 1 to 100. Default 25.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
