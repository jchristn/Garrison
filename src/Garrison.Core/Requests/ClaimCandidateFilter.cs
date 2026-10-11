namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Which queued runs a node may claim, applied in SQL so a node never starves behind runs it cannot take (P10.16).
    /// </summary>
    public class ClaimCandidateFilter
    {
        #region Public-Members

        /// <summary>
        /// Harness types the node reports as available. Required; an empty list matches nothing.
        /// </summary>
        public List<HarnessTypeEnum> HarnessTypes
        {
            get
            {
                return _HarnessTypes;
            }
            set
            {
                _HarnessTypes = value ?? new List<HarnessTypeEnum>();
            }
        }

        /// <summary>
        /// The node's pool. Runs pinned to another pool are excluded; when null, only runs without a pool qualify.
        /// When <see cref="IgnoreNodePool"/> is true this is not applied.
        /// </summary>
        public string? NodePoolId { get; set; } = null;

        /// <summary>
        /// Whether the node pool condition is skipped (callers that filter placement in code). Default false.
        /// </summary>
        public bool IgnoreNodePool { get; set; } = false;

        /// <summary>
        /// Tenants the node's pool is dedicated to. Null or empty means any tenant.
        /// </summary>
        public List<string>? AllowedTenantIds { get; set; } = null;

        /// <summary>
        /// Executors the node supports. Runs needing another executor are excluded (runs created before executors
        /// existed count as Process). Null applies no executor condition; an empty list means Process only.
        /// </summary>
        public List<RunExecutorEnum>? Executors { get; set; } = null;

        /// <summary>
        /// Maximum candidates. Minimum 1, maximum 500, default 16.
        /// </summary>
        public int Limit
        {
            get
            {
                return _Limit;
            }
            set
            {
                _Limit = Math.Clamp(value, 1, 500);
            }
        }

        #endregion

        #region Private-Members

        private List<HarnessTypeEnum> _HarnessTypes = new List<HarnessTypeEnum>();
        private int _Limit = 16;

        #endregion
    }
}
