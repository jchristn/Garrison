namespace Garrison.Worker.Kubernetes
{
    /// <summary>
    /// Kind of protocol line a run pod writes to its stdout.
    /// </summary>
    public enum PodLineTypeEnum
    {
        /// <summary>
        /// The harness process started (carries its process ID).
        /// </summary>
        Started,

        /// <summary>
        /// A normalized run event.
        /// </summary>
        Event,

        /// <summary>
        /// The final completion report. The worker accepts the first one and ignores anything after it.
        /// </summary>
        Complete,

        /// <summary>
        /// A file the harness changed under the conversation file space mount path (AD3.4). The worker writes it back to
        /// the file space with its own credentials; the pod has none.
        /// </summary>
        FileChanged
    }
}
