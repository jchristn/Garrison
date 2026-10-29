namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One operation on a studio draft's app graph. Member and edge operations rewrite the draft's AgenticApp item. Not
    /// thread-safe.
    /// </summary>
    public class StudioGraphOperationRequest
    {
        #region Public-Members

        /// <summary>
        /// The draft version the caller read. Minimum 1, default 1.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when set below 1.</exception>
        public int Version
        {
            get
            {
                return _Version;
            }
            set
            {
                if (value < 1) throw new ArgumentOutOfRangeException(nameof(Version), "Version is 1 or more.");
                _Version = value;
            }
        }

        /// <summary>
        /// The operation. Default AddMember.
        /// </summary>
        public StudioGraphOperationEnum Operation { get; set; } = StudioGraphOperationEnum.AddMember;

        /// <summary>
        /// App name, or null for the draft's target app. An app the draft does not hold yet starts from the live app, or
        /// from a new app when none exists.
        /// </summary>
        public string? App { get; set; } = null;

        /// <summary>
        /// Agent name for AddMember, RemoveMember, and SetEntry, or null.
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// Optional member role for AddMember, or null.
        /// </summary>
        public string? Role { get; set; } = null;

        /// <summary>
        /// Calling member for Connect and Disconnect, or null.
        /// </summary>
        public string? From { get; set; } = null;

        /// <summary>
        /// Called member for Connect and Disconnect, or null.
        /// </summary>
        public string? To { get; set; } = null;

        /// <summary>
        /// For Connect: whether the caller may reach the callee through garrison_fan_out, or null for the default, true.
        /// </summary>
        public bool? FanOut { get; set; } = null;

        /// <summary>
        /// Node key (kind/name) for MoveNode, or null.
        /// </summary>
        public string? NodeKey { get; set; } = null;

        /// <summary>
        /// Horizontal position for MoveNode.
        /// </summary>
        public double X { get; set; } = 0;

        /// <summary>
        /// Vertical position for MoveNode.
        /// </summary>
        public double Y { get; set; } = 0;

        #endregion

        #region Private-Members

        private int _Version = 1;

        #endregion
    }
}
