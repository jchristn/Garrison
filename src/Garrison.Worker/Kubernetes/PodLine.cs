namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Text.Json.Serialization;
    using Garrison.Core.Protocol;

    /// <summary>
    /// One protocol message from a run pod (plan D-033). On the wire it is the JSON payload of a line that starts with
    /// the run's nonce prefix and a sequence number (see <see cref="PodLineProtocol"/>).
    /// </summary>
    public class PodLine
    {
        #region Public-Members

        /// <summary>
        /// Sequence number from the line prefix. Strictly increasing from 1 within a run pod; the worker drops lines
        /// whose sequence it has already seen (for example after reconnecting to the log stream). Not serialized.
        /// </summary>
        [JsonIgnore]
        public long Sequence { get; set; } = 0;

        /// <summary>
        /// Line type.
        /// </summary>
        public PodLineTypeEnum Type { get; set; } = PodLineTypeEnum.Event;

        /// <summary>
        /// Harness process ID for <see cref="PodLineTypeEnum.Started"/> lines.
        /// </summary>
        public int? ProcessId { get; set; } = null;

        /// <summary>
        /// Event for <see cref="PodLineTypeEnum.Event"/> lines.
        /// </summary>
        public RunEventReport? Event { get; set; } = null;

        /// <summary>
        /// Completion for <see cref="PodLineTypeEnum.Complete"/> lines.
        /// </summary>
        public RunCompleteRequest? Complete { get; set; } = null;

        /// <summary>
        /// Changed file for FileChanged lines (AD3.4).
        /// </summary>
        public PodFileChange? File { get; set; } = null;

        #endregion
    }
}
