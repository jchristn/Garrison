namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Abort a running canary release (AA9.8): its deployments go back to the weights they had when it started.
    /// </summary>
    public class CanaryAbortRequest
    {
        /// <summary>
        /// Why, at most 2000 characters, or null.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
