namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// One choice offered by an escalation (AA2), for example "refund" or "wait". An answer to an escalation with options
    /// names one of them by key. Not thread-safe.
    /// </summary>
    public class EscalationOption
    {
        #region Public-Members

        /// <summary>
        /// Option key: 1 to 64 characters, unique (ignoring case) within the escalation. Answers name it as their choice.
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
        /// Text shown to whoever answers, or null to show the key. At most 512 characters.
        /// </summary>
        public string? Label { get; set; } = null;

        /// <summary>
        /// Position in the list, starting at 0. Assigned by the server from list order.
        /// </summary>
        public int Order
        {
            get
            {
                return _Order;
            }
            set
            {
                _Order = Math.Max(0, value);
            }
        }

        #endregion

        #region Private-Members

        private string _Key = String.Empty;
        private int _Order = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with defaults.
        /// </summary>
        public EscalationOption()
        {
        }

        #endregion
    }
}
