namespace Garrison.Core.Models
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// CPU, memory, and ephemeral storage requests and limits for the run pod of a KubernetesJob run (P11.5). Values are
    /// Kubernetes quantities (for example <c>500m</c>, <c>2</c>, <c>512Mi</c>, <c>4Gi</c>). Null or empty means unset:
    /// the worker's defaults apply (<c>Kubernetes.DefaultResources</c> in the worker settings), and when those are unset
    /// too, the namespace's LimitRange or no limit. Ignored for Process runs. Blank strings are stored as null.
    /// </summary>
    public class RunPodResources
    {
        #region Public-Members

        /// <summary>
        /// CPU request (for example 250m). Null for unset.
        /// </summary>
        public string? CpuRequest
        {
            get
            {
                return _CpuRequest;
            }
            set
            {
                _CpuRequest = Normalize(value);
            }
        }

        /// <summary>
        /// CPU limit (for example 2). Null for unset.
        /// </summary>
        public string? CpuLimit
        {
            get
            {
                return _CpuLimit;
            }
            set
            {
                _CpuLimit = Normalize(value);
            }
        }

        /// <summary>
        /// Memory request (for example 512Mi). Null for unset.
        /// </summary>
        public string? MemoryRequest
        {
            get
            {
                return _MemoryRequest;
            }
            set
            {
                _MemoryRequest = Normalize(value);
            }
        }

        /// <summary>
        /// Memory limit (for example 2Gi). A run that exceeds it is OOMKilled and fails with outcome PodFailed. Null for unset.
        /// </summary>
        public string? MemoryLimit
        {
            get
            {
                return _MemoryLimit;
            }
            set
            {
                _MemoryLimit = Normalize(value);
            }
        }

        /// <summary>
        /// Ephemeral storage request (for example 1Gi), covering the emptyDir workspace, home, and temporary directories. Null for unset.
        /// </summary>
        public string? EphemeralStorageRequest
        {
            get
            {
                return _EphemeralStorageRequest;
            }
            set
            {
                _EphemeralStorageRequest = Normalize(value);
            }
        }

        /// <summary>
        /// Ephemeral storage limit (for example 10Gi). A pod that exceeds it is evicted and the run fails with outcome PodFailed. Null for unset.
        /// </summary>
        public string? EphemeralStorageLimit
        {
            get
            {
                return _EphemeralStorageLimit;
            }
            set
            {
                _EphemeralStorageLimit = Normalize(value);
            }
        }

        /// <summary>
        /// Whether no value is set.
        /// </summary>
        [JsonIgnore]
        public bool IsEmpty
        {
            get
            {
                return _CpuRequest == null && _CpuLimit == null && _MemoryRequest == null && _MemoryLimit == null && _EphemeralStorageRequest == null && _EphemeralStorageLimit == null;
            }
        }

        #endregion

        #region Private-Members

        private string? _CpuRequest = null;
        private string? _CpuLimit = null;
        private string? _MemoryRequest = null;
        private string? _MemoryLimit = null;
        private string? _EphemeralStorageRequest = null;
        private string? _EphemeralStorageLimit = null;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Copy the values.
        /// </summary>
        /// <returns>A new instance with the same values.</returns>
        public RunPodResources Clone()
        {
            RunPodResources copy = new RunPodResources();
            copy.CpuRequest = _CpuRequest;
            copy.CpuLimit = _CpuLimit;
            copy.MemoryRequest = _MemoryRequest;
            copy.MemoryLimit = _MemoryLimit;
            copy.EphemeralStorageRequest = _EphemeralStorageRequest;
            copy.EphemeralStorageLimit = _EphemeralStorageLimit;
            return copy;
        }

        #endregion

        #region Private-Methods

        private static string? Normalize(string? value)
        {
            return String.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        #endregion
    }
}
