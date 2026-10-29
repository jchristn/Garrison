namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral promotion record data access (AD1.4). Repinning deployments and writing the record happen in one
    /// transaction, so a promotion of several deployments changes all of them or none. Thread-safe.
    /// </summary>
    public class AdoPromotionRecordMethods : IPromotionRecordMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, kind, outcome, agentid, appid, apprevisionid, agentrevisionid, sourceenvironment, targetenvironment, skippedenvironments, rollbackofid, rolledbackbyid, actortype, actorid, actorname, note, createdutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Items;
        private readonly string _Deployments;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoPromotionRecordMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("promotion_records");
            _Items = driver.Table("promotion_record_items");
            _Deployments = driver.Table("deployments");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<PromotionRecord> ApplyAsync(PromotionRecord record, CancellationToken token = default)
        {
            if (record == null) throw new ArgumentNullException(nameof(record));
            record.CreatedUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                foreach (PromotionRecordItem item in record.Items)
                {
                    int repinned = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "UPDATE " + _Deployments + " SET agentrevisionid = @revisionid, configversion = configversion + 1, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid;",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "revisionid", item.NewRevisionId);
                            AdoDatabaseDriver.Add(command, "now", record.CreatedUtc);
                            AdoDatabaseDriver.Add(command, "id", item.DeploymentId);
                            AdoDatabaseDriver.Add(command, "tenantid", record.TenantId);
                        }, ct).ConfigureAwait(false);
                    if (repinned == 0) throw new InvalidOperationException("Deployment " + item.DeploymentName + " no longer exists.");
                }

                if (!String.IsNullOrEmpty(record.RollbackOfId))
                {
                    int marked = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "UPDATE " + _Table + " SET outcome = 'RolledBack', rolledbackbyid = @rollbackid WHERE id = @id AND tenantid = @tenantid AND rolledbackbyid IS NULL;",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "rollbackid", record.Id);
                            AdoDatabaseDriver.Add(command, "id", record.RollbackOfId);
                            AdoDatabaseDriver.Add(command, "tenantid", record.TenantId);
                        }, ct).ConfigureAwait(false);
                    if (marked == 0) throw new InvalidOperationException("Promotion " + record.RollbackOfId + " was already rolled back.");
                }

                string values = "@" + String.Join(", @", _Columns.Split(", "));
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, record), ct).ConfigureAwait(false);
                for (int i = 0; i < record.Items.Count; i++)
                {
                    PromotionRecordItem item = record.Items[i];
                    int position = i;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _Items + " (id, promotionid, tenantid, position, deploymentid, deploymentname, agentid, previousrevisionid, newrevisionid) VALUES (@id, @promotionid, @tenantid, @position, @deploymentid, @deploymentname, @agentid, @previousrevisionid, @newrevisionid);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "id", IdGenerator.NewPromotionRecordItemId());
                            AdoDatabaseDriver.Add(command, "promotionid", record.Id);
                            AdoDatabaseDriver.Add(command, "tenantid", record.TenantId);
                            AdoDatabaseDriver.Add(command, "position", position);
                            AdoDatabaseDriver.Add(command, "deploymentid", item.DeploymentId);
                            AdoDatabaseDriver.Add(command, "deploymentname", item.DeploymentName);
                            AdoDatabaseDriver.Add(command, "agentid", item.AgentId);
                            AdoDatabaseDriver.Add(command, "previousrevisionid", item.PreviousRevisionId);
                            AdoDatabaseDriver.Add(command, "newrevisionid", item.NewRevisionId);
                        }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return record;
        }

        /// <inheritdoc />
        public async Task<PromotionRecord?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            PromotionRecord? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadItemsAsync(new List<PromotionRecord> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<PromotionRecord>> EnumerateAsync(string tenantId, string? agentId, string? appId, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(agentId)) clauses.Add("agentid = @agentid");
            if (!String.IsNullOrEmpty(appId)) clauses.Add("appid = @appid");
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(agentId)) AdoDatabaseDriver.Add(command, "agentid", agentId);
                if (!String.IsNullOrEmpty(appId)) AdoDatabaseDriver.Add(command, "appid", appId);
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            List<PromotionRecord> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + " ORDER BY createdutc DESC, id DESC" + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            await LoadItemsAsync(objects, token).ConfigureAwait(false);
            return EnumerationResult<PromotionRecord>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a record row (items not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>Record.</returns>
        public static PromotionRecord Map(DbDataReader reader)
        {
            PromotionRecord obj = new PromotionRecord();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Kind = AdoConverters.Enum(reader, "kind", PromotionKindEnum.Promote);
            obj.Outcome = AdoConverters.Enum(reader, "outcome", PromotionOutcomeEnum.Applied);
            obj.AgentId = AdoConverters.NullableStr(reader, "agentid");
            obj.AppId = AdoConverters.NullableStr(reader, "appid");
            obj.AppRevisionId = AdoConverters.NullableStr(reader, "apprevisionid");
            obj.AgentRevisionId = AdoConverters.NullableStr(reader, "agentrevisionid");
            obj.SourceEnvironment = AdoConverters.Str(reader, "sourceenvironment");
            obj.TargetEnvironment = AdoConverters.Str(reader, "targetenvironment");
            obj.SkippedEnvironments = AdoConverters.Bool(reader, "skippedenvironments");
            obj.RollbackOfId = AdoConverters.NullableStr(reader, "rollbackofid");
            obj.RolledBackById = AdoConverters.NullableStr(reader, "rolledbackbyid");
            obj.ActorType = AdoConverters.Enum(reader, "actortype", PrincipalTypeEnum.User);
            obj.ActorId = AdoConverters.NullableStr(reader, "actorid");
            obj.ActorName = AdoConverters.NullableStr(reader, "actorname");
            obj.Note = AdoConverters.NullableStr(reader, "note");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, PromotionRecord obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
            AdoDatabaseDriver.Add(command, "outcome", obj.Outcome.ToString());
            AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
            AdoDatabaseDriver.Add(command, "appid", obj.AppId);
            AdoDatabaseDriver.Add(command, "apprevisionid", obj.AppRevisionId);
            AdoDatabaseDriver.Add(command, "agentrevisionid", obj.AgentRevisionId);
            AdoDatabaseDriver.Add(command, "sourceenvironment", obj.SourceEnvironment);
            AdoDatabaseDriver.Add(command, "targetenvironment", obj.TargetEnvironment);
            AdoDatabaseDriver.Add(command, "skippedenvironments", obj.SkippedEnvironments);
            AdoDatabaseDriver.Add(command, "rollbackofid", obj.RollbackOfId);
            AdoDatabaseDriver.Add(command, "rolledbackbyid", obj.RolledBackById);
            AdoDatabaseDriver.Add(command, "actortype", obj.ActorType.ToString());
            AdoDatabaseDriver.Add(command, "actorid", obj.ActorId);
            AdoDatabaseDriver.Add(command, "actorname", obj.ActorName);
            AdoDatabaseDriver.Add(command, "note", obj.Note);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
        }

        private async Task LoadItemsAsync(List<PromotionRecord> records, CancellationToken token)
        {
            for (int offset = 0; offset < records.Count; offset += 200)
            {
                List<PromotionRecord> page = records.Skip(offset).Take(200).ToList();
                List<string> names = new List<string>();
                for (int i = 0; i < page.Count; i++) names.Add("@p" + i);
                List<PromotionItemRow> rows = await _Driver.QueryAsync(
                    "SELECT * FROM " + _Items + " WHERE promotionid IN (" + String.Join(", ", names) + ") ORDER BY promotionid, position ASC;",
                    command =>
                    {
                        for (int i = 0; i < page.Count; i++) AdoDatabaseDriver.Add(command, "p" + i, page[i].Id);
                    },
                    reader =>
                    {
                        PromotionItemRow row = new PromotionItemRow();
                        row.PromotionId = AdoConverters.Str(reader, "promotionid");
                        row.Item.DeploymentId = AdoConverters.Str(reader, "deploymentid");
                        row.Item.DeploymentName = AdoConverters.Str(reader, "deploymentname");
                        row.Item.AgentId = AdoConverters.Str(reader, "agentid");
                        row.Item.PreviousRevisionId = AdoConverters.NullableStr(reader, "previousrevisionid");
                        row.Item.NewRevisionId = AdoConverters.NullableStr(reader, "newrevisionid");
                        return row;
                    }, token).ConfigureAwait(false);
                foreach (PromotionRecord record in page)
                {
                    record.Items = rows.Where(r => r.PromotionId == record.Id).Select(r => r.Item).ToList();
                }
            }
        }

        #endregion
    }
}
