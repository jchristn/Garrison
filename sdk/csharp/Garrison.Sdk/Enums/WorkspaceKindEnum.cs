namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Kind of run workspace.
    /// </summary>
    public enum WorkspaceKindEnum
    {
        /// <summary>
        /// Empty.
        /// </summary>
        Empty,

        /// <summary>
        /// GitRepository.
        /// </summary>
        GitRepository,

        /// <summary>
        /// Seeded.
        /// </summary>
        Seeded,

        /// <summary>
        /// PersistentVolume: a Kubernetes PersistentVolumeClaim (named by persistentVolumeClaim) mounted at the
        /// workspace path of the run pod. KubernetesJob runs only; the contents persist across runs.
        /// </summary>
        PersistentVolume
    }
}
