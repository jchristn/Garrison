namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral store for the polling event backplane. Thread-safe.
    /// </summary>
    public class AdoBackplaneMessageMethods : IBackplaneMessageMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoBackplaneMessageMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("backplane_messages");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task InsertAsync(List<BackplaneMessage> messages, CancellationToken token = default)
        {
            if (messages == null) throw new ArgumentNullException(nameof(messages));
            if (messages.Count == 0) return;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                foreach (BackplaneMessage message in messages)
                {
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _Table + " (kind, subject, origin, createdutc) VALUES (@kind, @subject, @origin, @createdutc);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "kind", message.Kind.ToString());
                            AdoDatabaseDriver.Add(command, "subject", message.Subject != null && message.Subject.Length > 256 ? message.Subject.Substring(0, 256) : message.Subject);
                            AdoDatabaseDriver.Add(command, "origin", message.Origin.Length > 128 ? message.Origin.Substring(0, 128) : message.Origin);
                            AdoDatabaseDriver.Add(command, "createdutc", message.CreatedUtc);
                        }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<BackplaneMessage>> ListAfterAsync(long afterSequence, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE seq > @after ORDER BY seq ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "after", afterSequence);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 10000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<long> MaxSequenceAsync(CancellationToken token = default)
        {
            object? value = await _Driver.ScalarAsync("SELECT MAX(seq) FROM " + _Table + ";", null, token).ConfigureAwait(false);
            return value == null ? 0 : Convert.ToInt64(value);
        }

        /// <inheritdoc />
        public async Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync(
                "DELETE FROM " + _Table + " WHERE createdutc < @cutoff;",
                command => AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc),
                token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>Message.</returns>
        public static BackplaneMessage Map(DbDataReader reader)
        {
            BackplaneMessage message = new BackplaneMessage();
            message.Sequence = AdoConverters.Long(reader, "seq");
            message.Kind = AdoConverters.Enum<BackplaneMessageKindEnum>(reader, "kind", BackplaneMessageKindEnum.RunChanged);
            message.Subject = AdoConverters.NullableStr(reader, "subject");
            message.Origin = AdoConverters.Str(reader, "origin");
            message.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return message;
        }

        #endregion
    }
}
