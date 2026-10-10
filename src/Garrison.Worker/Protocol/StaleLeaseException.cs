namespace Garrison.Worker.Protocol
{
    /// <summary>
    /// Raised when the control plane rejects a run-scoped call with 409: this worker no longer holds the lease and
    /// must kill the harness process.
    /// </summary>
    public class StaleLeaseException : NodeProtocolException
    {
        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="message">Message.</param>
        public StaleLeaseException(string runId, string message) : base(409, message)
        {
            RunId = runId;
        }
    }
}
