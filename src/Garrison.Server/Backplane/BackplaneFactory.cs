namespace Garrison.Server.Backplane
{
    using System;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enums;
    using SyslogLogging;

    /// <summary>
    /// Builds the configured backplane.
    /// </summary>
    public static class BackplaneFactory
    {
        /// <summary>
        /// Resolve Auto to a concrete mode for a provider.
        /// </summary>
        /// <param name="mode">Configured mode.</param>
        /// <param name="provider">Database provider.</param>
        /// <returns>Concrete mode.</returns>
        public static BackplaneModeEnum Resolve(BackplaneModeEnum mode, DatabaseTypeEnum provider)
        {
            if (mode != BackplaneModeEnum.Auto) return mode;
            return provider == DatabaseTypeEnum.Postgresql ? BackplaneModeEnum.PostgresNotify : BackplaneModeEnum.Local;
        }

        /// <summary>
        /// Create a backplane.
        /// </summary>
        /// <param name="mode">Configured mode.</param>
        /// <param name="database">Database.</param>
        /// <param name="instanceId">Identifier of this replica instance.</param>
        /// <param name="pollMs">Poll interval for the polling backplane.</param>
        /// <param name="logging">Logging, or null.</param>
        /// <returns>Backplane (not started).</returns>
        /// <exception cref="ArgumentNullException">Thrown when database or instanceId is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when PostgresNotify is requested on another provider.</exception>
        public static IEventBackplane Create(BackplaneModeEnum mode, DatabaseDriverBase database, string instanceId, int pollMs, LoggingModule? logging)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (String.IsNullOrEmpty(instanceId)) throw new ArgumentNullException(nameof(instanceId));

            switch (Resolve(mode, database.DatabaseType))
            {
                case BackplaneModeEnum.Polling:
                    PollingBackplane polling = new PollingBackplane(database, instanceId, logging);
                    polling.PollMs = pollMs;
                    return polling;
                case BackplaneModeEnum.PostgresNotify:
                    if (database.DatabaseType != DatabaseTypeEnum.Postgresql || database is not AdoDatabaseDriver ado)
                    {
                        throw new InvalidOperationException("Cluster.Backplane is PostgresNotify but the database is " + database.DatabaseType + ". Use Polling or Local.");
                    }
                    return new PostgresNotifyBackplane(ado, instanceId, logging);
                default:
                    return new LocalBackplane(instanceId, logging);
            }
        }
    }
}
