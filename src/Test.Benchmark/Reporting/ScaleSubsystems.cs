namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Control-plane subsystem counters for one scale level, summed over every server replica from the P13.24
    /// Prometheus metrics (the difference between a scrape before the level and one after it drained). The counters are
    /// server-wide, so background work (heartbeats, maintenance, gauges) is included; per-run values divide by the runs
    /// that finished in the level (I-12).
    /// </summary>
    public class ScaleSubsystems
    {
        /// <summary>
        /// Server replicas whose metrics answered at both ends of the level.
        /// </summary>
        public int Replicas { get; set; }

        /// <summary>
        /// Runs that finished in the level (any outcome), from garrison_runs_finished_total; the divisor of the per-run values.
        /// </summary>
        public double RunsFinished { get; set; }

        /// <summary>
        /// Run events received from workers (garrison_run_events_total).
        /// </summary>
        public double EventsReceived { get; set; }

        /// <summary>
        /// Event batches received (garrison_event_batch_size count).
        /// </summary>
        public double EventBatches { get; set; }

        /// <summary>
        /// INSERT or upsert statements on run_events (garrison_db_operation_duration_seconds count).
        /// </summary>
        public double EventInsertStatements { get; set; }

        /// <summary>
        /// Mean duration of one run_events insert statement (ms).
        /// </summary>
        public double EventInsertMeanMs { get; set; }

        /// <summary>
        /// Lease long polls woken by a queue notification (garrison_scheduler_queue_wakeups_total{source="notify"}).
        /// </summary>
        public double WakeupsNotify { get; set; }

        /// <summary>
        /// Lease long polls woken by the fallback poll interval (source="poll").
        /// </summary>
        public double WakeupsPoll { get; set; }

        /// <summary>
        /// Lease requests answered with work (garrison_scheduler_lease_requests_total{result="assigned"}).
        /// </summary>
        public double LeaseRequestsAssigned { get; set; }

        /// <summary>
        /// Lease requests answered empty.
        /// </summary>
        public double LeaseRequestsEmpty { get; set; }

        /// <summary>
        /// Claim passes that found nothing to claim (garrison_scheduler_claim_duration_seconds{result="empty"} count).
        /// </summary>
        public double EmptyClaimPasses { get; set; }

        /// <summary>
        /// Leases renewed by heartbeats (garrison_lease_renewals_total{result="renewed"}).
        /// </summary>
        public double LeaseRenewals { get; set; }

        /// <summary>
        /// Renewals that found the lease gone (result="lost").
        /// </summary>
        public double LeaseRenewalsLost { get; set; }

        /// <summary>
        /// Leases that expired (garrison_lease_expirations_total).
        /// </summary>
        public double LeaseExpirations { get; set; }

        /// <summary>
        /// Worker heartbeats received (garrison_node_heartbeats_total).
        /// </summary>
        public double Heartbeats { get; set; }

        /// <summary>
        /// Claims that took the per-deployment concurrency lock (garrison_scheduler_deployment_lock_wait_seconds count).
        /// </summary>
        public double DeploymentLockAcquisitions { get; set; }

        /// <summary>
        /// Mean wait for the per-deployment concurrency lock (ms).
        /// </summary>
        public double DeploymentLockMeanWaitMs { get; set; }

        /// <summary>
        /// Total time claims spent waiting for the per-deployment lock (ms).
        /// </summary>
        public double DeploymentLockTotalWaitMs { get; set; }

        /// <summary>
        /// Claims by result (won, lost, limit, quota, affinity) from garrison_claims_total.
        /// </summary>
        public SortedDictionary<string, double> Claims { get; set; } = new SortedDictionary<string, double>(StringComparer.Ordinal);

        /// <summary>
        /// Database statements (every operation, every table, every replica).
        /// </summary>
        public double DbStatements { get; set; }

        /// <summary>
        /// Mean statement duration (ms).
        /// </summary>
        public double DbMeanMs { get; set; }

        /// <summary>
        /// Database statements per finished run (I-12; includes background work during the level).
        /// </summary>
        public double DbStatementsPerRun { get; set; }

        /// <summary>
        /// Database statements per finished run by table, largest first (top 12).
        /// </summary>
        public SortedDictionary<string, double> DbStatementsPerRunByTable { get; set; } = new SortedDictionary<string, double>(StringComparer.Ordinal);

        /// <summary>
        /// request_history_headers inserts per finished run (I-05 re-measure; near zero once node-protocol capture is off).
        /// </summary>
        public double RequestHistoryHeaderInsertsPerRun { get; set; }

        /// <summary>
        /// request_history inserts per finished run.
        /// </summary>
        public double RequestHistoryInsertsPerRun { get; set; }

        /// <summary>
        /// Database statements that threw (garrison_db_errors_total).
        /// </summary>
        public double DbErrors { get; set; }

        /// <summary>
        /// Transactions retried after a transient conflict (garrison_db_transaction_retries_total).
        /// </summary>
        public double DbRetries { get; set; }

        /// <summary>
        /// Most database connections in use at once, summed over replicas, sampled while the level drained.
        /// </summary>
        public double PeakDbConnections { get; set; }

        /// <summary>
        /// REST responses by status class (2xx, 4xx, 5xx, aborted) from garrison_http_requests_total.
        /// </summary>
        public SortedDictionary<string, double> HttpByStatusClass { get; set; } = new SortedDictionary<string, double>(StringComparer.Ordinal);

        /// <summary>
        /// REST 429 and 503 responses (admission refusals: QueueFull, DatabaseBusy).
        /// </summary>
        public double Http429And503 { get; set; }
    }
}
