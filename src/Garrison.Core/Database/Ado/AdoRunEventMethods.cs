namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Globalization;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral RunEvent data access. Thread-safe.
    /// </summary>
    public class AdoRunEventMethods : IRunEventMethods
    {
        #region Public-Members

        /// <summary>
        /// Maximum rows per event INSERT. Minimum 1, maximum 5000; defaults to 2 on SQLite and 4369 on PostgreSQL.
        /// The dialect's parameter limit also caps the effective size. Small SQLite chunks avoid expensive named
        /// parameter binding; the prepared command is reused within a batch. Changes affect subsequent batches.
        /// </summary>
        public int BatchRowLimit
        {
            get
            {
                return _BatchRowLimit;
            }
            set
            {
                _BatchRowLimit = Math.Clamp(value, 1, 5000);
            }
        }

        #endregion

        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private int _BatchRowLimit = 2;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoRunEventMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("run_events");
            if (driver.Dialect.DatabaseType == DatabaseTypeEnum.Postgresql) _BatchRowLimit = driver.Dialect.MaximumParametersPerStatement / 15;
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<RunEvent> CreateAsync(RunEvent obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await InsertRowAsync(connection, transaction, obj, false, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<RunEvent?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            RunEvent? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<RunEvent?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            RunEvent? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<RunEvent> UpdateAsync(RunEvent obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, runid = @runid, sequence = @sequence, eventtype = @eventtype, timestamputc = @timestamputc, text = @text, code = @code, toolname = @toolname, toolcallid = @toolcallid, success = @success, inputtokens = @inputtokens, outputtokens = @outputtokens, raweventjson = @raweventjson WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "runid", obj.RunId);
                    AdoDatabaseDriver.Add(command, "sequence", obj.Sequence);
                    AdoDatabaseDriver.Add(command, "eventtype", obj.EventType.ToString());
                    AdoDatabaseDriver.Add(command, "timestamputc", obj.TimestampUtc);
                    AdoDatabaseDriver.Add(command, "text", obj.Text);
                    AdoDatabaseDriver.Add(command, "code", obj.Code);
                    AdoDatabaseDriver.Add(command, "toolname", obj.ToolName);
                    AdoDatabaseDriver.Add(command, "toolcallid", obj.ToolCallId);
                    AdoDatabaseDriver.Add(command, "success", obj.Success);
                    AdoDatabaseDriver.Add(command, "inputtokens", obj.InputTokens);
                    AdoDatabaseDriver.Add(command, "outputtokens", obj.OutputTokens);
                    AdoDatabaseDriver.Add(command, "raweventjson", obj.RawEventJson);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> ExistsAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            object? result = await _Driver.ScalarAsync("SELECT 1 FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), token).ConfigureAwait(false);
            return result != null;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<RunEvent>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(tenantId))
            {
                clauses.Add("tenantid = @tenantid");
            }
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string sql = "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";";
            List<RunEvent> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            return EnumerationResult<RunEvent>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a RunEvent (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static RunEvent Map(DbDataReader reader)
        {
            RunEvent obj = new RunEvent();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.RunId = AdoConverters.Str(reader, "runid");
            obj.Sequence = AdoConverters.Long(reader, "sequence");
            obj.EventType = AdoConverters.Enum<RunEventTypeEnum>(reader, "eventtype", RunEventTypeEnum.Lifecycle);
            obj.TimestampUtc = AdoConverters.Date(reader, "timestamputc");
            obj.Text = AdoConverters.NullableStr(reader, "text");
            obj.Code = AdoConverters.NullableStr(reader, "code");
            obj.ToolName = AdoConverters.NullableStr(reader, "toolname");
            obj.ToolCallId = AdoConverters.NullableStr(reader, "toolcallid");
            obj.Success = AdoConverters.NullableBool(reader, "success");
            obj.InputTokens = AdoConverters.NullableLong(reader, "inputtokens");
            obj.OutputTokens = AdoConverters.NullableLong(reader, "outputtokens");
            obj.RawEventJson = AdoConverters.NullableStr(reader, "raweventjson");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        /// <inheritdoc />
        public async Task<int> InsertBatchAsync(List<RunEvent> events, CancellationToken token = default)
        {
            if (events == null) throw new ArgumentNullException(nameof(events));
            if (events.Count == 0) return 0;
            if (events.Count == 1)
            {
                // Keep the small-batch path free of multi-row SQL construction and preparation overhead.
                int single = 0;
                await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
                {
                    single = await InsertRowAsync(connection, transaction, events[0], true, ct).ConfigureAwait(false);
                }, token).ConfigureAwait(false);
                return single;
            }

            string[] columns = new[] { "id", "tenantid", "runid", "sequence", "eventtype", "timestamputc", "text", "code", "toolname", "toolcallid", "success", "inputtokens", "outputtokens", "raweventjson", "createdutc" };
            int rowsPerStatement = Math.Min(BatchRowLimit, Math.Max(1, _Driver.Dialect.MaximumParametersPerStatement / columns.Length));
            int inserted = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                // Retry the entire transaction, including its count. A failure in a later chunk must roll back earlier
                // chunks, and a retry must not include their discarded count (P10.22).
                inserted = 0;
                using (DbCommand command = connection.CreateCommand())
                {
                    command.Transaction = transaction;
                    for (int start = 0; start < events.Count; start += rowsPerStatement)
                    {
                        ct.ThrowIfCancellationRequested();
                        int count = Math.Min(rowsPerStatement, events.Count - start);
                        bool rebuild = command.Parameters.Count != count * columns.Length;
                        if (rebuild)
                        {
                            command.Parameters.Clear();
                            StringBuilder sql = new StringBuilder("INSERT INTO " + _Table + " (" + String.Join(", ", columns) + ") VALUES ");
                            for (int row = 0; row < count; row++)
                            {
                                if (row > 0) sql.Append(", ");
                                sql.Append('(');
                                for (int column = 0; column < columns.Length; column++)
                                {
                                    if (column > 0) sql.Append(", ");
                                    string parameter = "p" + (row * columns.Length + column).ToString(CultureInfo.InvariantCulture);
                                    sql.Append('@').Append(parameter);
                                    AdoDatabaseDriver.Add(command, parameter, null);
                                }
                                sql.Append(')');
                            }
                            sql.Append(" ON CONFLICT (runid, sequence) DO NOTHING;");
                            command.CommandText = sql.ToString();
                        }
                        DateTime created = DateTime.UtcNow;
                        for (int row = 0; row < count; row++)
                        {
                            RunEvent evt = events[start + row];
                            object?[] values = new object?[] { evt.Id, evt.TenantId, evt.RunId, evt.Sequence, evt.EventType.ToString(), TimestampHelper.Normalize(evt.TimestampUtc), evt.Text, evt.Code, evt.ToolName, evt.ToolCallId, evt.Success, evt.InputTokens, evt.OutputTokens, evt.RawEventJson, created };
                            for (int column = 0; column < values.Length; column++) command.Parameters[row * columns.Length + column].Value = values[column] ?? DBNull.Value;
                        }
                        // SQLite benefits from retaining the compiled statement and parameter objects across chunks.
                        // PostgreSQL keeps its normal execution path; preparing it would add a round trip per batch.
                        if (rebuild && _Driver.Dialect.DatabaseType == DatabaseTypeEnum.Sqlite) await command.PrepareAsync(ct).ConfigureAwait(false);
                        inserted += await AdoDatabaseDriver.ExecuteAsync(command, ct).ConfigureAwait(false);
                    }
                }
            }, token).ConfigureAwait(false);
            return inserted;
        }

        /// <inheritdoc />
        public async Task<List<RunEvent>> ListAfterAsync(string runId, long afterSequence, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE runid = @runid AND sequence > @after ORDER BY sequence ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "runid", runId);
                    AdoDatabaseDriver.Add(command, "after", afterSequence);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 5000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync(
                "DELETE FROM " + _Table + " WHERE createdutc < @cutoff;",
                command => AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc),
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<RunEvent>> ListOlderThanAsync(DateTime olderThanUtc, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE createdutc < @cutoff ORDER BY createdutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 10000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> DeleteManyAsync(List<string> ids, CancellationToken token = default)
        {
            if (ids == null) throw new ArgumentNullException(nameof(ids));
            int deleted = 0;
            for (int offset = 0; offset < ids.Count; offset += 500)
            {
                List<string> chunk = ids.GetRange(offset, Math.Min(500, ids.Count - offset));
                List<string> names = new List<string>();
                for (int i = 0; i < chunk.Count; i++) names.Add("@e" + i);
                deleted += await _Driver.NonQueryAsync(
                    "DELETE FROM " + _Table + " WHERE id IN (" + String.Join(", ", names) + ");",
                    command =>
                    {
                        for (int i = 0; i < chunk.Count; i++) AdoDatabaseDriver.Add(command, "e" + i, chunk[i]);
                    },
                    token).ConfigureAwait(false);
            }
            return deleted;
        }

        #endregion

        #region Private-Methods

        private async Task<int> InsertRowAsync(DbConnection connection, DbTransaction transaction, RunEvent obj, bool ignoreReplay, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, runid, sequence, eventtype, timestamputc, text, code, toolname, toolcallid, success, inputtokens, outputtokens, raweventjson, createdutc) VALUES (@id, @tenantid, @runid, @sequence, @eventtype, @timestamputc, @text, @code, @toolname, @toolcallid, @success, @inputtokens, @outputtokens, @raweventjson, @createdutc)" + (ignoreReplay ? " ON CONFLICT (runid, sequence) DO NOTHING;" : ";");
            return await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "runid", obj.RunId);
                AdoDatabaseDriver.Add(command, "sequence", obj.Sequence);
                AdoDatabaseDriver.Add(command, "eventtype", obj.EventType.ToString());
                AdoDatabaseDriver.Add(command, "timestamputc", obj.TimestampUtc);
                AdoDatabaseDriver.Add(command, "text", obj.Text);
                AdoDatabaseDriver.Add(command, "code", obj.Code);
                AdoDatabaseDriver.Add(command, "toolname", obj.ToolName);
                AdoDatabaseDriver.Add(command, "toolcallid", obj.ToolCallId);
                AdoDatabaseDriver.Add(command, "success", obj.Success);
                AdoDatabaseDriver.Add(command, "inputtokens", obj.InputTokens);
                AdoDatabaseDriver.Add(command, "outputtokens", obj.OutputTokens);
                AdoDatabaseDriver.Add(command, "raweventjson", obj.RawEventJson);
                AdoDatabaseDriver.Add(command, "createdutc", ignoreReplay ? DateTime.UtcNow : obj.CreatedUtc);
            }, token).ConfigureAwait(false);
        }

        #endregion
    }
}
