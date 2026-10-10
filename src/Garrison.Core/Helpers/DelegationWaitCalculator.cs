namespace Garrison.Core.Helpers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Computes how long a run waited on the child runs it delegated to (plan P9.17, finding M1-08), from server
    /// timestamps only. Each child contributes the interval from its creation to its end; intervals are merged so that
    /// children running in parallel count once, and clipped to the parent's execution window. Thread-safe (stateless).
    /// </summary>
    public static class DelegationWaitCalculator
    {
        #region Public-Methods

        /// <summary>
        /// Compute the delegation wait.
        /// </summary>
        /// <param name="windowStartUtc">Start of the parent's execution window on the server clock (started, else leased).</param>
        /// <param name="windowEndUtc">End of the parent's execution window on the server clock (when its completion arrived).</param>
        /// <param name="timeToFirstTokenMs">Parent time to first token, or null when not measured.</param>
        /// <param name="children">Child runs (parentRunId equals the parent). Null is treated as none.</param>
        /// <returns>Result.</returns>
        public static DelegationWaitResult Compute(DateTime windowStartUtc, DateTime windowEndUtc, long? timeToFirstTokenMs, IEnumerable<Run>? children)
        {
            DelegationWaitResult result = new DelegationWaitResult();
            if (windowEndUtc < windowStartUtc) windowEndUtc = windowStartUtc;

            List<DelegationInterval> intervals = new List<DelegationInterval>();
            if (children != null)
            {
                foreach (Run child in children)
                {
                    if (child == null) continue;
                    DateTime start = child.CreatedUtc;
                    DateTime end = ChildEnd(child, windowEndUtc);
                    if (start < windowStartUtc) start = windowStartUtc;
                    if (end > windowEndUtc) end = windowEndUtc;
                    if (end <= start) continue;
                    intervals.Add(new DelegationInterval(start, end));
                }
            }

            List<DelegationInterval> merged = Merge(intervals);
            result.DelegationWaitMs = merged.Sum(i => Milliseconds(i.Start, i.End));

            if (timeToFirstTokenMs.HasValue)
            {
                long ttft = Math.Max(0, timeToFirstTokenMs.Value);
                DateTime firstTokenUtc = windowStartUtc.AddMilliseconds(ttft);
                long before = 0;
                foreach (DelegationInterval interval in merged)
                {
                    if (interval.Start >= firstTokenUtc) break;
                    DateTime end = interval.End < firstTokenUtc ? interval.End : firstTokenUtc;
                    before += Milliseconds(interval.Start, end);
                }
                result.DelegationWaitBeforeFirstTokenMs = before;
                result.TimeToFirstTokenExcludingDelegationMs = Math.Max(0, ttft - before);
            }

            return result;
        }

        #endregion

        #region Private-Methods

        private static DateTime ChildEnd(Run child, DateTime windowEndUtc)
        {
            bool finished = child.Status == RunStatusEnum.Succeeded
                || child.Status == RunStatusEnum.Failed
                || child.Status == RunStatusEnum.Cancelled
                || child.Status == RunStatusEnum.TimedOut
                || child.Status == RunStatusEnum.Rejected;
            if (!finished) return windowEndUtc;

            // TotalMs is measured from queued to the server receiving the completion, on the server clock.
            if (child.QueuedUtc.HasValue && child.TotalMs.HasValue) return child.QueuedUtc.Value.AddMilliseconds(child.TotalMs.Value);
            if (child.LastUpdateUtc > child.CreatedUtc) return child.LastUpdateUtc;
            return child.CompletedUtc ?? windowEndUtc;
        }

        private static List<DelegationInterval> Merge(List<DelegationInterval> intervals)
        {
            List<DelegationInterval> merged = new List<DelegationInterval>();
            foreach (DelegationInterval interval in intervals.OrderBy(i => i.Start))
            {
                if (merged.Count > 0 && interval.Start <= merged[merged.Count - 1].End)
                {
                    DelegationInterval last = merged[merged.Count - 1];
                    if (interval.End > last.End) merged[merged.Count - 1] = new DelegationInterval(last.Start, interval.End);
                }
                else
                {
                    merged.Add(interval);
                }
            }
            return merged;
        }

        private static long Milliseconds(DateTime start, DateTime end)
        {
            return Math.Max(0, (long)(end - start).TotalMilliseconds);
        }

        #endregion
    }
}
