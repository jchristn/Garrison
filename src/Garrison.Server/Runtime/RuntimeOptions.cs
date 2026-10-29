namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Scheduling and run lifecycle timing. Defaults match the cluster runtime settings in plan Appendix C; the runtime
    /// module refreshes these from cluster settings when available.
    /// </summary>
    public class RuntimeOptions
    {
        #region Public-Members

        /// <summary>Shared run/pipeline synchronous wait budget. It never queues requests for a slot.</summary>
        public SynchronousWaitBudget SynchronousWaits { get; } = new SynchronousWaitBudget();

        /// <summary>Maximum held synchronous invocation waits per replica. Default 256, minimum 1, maximum 768.
        /// Excess external waits return the accepted run for polling; resident synchronous delegations fail before child creation, leaving headroom under Watson's 1024 request cap.</summary>
        public int MaxSynchronousWaiters
        {
            get { return _MaxSynchronousWaiters; }
            set { _MaxSynchronousWaiters = Math.Clamp(value, 1, 768); }
        }


        /// <summary>
        /// Run lease duration in milliseconds; heartbeats extend it. Minimum 5000, maximum 600000, default 30000.
        /// </summary>
        public int LeaseDurationMs
        {
            get
            {
                return _LeaseDurationMs;
            }
            set
            {
                _LeaseDurationMs = Math.Clamp(value, 5000, 600000);
            }
        }

        /// <summary>
        /// Maximum lease long-poll wait in milliseconds. Minimum 0, maximum 60000, default 20000.
        /// </summary>
        public int LeaseWaitMs
        {
            get
            {
                return _LeaseWaitMs;
            }
            set
            {
                _LeaseWaitMs = Math.Clamp(value, 0, 60000);
            }
        }

        /// <summary>
        /// Interval at which a waiting lease request re-checks the queue, catching runs created on other replicas.
        /// Minimum 50, maximum 10000, default 500.
        /// </summary>
        public int LeasePollMs
        {
            get
            {
                return _LeasePollMs;
            }
            set
            {
                _LeasePollMs = Math.Clamp(value, 50, 10000);
            }
        }

        /// <summary>
        /// Heartbeat interval workers are told to use, in milliseconds. Minimum 1000, maximum 60000, default 5000.
        /// </summary>
        public int HeartbeatIntervalMs
        {
            get
            {
                return _HeartbeatIntervalMs;
            }
            set
            {
                _HeartbeatIntervalMs = Math.Clamp(value, 1000, 60000);
            }
        }

        /// <summary>
        /// A node with no heartbeat for this long is marked Lost. Minimum 5000, maximum 600000, default 20000.
        /// </summary>
        public int NodeHeartbeatTimeoutMs
        {
            get
            {
                return _NodeHeartbeatTimeoutMs;
            }
            set
            {
                _NodeHeartbeatTimeoutMs = Math.Clamp(value, 5000, 600000);
            }
        }

        /// <summary>
        /// Interval at which streaming readers poll for new events, in milliseconds. Minimum 50, maximum 10000, default 250.
        /// </summary>
        public int EventPollMs
        {
            get
            {
                return _EventPollMs;
            }
            set
            {
                _EventPollMs = Math.Clamp(value, 50, 10000);
            }
        }

        /// <summary>
        /// Fallback interval at which a synchronous invocation waiter re-reads its run, in milliseconds. Waiters wake as
        /// soon as their run finishes on any replica; this re-read only covers a completion signal that never arrived.
        /// Event batches do not wake them. Minimum 250, maximum 60000, default 5000.
        /// </summary>
        public int InvocationWaitPollMs
        {
            get
            {
                return _InvocationWaitPollMs;
            }
            set
            {
                _InvocationWaitPollMs = Math.Clamp(value, 250, 60000);
            }
        }

        /// <summary>
        /// Maximum delegation depth. Minimum 0, maximum 20, default 3.
        /// </summary>
        public int MaxDelegationDepth
        {
            get
            {
                return _MaxDelegationDepth;
            }
            set
            {
                _MaxDelegationDepth = Math.Clamp(value, 0, 20);
            }
        }

        /// <summary>
        /// Most children one garrison_fan_out call may start (AD5.2). Minimum 1, maximum 64, default 8. Cluster setting
        /// Delegation.MaxFanOutWidth.
        /// </summary>
        public int MaxFanOutWidth
        {
            get
            {
                return _MaxFanOutWidth;
            }
            set
            {
                _MaxFanOutWidth = Math.Clamp(value, 1, 64);
            }
        }

        /// <summary>
        /// Longest result text garrison_gather returns per member, in characters (AD5.3). Minimum 256, maximum 1000000,
        /// default 16000. Cluster setting Delegation.GatherResultCharLimit.
        /// </summary>
        public int GatherResultCharLimit
        {
            get
            {
                return _GatherResultCharLimit;
            }
            set
            {
                _GatherResultCharLimit = Math.Clamp(value, 256, 1000000);
            }
        }

        /// <summary>
        /// Delegation capacity (P12.38): most queued delegated runs whose parent waits on them, across the cluster, before
        /// a new synchronous delegation fails with DelegationCapacityExhausted. Checked when the parent starts waiting.
        /// Minimum 1, maximum 100000, default 100.
        /// </summary>
        public int DelegationChildQueueDepth
        {
            get
            {
                return _DelegationChildQueueDepth;
            }
            set
            {
                _DelegationChildQueueDepth = Math.Clamp(value, 1, 100000);
            }
        }

        /// <summary>
        /// Seconds suggested in Retry-After when a synchronous delegation fails with DelegationCapacityExhausted.
        /// Minimum 1, maximum 300, default 5.
        /// </summary>
        public int DelegationRetryAfterSeconds
        {
            get
            {
                return _DelegationRetryAfterSeconds;
            }
            set
            {
                _DelegationRetryAfterSeconds = Math.Clamp(value, 1, 300);
            }
        }

        /// <summary>
        /// Seconds after which the leader deletes a delegation wait record whose child run was never created (the
        /// replica that recorded it stopped between the handshake and the child's creation). Records whose parent or
        /// child finished are deleted at once. Minimum 30, maximum 86400, default 300.
        /// </summary>
        public int ChildWaitOrphanSeconds
        {
            get
            {
                return _ChildWaitOrphanSeconds;
            }
            set
            {
                _ChildWaitOrphanSeconds = Math.Clamp(value, 30, 86400);
            }
        }

        /// <summary>
        /// Seconds past the run timeout before the control plane gives up on a run. Minimum 0, maximum 3600, default 120.
        /// </summary>
        public int DeadlineGraceSeconds
        {
            get
            {
                return _DeadlineGraceSeconds;
            }
            set
            {
                _DeadlineGraceSeconds = Math.Clamp(value, 0, 3600);
            }
        }

        /// <summary>
        /// Maintenance (leader) loop interval in milliseconds. Minimum 500, maximum 60000, default 2000.
        /// </summary>
        public int MaintenanceIntervalMs
        {
            get
            {
                return _MaintenanceIntervalMs;
            }
            set
            {
                _MaintenanceIntervalMs = Math.Clamp(value, 500, 60000);
            }
        }

        /// <summary>
        /// Leader lease duration in milliseconds. Minimum 3000, maximum 600000, default 15000.
        /// </summary>
        public int LeaderLeaseMs
        {
            get
            {
                return _LeaderLeaseMs;
            }
            set
            {
                _LeaderLeaseMs = Math.Clamp(value, 3000, 600000);
            }
        }

        /// <summary>
        /// Cluster cap on any run's execution, in seconds. Compiled runs get the smaller of their own timeout and this
        /// cap, and the leader times out any leased or running run that started longer ago than this cap plus
        /// <see cref="DeadlineGraceSeconds"/>, whatever its stored deadline. Minimum 60, maximum 604800 (7 days),
        /// default 3600. Refreshed from the cluster setting Runtime.MaxRunSeconds.
        /// </summary>
        public int MaxRunSeconds
        {
            get
            {
                return _MaxRunSeconds;
            }
            set
            {
                _MaxRunSeconds = Math.Clamp(value, 60, 604800);
            }
        }

        /// <summary>
        /// Seconds a queued run may stay blocked (no Ready worker can run it) before the leader fails it with outcome
        /// NoCapableWorker. 0 never fails blocked runs. Minimum 0, maximum 604800 (7 days), default 0. Refreshed from the
        /// cluster setting Runtime.FailBlockedAfterSeconds.
        /// </summary>
        public int FailBlockedAfterSeconds
        {
            get
            {
                return _FailBlockedAfterSeconds;
            }
            set
            {
                _FailBlockedAfterSeconds = Math.Clamp(value, 0, 604800);
            }
        }

        /// <summary>
        /// Milliseconds a conversation turn that resumes a harness session waits for its affinity node (the node holding
        /// the conversation's directories) before any other capable node may claim it as a fallback. Other nodes take it
        /// at once when the affinity node is not Ready. 0 never waits. Minimum 0, maximum 600000 (10 minutes), default
        /// 30000. Refreshed from the cluster setting Runtime.ConversationAffinityWaitMs.
        /// </summary>
        public int ConversationAffinityWaitMs
        {
            get
            {
                return _ConversationAffinityWaitMs;
            }
            set
            {
                _ConversationAffinityWaitMs = Math.Clamp(value, 0, 600000);
            }
        }

        /// <summary>
        /// Most earlier turns repeated to a conversation turn that falls back to a fresh harness session; the newest ones
        /// are kept. Minimum 1, maximum 200, default 20. Refreshed from the cluster setting
        /// Runtime.ConversationTranscriptTurns.
        /// </summary>
        public int ConversationTranscriptTurns
        {
            get
            {
                return _ConversationTranscriptTurns;
            }
            set
            {
                _ConversationTranscriptTurns = Math.Clamp(value, 1, 200);
            }
        }

        /// <summary>
        /// Most characters of each earlier input and answer repeated to a fallback turn; longer ones are cut and marked
        /// as truncated. Minimum 200, maximum 200000, default 4000. Refreshed from the cluster setting
        /// Runtime.ConversationTranscriptChars.
        /// </summary>
        public int ConversationTranscriptChars
        {
            get
            {
                return _ConversationTranscriptChars;
            }
            set
            {
                _ConversationTranscriptChars = Math.Clamp(value, 200, 200000);
            }
        }

        /// <summary>
        /// Interval of the leader's pipeline sweep in milliseconds (P12.9): it advances pipeline runs whose stage run
        /// finished without a local completion hook (for example on another replica that crashed), links claimed stage
        /// executions, retries blocked stage starts, applies review timeouts and deadlines, and cancels stage runs left
        /// under finished pipeline runs. Minimum 500, maximum 600000, default 5000. Refreshed from the cluster setting
        /// Runtime.PipelineSweepIntervalMs.
        /// </summary>
        public int PipelineSweepIntervalMs
        {
            get
            {
                return _PipelineSweepIntervalMs;
            }
            set
            {
                _PipelineSweepIntervalMs = Math.Clamp(value, 500, 600000);
            }
        }

        /// <summary>
        /// Most stages a pipeline may have (P12.9). Minimum 1, maximum 100, default 20. Refreshed from the cluster setting
        /// Runtime.PipelineMaxStages.
        /// </summary>
        public int PipelineMaxStages
        {
            get
            {
                return _PipelineMaxStages;
            }
            set
            {
                _PipelineMaxStages = Math.Clamp(value, 1, 100);
            }
        }

        /// <summary>
        /// Interval at which this replica heartbeats its control node row, in milliseconds. Minimum 1000, maximum 60000,
        /// default 5000. Refreshed from the cluster setting ControlPlane.HeartbeatIntervalMs.
        /// </summary>
        public int ControlNodeHeartbeatMs
        {
            get
            {
                return _ControlNodeHeartbeatMs;
            }
            set
            {
                _ControlNodeHeartbeatMs = Math.Clamp(value, 1000, 60000);
            }
        }

        /// <summary>
        /// A control node row with no heartbeat for this long is marked Offline by the leader, in milliseconds. Keep it
        /// several heartbeat intervals long. Minimum 5000, maximum 600000, default 30000. Refreshed from the cluster
        /// setting ControlPlane.OfflineAfterMs.
        /// </summary>
        public int ControlNodeOfflineAfterMs
        {
            get
            {
                return _ControlNodeOfflineAfterMs;
            }
            set
            {
                _ControlNodeOfflineAfterMs = Math.Clamp(value, 5000, 600000);
            }
        }

        /// <summary>
        /// Hours an Offline control node row is kept (counted from its last heartbeat) before the leader deletes it.
        /// Minimum 1, maximum 8760 (one year), default 24. Refreshed from the cluster setting
        /// ControlPlane.OfflineRetentionHours.
        /// </summary>
        public int ControlNodeOfflineRetentionHours
        {
            get
            {
                return _ControlNodeOfflineRetentionHours;
            }
            set
            {
                _ControlNodeOfflineRetentionHours = Math.Clamp(value, 1, 8760);
            }
        }

        /// <summary>
        /// Pause tolerance (P3.16), in milliseconds. The leader's maintenance loop treats a tick as following a pause (the
        /// host slept, the container or VM was frozen, the clock jumped, or a very long garbage collection ran) when more
        /// than <see cref="MaintenanceIntervalMs"/> plus this value passed since its previous tick, or more than this value
        /// passed between two steps of one pass. After a pause it expires no leases, marks no node Lost and no control
        /// node Offline, enforces no deadline, and fails no blocked run until one heartbeat window
        /// (<see cref="PauseDeferralMs"/>) has passed since the resume. Keep it above the slowest expected maintenance
        /// query. Minimum 1000, maximum 600000, default 5000. Refreshed from the cluster setting Scheduling.PauseGraceMs.
        /// </summary>
        public int PauseGraceMs
        {
            get
            {
                return _PauseGraceMs;
            }
            set
            {
                _PauseGraceMs = Math.Clamp(value, 1000, 600000);
            }
        }

        /// <summary>
        /// How long destructive maintenance waits after a detected pause, in milliseconds: one full heartbeat window (the
        /// larger of <see cref="HeartbeatIntervalMs"/> and <see cref="ControlNodeHeartbeatMs"/>) plus
        /// <see cref="PauseGraceMs"/>, measured from the resume. Derived; 10000 with the defaults.
        /// </summary>
        public int PauseDeferralMs
        {
            get
            {
                return Math.Max(_HeartbeatIntervalMs, _ControlNodeHeartbeatMs) + _PauseGraceMs;
            }
        }

        #endregion

        /// <summary>Cluster queued-run admission limit, default 0 (unlimited), minimum 0.</summary>
        public int QueueDepthCluster { get; set; } = 0;
        /// <summary>Per-tenant queued-run admission limit, default 0 (unlimited), minimum 0.</summary>
        public int QueueDepthTenant { get; set; } = 0;
        /// <summary>Per-agent queued-run admission limit, default 0 (unlimited), minimum 0.</summary>
        public int QueueDepthAgent { get; set; } = 0;

        #region Private-Members

        private int _LeaseDurationMs = 30000;
        private int _LeaseWaitMs = 20000;
        private int _LeasePollMs = 500;
        private int _HeartbeatIntervalMs = 5000;
        private int _NodeHeartbeatTimeoutMs = 20000;
        private int _EventPollMs = 250;
        private int _InvocationWaitPollMs = 5000;
        private int _MaxSynchronousWaiters = 256;
        private int _PipelineSweepIntervalMs = 5000;
        private int _PipelineMaxStages = 20;
        private int _MaxDelegationDepth = 3;
        private int _DelegationChildQueueDepth = 100;
        private int _MaxFanOutWidth = 8;
        private int _GatherResultCharLimit = 16000;
        private int _DelegationRetryAfterSeconds = 5;
        private int _ChildWaitOrphanSeconds = 300;
        private int _DeadlineGraceSeconds = 120;
        private int _MaintenanceIntervalMs = 2000;
        private int _LeaderLeaseMs = 15000;
        private int _FailBlockedAfterSeconds = 0;
        private int _ConversationAffinityWaitMs = 30000;
        private int _ConversationTranscriptTurns = 20;
        private int _ConversationTranscriptChars = 4000;
        private int _MaxRunSeconds = 3600;
        private int _ControlNodeHeartbeatMs = 5000;
        private int _ControlNodeOfflineAfterMs = 30000;
        private int _ControlNodeOfflineRetentionHours = 24;
        private int _PauseGraceMs = 5000;

        #endregion
    }
}
