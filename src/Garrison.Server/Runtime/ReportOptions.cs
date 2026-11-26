namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Report options (AA5), refreshed from the Reports.* cluster settings. Thread-safe for reads.
    /// </summary>
    public class ReportOptions
    {
        #region Public-Members

        /// <summary>
        /// Most UTF-8 bytes in a report body. Minimum 256, maximum 262144, default 32768. Cluster setting
        /// Reports.MaxBodyBytes.
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

        /// <summary>
        /// Most subordinate reports a keeper tick's input carries, the newest ones. Minimum 0 (no digest), maximum 200,
        /// default 20. Cluster setting Reports.DigestMaxReports.
        /// </summary>
        public int DigestMaxReports
        {
            get
            {
                return _DigestMaxReports;
            }
            set
            {
                _DigestMaxReports = Math.Clamp(value, 0, 200);
            }
        }

        #endregion

        #region Private-Members

        private int _MaxBodyBytes = 32768;
        private int _DigestMaxReports = 20;

        #endregion
    }
}
