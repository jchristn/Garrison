namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Worker node (Post).
    /// </summary>
    public class Node
    {
        #region Public-Members

        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? String.Empty : value;
            }
        }

        /// <summary>
        /// Node name, unique (Kubernetes pod name).
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Node pool.
        /// </summary>
        public string? NodePoolId { get; set; } = null;

        /// <summary>
        /// Informational address.
        /// </summary>
        public string? Address { get; set; } = null;

        /// <summary>
        /// Worker software version.
        /// </summary>
        public string? NodeVersion { get; set; } = null;

        /// <summary>
        /// Status.
        /// </summary>
        public NodeStatusEnum Status { get; set; } = NodeStatusEnum.Ready;

        /// <summary>
        /// Run capacity. Minimum 1, maximum 1000, default 4.
        /// </summary>
        public int MaxConcurrentRuns
        {
            get
            {
                return _MaxConcurrentRuns;
            }
            set
            {
                _MaxConcurrentRuns = Math.Clamp(value, 1, 1000);
            }
        }

        /// <summary>
        /// Runs currently held.
        /// </summary>
        public int ActiveRuns { get; set; } = 0;

        /// <summary>
        /// Credential the node authenticates with.
        /// </summary>
        public string? CredentialId { get; set; } = null;

        /// <summary>
        /// Last heartbeat (UTC).
        /// </summary>
        public DateTime? LastHeartbeatUtc { get; set; } = null;

        /// <summary>
        /// Last registration (UTC).
        /// </summary>
        public DateTime? RegisteredUtc { get; set; } = null;

        /// <summary>
        /// Whether the record is active.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Whether the record is protected from deletion.
        /// </summary>
        public bool IsProtected { get; set; } = false;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc
        {
            get
            {
                return _CreatedUtc;
            }
            set
            {
                _CreatedUtc = value;
            }
        }

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc
        {
            get
            {
                return _LastUpdateUtc;
            }
            set
            {
                _LastUpdateUtc = value;
            }
        }

        /// <summary>
        /// Labels.
        /// </summary>
        public List<NodeLabel> Labels
        {
            get
            {
                return _Labels;
            }
            set
            {
                _Labels = value ?? new List<NodeLabel>();
            }
        }

        /// <summary>
        /// Harness capabilities detected by probes.
        /// </summary>
        public List<NodeCapability> Capabilities
        {
            get
            {
                return _Capabilities;
            }
            set
            {
                _Capabilities = value ?? new List<NodeCapability>();
            }
        }

        /// <summary>
        /// Executors the node reports (Process, and KubernetesJob when it can create Jobs). Empty means Process only.
        /// </summary>
        public List<RunExecutorEnum> Executors
        {
            get
            {
                return _Executors;
            }
            set
            {
                _Executors = value ?? new List<RunExecutorEnum>();
            }
        }

        /// <summary>Reported executor capabilities. Empty means no advanced capability promise.</summary>
        public List<ExecutorCapabilities> ExecutorCapabilities
        {
            get { return _ExecutorCapabilities; }
            set { _ExecutorCapabilities = value ?? new List<ExecutorCapabilities>(); }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _Name = String.Empty;
        private int _MaxConcurrentRuns = 4;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<NodeLabel> _Labels = new List<NodeLabel>();
        private List<NodeCapability> _Capabilities = new List<NodeCapability>();
        private List<RunExecutorEnum> _Executors = new List<RunExecutorEnum>();

        private List<ExecutorCapabilities> _ExecutorCapabilities = new List<ExecutorCapabilities>();

        #endregion
    }
}
