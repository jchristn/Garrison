namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>Result of garrison_keeper_complete_tick (AA1.7).</summary>
    public class McpKeeperTickResult
    {
        /// <summary>Tick identifier.</summary>
        public string TickId { get; set; } = String.Empty;

        /// <summary>Outcome now recorded on the tick.</summary>
        public string? Outcome { get; set; } = null;

        /// <summary>True when this call recorded the outcome; false when an earlier call already did (the first report wins).</summary>
        public bool Accepted { get; set; } = false;

        /// <summary>What happens next.</summary>
        public string Message { get; set; } = String.Empty;
    }
}
