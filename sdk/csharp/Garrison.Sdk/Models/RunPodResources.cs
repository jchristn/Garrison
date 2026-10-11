namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// CPU, memory, and ephemeral storage requests and limits for the run pod of a KubernetesJob run, as Kubernetes
    /// quantities (for example 500m, 2, 512Mi, 4Gi). Null means unset: the worker's defaults apply. Ignored for
    /// Process runs.
    /// </summary>
    public class RunPodResources
    {
        #region Public-Members

        /// <summary>
        /// CPU request (for example 250m). Null for unset.
        /// </summary>
        public string? CpuRequest { get; set; } = null;

        /// <summary>
        /// CPU limit (for example 2). Null for unset.
        /// </summary>
        public string? CpuLimit { get; set; } = null;

        /// <summary>
        /// Memory request (for example 512Mi). Null for unset.
        /// </summary>
        public string? MemoryRequest { get; set; } = null;

        /// <summary>
        /// Memory limit (for example 2Gi). A run that exceeds it is OOMKilled and fails with outcome PodFailed. Null for unset.
        /// </summary>
        public string? MemoryLimit { get; set; } = null;

        /// <summary>
        /// Ephemeral storage request (for example 1Gi). Null for unset.
        /// </summary>
        public string? EphemeralStorageRequest { get; set; } = null;

        /// <summary>
        /// Ephemeral storage limit (for example 10Gi). Null for unset.
        /// </summary>
        public string? EphemeralStorageLimit { get; set; } = null;

        #endregion
    }
}
