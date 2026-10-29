namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// A node label a run needs when its agent uses a capability (AD4.4), for example garrison.io/tool-pandoc=true. Runs
    /// carry these as run requirements, so the scheduler places them only on nodes whose labels match.
    /// </summary>
    public class CapabilityRequirement
    {
        #region Public-Members

        /// <summary>
        /// Node label key. 1 to 256 characters.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the key is empty or longer than 256 characters.</exception>
        public string Key
        {
            get
            {
                return _Key;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value) || value.Length > 256) throw new ArgumentException("A requirement key is 1 to 256 characters.", nameof(Key));
                _Key = value;
            }
        }

        /// <summary>
        /// Node label value the node must report. Up to 256 characters. Default "true".
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is longer than 256 characters.</exception>
        public string Value
        {
            get
            {
                return _Value;
            }
            set
            {
                string v = value ?? String.Empty;
                if (v.Length > 256) throw new ArgumentException("A requirement value is at most 256 characters.", nameof(Value));
                _Value = v;
            }
        }

        #endregion

        #region Private-Members

        private string _Key = "garrison.io/tool-unset";
        private string _Value = "true";

        #endregion
    }
}
