namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Child record of Node: harness capabilities detected by probes.
    /// </summary>
    public class NodeCapability
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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewNodeCapabilityId() : value;
            }
        }

        /// <summary>
        /// Parent Node identifier.
        /// </summary>
        public string NodeId
        {
            get
            {
                return _NodeId;
            }
            set
            {
                _NodeId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Harness type.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Resolved executable.
        /// </summary>
        public string? Executable { get; set; } = null;

        /// <summary>
        /// Detected version.
        /// </summary>
        public string? DetectedVersion { get; set; } = null;

        /// <summary>
        /// Whether the probe succeeded.
        /// </summary>
        public bool Available { get; set; } = false;

        /// <summary>
        /// Probe detail or error.
        /// </summary>
        public string? Detail { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewNodeCapabilityId();
        private string _NodeId = String.Empty;

        #endregion
    }
}
