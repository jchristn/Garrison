namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A group of child runs a run started with the garrison_fan_out MCP tool, with its members' current state and
    /// results. Groups are read and cancelled through the API but never created there. Not thread-safe.
    /// </summary>
    public class FanOutGroup
    {
        #region Public-Members

        /// <summary>
        /// Group identifier (prefix fog_).
        /// </summary>
        public string FanOutGroupId { get; set; } = String.Empty;

        /// <summary>
        /// The run that started the group.
        /// </summary>
        public string ParentRunId { get; set; } = String.Empty;

        /// <summary>
        /// Group state. Every state other than Running is final. Default Running.
        /// </summary>
        public FanOutGroupStatusEnum Status { get; set; } = FanOutGroupStatusEnum.Running;

        /// <summary>
        /// Why the group ended, or null while it runs.
        /// </summary>
        public string? StatusReason { get; set; } = null;

        /// <summary>
        /// Join policy. Default All.
        /// </summary>
        public FanOutJoinPolicyEnum JoinPolicy { get; set; } = FanOutJoinPolicyEnum.All;

        /// <summary>
        /// Successes needed when the join policy is Quorum. Default 1.
        /// </summary>
        public int Quorum { get; set; } = 1;

        /// <summary>
        /// Number of members.
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
        /// Labels of members still queued or running. Never null; assigning null stores an empty list.
        /// </summary>
        public List<string> Pending
        {
            get
            {
                return _Pending;
            }
            set
            {
                _Pending = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Labels of members that failed, timed out, or were cancelled. Never null; assigning null stores an empty list.
        /// </summary>
        public List<string> Failed
        {
            get
            {
                return _Failed;
            }
            set
            {
                _Failed = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Every member, in the order the parent gave them. Never null; assigning null stores an empty list.
        /// </summary>
        public List<FanOutMember> Members
        {
            get
            {
                return _Members;
            }
            set
            {
                _Members = value ?? new List<FanOutMember>();
            }
        }

        /// <summary>
        /// Cost the members recorded together, in US dollars.
        /// </summary>
        public double CostUsd { get; set; } = 0;

        /// <summary>
        /// Input plus output tokens the members recorded together.
        /// </summary>
        public long Tokens { get; set; } = 0;

        /// <summary>
        /// Cost budget in US dollars, or null when the group has none.
        /// </summary>
        public double? MaxCostUsd { get; set; } = null;

        /// <summary>
        /// Token budget, or null when the group has none.
        /// </summary>
        public long? MaxTokens { get; set; } = null;

        /// <summary>
        /// When the group times out (UTC), or null when it has no timeout.
        /// </summary>
        public DateTime? DeadlineUtc { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the group ended (UTC), or null while it runs.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// The results rendered for a harness by garrison_gather, or null. Normally null on API reads.
        /// </summary>
        public string? Summary { get; set; } = null;

        /// <summary>
        /// Continuation marker telling a harness to end its turn and resume when the group ends, or null. Normally null on
        /// API reads.
        /// </summary>
        public string? ContinuationMarker { get; set; } = null;

        /// <summary>
        /// Instruction that goes with the continuation marker, or null. Normally null on API reads.
        /// </summary>
        public string? ContinuationInstruction { get; set; } = null;

        #endregion

        #region Private-Members

        private List<string> _Pending = new List<string>();
        private List<string> _Failed = new List<string>();
        private List<FanOutMember> _Members = new List<FanOutMember>();

        #endregion
    }
}
