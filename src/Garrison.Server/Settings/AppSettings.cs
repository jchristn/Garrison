namespace Garrison.Server.Settings
{
    using System;

    /// <summary>
    /// Agentic app UI settings (AD6.5).
    /// </summary>
    public class AppSettings
    {
        #region Public-Members

        /// <summary>
        /// How long a signed-in user's app session lasts, in minutes. Default 480; minimum 5; maximum 10080.
        /// Environment: GARRISON_APPS_SESSION_MINUTES.
        /// </summary>
        public int SessionMinutes
        {
            get
            {
                return _SessionMinutes;
            }
            set
            {
                _SessionMinutes = Math.Clamp(value, 5, 10080);
            }
        }

        /// <summary>
        /// How long an anonymous app session lasts, in minutes. Default 60; minimum 5; maximum 1440.
        /// Environment: GARRISON_APPS_ANONYMOUS_SESSION_MINUTES.
        /// </summary>
        public int AnonymousSessionMinutes
        {
            get
            {
                return _AnonymousSessionMinutes;
            }
            set
            {
                _AnonymousSessionMinutes = Math.Clamp(value, 5, 1440);
            }
        }

        /// <summary>
        /// Most messages one app session may send per minute. Default 30; minimum 1; maximum 1000.
        /// Environment: GARRISON_APPS_MESSAGES_PER_MINUTE.
        /// </summary>
        public int MessagesPerMinute
        {
            get
            {
                return _MessagesPerMinute;
            }
            set
            {
                _MessagesPerMinute = Math.Clamp(value, 1, 1000);
            }
        }

        #endregion

        #region Private-Members

        private int _SessionMinutes = 480;
        private int _AnonymousSessionMinutes = 60;
        private int _MessagesPerMinute = 30;

        #endregion
    }
}
