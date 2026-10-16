namespace Garrison.Benchmark.Client
{
    /// <summary>
    /// Exact centrally instrumented ADO statement attempts attributed to a run and fixed lifecycle operation.
    /// Durations sum statement wall time, including lock waits, and can exceed elapsed run time under concurrency.
    /// Explicit transaction wrappers are counted separately; telemetry persistence is excluded. Thread-safe snapshots.
    /// </summary>
    public class RunDatabaseUsage
    {
        /// <summary>Tenant identifier.</summary>
        public string TenantId { get; set; } = string.Empty;
        /// <summary>Run identifier.</summary>
        public string RunId { get; set; } = string.Empty;
        /// <summary>Fixed lifecycle operation name.</summary>
        public string Operation { get; set; } = string.Empty;
        /// <summary>Executed statement attempts, including failures and retries.</summary>
        public long Statements { get; set; }
        /// <summary>Read statement attempts.</summary>
        public long Reads { get; set; }
        /// <summary>Insert, update, delete and upsert statement attempts.</summary>
        public long Writes { get; set; }
        /// <summary>Failed statement attempts, including cancellation.</summary>
        public long Errors { get; set; }
        /// <summary>Explicit transaction wrapper attempts, separate from statements.</summary>
        public long Transactions { get; set; }
        /// <summary>Summed statement wall time in microseconds; transaction wrappers excluded to avoid double counting.</summary>
        public long DurationMicroseconds { get; set; }
    }
}
