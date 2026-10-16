namespace Garrison.Server.Runtime
{
    using System.Diagnostics;
    using System.Threading;
    using Garrison.Core.Telemetry;

    /// <summary>Shared per-replica bound on run and pipeline synchronous waits. Thread-safe and non-blocking.</summary>
    public class SynchronousWaitBudget
    {
        private int _Active;

        /// <summary>Current held waits, including both run and pipeline waits.</summary>
        public int Active { get { return Volatile.Read(ref _Active); } }

        /// <summary>Acquire a wait slot immediately or decline without queueing another HTTP request.</summary>
        /// <param name="limit">Current configured wait limit.</param>
        /// <param name="failFastDelegation">True records delegation_denied when a resident child wait cannot be admitted; false records accepted asynchronous fallback. Default false.</param>
        /// <returns>True when the caller must release a slot in a finally block.</returns>
        public bool TryEnter(int limit, bool failFastDelegation = false)
        {
            while (true)
            {
                int active = Volatile.Read(ref _Active);
                if (active >= limit)
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.SynchronousWaitAdmission, "result", failFastDelegation ? "delegation_denied" : "fallback");
                    return false;
                }
                if (Interlocked.CompareExchange(ref _Active, active + 1, active) == active)
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.SynchronousWaitAdmission, "result", "admitted");
                    GarrisonMetrics.Adjust(GarrisonMetricCatalog.SynchronousWaiters, 1, new TagList());
                    return true;
                }
            }
        }

        /// <summary>Release a slot obtained from a successful TryEnter.</summary>
        public void Release()
        {
            Interlocked.Decrement(ref _Active);
            GarrisonMetrics.Adjust(GarrisonMetricCatalog.SynchronousWaiters, -1, new TagList());
        }
    }
}
