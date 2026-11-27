namespace Garrison.Server.Runtime
{
    /// <summary>
    /// What cancelling one run during an org-scale brake did (AA11.4). Immutable.
    /// </summary>
    public class OrgCancelOutcome
    {
        /// <summary>
        /// True when a cancellation was requested; false when the run had already finished.
        /// </summary>
        public bool Requested { get; }

        /// <summary>
        /// True when the run carried a keeper tick.
        /// </summary>
        public bool Tick { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="requested">True when a cancellation was requested.</param>
        /// <param name="tick">True when the run carried a keeper tick.</param>
        public OrgCancelOutcome(bool requested, bool tick)
        {
            Requested = requested;
            Tick = tick;
        }
    }
}
