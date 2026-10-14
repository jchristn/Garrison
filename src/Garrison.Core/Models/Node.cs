namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Worker node (Post).
    /// </summary>
    public class Node
    {
        #region Public-Members

        /// <summary>Whether this worker supports transient stdio MCP diagnostics. Legacy workers default false.</summary>
        public bool SupportsMcpTests { get; set; } = false;

        /// <summary>
        /// Whether the worker runs inside a container or pod (G-29), reported at registration from the worker setting
        /// Containerized (GARRISON_WORKER_CONTAINERIZED). The compiler exposes it to harness profiles as
        /// executor.containerized; the built-in Codex profiles then default their sandbox to danger-full-access because
        /// the container is the isolation boundary. Default false (a worker run directly on a host, or one that predates
        /// the field).
        /// </summary>
        public bool Containerized { get; set; } = false;

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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewNodeId() : value;
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
        /// Child reserve (P12.38): extra slots the worker opens only for delegated runs whose parent waits on them, one
        /// per run on this node that is waiting on a child, up to this many. Reported by the worker at registration.
        /// Minimum 0 (no reserve), maximum 64, default 0 (a node registered before the reserve existed).
        /// </summary>
        public int ChildReserveSlots
        {
            get
            {
                return _ChildReserveSlots;
            }
            set
            {
                _ChildReserveSlots = Math.Clamp(value, 0, 64);
            }
        }

        /// <summary>
        /// Most runs on this node that may wait synchronously on a delegated run at once while staying resident (P12.38).
        /// A delegation that would exceed it fails with DelegationCapacityExhausted. 0 means MaxConcurrentRuns. The
        /// effective cap is never more than MaxConcurrentRuns plus ChildReserveSlots minus one. Reported by the worker
        /// at registration. Minimum 0, maximum 1024, default 0.
        /// </summary>
        public int MaxResidentWaiters
        {
            get
            {
                return _MaxResidentWaiters;
            }
            set
            {
                _MaxResidentWaiters = Math.Clamp(value, 0, 1024);
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
                _CreatedUtc = TimestampHelper.Normalize(value);
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
                _LastUpdateUtc = TimestampHelper.Normalize(value);
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
        /// Executors the node reports (Process, and KubernetesJob when it can create Jobs). An empty list from an older
        /// worker means Process only. Runs are claimed only by nodes that report the run's executor.
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

        /// <summary>
        /// Structured capabilities per executor. Missing reports mean legacy workers make no advanced capability promise.
        /// </summary>
        public List<ExecutorCapabilities> ExecutorCapabilities
        {
            get { return _ExecutorCapabilities; }
            set { _ExecutorCapabilities = value ?? new List<ExecutorCapabilities>(); }
        }

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewNodeId();
        private string _Name = String.Empty;
        private int _MaxConcurrentRuns = 4;
        private int _ChildReserveSlots = 0;
        private int _MaxResidentWaiters = 0;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<NodeLabel> _Labels = new List<NodeLabel>();
        private List<NodeCapability> _Capabilities = new List<NodeCapability>();
        private List<ExecutorCapabilities> _ExecutorCapabilities = new List<ExecutorCapabilities>();
        private List<RunExecutorEnum> _Executors = new List<RunExecutorEnum>();

        #endregion
    }
}
