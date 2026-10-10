namespace Garrison.Server.Backplane
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Models;
    using Garrison.Core.Serialization;
    using Npgsql;
    using SyslogLogging;

    /// <summary>
    /// Backplane over Postgresql LISTEN/NOTIFY. Each replica holds one unpooled LISTEN connection; publishing is a
    /// pg_notify call on a pooled connection. The channel name is derived from the database, schema, and table prefix,
    /// so separate Garrison installations sharing a server do not hear each other. After the LISTEN connection is
    /// re-established, subscribers are told to resynchronize, since notifications sent in between are lost. Thread-safe.
    /// </summary>
    public class PostgresNotifyBackplane : BackplaneBase
    {
        #region Public-Members

        /// <inheritdoc />
        public override string Name
        {
            get
            {
                return "PostgresNotify";
            }
        }

        /// <summary>
        /// Notification channel.
        /// </summary>
        public string Channel { get; }

        /// <summary>
        /// Whether the LISTEN connection is currently established.
        /// </summary>
        public bool Listening
        {
            get
            {
                return Volatile.Read(ref _Listening) == 1;
            }
        }

        #endregion

        #region Private-Members

        private readonly AdoDatabaseDriver _Database;
        private int _Listening = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Postgresql driver.</param>
        /// <param name="instanceId">Identifier of this replica instance.</param>
        /// <param name="logging">Logging, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when database or instanceId is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the driver is not a Postgresql driver.</exception>
        public PostgresNotifyBackplane(AdoDatabaseDriver database, string instanceId, LoggingModule? logging)
            : base(instanceId, logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            if (database.DatabaseType != Garrison.Core.Enums.DatabaseTypeEnum.Postgresql) throw new ArgumentException("The Postgresql notification backplane requires a Postgresql database.", nameof(database));
            long key = AdoDatabaseDriver.LockKey("garrison-backplane:" + database.Settings.DatabaseName + ":" + (database.Catalog.Schema ?? String.Empty) + ":" + database.Catalog.Prefix);
            Channel = "garrison_bp_" + key.ToString("x16", CultureInfo.InvariantCulture);
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override async Task SendAsync(List<BackplaneMessage> messages, CancellationToken token)
        {
            StringBuilder sql = new StringBuilder("SELECT ");
            for (int i = 0; i < messages.Count; i++)
            {
                if (i > 0) sql.Append(", ");
                sql.Append("pg_notify(@channel, @p" + i + ")");
            }
            sql.Append(';');
            await _Database.ScalarAsync(sql.ToString(), command =>
            {
                AdoDatabaseDriver.Add(command, "channel", Channel);
                for (int i = 0; i < messages.Count; i++) AdoDatabaseDriver.Add(command, "p" + i, Serializer.Serialize(messages[i]));
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        protected override async Task ReceiveLoopAsync(CancellationToken token)
        {
            bool connectedBefore = false;
            int backoffMs = 500;
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await using (NpgsqlConnection connection = new NpgsqlConnection(_Database.Settings.ToPostgresqlListenerConnectionString()))
                    {
                        await connection.OpenAsync(token).ConfigureAwait(false);
                        connection.Notification += OnNotification;
                        await using (NpgsqlCommand listen = new NpgsqlCommand("LISTEN " + Channel + ";", connection))
                        {
                            await listen.ExecuteNonQueryAsync(token).ConfigureAwait(false);
                        }
                        Volatile.Write(ref _Listening, 1);
                        backoffMs = 500;
                        if (connectedBefore) RaiseResynchronized();
                        connectedBefore = true;
                        Debug("listening on " + Channel);

                        while (!token.IsCancellationRequested)
                        {
                            await connection.WaitAsync(token).ConfigureAwait(false);
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    return;
                }
                catch (Exception e)
                {
                    Warn("listen connection failed, reconnecting in " + backoffMs + " ms: " + e.Message);
                }
                finally
                {
                    Volatile.Write(ref _Listening, 0);
                }

                try
                {
                    await Task.Delay(backoffMs, token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
                backoffMs = Math.Min(backoffMs * 2, 10000);
            }
        }

        #endregion

        #region Private-Methods

        private void OnNotification(object sender, NpgsqlNotificationEventArgs e)
        {
            if (!String.Equals(e.Channel, Channel, StringComparison.Ordinal)) return;
            BackplaneMessage? message = null;
            try
            {
                message = Serializer.Deserialize<BackplaneMessage>(e.Payload);
            }
            catch (Exception ex) when (ex is System.Text.Json.JsonException || ex is NotSupportedException)
            {
                Debug("ignored a malformed notification: " + ex.Message);
            }
            if (message != null) Deliver(message);
        }

        #endregion
    }
}
