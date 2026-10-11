namespace Garrison.Worker.Kubernetes
{
    /// <summary>
    /// Where a run pod is in its life, as seen by the worker.
    /// </summary>
    public enum RunPodStateEnum
    {
        /// <summary>
        /// Waiting to be scheduled, pulling its image, or mounting volumes; may still start.
        /// </summary>
        Pending,

        /// <summary>
        /// The run container started (running or already finished): its log can be read.
        /// </summary>
        Started,

        /// <summary>
        /// The pod cannot start or was stopped by Kubernetes (image pull failure, invalid configuration, eviction,
        /// deadline); the run fails.
        /// </summary>
        Failed
    }
}
