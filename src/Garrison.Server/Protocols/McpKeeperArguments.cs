namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of the keeper run tools garrison_keeper_context and garrison_keeper_complete_tick (AA1.7).</summary>
    public class McpKeeperArguments
    {
        /// <summary>Tick outcome to report: Quiet, Acted, Attention, or Escalated. Required by garrison_keeper_complete_tick.</summary>
        public string? Outcome { get; set; } = null;

        /// <summary>Short summary of the tick, at most 4000 characters, or null.</summary>
        public string? Summary { get; set; } = null;

        /// <summary>Seconds until the next wake the keeper asks for, 1 to 2592000, or null to let the schedule decide.</summary>
        public int? NextWakeSeconds { get; set; } = null;

        /// <summary>Recent finished ticks garrison_keeper_context returns, 1 to 100; null means 10.</summary>
        public int? RecentTicks { get; set; } = null;
    }
}
