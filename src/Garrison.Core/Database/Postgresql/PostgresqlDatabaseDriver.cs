namespace Garrison.Core.Database.Postgresql
{
    using System;
    using System.Data.Common;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Database.Postgresql.Queries;
    using Garrison.Core.Enums;
    using Npgsql;

    /// <summary>
    /// PostgreSQL driver. Thread-safe.
    /// </summary>
    public class PostgresqlDatabaseDriver : AdoDatabaseDriver
    {
        #region Public-Members

        /// <inheritdoc />
        public override DatabaseTypeEnum DatabaseType
        {
            get
            {
                return DatabaseTypeEnum.Postgresql;
            }
        }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="settings">Database settings.</param>
        /// <exception cref="ArgumentNullException">Thrown when settings is null.</exception>
        public PostgresqlDatabaseDriver(DatabaseSettings settings)
            : base(settings, new PostgresqlDialect())
        {
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public override DbConnection CreateConnection()
        {
            return new NpgsqlConnection(Settings.ToPostgresqlConnectionString());
        }

        #endregion
    }
}
