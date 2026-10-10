namespace Garrison.Core.Helpers
{
    using System;

    /// <summary>
    /// Delegation wait of one run, computed by <see cref="DelegationWaitCalculator"/>.
    /// </summary>
    public class DelegationWaitResult
    {
        private long _DelegationWaitMs = 0;
        private long _DelegationWaitBeforeFirstTokenMs = 0;

        /// <summary>
        /// Milliseconds the run spent waiting on its child runs (overlapping children counted once). Minimum 0.
        /// </summary>
        public long DelegationWaitMs
        {
            get
            {
                return _DelegationWaitMs;
            }
            set
            {
                _DelegationWaitMs = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Part of the delegation wait that happened before the first model output. Minimum 0.
        /// </summary>
        public long DelegationWaitBeforeFirstTokenMs
        {
            get
            {
                return _DelegationWaitBeforeFirstTokenMs;
            }
            set
            {
                _DelegationWaitBeforeFirstTokenMs = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Time to first token minus the delegation wait before it, never negative. Null when the run has no time to
        /// first token.
        /// </summary>
        public long? TimeToFirstTokenExcludingDelegationMs { get; set; } = null;
    }
}
