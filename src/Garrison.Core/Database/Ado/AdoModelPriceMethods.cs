namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral ModelPrice data access. Thread-safe.
    /// </summary>
    public class AdoModelPriceMethods : IModelPriceMethods
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
        public AdoModelPriceMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("model_prices");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<ModelPrice> CreateAsync(ModelPrice obj, CancellationToken token = default)
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
        public async Task<ModelPrice?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            ModelPrice? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<ModelPrice?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            ModelPrice? obj = await _Driver.QuerySingleAsync(
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
        public async Task<ModelPrice?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

            string sql = "SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;";
            ModelPrice? obj = await _Driver.QuerySingleAsync(
                sql,
                command =>
                {
                    AdoDatabaseDriver.Add(command, "name", name);
                    if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<ModelPrice?> ReadByModelAsync(string tenantId, HarnessTypeEnum harnessType, string model, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(model)) throw new ArgumentNullException(nameof(model));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND harnesstype = @harness AND model = @model;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "harness", harnessType.ToString());
                AdoDatabaseDriver.Add(command, "model", model);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<ModelPrice> UpdateAsync(ModelPrice obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, name = @name, description = @description, model = @model, harnesstype = @harnesstype, inputusdpermillion = @inputusdpermillion, outputusdpermillion = @outputusdpermillion, cachedinputusdpermillion = @cachedinputusdpermillion, reasoningusdpermillion = @reasoningusdpermillion, inputincludescachedtokens = @inputincludescachedtokens, outputincludesreasoningtokens = @outputincludesreasoningtokens, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "description", obj.Description);
                    AdoDatabaseDriver.Add(command, "model", obj.Model);
                    AdoDatabaseDriver.Add(command, "harnesstype", obj.HarnessType.ToString());
                    AdoDatabaseDriver.Add(command, "inputusdpermillion", obj.InputUsdPerMillion);
                    AdoDatabaseDriver.Add(command, "outputusdpermillion", obj.OutputUsdPerMillion);
                    AdoDatabaseDriver.Add(command, "cachedinputusdpermillion", obj.CachedInputUsdPerMillion);
                    AdoDatabaseDriver.Add(command, "reasoningusdpermillion", obj.ReasoningUsdPerMillion);
                    AdoDatabaseDriver.Add(command, "inputincludescachedtokens", obj.InputIncludesCachedTokens);
                    AdoDatabaseDriver.Add(command, "outputincludesreasoningtokens", obj.OutputIncludesReasoningTokens);
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
        public async Task<EnumerationResult<ModelPrice>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(tenantId))
            {
                clauses.Add("tenantid = @tenantid");
            }
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string sql = "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";";
            List<ModelPrice> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            return EnumerationResult<ModelPrice>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a ModelPrice.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static ModelPrice Map(DbDataReader reader)
        {
            ModelPrice obj = new ModelPrice();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Model = AdoConverters.Str(reader, "model");
            obj.HarnessType = AdoConverters.Enum<HarnessTypeEnum>(reader, "harnesstype", HarnessTypeEnum.Generic);
            obj.InputUsdPerMillion = AdoConverters.Double(reader, "inputusdpermillion");
            obj.OutputUsdPerMillion = AdoConverters.Double(reader, "outputusdpermillion");
            obj.CachedInputUsdPerMillion = AdoConverters.NullableDouble(reader, "cachedinputusdpermillion");
            obj.ReasoningUsdPerMillion = AdoConverters.NullableDouble(reader, "reasoningusdpermillion");
            obj.InputIncludesCachedTokens = AdoConverters.Bool(reader, "inputincludescachedtokens");
            obj.OutputIncludesReasoningTokens = AdoConverters.Bool(reader, "outputincludesreasoningtokens");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, ModelPrice obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, name, description, model, harnesstype, inputusdpermillion, outputusdpermillion, cachedinputusdpermillion, reasoningusdpermillion, inputincludescachedtokens, outputincludesreasoningtokens, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @name, @description, @model, @harnesstype, @inputusdpermillion, @outputusdpermillion, @cachedinputusdpermillion, @reasoningusdpermillion, @inputincludescachedtokens, @outputincludesreasoningtokens, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "name", obj.Name);
                AdoDatabaseDriver.Add(command, "description", obj.Description);
                AdoDatabaseDriver.Add(command, "model", obj.Model);
                AdoDatabaseDriver.Add(command, "harnesstype", obj.HarnessType.ToString());
                AdoDatabaseDriver.Add(command, "inputusdpermillion", obj.InputUsdPerMillion);
                AdoDatabaseDriver.Add(command, "outputusdpermillion", obj.OutputUsdPerMillion);
                AdoDatabaseDriver.Add(command, "cachedinputusdpermillion", obj.CachedInputUsdPerMillion);
                AdoDatabaseDriver.Add(command, "reasoningusdpermillion", obj.ReasoningUsdPerMillion);
                AdoDatabaseDriver.Add(command, "inputincludescachedtokens", obj.InputIncludesCachedTokens);
                AdoDatabaseDriver.Add(command, "outputincludesreasoningtokens", obj.OutputIncludesReasoningTokens);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        #endregion
    }
}
