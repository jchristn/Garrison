namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Acknowledgement of a node protocol call.
    /// </summary>
    public class NodeAckResponse
    {
        /// <summary>
        /// Whether the call was accepted.
        /// </summary>
        public bool Accepted { get; set; } = true;

        /// <summary>
        /// Optional message.
        /// </summary>
        public string? Message { get; set; } = null;
    }
}
