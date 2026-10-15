namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Trigger runtime options (P12.5), refreshed from the Triggers.* cluster settings. Thread-safe for reads.
    /// </summary>
    public class TriggerOptions
    {
        #region Public-Members

        /// <summary>
        /// Largest webhook request body in bytes; larger deliveries answer 413. Minimum 1024, maximum 1048576, default 262144. Cluster setting Triggers.WebhookMaxBodyBytes.
        /// </summary>
        public int WebhookMaxBodyBytes
        {
            get
            {
                return _WebhookMaxBodyBytes;
            }
            set
            {
                _WebhookMaxBodyBytes = Math.Clamp(value, 1024, 1048576);
            }
        }

        /// <summary>
        /// Largest difference in seconds between a webhook signature timestamp and the server clock. Minimum 30, maximum 3600, default 300. Cluster setting Triggers.WebhookToleranceSeconds.
        /// </summary>
        public int WebhookToleranceSeconds
        {
            get
            {
                return _WebhookToleranceSeconds;
            }
            set
            {
                _WebhookToleranceSeconds = Math.Clamp(value, 30, 3600);
            }
        }

        /// <summary>
        /// Missed cron occurrences collapse into one fire for the latest one unless it is older than this many seconds, in which case it is recorded as Skipped. 0 always fires once. Minimum 0, maximum 604800, default 3600. Cluster setting Triggers.CronMaxLatenessSeconds.
        /// </summary>
        public int CronMaxLatenessSeconds
        {
            get
            {
                return _CronMaxLatenessSeconds;
            }
            set
            {
                _CronMaxLatenessSeconds = Math.Clamp(value, 0, 604800);
            }
        }

        /// <summary>
        /// Days fire history is retained. Minimum 1, maximum 3650, default 30. Cluster setting Triggers.FireRetentionDays.
        /// </summary>
        public int FireRetentionDays
        {
            get
            {
                return _FireRetentionDays;
            }
            set
            {
                _FireRetentionDays = Math.Clamp(value, 1, 3650);
            }
        }

        /// <summary>
        /// Most due cron triggers the leader fires in one maintenance pass; the rest wait for the next pass. Minimum 1, maximum 10000, default 100.
        /// </summary>
        public int SweepBatchSize
        {
            get
            {
                return _SweepBatchSize;
            }
            set
            {
                _SweepBatchSize = Math.Clamp(value, 1, 10000);
            }
        }

        #endregion

        #region Private-Members

        private int _WebhookMaxBodyBytes = 262144;
        private int _WebhookToleranceSeconds = 300;
        private int _CronMaxLatenessSeconds = 3600;
        private int _FireRetentionDays = 30;
        private int _SweepBatchSize = 100;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with defaults.
        /// </summary>
        public TriggerOptions()
        {
        }

        #endregion
    }
}
