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

        #endregion

        #region Private-Members

        private int _LeaseDurationMs = 30000;
        private int _LeaseWaitMs = 20000;
        private int _LeasePollMs = 500;
        private int _HeartbeatIntervalMs = 5000;
        private int _NodeHeartbeatTimeoutMs = 20000;
        private int _EventPollMs = 250;
        private int _MaxDelegationDepth = 3;
        private int _DeadlineGraceSeconds = 120;
        private int _MaintenanceIntervalMs = 2000;
        private int _LeaderLeaseMs = 15000;

        #endregion
    }
}
