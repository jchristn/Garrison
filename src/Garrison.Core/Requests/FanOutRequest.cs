namespace Garrison.Core.Requests
{
    using System.Collections.Generic;

    /// <summary>
    /// A garrison_fan_out call (AD5.2): the members to start and how the group is joined and bounded.
    /// </summary>
    public class FanOutRequest
    {
        /// <summary>
        /// Members to start: 1 to Delegation.MaxFanOutWidth.
        /// </summary>
        public List<FanOutMemberRequest> Members { get; set; } = new List<FanOutMemberRequest>();

        /// <summary>
        /// All, Any, or Quorum. Default All.
        /// </summary>
        public string? JoinPolicy { get; set; } = null;

        /// <summary>
        /// Successes needed for Quorum: 1 to the member count. Required for Quorum.
        /// </summary>
        public int? Quorum { get; set; } = null;

        /// <summary>
        /// Seconds until the group times out and its running members are cancelled: 0 to 86400. Default 0, no group
        /// timeout.
        /// </summary>
        public int? TimeoutSeconds { get; set; } = null;

        /// <summary>
        /// Most cost in US dollars the members may spend together, greater than 0, or null for no limit.
        /// </summary>
        public double? MaxCostUsd { get; set; } = null;

        /// <summary>
        /// Most input plus output tokens the members may spend together, at least 1, or null for no limit.
        /// </summary>
        public long? MaxTokens { get; set; } = null;

        /// <summary>
        /// Whether running members are cancelled when Any or Quorum is met early. Default true.
        /// </summary>
        public bool? CancelRemaining { get; set; } = null;
    }
}
