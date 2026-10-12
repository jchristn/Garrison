namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral ManifestApply data access. Thread-safe.
    /// </summary>
    public class AdoManifestApplyMethods : IManifestApplyMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _ItemsTable;
        private readonly string _ChangesTable;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoManifestApplyMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("manifest_applies");
            _ItemsTable = driver.Table("manifest_apply_items");
            _ChangesTable = driver.Table("manifest_apply_changes");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<ManifestApply> CreateAsync(ManifestApply obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await InsertRowAsync(connection, transaction, obj, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<ManifestApply?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            ManifestApply? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<ManifestApply?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            ManifestApply? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<ManifestApply> UpdateAsync(ManifestApply obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, principalname = @principalname, dryrun = @dryrun, documentcount = @documentcount, createdcount = @createdcount, updatedcount = @updatedcount, unchangedcount = @unchangedcount, failedcount = @failedcount, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "principalname", obj.PrincipalName);
                    AdoDatabaseDriver.Add(command, "dryrun", obj.DryRun);
                    AdoDatabaseDriver.Add(command, "documentcount", obj.DocumentCount);
                    AdoDatabaseDriver.Add(command, "createdcount", obj.CreatedCount);
                    AdoDatabaseDriver.Add(command, "updatedcount", obj.UpdatedCount);
                    AdoDatabaseDriver.Add(command, "unchangedcount", obj.UnchangedCount);
                    AdoDatabaseDriver.Add(command, "failedcount", obj.FailedCount);
                    AdoDatabaseDriver.Add(command, "active", obj.Active);
                    AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
                }, ct).ConfigureAwait(false);

                await DeleteChildrenAsync(connection, transaction, obj.Id, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
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
                await DeleteChildrenAsync(connection, transaction, id, ct).ConfigureAwait(false);
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
        public async Task<EnumerationResult<ManifestApply>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
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
            List<ManifestApply> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            foreach (ManifestApply obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);

            return EnumerationResult<ManifestApply>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a ManifestApply (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static ManifestApply Map(DbDataReader reader)
        {
            ManifestApply obj = new ManifestApply();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.PrincipalName = AdoConverters.NullableStr(reader, "principalname");
            obj.DryRun = AdoConverters.Bool(reader, "dryrun");
            obj.DocumentCount = AdoConverters.Int(reader, "documentcount");
            obj.CreatedCount = AdoConverters.Int(reader, "createdcount");
            obj.UpdatedCount = AdoConverters.Int(reader, "updatedcount");
            obj.UnchangedCount = AdoConverters.Int(reader, "unchangedcount");
            obj.FailedCount = AdoConverters.Int(reader, "failedcount");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <summary>
        /// Load child rows into a ManifestApply.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task LoadChildrenAsync(ManifestApply obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));

            obj.Items = await _Driver.QueryAsync(
                "SELECT * FROM " + _ItemsTable + " WHERE manifestapplyid = @parentid ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapItems,
                token).ConfigureAwait(false);

            List<ManifestFieldChangeRow> changes = await _Driver.QueryAsync(
                "SELECT * FROM " + _ChangesTable + " WHERE manifestapplyid = @parentid ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapChanges,
                token).ConfigureAwait(false);
            foreach (ManifestApplyItem item in obj.Items)
            {
                item.Changes = changes.Where(c => c.ItemId == item.Id).Select(c => c.Change).ToList();
            }
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, ManifestApply obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, principalname, dryrun, documentcount, createdcount, updatedcount, unchangedcount, failedcount, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @principalname, @dryrun, @documentcount, @createdcount, @updatedcount, @unchangedcount, @failedcount, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "principalname", obj.PrincipalName);
                AdoDatabaseDriver.Add(command, "dryrun", obj.DryRun);
                AdoDatabaseDriver.Add(command, "documentcount", obj.DocumentCount);
                AdoDatabaseDriver.Add(command, "createdcount", obj.CreatedCount);
                AdoDatabaseDriver.Add(command, "updatedcount", obj.UpdatedCount);
                AdoDatabaseDriver.Add(command, "unchangedcount", obj.UnchangedCount);
                AdoDatabaseDriver.Add(command, "failedcount", obj.FailedCount);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, ManifestApply obj, CancellationToken token)
        {
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < obj.Items.Count; i++)
            {
                ManifestApplyItem child = obj.Items[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "ite";
                child.ManifestApplyId = obj.Id;
                child.Position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _ItemsTable + " (id, manifestapplyid, tenantid, position, kind, name, result, resourceid, message, plannedresult, errorcode, errorfield) VALUES (@id, @manifestapplyid, @tenantid, @position, @kind, @name, @result, @resourceid, @message, @plannedresult, @errorcode, @errorfield);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "manifestapplyid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", child.Position);
                        AdoDatabaseDriver.Add(command, "kind", child.Kind);
                        AdoDatabaseDriver.Add(command, "name", child.Name);
                        AdoDatabaseDriver.Add(command, "result", child.Result.ToString());
                        AdoDatabaseDriver.Add(command, "resourceid", child.ResourceId);
                        AdoDatabaseDriver.Add(command, "message", child.Message);
                        AdoDatabaseDriver.Add(command, "plannedresult", child.PlannedResult?.ToString());
                        AdoDatabaseDriver.Add(command, "errorcode", child.ErrorCode);
                        AdoDatabaseDriver.Add(command, "errorfield", child.ErrorField);
                    }, token).ConfigureAwait(false);

                for (int j = 0; j < child.Changes.Count; j++)
                {
                    ManifestFieldChange change = child.Changes[j];
                    string changeId = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + j.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "chg";
                    int position = j;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _ChangesTable + " (id, manifestapplyid, manifestapplyitemid, tenantid, position, field, beforevalue, aftervalue) VALUES (@id, @manifestapplyid, @itemid, @tenantid, @position, @field, @beforevalue, @aftervalue);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "id", changeId);
                            AdoDatabaseDriver.Add(command, "manifestapplyid", obj.Id);
                            AdoDatabaseDriver.Add(command, "itemid", child.Id);
                            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                            AdoDatabaseDriver.Add(command, "position", position);
                            AdoDatabaseDriver.Add(command, "field", change.Field);
                            AdoDatabaseDriver.Add(command, "beforevalue", change.Before);
                            AdoDatabaseDriver.Add(command, "aftervalue", change.After);
                        }, token).ConfigureAwait(false);
                }
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string parentId, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ChangesTable + " WHERE manifestapplyid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ItemsTable + " WHERE manifestapplyid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
        }

        private static ManifestApplyItem MapItems(DbDataReader reader)
        {
            ManifestApplyItem child = new ManifestApplyItem();
            child.Id = AdoConverters.Str(reader, "id");
            child.ManifestApplyId = AdoConverters.Str(reader, "manifestapplyid");
            child.Position = AdoConverters.Int(reader, "position");
            child.Kind = AdoConverters.Str(reader, "kind");
            child.Name = AdoConverters.Str(reader, "name");
            child.Result = AdoConverters.Enum<ManifestApplyResultEnum>(reader, "result", ManifestApplyResultEnum.Validated);
            child.ResourceId = AdoConverters.NullableStr(reader, "resourceid");
            child.Message = AdoConverters.NullableStr(reader, "message");
            child.ErrorCode = AdoConverters.NullableStr(reader, "errorcode");
            child.ErrorField = AdoConverters.NullableStr(reader, "errorfield");
            string? planned = AdoConverters.NullableStr(reader, "plannedresult");
            if (!String.IsNullOrEmpty(planned) && Enum.TryParse<ManifestApplyResultEnum>(planned, true, out ManifestApplyResultEnum parsed)) child.PlannedResult = parsed;
            return child;
        }

        private static ManifestFieldChangeRow MapChanges(DbDataReader reader)
        {
            ManifestFieldChangeRow row = new ManifestFieldChangeRow();
            row.ItemId = AdoConverters.Str(reader, "manifestapplyitemid");
            row.Change = new ManifestFieldChange(AdoConverters.Str(reader, "field"), AdoConverters.NullableStr(reader, "beforevalue"), AdoConverters.NullableStr(reader, "aftervalue"));
            return row;
        }

        #endregion
    }
}
