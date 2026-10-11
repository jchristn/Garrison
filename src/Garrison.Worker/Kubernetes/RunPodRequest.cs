namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Protocol;

    /// <summary>
    /// Inputs for building one run's Job and spec Secret.
    /// </summary>
    public class RunPodRequest
    {
        #region Public-Members

        /// <summary>
        /// The leased run.
        /// </summary>
        public RunAssignment Assignment
        {
            get
            {
                return _Assignment;
            }
            set
            {
                _Assignment = value ?? throw new ArgumentNullException(nameof(Assignment));
            }
        }

        /// <summary>
        /// Name of the worker node creating the Job (its pod name in a cluster).
        /// </summary>
        public string NodeName { get; set; } = String.Empty;

        /// <summary>
        /// Run namespace.
        /// </summary>
        public string Namespace { get; set; } = "default";

        /// <summary>
        /// Run pod image.
        /// </summary>
        public string Image { get; set; } = String.Empty;

        /// <summary>
        /// Image pull policy, or null for the Kubernetes default.
        /// </summary>
        public string? ImagePullPolicy { get; set; } = null;

        /// <summary>
        /// Image pull secret names.
        /// </summary>
        public List<string> ImagePullSecrets
        {
            get
            {
                return _ImagePullSecrets;
            }
            set
            {
                _ImagePullSecrets = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Serialized <see cref="RunPodEnvelope"/> stored in the spec Secret.
        /// </summary>
        public string EnvelopeJson { get; set; } = String.Empty;

        #endregion

        #region Private-Members

        private RunAssignment _Assignment = new RunAssignment();
        private List<string> _ImagePullSecrets = new List<string>();

        #endregion
    }
}
