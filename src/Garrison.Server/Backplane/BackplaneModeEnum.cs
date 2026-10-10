namespace Garrison.Server.Backplane
{
    /// <summary>
    /// Which event backplane connects control-plane replicas (P10.4).
    /// </summary>
    public enum BackplaneModeEnum
    {
        /// <summary>
        /// PostgresNotify on Postgresql, Local on Sqlite (Sqlite runs one replica).
        /// </summary>
        Auto,

        /// <summary>
        /// No cross-replica messages. Waiters on other replicas still see changes on their next database poll.
        /// </summary>
        Local,

        /// <summary>
        /// Messages are rows in the backplane_messages table that every replica polls. Works on Sqlite and Postgresql.
        /// </summary>
        Polling,

        /// <summary>
        /// Messages are Postgresql NOTIFY payloads on a channel each replica LISTENs on. Lowest latency; Postgresql only.
        /// </summary>
        PostgresNotify
    }
}
