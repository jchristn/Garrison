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
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral change rule data access (AA8.4). Classes and limits live in child tables keyed by rule and position.
    /// Thread-safe.
    /// </summary>
    public class AdoChangeRuleMethods : IChangeRuleMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, organizationid, unitid, name, description, active, expiresutc, gateevalset, gatethreshold, createdbytype, createdbyid, createdbyname, updatedbyname, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Rules;
        private readonly string _Classes;
        private readonly string _Limits;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoChangeRuleMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Rules = driver.Table("change_rules");
            _Classes = driver.Table("change_rule_classes");
            _Limits = driver.Table("change_rule_limits");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<ChangeRule> CreateAsync(ChangeRule obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Rules + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<ChangeRule> UpdateAsync(ChangeRule obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Rules + " SET unitid = @unitid, name = @name, description = @description, active = @active, expiresutc = @expiresutc, gateevalset = @gateevalset, gatethreshold = @gatethreshold, updatedbyname = @updatedbyname, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                    command => Bind(command, obj), ct).ConfigureAwait(false);
                await DeleteChildrenAsync(connection, transaction, obj.TenantId, obj.Id, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<ChangeRule?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            ChangeRule? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Rules + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj == null) return null;
            await LoadChildrenAsync(new List<ChangeRule> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<ChangeRule>> EnumerateAsync(string tenantId, string? organizationId, string? unitId, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(organizationId)) clauses.Add("organizationid = @organizationid");
            if (!String.IsNullOrEmpty(unitId)) clauses.Add("unitid = @unitid");
            if (query.ActiveOnly) clauses.Add("active = @active");
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(organizationId)) AdoDatabaseDriver.Add(command, "organizationid", organizationId);
                if (!String.IsNullOrEmpty(unitId)) AdoDatabaseDriver.Add(command, "unitid", unitId);
                if (query.ActiveOnly) AdoDatabaseDriver.Add(command, "active", true);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Rules + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            string order = query.Ordering == EnumerationOrderEnum.CreatedAscending ? " ORDER BY createdutc ASC, id ASC" : " ORDER BY createdutc DESC, id DESC";
            List<ChangeRule> rules = await _Driver.QueryAsync("SELECT * FROM " + _Rules + where + order + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            await LoadChildrenAsync(rules, token).ConfigureAwait(false);
            return EnumerationResult<ChangeRule>.Build(query, total, rules);
        }

        /// <inheritdoc />
        public async Task<List<ChangeRule>> ListInForceAsync(string tenantId, string organizationId, DateTime utc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(organizationId)) throw new ArgumentNullException(nameof(organizationId));
            List<ChangeRule> rules = await _Driver.QueryAsync(
                "SELECT * FROM " + _Rules + " WHERE tenantid = @tenantid AND organizationid = @organizationid AND active = @active AND (expiresutc IS NULL OR expiresutc > @now) ORDER BY createdutc ASC, id ASC;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "organizationid", organizationId);
                    AdoDatabaseDriver.Add(command, "active", true);
                    AdoDatabaseDriver.Add(command, "now", utc);
                }, Map, token).ConfigureAwait(false);
            await LoadChildrenAsync(rules, token).ConfigureAwait(false);
            return rules;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await DeleteChildrenAsync(connection, transaction, tenantId, id, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Rules + " WHERE id = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<int> DeleteForOrganizationAsync(string tenantId, string organizationId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(organizationId)) throw new ArgumentNullException(nameof(organizationId));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                string owned = "ruleid IN (SELECT id FROM " + _Rules + " WHERE tenantid = @tenantid AND organizationid = @organizationid)";
                Action<DbCommand> bind = command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "organizationid", organizationId);
                };
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Classes + " WHERE tenantid = @tenantid AND " + owned + ";", bind, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Limits + " WHERE tenantid = @tenantid AND " + owned + ";", bind, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Rules + " WHERE tenantid = @tenantid AND organizationid = @organizationid;", bind, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected;
        }

        #endregion

        #region Private-Methods

        private static ChangeRule Map(DbDataReader reader)
        {
            ChangeRule obj = new ChangeRule();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.OrganizationId = AdoConverters.Str(reader, "organizationid");
            obj.UnitId = AdoConverters.Str(reader, "unitid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.ExpiresUtc = AdoConverters.NullableDate(reader, "expiresutc");
            obj.GateEvalSet = AdoConverters.NullableStr(reader, "gateevalset");
            obj.GateThreshold = AdoConverters.NullableDouble(reader, "gatethreshold");
            obj.CreatedByType = AdoConverters.Enum(reader, "createdbytype", PrincipalTypeEnum.User);
            obj.CreatedById = AdoConverters.NullableStr(reader, "createdbyid");
            obj.CreatedByName = AdoConverters.NullableStr(reader, "createdbyname");
            obj.UpdatedByName = AdoConverters.NullableStr(reader, "updatedbyname");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        private static void Bind(DbCommand command, ChangeRule obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "organizationid", obj.OrganizationId);
            AdoDatabaseDriver.Add(command, "unitid", obj.UnitId);
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "description", obj.Description);
            AdoDatabaseDriver.Add(command, "active", obj.Active);
            AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
            AdoDatabaseDriver.Add(command, "gateevalset", obj.GateEvalSet);
            AdoDatabaseDriver.Add(command, "gatethreshold", obj.GateThreshold);
            AdoDatabaseDriver.Add(command, "createdbytype", obj.CreatedByType.ToString());
            AdoDatabaseDriver.Add(command, "createdbyid", obj.CreatedById);
            AdoDatabaseDriver.Add(command, "createdbyname", obj.CreatedByName);
            AdoDatabaseDriver.Add(command, "updatedbyname", obj.UpdatedByName);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, ChangeRule obj, CancellationToken token)
        {
            for (int i = 0; i < obj.Classes.Count; i++)
            {
                ChangeRuleClass row = obj.Classes[i];
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Classes + " (ruleid, tenantid, position, changeclass) VALUES (@ruleid, @tenantid, @position, @changeclass);", command =>
                {
                    AdoDatabaseDriver.Add(command, "ruleid", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "position", i);
                    AdoDatabaseDriver.Add(command, "changeclass", row.Class.ToString());
                }, token).ConfigureAwait(false);
            }
            for (int i = 0; i < obj.Limits.Count; i++)
            {
                ChangeRuleLimit row = obj.Limits[i];
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Limits + " (ruleid, tenantid, position, changeclass, name, minimum, maximum) VALUES (@ruleid, @tenantid, @position, @changeclass, @name, @minimum, @maximum);", command =>
                {
                    AdoDatabaseDriver.Add(command, "ruleid", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "position", i);
                    AdoDatabaseDriver.Add(command, "changeclass", row.Class.ToString());
                    AdoDatabaseDriver.Add(command, "name", row.Name);
                    AdoDatabaseDriver.Add(command, "minimum", row.Minimum);
                    AdoDatabaseDriver.Add(command, "maximum", row.Maximum);
                }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string tenantId, string ruleId, CancellationToken token)
        {
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "ruleid", ruleId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            };
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Classes + " WHERE ruleid = @ruleid AND tenantid = @tenantid;", bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Limits + " WHERE ruleid = @ruleid AND tenantid = @tenantid;", bind, token).ConfigureAwait(false);
        }

        private async Task LoadChildrenAsync(List<ChangeRule> rules, CancellationToken token)
        {
            if (rules.Count == 0) return;
            Dictionary<string, ChangeRule> byId = rules.ToDictionary(r => r.Id, StringComparer.Ordinal);
            List<string> names = new List<string>();
            for (int i = 0; i < rules.Count; i++) names.Add("@r" + i.ToString(CultureInfo.InvariantCulture));
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", rules[0].TenantId);
                for (int i = 0; i < rules.Count; i++) AdoDatabaseDriver.Add(command, "r" + i.ToString(CultureInfo.InvariantCulture), rules[i].Id);
            };
            string within = " WHERE tenantid = @tenantid AND ruleid IN (" + String.Join(", ", names) + ") ORDER BY ruleid, position;";
            List<ChangeRuleChildRow> classes = await _Driver.QueryAsync("SELECT ruleid, changeclass FROM " + _Classes + within, bind, reader => new ChangeRuleChildRow
            {
                RuleId = AdoConverters.Str(reader, "ruleid"),
                Class = new ChangeRuleClass { Class = AdoConverters.Enum(reader, "changeclass", ChangeClassEnum.PromptRetune) }
            }, token).ConfigureAwait(false);
            List<ChangeRuleChildRow> limits = await _Driver.QueryAsync("SELECT ruleid, changeclass, name, minimum, maximum FROM " + _Limits + within, bind, reader => new ChangeRuleChildRow
            {
                RuleId = AdoConverters.Str(reader, "ruleid"),
                Limit = new ChangeRuleLimit
                {
                    Class = AdoConverters.Enum(reader, "changeclass", ChangeClassEnum.PromptRetune),
                    Name = AdoConverters.Str(reader, "name"),
                    Minimum = AdoConverters.NullableDouble(reader, "minimum"),
                    Maximum = AdoConverters.NullableDouble(reader, "maximum")
                }
            }, token).ConfigureAwait(false);
            foreach (ChangeRuleChildRow row in classes)
            {
                if (row.Class != null && byId.TryGetValue(row.RuleId, out ChangeRule? rule)) rule.Classes.Add(row.Class);
            }
            foreach (ChangeRuleChildRow row in limits)
            {
                if (row.Limit != null && byId.TryGetValue(row.RuleId, out ChangeRule? rule)) rule.Limits.Add(row.Limit);
            }
        }

        #endregion
    }
}
