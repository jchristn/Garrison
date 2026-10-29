namespace Garrison.Server.Protocols
{
    /// <summary>Typed garrison_gather and garrison_cancel_fan_out arguments (AD5).</summary>
    public class McpFanOutArguments
    {
        /// <summary>Fan-out group identifier (fog_...).</summary>
        public string? FanOutGroupId { get; set; } = null;

        /// <summary>Most seconds gather waits; default the server's maximum tool wait.</summary>
        public int? WaitSeconds { get; set; } = null;

        /// <summary>Why the group is cancelled, for the record.</summary>
        public string? Reason { get; set; } = null;
    }
}
