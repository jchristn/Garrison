namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// A fan-out group with its members' current state and results (AD5): what garrison_fan_out, garrison_gather,
    /// garrison_cancel_fan_out, the REST routes, and the fan-out channel return.
    /// </summary>
    public class FanOutGroupView
    {
        /// <summary>
        /// Group identifier (fog_).
        /// </summary>
        public string FanOutGroupId { get; set; } = String.Empty;

        /// <summary>
        /// The run that started the group.
        /// </summary>
        public string ParentRunId { get; set; } = String.Empty;

        /// <summary>
        /// Group state.
        /// </summary>
        public FanOutGroupStatusEnum Status { get; set; } = FanOutGroupStatusEnum.Running;

        /// <summary>
        /// Why the group ended, or null while it runs.
        /// </summary>
        public string? StatusReason { get; set; } = null;

        /// <summary>
        /// Join policy.
        /// </summary>
        public FanOutJoinPolicyEnum JoinPolicy { get; set; } = FanOutJoinPolicyEnum.All;

        /// <summary>
        /// Successes needed for Quorum.
        /// </summary>
        public int Quorum { get; set; } = 1;

        /// <summary>
        /// Members.
        /// </summary>
        public int Total { get; set; } = 0;

        /// <summary>
        /// Members that finished, whatever their outcome.
        /// </summary>
        public int Finished { get; set; } = 0;

        /// <summary>
        /// Members that succeeded.
        /// </summary>
        public int Succeeded { get; set; } = 0;

        /// <summary>
        /// Labels of members still running or queued.
        /// </summary>
        public List<string> Pending { get; set; } = new List<string>();

        /// <summary>
        /// Labels of members that failed, timed out, or were cancelled.
        /// </summary>
        public List<string> Failed { get; set; } = new List<string>();

        /// <summary>
        /// Every member, in the order given.
        /// </summary>
        public List<FanOutMemberView> Members { get; set; } = new List<FanOutMemberView>();

        /// <summary>
        /// Cost the members recorded together, in US dollars.
        /// </summary>
        public double CostUsd { get; set; } = 0;

        /// <summary>
        /// Input plus output tokens the members recorded together.
        /// </summary>
        public long Tokens { get; set; } = 0;

        /// <summary>
        /// Cost budget, or null.
        /// </summary>
        public double? MaxCostUsd { get; set; } = null;

        /// <summary>
        /// Token budget, or null.
        /// </summary>
        public long? MaxTokens { get; set; } = null;

        /// <summary>
        /// When the group times out (UTC), or null.
        /// </summary>
        public DateTime? DeadlineUtc { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the group ended (UTC), or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// The results rendered for a harness by the fan-out-gather-result template; set by gather.
        /// </summary>
        public string? Summary { get; set; } = null;

        /// <summary>
        /// GARRISON_CONTINUATION_WAIT when the parent should finish its turn and resume when the group ends, or null.
        /// </summary>
        public string? ContinuationMarker { get; set; } = null;

        /// <summary>
        /// The instruction that goes with the continuation marker, or null.
        /// </summary>
        public string? ContinuationInstruction { get; set; } = null;
    }
}
