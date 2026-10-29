namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Children a run started in parallel with garrison_fan_out (AD5, AD-016), with how they are joined and what they
    /// may spend. Members are ordinary delegated child runs of the parent, in the parent's tree.
    /// </summary>
    public class FanOutGroup
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix fog_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewFanOutGroupId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// The run that started the group.
        /// </summary>
        public string ParentRunId { get; set; } = String.Empty;

        /// <summary>
        /// Root of the parent's delegation tree.
        /// </summary>
        public string RootRunId { get; set; } = String.Empty;

        /// <summary>
        /// When the group is joined. Default All.
        /// </summary>
        public FanOutJoinPolicyEnum JoinPolicy { get; set; } = FanOutJoinPolicyEnum.All;

        /// <summary>
        /// Members that must succeed for Quorum; 1 to the member count. Ignored for All and Any.
        /// </summary>
        public int Quorum
        {
            get
            {
                return _Quorum;
            }
            set
            {
                _Quorum = Math.Max(1, value);
            }
        }

        /// <summary>
        /// Seconds from creation until the group times out; 0 means no group timeout (each child still has its own).
        /// </summary>
        public int TimeoutSeconds
        {
            get
            {
                return _TimeoutSeconds;
            }
            set
            {
                _TimeoutSeconds = Math.Max(0, value);
            }
        }

        /// <summary>
        /// When the group times out (UTC), or null without a timeout.
        /// </summary>
        public DateTime? DeadlineUtc { get; set; } = null;

        /// <summary>
        /// Most cost in US dollars the members may spend together, or null for no limit.
        /// </summary>
        public double? MaxCostUsd { get; set; } = null;

        /// <summary>
        /// Most input plus output tokens the members may spend together, or null for no limit.
        /// </summary>
        public long? MaxTokens { get; set; } = null;

        /// <summary>
        /// Whether members still running are cancelled when the group is joined early (Any, Quorum). Default true.
        /// Members are always cancelled on timeout, budget breach, and cancellation.
        /// </summary>
        public bool CancelRemaining { get; set; } = true;

        /// <summary>
        /// State.
        /// </summary>
        public FanOutGroupStatusEnum Status { get; set; } = FanOutGroupStatusEnum.Running;

        /// <summary>
        /// Why the group ended, or null while it runs.
        /// </summary>
        public string? StatusReason { get; set; } = null;

        /// <summary>
        /// Cost the members recorded, in US dollars, at the last evaluation.
        /// </summary>
        public double CostUsd { get; set; } = 0;

        /// <summary>
        /// Input plus output tokens the members recorded at the last evaluation.
        /// </summary>
        public long Tokens { get; set; } = 0;

        /// <summary>
        /// SHA-256 of the request that created the group; a repeated identical request from the same parent returns the
        /// group instead of starting new children.
        /// </summary>
        public string RequestDigest { get; set; } = String.Empty;

        /// <summary>
        /// Members, in position order.
        /// </summary>
        public List<FanOutGroupMember> Members
        {
            get
            {
                return _Members;
            }
            set
            {
                _Members = value ?? new List<FanOutGroupMember>();
            }
        }

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the group left Running (UTC), or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewFanOutGroupId();
        private int _Quorum = 1;
        private int _TimeoutSeconds = 0;
        private List<FanOutGroupMember> _Members = new List<FanOutGroupMember>();

        #endregion
    }
}
