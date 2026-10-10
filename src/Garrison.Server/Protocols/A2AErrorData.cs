namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// The data member of a Garrison A2A JSON-RPC error: a stable machine code and, for validation errors, the
    /// offending parameters, so clients can react without parsing the message.
    /// </summary>
    public class A2AErrorData
    {
        /// <summary>
        /// Stable machine code, for example ValidationFailed, MessageIdConflict, NoActiveDeployment, or a conflict code.
        /// </summary>
        public string Code { get; set; } = String.Empty;

        /// <summary>
        /// Validation errors keyed by parameter path (for example parameters.model); null when not a validation error.
        /// </summary>
        public Dictionary<string, string>? Errors { get; set; } = null;

        /// <summary>
        /// Machine code per entry in Errors (for example ParameterNotAllowed); null when not a validation error.
        /// </summary>
        public Dictionary<string, string>? FieldCodes { get; set; } = null;

        /// <summary>
        /// For MessageIdConflict, the task the messageId already belongs to; otherwise null.
        /// </summary>
        public string? TaskId { get; set; } = null;
    }
}
