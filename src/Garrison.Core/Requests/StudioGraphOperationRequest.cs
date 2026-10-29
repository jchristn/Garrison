namespace Garrison.Core.Requests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One graph operation on a studio draft (AD7.5), applied at the draft version the caller read.
    /// </summary>
    public class StudioGraphOperationRequest
    {
        /// <summary>
        /// Draft version the caller read. A different version answers 409 DraftVersionConflict.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// The operation.
        /// </summary>
        public StudioGraphOperationEnum Operation { get; set; } = StudioGraphOperationEnum.AddMember;

        /// <summary>
        /// App name. Null means the draft's target app. Not used by MoveNode.
        /// </summary>
        public string? App { get; set; } = null;

        /// <summary>
        /// Agent name, for AddMember, RemoveMember, and SetEntry.
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// Member role text, for AddMember. Null for none.
        /// </summary>
        public string? Role { get; set; } = null;

        /// <summary>
        /// Calling member, for Connect and Disconnect.
        /// </summary>
        public string? From { get; set; } = null;

        /// <summary>
        /// Called member, for Connect and Disconnect.
        /// </summary>
        public string? To { get; set; } = null;

        /// <summary>
        /// Whether the edge allows fan-out, for Connect. Null means the default (true).
        /// </summary>
        public bool? FanOut { get; set; } = null;

        /// <summary>
        /// Node key for MoveNode: "Agent/{name}" or "AgenticApp/{name}".
        /// </summary>
        public string? NodeKey { get; set; } = null;

        /// <summary>
        /// Canvas X for MoveNode.
        /// </summary>
        public double X { get; set; } = 0;

        /// <summary>
        /// Canvas Y for MoveNode.
        /// </summary>
        public double Y { get; set; } = 0;
    }
}
