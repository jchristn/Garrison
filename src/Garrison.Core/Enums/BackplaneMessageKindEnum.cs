namespace Garrison.Core.Enums
{
    /// <summary>
    /// Kind of message sent between control-plane replicas through the event backplane. Every message is a hint that
    /// makes a replica look at the database sooner; correctness never depends on delivery.
    /// </summary>
    public enum BackplaneMessageKindEnum
    {
        /// <summary>
        /// A run changed (new events, status, cancellation). Subject is the run identifier.
        /// </summary>
        RunChanged,

        /// <summary>
        /// A run finished. Subject is the run identifier.
        /// </summary>
        RunCompleted,

        /// <summary>
        /// Runs were queued or requeued; waiting lease long-polls should look for work.
        /// </summary>
        QueueChanged,

        /// <summary>
        /// Cluster settings changed; reload them.
        /// </summary>
        SettingsChanged,

        /// <summary>
        /// Roles, permissions, or assignments changed; drop cached grants.
        /// </summary>
        PermissionsChanged,

        /// <summary>
        /// An MCP session was closed. Subject is the cluster session identifier.
        /// </summary>
        McpSessionClosed,

        /// <summary>
        /// An MCP client cancelled a request (notifications/cancelled) on one replica; the replica running the request
        /// relays the cancellation to its local session. Subject: cluster session identifier, a line feed, and the raw
        /// JSON request identifier.
        /// </summary>
        McpRequestCancelled,

        /// <summary>
        /// A permission approval was created or decided (P12.3); the subject is the approval identifier. Wakes harness
        /// calls waiting on that approval on every replica.
        /// </summary>
        ApprovalChanged,

        /// <summary>
        /// An authentication session was revoked (P10.24); the subject is the session identifier. Replicas drop it from
        /// their authentication cache.
        /// </summary>
        SessionRevoked
    }
}
