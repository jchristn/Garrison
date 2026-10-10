namespace Garrison.Core.Database.Sqlite
{
    using System;
    using System.Data.Common;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Database.Sqlite.Queries;
    using Garrison.Core.Enums;
    using Microsoft.Data.Sqlite;

    /// <summary>
    /// SQLite driver. Writes are serialized with a semaphore; reads run concurrently under WAL. Thread-safe.
    /// Intended for development and single-node use only.
    /// </summary>
    public class SqliteDatabaseDriver : AdoDatabaseDriver
    {
        #region Public-Members

        /// <inheritdoc />
        public override DatabaseTypeEnum DatabaseType
        {
            get
            {
                return DatabaseTypeEnum.Sqlite;
            }
        }

        /// <summary>
        /// Busy timeout in milliseconds. Minimum 0, maximum 600000, default 5000.
        /// </summary>
        public int BusyTimeoutMs
        {
            get
            {
                return _BusyTimeoutMs;
            }
            set
            {
                _BusyTimeoutMs = Math.Clamp(value, 0, 600000);
            }
        }

        #endregion

        #region Private-Members

        private readonly SemaphoreSlim _WriteLock = new SemaphoreSlim(1, 1);
        private int _BusyTimeoutMs = 5000;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="settings">Database settings.</param>
        /// <exception cref="ArgumentNullException">Thrown when settings is null.</exception>
        public SqliteDatabaseDriver(DatabaseSettings settings)
            : base(settings, new SqliteDialect())
        {
            string? directory = Path.GetDirectoryName(Path.GetFullPath(settings.Filename));
            if (!String.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public override DbConnection CreateConnection()
        {
            return new SqliteConnection(Settings.ToSqliteConnectionString());
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override async Task OnConnectionOpenedAsync(DbConnection connection, CancellationToken token)
        {
            await using (DbCommand command = connection.CreateCommand())
            {
                command.CommandText = "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=" + _BusyTimeoutMs + "; PRAGMA synchronous=NORMAL;";
                await command.ExecuteNonQueryAsync(token).ConfigureAwait(false);
            }
        }

        /// <inheritdoc />
        protected override async Task<IDisposable?> EnterWriteAsync(CancellationToken token)
        {
            await _WriteLock.WaitAsync(token).ConfigureAwait(false);
            return new SemaphoreReleaser(_WriteLock);
        }

        /// <inheritdoc />
        protected override void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) _WriteLock.Dispose();
            _Disposed = true;
            base.Dispose(disposing);
        }

        #endregion
    }
}
