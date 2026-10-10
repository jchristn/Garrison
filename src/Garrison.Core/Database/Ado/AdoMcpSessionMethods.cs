namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral cluster MCP session store. Thread-safe.
    /// </summary>
    public class AdoMcpSessionMethods : IMcpSessionMethods
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
        public AdoMcpSessionMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("mcp_sessions");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<McpSession> CreateAsync(McpSession session, CancellationToken token = default)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));
            await _Driver.NonQueryAsync(
                "INSERT INTO " + _Table + " (id, principal, protocolversion, clientname, clientversion, createdutc, lastseenutc, expiresutc) VALUES (@id, @principal, @protocolversion, @clientname, @clientversion, @createdutc, @lastseenutc, @expiresutc);",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", session.Id);
                    AdoDatabaseDriver.Add(command, "principal", Truncate(session.Principal, 512));
                    AdoDatabaseDriver.Add(command, "protocolversion", Truncate(session.ProtocolVersion, 64));
                    AdoDatabaseDriver.Add(command, "clientname", Truncate(session.ClientName, 256));
                    AdoDatabaseDriver.Add(command, "clientversion", Truncate(session.ClientVersion, 128));
                    AdoDatabaseDriver.Add(command, "createdutc", session.CreatedUtc);
                    AdoDatabaseDriver.Add(command, "lastseenutc", session.LastSeenUtc);
                    AdoDatabaseDriver.Add(command, "expiresutc", session.ExpiresUtc);
                },
                token).ConfigureAwait(false);
            return session;
        }

        /// <inheritdoc />
        public async Task<McpSession?> ReadActiveAsync(string id, DateTime nowUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) return null;
            return await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id AND expiresutc > @now;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> TouchAsync(string id, DateTime nowUtc, DateTime expiresUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) return false;
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET lastseenutc = @now, expiresutc = @expires WHERE id = @id AND expiresutc > @now;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "expires", expiresUtc);
                },
                token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) return false;
            int affected = await _Driver.NonQueryAsync(
                "DELETE FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<int> PruneExpiredAsync(DateTime nowUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync(
                "DELETE FROM " + _Table + " WHERE expiresutc < @now;",
                command => AdoDatabaseDriver.Add(command, "now", nowUtc),
                token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>Session.</returns>
        public static McpSession Map(DbDataReader reader)
        {
            McpSession session = new McpSession();
            session.Id = AdoConverters.Str(reader, "id");
            session.Principal = AdoConverters.Str(reader, "principal");
            session.ProtocolVersion = AdoConverters.Str(reader, "protocolversion");
            session.ClientName = AdoConverters.NullableStr(reader, "clientname");
            session.ClientVersion = AdoConverters.NullableStr(reader, "clientversion");
            session.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            session.LastSeenUtc = AdoConverters.Date(reader, "lastseenutc");
            session.ExpiresUtc = AdoConverters.Date(reader, "expiresutc");
            return session;
        }

        #endregion

        #region Private-Methods

        private static string? Truncate(string? value, int length)
        {
            if (value == null) return null;
            return value.Length > length ? value.Substring(0, length) : value;
        }

        #endregion
    }
}
