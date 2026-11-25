namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// One signal a keeper watches (AA1): a named thing to check on each tick, in a fixed order.
    /// </summary>
    public class MandateRevisionSignal
    {
        #region Public-Members

        /// <summary>
        /// Signal name. Never null.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Optional description of what to check.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Position in the list, starting at 0. Minimum 0.
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

        private string _Name = String.Empty;
        private int _Order = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MandateRevisionSignal()
        {
        }

        #endregion
    }
}
