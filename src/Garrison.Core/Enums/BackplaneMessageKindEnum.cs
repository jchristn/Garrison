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
        McpSessionClosed
    }
}
