namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// One thing a keeper observes on each tick (AA1), for example "status page HTTP code" or "open incidents". Belongs to
    /// a mandate revision. Not thread-safe.
    /// </summary>
    public class MandateRevisionSignal
    {
        #region Public-Members

        /// <summary>
        /// Signal name: 1 to 128 characters, unique within the revision.
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
        /// How to observe the signal and what to look for, or null. At most 2000 characters.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Position in the revision's list, starting at 0. Assigned by the server from list order.
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
        /// Instantiate with defaults.
        /// </summary>
        public MandateRevisionSignal()
        {
        }

        #endregion
    }
}
