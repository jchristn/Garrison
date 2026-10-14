namespace Garrison.Core.Services
{
    using System;
    using System.Globalization;
    using Garrison.Core.Enums;

    /// <summary>
    /// A synchronous delegation was refused because waiting on the child could leave no capacity to run it (P12.38): the
    /// parent's node already keeps as many waiting runs as it may, or too many waited children are queued. Code
    /// DelegationCapacityExhausted. REST maps it to 429 with Retry-After; MCP and A2A return the code like other
    /// conflicts.
    /// </summary>
    public class DelegationCapacityExhaustedException : ConflictException
    {
        #region Public-Members

        /// <summary>
        /// The limit that refused the delegation.
        /// </summary>
        public DelegationCapacityLimitEnum Limit { get; }

        /// <summary>
        /// The parent's node, or null.
        /// </summary>
        public string? NodeId { get; }

        /// <summary>
        /// Usage when the delegation was refused.
        /// </summary>
        public long Used { get; }

        /// <summary>
        /// The limit's value.
        /// </summary>
        public long Maximum { get; }

        /// <summary>
        /// Seconds after which a retry may succeed. Minimum 1.
        /// </summary>
        public int RetryAfterSeconds { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="limit">The refusing limit.</param>
        /// <param name="nodeId">The parent's node, or null.</param>
        /// <param name="used">Usage.</param>
        /// <param name="maximum">Limit value.</param>
        /// <param name="retryAfterSeconds">Seconds before a retry may succeed; values below 1 become 1.</param>
        public DelegationCapacityExhaustedException(DelegationCapacityLimitEnum limit, string? nodeId, long used, long maximum, int retryAfterSeconds)
            : base("DelegationCapacityExhausted", Describe(limit, nodeId, used, maximum))
        {
            Limit = limit;
            NodeId = nodeId;
            Used = used;
            Maximum = maximum;
            RetryAfterSeconds = Math.Max(1, retryAfterSeconds);
        }

        #endregion

        #region Private-Methods

        private static string Describe(DelegationCapacityLimitEnum limit, string? nodeId, long used, long maximum)
        {
            string counts = " (" + used.ToString(CultureInfo.InvariantCulture) + " of " + maximum.ToString(CultureInfo.InvariantCulture) + ")";
            if (limit == DelegationCapacityLimitEnum.ChildQueueDepth)
            {
                return "Too many delegated runs are already queued while their parents wait" + counts + ". Retry later, or delegate without waiting.";
            }
            return "Node " + (nodeId ?? "unknown") + " already has as many runs waiting on a delegated run as it can keep" + counts + ". Retry later, or delegate without waiting.";
        }

        #endregion
    }
}
