namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Escalation options (AA2), refreshed from the Escalations.* cluster settings. Thread-safe for reads.
    /// </summary>
    public class EscalationOptions
    {
        #region Public-Members

        /// <summary>
        /// Timeout in seconds for an escalation raised without one. Minimum 60, maximum 2592000 (30 days), default 86400 (one
        /// day). Cluster setting Escalations.DefaultTimeoutSeconds.
        /// </summary>
        public int DefaultTimeoutSeconds
        {
            get
            {
                return _DefaultTimeoutSeconds;
            }
            set
            {
                _DefaultTimeoutSeconds = Math.Clamp(value, 60, 2592000);
            }
        }

        /// <summary>
        /// Most UTF-8 bytes in an escalation's question and context together. Minimum 256, maximum 65536, default 8192.
        /// Cluster setting Escalations.MaxQuestionBytes.
        /// </summary>
        public int MaxQuestionBytes
        {
            get
            {
                return _MaxQuestionBytes;
            }
            set
            {
                _MaxQuestionBytes = Math.Clamp(value, 256, 65536);
            }
        }

        /// <summary>
        /// Most expired escalations the leader handles in one sweep. Minimum 1, maximum 10000, default 100.
        /// </summary>
        public int MaxExpiredPerSweep
        {
            get
            {
                return _MaxExpiredPerSweep;
            }
            set
            {
                _MaxExpiredPerSweep = Math.Clamp(value, 1, 10000);
            }
        }

        #endregion

        #region Private-Members

        private int _DefaultTimeoutSeconds = 86400;
        private int _MaxQuestionBytes = 8192;
        private int _MaxExpiredPerSweep = 100;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with defaults.
        /// </summary>
        public EscalationOptions()
        {
        }

        #endregion
    }
}
