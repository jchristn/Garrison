namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// A call one member of an app may make to another, in a studio draft's graph. Not thread-safe.
    /// </summary>
    public class StudioGraphEdge
    {
        #region Public-Members

        /// <summary>
        /// App name. Never null.
        /// </summary>
        public string App
        {
            get
            {
                return _App;
            }
            set
            {
                _App = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Calling agent name. Never null.
        /// </summary>
        public string From
        {
            get
            {
                return _From;
            }
            set
            {
                _From = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Called agent name. Never null.
        /// </summary>
        public string To
        {
            get
            {
                return _To;
            }
            set
            {
                _To = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether the caller may reach the callee through garrison_fan_out. Default true.
        /// </summary>
        public bool FanOut { get; set; } = true;

        #endregion

        #region Private-Members

        private string _App = String.Empty;
        private string _From = String.Empty;
        private string _To = String.Empty;

        #endregion
    }
}
