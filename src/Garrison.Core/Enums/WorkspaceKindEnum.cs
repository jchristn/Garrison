namespace Garrison.Core.Enums
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
        /// A Kubernetes PersistentVolumeClaim (named by the template's persistentVolumeClaim) mounted at the workspace
        /// path of the run pod. Only runs with the KubernetesJob executor can use it; the contents persist across runs.
        /// </summary>
        PersistentVolume
    }
}
