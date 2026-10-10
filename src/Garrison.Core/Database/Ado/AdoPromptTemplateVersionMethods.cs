namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral PromptTemplateVersion data access. Thread-safe.
    /// </summary>
    public class AdoPromptTemplateVersionMethods : IPromptTemplateVersionMethods
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
        public AdoPromptTemplateVersionMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("prompt_template_versions");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<PromptTemplateVersion> CreateAsync(PromptTemplateVersion obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await InsertRowAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<PromptTemplateVersion?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            PromptTemplateVersion? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<PromptTemplateVersion?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            PromptTemplateVersion? obj = await _Driver.QuerySingleAsync(
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
        public async Task<PromptTemplateVersion> UpdateAsync(PromptTemplateVersion obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, templateid = @templateid, version = @version, content = @content, changenote = @changenote, createdby = @createdby, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "templateid", obj.TemplateId);
                    AdoDatabaseDriver.Add(command, "version", obj.Version);
                    AdoDatabaseDriver.Add(command, "content", obj.Content);
                    AdoDatabaseDriver.Add(command, "changenote", obj.ChangeNote);
                    AdoDatabaseDriver.Add(command, "createdby", obj.CreatedBy);
                    AdoDatabaseDriver.Add(command, "active", obj.Active);
                    AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
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
        public async Task<EnumerationResult<PromptTemplateVersion>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(tenantId))
            {
                clauses.Add("tenantid = @tenantid");
            }
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string sql = "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";";
            List<PromptTemplateVersion> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            return EnumerationResult<PromptTemplateVersion>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a PromptTemplateVersion (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static PromptTemplateVersion Map(DbDataReader reader)
        {
            PromptTemplateVersion obj = new PromptTemplateVersion();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.NullableStr(reader, "tenantid");
            obj.TemplateId = AdoConverters.Str(reader, "templateid");
            obj.Version = AdoConverters.Int(reader, "version");
            obj.Content = AdoConverters.Str(reader, "content");
            obj.ChangeNote = AdoConverters.NullableStr(reader, "changenote");
            obj.CreatedBy = AdoConverters.NullableStr(reader, "createdby");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <inheritdoc />
        public async Task<List<PromptTemplateVersion>> ListByTemplateAsync(string templateId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(templateId)) throw new ArgumentNullException(nameof(templateId));

            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE templateid = @templateid ORDER BY version DESC;",
                command => AdoDatabaseDriver.Add(command, "templateid", templateId),
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<PromptTemplateVersion?> ReadByVersionAsync(string templateId, int version, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(templateId)) throw new ArgumentNullException(nameof(templateId));

            return await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE templateid = @templateid AND version = @version;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "templateid", templateId);
                    AdoDatabaseDriver.Add(command, "version", version);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> DeleteByTemplateAsync(string templateId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(templateId)) throw new ArgumentNullException(nameof(templateId));

            return await _Driver.NonQueryAsync(
                "DELETE FROM " + _Table + " WHERE templateid = @templateid;",
                command => AdoDatabaseDriver.Add(command, "templateid", templateId),
                token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, PromptTemplateVersion obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, templateid, version, content, changenote, createdby, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @templateid, @version, @content, @changenote, @createdby, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "templateid", obj.TemplateId);
                AdoDatabaseDriver.Add(command, "version", obj.Version);
                AdoDatabaseDriver.Add(command, "content", obj.Content);
                AdoDatabaseDriver.Add(command, "changenote", obj.ChangeNote);
                AdoDatabaseDriver.Add(command, "createdby", obj.CreatedBy);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        #endregion
    }
}
