namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Keeper scheduling options (AA1.14), refreshed from the Autonomy.* cluster settings. Thread-safe for reads.
    /// </summary>
    public class KeeperOptions
    {
        #region Public-Members

        /// <summary>
        /// How often the leader looks for due mandates and ticks whose run ended, in seconds. Minimum 1, maximum 60,
        /// default 5. Cluster setting Autonomy.SchedulerSweepSeconds.
        /// </summary>
        public int SchedulerSweepSeconds
        {
            get
            {
                return _SchedulerSweepSeconds;
            }
            set
            {
                _SchedulerSweepSeconds = Math.Clamp(value, 1, 60);
            }
        }

        /// <summary>
        /// Floor for every mandate revision's minimum interval, in seconds. Minimum 10, maximum 86400, default 60. Revisions
        /// saved with a smaller minimum are raised to it with a warning. Cluster setting Autonomy.MinIntervalSeconds.
        /// </summary>
        public int MinIntervalSeconds
        {
            get
            {
                return _MinIntervalSeconds;
            }
            set
            {
                _MinIntervalSeconds = Math.Clamp(value, 10, 86400);
            }
        }

        /// <summary>
        /// Ceiling for every mandate revision's maximum interval, in seconds. Minimum 60, maximum 2592000, default 604800
        /// (7 days). Revisions saved with a larger maximum are lowered to it with a warning. Cluster setting
        /// Autonomy.MaxIntervalSeconds.
        /// </summary>
        public int MaxIntervalSeconds
        {
            get
            {
                return _MaxIntervalSeconds;
            }
            set
            {
                _MaxIntervalSeconds = Math.Clamp(value, 60, 2592000);
            }
        }

        /// <summary>
        /// Jitter percent for revisions that set none. Minimum 0, maximum 50, default 10. Cluster setting
        /// Autonomy.DefaultJitterPercent.
        /// </summary>
        public int DefaultJitterPercent
        {
            get
            {
                return _DefaultJitterPercent;
            }
            set
            {
                _DefaultJitterPercent = Math.Clamp(value, 0, 50);
            }
        }

        /// <summary>
        /// Most due mandates the leader claims in one sweep; the rest wait for the next sweep. Minimum 1, maximum 10000,
        /// default 100. Cluster setting Autonomy.MaxDueClaimsPerSweep.
        /// </summary>
        public int MaxDueClaimsPerSweep
        {
            get
            {
                return _MaxDueClaimsPerSweep;
            }
            set
            {
                _MaxDueClaimsPerSweep = Math.Clamp(value, 1, 10000);
            }
        }

        /// <summary>
        /// Days finished tick history is kept. Minimum 1, maximum 3650, default 30. Cluster setting
        /// Autonomy.TickHistoryRetentionDays.
        /// </summary>
        public int TickHistoryRetentionDays
        {
            get
            {
                return _TickHistoryRetentionDays;
            }
            set
            {
                _TickHistoryRetentionDays = Math.Clamp(value, 1, 3650);
            }
        }

        /// <summary>
        /// Recent tick summaries included in a tick's input, newest first. Minimum 0, maximum 100, default 5. Cluster setting
        /// Autonomy.TickInputRecentTicks.
        /// </summary>
        public int TickInputRecentTicks
        {
            get
            {
                return _TickInputRecentTicks;
            }
            set
            {
                _TickInputRecentTicks = Math.Clamp(value, 0, 100);
            }
        }

        #endregion

        #region Private-Members

        private int _SchedulerSweepSeconds = 5;
        private int _MinIntervalSeconds = 60;
        private int _MaxIntervalSeconds = 604800;
        private int _DefaultJitterPercent = 10;
        private int _MaxDueClaimsPerSweep = 100;
        private int _TickHistoryRetentionDays = 30;
        private int _TickInputRecentTicks = 5;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with defaults.
        /// </summary>
        public KeeperOptions()
        {
        }

        #endregion
    }
}
