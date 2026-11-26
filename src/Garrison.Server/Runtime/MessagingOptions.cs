namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Messaging options (AA6), refreshed from the Messaging.* cluster settings. Thread-safe for reads.
    /// </summary>
    public class MessagingOptions
    {
        #region Public-Members

        /// <summary>
        /// Most agent-to-agent hops a message may travel; a message that would travel more is rejected with HopLimit.
        /// Cluster setting Messaging.MaxHops. Minimum 1, maximum 64, default 8.
        /// </summary>
        public int MaxHops
        {
            get
            {
                return _MaxHops;
            }
            set
            {
                _MaxHops = Math.Clamp(value, 1, 64);
            }
        }

        /// <summary>
        /// Most messages one sender may send one recipient in any 60 seconds; more are rejected with LineRate. Counted in
        /// the database, so the limit holds across replicas. Cluster setting Messaging.LineRatePerMinute. Minimum 1,
        /// maximum 6000, default 30.
        /// </summary>
        public int LineRatePerMinute
        {
            get
            {
                return _LineRatePerMinute;
            }
            set
            {
                _LineRatePerMinute = Math.Clamp(value, 1, 6000);
            }
        }

        /// <summary>
        /// Most messages one thread may hold; more are rejected with ThreadBudget. Cluster setting Messaging.ThreadBudget.
        /// Minimum 2, maximum 100000, default 200.
        /// </summary>
        public int ThreadBudget
        {
            get
            {
                return _ThreadBudget;
            }
            set
            {
                _ThreadBudget = Math.Clamp(value, 2, 100000);
            }
        }

        /// <summary>
        /// Most urgent wakes per recipient agent in any hour. Above it, and at 0, urgent mail waits like normal mail.
        /// Cluster setting Messaging.UrgentWakesPerHour. Minimum 0, maximum 3600, default 12.
        /// </summary>
        public int UrgentWakesPerHour
        {
            get
            {
                return _UrgentWakesPerHour;
            }
            set
            {
                _UrgentWakesPerHour = Math.Clamp(value, 0, 3600);
            }
        }

        /// <summary>
        /// Most messages one run receives in its input or from one garrison_read_inbox call, oldest first; the rest stay
        /// queued. Cluster setting Messaging.MaxMessagesPerDelivery. Minimum 1, maximum 500, default 50.
        /// </summary>
        public int MaxMessagesPerDelivery
        {
            get
            {
                return _MaxMessagesPerDelivery;
            }
            set
            {
                _MaxMessagesPerDelivery = Math.Clamp(value, 1, 500);
            }
        }

        /// <summary>
        /// Most UTF-8 bytes in a message body. A larger body is refused with a validation error. Cluster setting
        /// Messaging.MaxBodyBytes. Minimum 256, maximum 262144, default 16384.
        /// </summary>
        public int MaxBodyBytes
        {
            get
            {
                return _MaxBodyBytes;
            }
            set
            {
                _MaxBodyBytes = Math.Clamp(value, 256, 262144);
            }
        }

        #endregion

        #region Private-Members

        private int _MaxHops = 8;
        private int _LineRatePerMinute = 30;
        private int _ThreadBudget = 200;
        private int _UrgentWakesPerHour = 12;
        private int _MaxMessagesPerDelivery = 50;
        private int _MaxBodyBytes = 16384;

        #endregion
    }
}
