namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// A request that names only the draft version the caller read (request-apply). Not thread-safe.
    /// </summary>
    public class StudioDraftVersionRequest
    {
        #region Public-Members

        /// <summary>
        /// The draft version the caller read. Minimum 1, default 1.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when set below 1.</exception>
        public int Version
        {
            get
            {
                return _Version;
            }
            set
            {
                if (value < 1) throw new ArgumentOutOfRangeException(nameof(Version), "Version is 1 or more.");
                _Version = value;
            }
        }

        #endregion

        #region Private-Members

        private int _Version = 1;

        #endregion
    }
}
