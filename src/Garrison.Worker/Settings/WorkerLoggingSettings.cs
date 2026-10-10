namespace Garrison.Worker.Settings
{
    using System;

    /// <summary>
    /// Worker logging settings.
    /// </summary>
    public class WorkerLoggingSettings
    {
        #region Public-Members

        /// <summary>
        /// Whether to log to the console. Default true.
        /// </summary>
        public bool ConsoleLogging { get; set; } = true;

        /// <summary>
        /// Minimum severity (0 debug to 7 emergency). Minimum 0, maximum 7, default 1.
        /// </summary>
        public int MinimumSeverity
        {
            get
            {
                return _MinimumSeverity;
            }
            set
            {
                _MinimumSeverity = Math.Clamp(value, 0, 7);
            }
        }

        #endregion

        #region Private-Members

        private int _MinimumSeverity = 1;

        #endregion
    }
}
