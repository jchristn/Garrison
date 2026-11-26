namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of the board tools (AA10). Tenant identity comes from the authenticated caller.</summary>
    public class McpBoardArguments
    {
        /// <summary>Organization identifier or name. Required.</summary>
        public string? Organization { get; set; } = null;

        /// <summary>Most escalations, proposals, and unhealthy reports, clamped to 1 to 100; null for 20 (garrison_board_get).</summary>
        public int? Limit { get; set; } = null;

        /// <summary>The direction, 1 to 4000 characters (garrison_board_direct).</summary>
        public string? Direction { get; set; } = null;

        /// <summary>Why, at most 1024 characters, or null for "Board direction" (garrison_board_direct).</summary>
        public string? ChangeNote { get; set; } = null;
    }
}
