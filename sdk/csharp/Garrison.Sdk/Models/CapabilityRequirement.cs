namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A node label a run needs when its agent uses a capability, for example garrison.io/tool-pandoc=true. Not
    /// thread-safe.
    /// </summary>
    public class CapabilityRequirement
    {
        #region Public-Members

        /// <summary>
        /// Node label key. The server accepts 1 to 256 characters. Never null.
        /// </summary>
        public string Key
        {
            get
            {
                return _Key;
            }
            set
            {
                _Key = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Node label value the node must report. The server accepts up to 256 characters. Default "true". Never null.
        /// </summary>
        public string Value
        {
            get
            {
                return _Value;
            }
            set
            {
                _Value = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _Key = String.Empty;
        private string _Value = "true";

        #endregion
    }
}
