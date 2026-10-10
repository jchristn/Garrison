namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>
    /// A cluster MCP session as served on this replica: the internal endpoint's session that stands in for it.
    /// </summary>
    public class McpLocalSession
    {
        /// <summary>
        /// Cluster session identifier (what the client holds).
        /// </summary>
        public string ClusterId { get; set; } = String.Empty;

        /// <summary>
        /// Session identifier on this replica's internal endpoint.
        /// </summary>
        public string LocalId { get; set; } = String.Empty;

        /// <summary>
        /// Principal that owns the session.
        /// </summary>
        public string Principal { get; set; } = String.Empty;

        /// <summary>
        /// Caller of the most recent request this replica forwarded for the session (in memory only), used to
        /// authenticate a cancellation relayed from another replica.
        /// </summary>
        public Garrison.Core.Security.RequestContext? Caller { get; set; } = null;

        /// <summary>
        /// When this replica last recorded use of the session in the database (UTC).
        /// </summary>
        public DateTime LastTouchUtc { get; set; } = DateTime.UtcNow;
    }
}
