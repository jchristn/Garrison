namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A control-plane replica (Command node). Each replica registers and heartbeats its own row (P10.19), so operators
    /// see the control plane the way they see worker nodes. <see cref="IsLeader"/>, <see cref="LeaderEpoch"/>, and
    /// <see cref="RespondingNodeId"/> are computed for API responses and are not stored.
    /// </summary>
    public class ControlNode
    {
        #region Public-Members

        /// <summary>
        /// Identifier: the replica's node ID (GARRISON_NODE_ID, the pod name in Kubernetes, otherwise the host name).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Display name. Defaults to the node ID.
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
        /// Host name of the machine or pod the replica runs on, or null.
        /// </summary>
        public string? Hostname { get; set; } = null;

        /// <summary>
        /// Informational address (IP address and REST port), or null.
        /// </summary>
        public string? Address { get; set; } = null;

        /// <summary>
        /// Garrison server software version.
        /// </summary>
        public string? Version { get; set; } = null;

        /// <summary>
        /// Database schema version the replica found at startup. Minimum 0.
        /// </summary>
        public int SchemaVersion
        {
            get
            {
                return _SchemaVersion;
            }
            set
            {
                _SchemaVersion = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Event backplane the replica runs (Local, Polling, or PostgresNotify), or null.
        /// </summary>
        public string? Backplane { get; set; } = null;

        /// <summary>
        /// Status.
        /// </summary>
        public ControlNodeStatusEnum Status { get; set; } = ControlNodeStatusEnum.Starting;

        /// <summary>
        /// When the replica process started (UTC).
        /// </summary>
        public DateTime StartedUtc
        {
            get
            {
                return _StartedUtc;
            }
            set
            {
                _StartedUtc = TimestampHelper.Normalize(value);
            }
        }

        /// <summary>
        /// Last heartbeat (UTC).
        /// </summary>
        public DateTime LastHeartbeatUtc
        {
            get
            {
                return _LastHeartbeatUtc;
            }
            set
            {
                _LastHeartbeatUtc = TimestampHelper.Normalize(value);
            }
        }

        /// <summary>
        /// HTTP requests in flight at the last heartbeat. Minimum 0.
        /// </summary>
        public int ActiveRequests
        {
            get
            {
                return _ActiveRequests;
            }
            set
            {
                _ActiveRequests = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Open SSE streams (run events, A2A streaming) and WebSocket connections at the last heartbeat. Minimum 0.
        /// </summary>
        public int OpenStreams
        {
            get
            {
                return _OpenStreams;
            }
            set
            {
                _OpenStreams = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Worker lease long polls held open at the last heartbeat. Minimum 0.
        /// </summary>
        public int HeldLongPolls
        {
            get
            {
                return _HeldLongPolls;
            }
            set
            {
                _HeldLongPolls = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Whether this replica holds the maintenance leader lease. Computed from the coordination lease when the record
        /// is returned by the API; not stored.
        /// </summary>
        public bool IsLeader { get; set; } = false;

        /// <summary>
        /// Leader fencing epoch when <see cref="IsLeader"/> is true, otherwise null. Computed; not stored.
        /// </summary>
        public long? LeaderEpoch { get; set; } = null;

        /// <summary>
        /// Node ID of the replica that answered the request, set on single-record API responses, otherwise null.
        /// Not stored.
        /// </summary>
        public string? RespondingNodeId { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _Name = String.Empty;
        private int _SchemaVersion = 0;
        private DateTime _StartedUtc = DateTime.UtcNow;
        private DateTime _LastHeartbeatUtc = DateTime.UtcNow;
        private int _ActiveRequests = 0;
        private int _OpenStreams = 0;
        private int _HeldLongPolls = 0;

        #endregion
    }
}
