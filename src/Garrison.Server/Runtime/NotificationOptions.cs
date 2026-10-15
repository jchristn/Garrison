namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Notification runtime options (P12.14), refreshed from the Notifications.* cluster settings. Thread-safe for reads.
    /// </summary>
    public class NotificationOptions
    {
        #region Public-Members

        /// <summary>
        /// Whether loopback and private destinations are allowed. Default false. Link-local, multicast, and reserved addresses are always refused. Cluster setting Notifications.AllowPrivateDestinations.
        /// </summary>
        public bool AllowPrivateDestinations { get; set; } = false;

        /// <summary>
        /// Most attempts per delivery. Minimum 1, maximum 20, default 8. Cluster setting Notifications.MaxAttempts.
        /// </summary>
        public int MaxAttempts
        {
            get
            {
                return _MaxAttempts;
            }
            set
            {
                _MaxAttempts = Math.Clamp(value, 1, 20);
            }
        }

        /// <summary>
        /// Delay before the second attempt; each later delay doubles up to MaxBackoffSeconds. Minimum 1, maximum 3600, default 10. Cluster setting Notifications.InitialBackoffSeconds.
        /// </summary>
        public int InitialBackoffSeconds
        {
            get
            {
                return _InitialBackoffSeconds;
            }
            set
            {
                _InitialBackoffSeconds = Math.Clamp(value, 1, 3600);
            }
        }

        /// <summary>
        /// Longest delay between attempts. Minimum 1, maximum 86400, default 3600. Cluster setting Notifications.MaxBackoffSeconds.
        /// </summary>
        public int MaxBackoffSeconds
        {
            get
            {
                return _MaxBackoffSeconds;
            }
            set
            {
                _MaxBackoffSeconds = Math.Clamp(value, 1, 86400);
            }
        }

        /// <summary>
        /// Seconds one attempt may take. Minimum 1, maximum 60, default 10. Cluster setting Notifications.TimeoutSeconds.
        /// </summary>
        public int TimeoutSeconds
        {
            get
            {
                return _TimeoutSeconds;
            }
            set
            {
                _TimeoutSeconds = Math.Clamp(value, 1, 60);
            }
        }

        /// <summary>
        /// How often each replica looks for due deliveries, in milliseconds. Minimum 100, maximum 60000, default 1000. Cluster setting Notifications.DispatchIntervalMs.
        /// </summary>
        public int DispatchIntervalMs
        {
            get
            {
                return _DispatchIntervalMs;
            }
            set
            {
                _DispatchIntervalMs = Math.Clamp(value, 100, 60000);
            }
        }

        /// <summary>
        /// Seconds of scanned history the leader sweep reads again on every pass. Minimum 0, maximum 600, default 30. Cluster setting Notifications.SweepOverlapSeconds.
        /// </summary>
        public int SweepOverlapSeconds
        {
            get
            {
                return _SweepOverlapSeconds;
            }
            set
            {
                _SweepOverlapSeconds = Math.Clamp(value, 0, 600);
            }
        }

        /// <summary>
        /// Days finished deliveries are kept. Minimum 1, maximum 3650, default 14. Cluster setting Notifications.DeliveryRetentionDays.
        /// </summary>
        public int DeliveryRetentionDays
        {
            get
            {
                return _DeliveryRetentionDays;
            }
            set
            {
                _DeliveryRetentionDays = Math.Clamp(value, 1, 3650);
            }
        }

        /// <summary>
        /// Most due deliveries one replica claims per dispatch pass. Minimum 1, maximum 500, default 20.
        /// </summary>
        public int DispatchBatchSize
        {
            get
            {
                return _DispatchBatchSize;
            }
            set
            {
                _DispatchBatchSize = Math.Clamp(value, 1, 500);
            }
        }

        /// <summary>
        /// Most deliveries one replica sends at the same time. Minimum 1, maximum 128, default 8.
        /// </summary>
        public int MaxConcurrentDeliveries
        {
            get
            {
                return _MaxConcurrentDeliveries;
            }
            set
            {
                _MaxConcurrentDeliveries = Math.Clamp(value, 1, 128);
            }
        }

        /// <summary>
        /// Rows the leader sweep reads per event source per page. Minimum 10, maximum 10000, default 500.
        /// </summary>
        public int SweepBatchSize
        {
            get
            {
                return _SweepBatchSize;
            }
            set
            {
                _SweepBatchSize = Math.Clamp(value, 10, 10000);
            }
        }

        #endregion

        #region Private-Members

        private int _MaxAttempts = 8;
        private int _InitialBackoffSeconds = 10;
        private int _MaxBackoffSeconds = 3600;
        private int _TimeoutSeconds = 10;
        private int _DispatchIntervalMs = 1000;
        private int _SweepOverlapSeconds = 30;
        private int _DeliveryRetentionDays = 14;
        private int _DispatchBatchSize = 20;
        private int _MaxConcurrentDeliveries = 8;
        private int _SweepBatchSize = 500;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with defaults.
        /// </summary>
        public NotificationOptions()
        {
        }

        #endregion
    }
}
