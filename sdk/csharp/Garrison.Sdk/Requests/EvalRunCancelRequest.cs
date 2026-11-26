namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Cancel an eval run (AA9.12). Not thread-safe.
    /// </summary>
    public class EvalRunCancelRequest
    {
        #region Public-Members

        /// <summary>
        /// Why, or null. Stored with the eval run's failure reason; at most 2000 characters with the canceller's name.
        /// </summary>
        public string? Reason { get; set; } = null;

        #endregion
    }
}
