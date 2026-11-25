namespace Garrison.Core.Manifests
{
    /// <summary>
    /// Mandate manifest spec (kind: Mandate, AA1.12). The agent and deployment are referenced by name. The inline revision
    /// is what the keeper is for; applying a document whose revision differs from the current one publishes a new
    /// revision, resets the interval, and wakes an active mandate. Applied mandates run as the principal that applied the
    /// manifest.
    /// </summary>
    public class MandateSpec
    {
        /// <summary>
        /// Description for people.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Agent name. Required.
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// Deployment name of the agent that runs each tick. Required.
        /// </summary>
        public string? Deployment { get; set; } = null;

        /// <summary>
        /// True to keep the mandate Paused; false or null makes it Active once it has a revision.
        /// </summary>
        public bool? Paused { get; set; } = null;

        /// <summary>
        /// The current revision. Required.
        /// </summary>
        public MandateRevisionSpec? Revision { get; set; } = null;
    }
}
