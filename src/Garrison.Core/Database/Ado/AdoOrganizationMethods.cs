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
    /// Provider-neutral organization data access (AA7). Thread-safe.
    /// </summary>
    public class AdoOrganizationMethods : IOrganizationMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, name, description, mission, status, rootunitid, currentrevisionid, currentrevisionnumber, createdby, createdutc, lastupdateutc";
        private static readonly string _UnitColumns = "id, tenantid, organizationid, parentunitid, name, description, leadagentid, leadtitle, leadmandateid, appid, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Units;
        private readonly string _Members;
        private readonly string _PeerLines;
        private readonly string _Budgets;
        private readonly string _Revisions;
        private readonly string _RevisionUnits;
        private readonly string _RevisionMembers;
        private readonly string _RevisionPeerLines;
        private readonly string _RevisionBudgets;
        private readonly string _RevisionMandates;
        private readonly string _Agents;
        private readonly string _Mandates;
        private readonly string _MandateRevisions;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoOrganizationMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("organizations");
            _Units = driver.Table("org_units");
            _Members = driver.Table("org_unit_members");
            _PeerLines = driver.Table("org_unit_peer_lines");
            _Budgets = driver.Table("org_unit_budgets");
            _Revisions = driver.Table("org_revisions");
            _RevisionUnits = driver.Table("org_revision_units");
            _RevisionMembers = driver.Table("org_revision_members");
            _RevisionPeerLines = driver.Table("org_revision_peer_lines");
            _RevisionBudgets = driver.Table("org_revision_budgets");
            _RevisionMandates = driver.Table("org_revision_mandates");
            _Agents = driver.Table("agents");
            _Mandates = driver.Table("mandates");
            _MandateRevisions = driver.Table("mandate_revisions");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Organization> CreateAsync(Organization obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            DateTime now = DateTime.UtcNow;
            obj.CreatedUtc = now;
            obj.LastUpdateUtc = now;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.NonQueryAsync("INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Organization> UpdateAsync(Organization obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.NonQueryAsync("UPDATE " + _Table + " SET name = @name, description = @description, mission = @mission, status = @status, rootunitid = @rootunitid, currentrevisionid = @currentrevisionid, currentrevisionnumber = @currentrevisionnumber, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task TouchAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            await _Driver.NonQueryAsync("UPDATE " + _Table + " SET lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Organization?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @key AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "key", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Organization?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE name = @key AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "key", name);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Organization>> EnumerateAsync(string tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            List<Organization> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            return EnumerationResult<Organization>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<Organization>> ListLiveAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            return await _Driver.QueryAsync("SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND status IN ('Active', 'Frozen') AND currentrevisionid IS NOT NULL ORDER BY createdutc ASC, id ASC;",
                command => AdoDatabaseDriver.Add(command, "tenantid", tenantId), Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                Action<DbCommand> bind = command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                };
                string revisions = "SELECT id FROM " + _Revisions + " WHERE organizationid = @id AND tenantid = @tenantid";
                foreach (string table in new[] { _RevisionUnits, _RevisionMembers, _RevisionPeerLines, _RevisionBudgets, _RevisionMandates })
                {
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + table + " WHERE revisionid IN (" + revisions + ");", bind, ct).ConfigureAwait(false);
                }
                foreach (string table in new[] { _Revisions, _Members, _PeerLines, _Budgets, _Units })
                {
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + table + " WHERE organizationid = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                }
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<OrgUnit> CreateUnitAsync(OrgUnit unit, CancellationToken token = default)
        {
            if (unit == null) throw new ArgumentNullException(nameof(unit));
            DateTime now = DateTime.UtcNow;
            unit.CreatedUtc = now;
            unit.LastUpdateUtc = now;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await InsertUnitAsync(connection, transaction, unit, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return unit;
        }

        /// <inheritdoc />
        public async Task<OrgUnit> UpdateUnitAsync(OrgUnit unit, CancellationToken token = default)
        {
            if (unit == null) throw new ArgumentNullException(nameof(unit));
            unit.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Units + " SET parentunitid = @parentunitid, name = @name, description = @description, leadagentid = @leadagentid, leadtitle = @leadtitle, leadmandateid = @leadmandateid, appid = @appid, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                    command => BindUnit(command, unit), ct).ConfigureAwait(false);
                await DeleteUnitChildrenAsync(connection, transaction, unit.TenantId, unit.Id, ct).ConfigureAwait(false);
                await InsertUnitChildrenAsync(connection, transaction, unit, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return unit;
        }

        /// <inheritdoc />
        public async Task<OrgUnit?> ReadUnitAsync(string tenantId, string unitId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(unitId)) throw new ArgumentNullException(nameof(unitId));
            OrgUnit? unit = await _Driver.QuerySingleAsync("SELECT u.*, a.name AS leadagentname FROM " + _Units + " u LEFT JOIN " + _Agents + " a ON a.id = u.leadagentid WHERE u.id = @id AND u.tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", unitId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapUnit, token).ConfigureAwait(false);
            if (unit == null) return null;
            await LoadUnitChildrenAsync(new List<OrgUnit> { unit }, _Members, _PeerLines, _Budgets, _Units, "unitid = @key", unit.Id, token).ConfigureAwait(false);
            return unit;
        }

        /// <inheritdoc />
        public async Task<List<OrgUnit>> ListUnitsAsync(string tenantId, string organizationId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(organizationId)) throw new ArgumentNullException(nameof(organizationId));
            List<OrgUnit> units = await _Driver.QueryAsync("SELECT u.*, a.name AS leadagentname FROM " + _Units + " u LEFT JOIN " + _Agents + " a ON a.id = u.leadagentid WHERE u.organizationid = @id AND u.tenantid = @tenantid ORDER BY u.createdutc ASC, u.id ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", organizationId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapUnit, token).ConfigureAwait(false);
            await LoadUnitChildrenAsync(units, _Members, _PeerLines, _Budgets, _Units, "organizationid = @key", organizationId, token).ConfigureAwait(false);
            return units;
        }

        /// <inheritdoc />
        public async Task<int> CountLedUnitsAsync(string tenantId, string agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            object? value = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Units + " u INNER JOIN " + _Table + " o ON o.id = u.organizationid WHERE u.tenantid = @tenantid AND u.leadagentid = @agentid AND o.status <> 'Retired';", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "agentid", agentId);
            }, token).ConfigureAwait(false);
            return value == null || value is DBNull ? 0 : Convert.ToInt32(value, System.Globalization.CultureInfo.InvariantCulture);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteUnitAsync(string tenantId, string unitId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(unitId)) throw new ArgumentNullException(nameof(unitId));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await DeleteUnitChildrenAsync(connection, transaction, tenantId, unitId, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _PeerLines + " WHERE peerunitid = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", unitId);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Units + " WHERE id = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", unitId);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task ReplaceTreeAsync(Organization organization, List<OrgUnit> units, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (units == null) throw new ArgumentNullException(nameof(units));
            DateTime now = DateTime.UtcNow;
            organization.LastUpdateUtc = now;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                Action<DbCommand> bind = command =>
                {
                    AdoDatabaseDriver.Add(command, "id", organization.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", organization.TenantId);
                };
                foreach (string table in new[] { _Members, _PeerLines, _Budgets, _Units })
                {
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + table + " WHERE organizationid = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                }
                foreach (OrgUnit unit in units)
                {
                    unit.TenantId = organization.TenantId;
                    unit.OrganizationId = organization.Id;
                    unit.LastUpdateUtc = now;
                    await InsertUnitAsync(connection, transaction, unit, ct).ConfigureAwait(false);
                }
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Table + " SET rootunitid = @rootunitid, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid;", command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "rootunitid", organization.RootUnitId);
                    AdoDatabaseDriver.Add(command, "now", now);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<OrgRevision> CreateRevisionAsync(OrgRevision revision, CancellationToken token = default)
        {
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            revision.CreatedUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                List<int> numbers = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT COALESCE(MAX(number), 0) AS highest FROM " + _Revisions + " WHERE organizationid = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", revision.OrganizationId);
                    AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                }, reader => AdoConverters.Int(reader, "highest"), ct).ConfigureAwait(false);
                revision.Number = (numbers.Count > 0 ? numbers[0] : 0) + 1;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Revisions + " (id, tenantid, organizationid, number, state, note, rollbackofrevisionid, draftid, revertdraftid, authortype, authorid, authorname, publishedutc, createdutc) VALUES (@id, @tenantid, @organizationid, @number, @state, @note, @rollbackofrevisionid, @draftid, @revertdraftid, @authortype, @authorid, @authorname, @publishedutc, @createdutc);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", revision.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                        AdoDatabaseDriver.Add(command, "organizationid", revision.OrganizationId);
                        AdoDatabaseDriver.Add(command, "number", revision.Number);
                        AdoDatabaseDriver.Add(command, "state", revision.State.ToString());
                        AdoDatabaseDriver.Add(command, "note", revision.Note);
                        AdoDatabaseDriver.Add(command, "rollbackofrevisionid", revision.RollbackOfRevisionId);
                        AdoDatabaseDriver.Add(command, "draftid", revision.DraftId);
                        AdoDatabaseDriver.Add(command, "revertdraftid", revision.RevertDraftId);
                        AdoDatabaseDriver.Add(command, "authortype", revision.AuthorType.ToString());
                        AdoDatabaseDriver.Add(command, "authorid", revision.AuthorId);
                        AdoDatabaseDriver.Add(command, "authorname", revision.AuthorName);
                        AdoDatabaseDriver.Add(command, "publishedutc", revision.PublishedUtc);
                        AdoDatabaseDriver.Add(command, "createdutc", revision.CreatedUtc);
                    }, ct).ConfigureAwait(false);
                for (int i = 0; i < revision.Units.Count; i++)
                {
                    OrgUnit unit = revision.Units[i];
                    int position = i;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _RevisionUnits + " (revisionid, tenantid, unitid, position, parentunitid, name, description, leadagentid, leadtitle, leadmandateid, appid) VALUES (@revisionid, @tenantid, @unitid, @position, @parentunitid, @name, @description, @leadagentid, @leadtitle, @leadmandateid, @appid);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "revisionid", revision.Id);
                            AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                            AdoDatabaseDriver.Add(command, "unitid", unit.Id);
                            AdoDatabaseDriver.Add(command, "position", position);
                            AdoDatabaseDriver.Add(command, "parentunitid", unit.ParentUnitId);
                            AdoDatabaseDriver.Add(command, "name", unit.Name);
                            AdoDatabaseDriver.Add(command, "description", unit.Description);
                            AdoDatabaseDriver.Add(command, "leadagentid", unit.LeadAgentId);
                            AdoDatabaseDriver.Add(command, "leadtitle", unit.LeadTitle);
                            AdoDatabaseDriver.Add(command, "leadmandateid", unit.LeadMandateId);
                            AdoDatabaseDriver.Add(command, "appid", unit.AppId);
                        }, ct).ConfigureAwait(false);
                    await InsertChildRowsAsync(connection, transaction, _RevisionMembers, _RevisionPeerLines, _RevisionBudgets, "revisionid", revision.Id, revision.TenantId, unit, ct).ConfigureAwait(false);
                }
                foreach (OrgRevisionMandate pin in revision.Mandates)
                {
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _RevisionMandates + " (revisionid, tenantid, mandateid, mandaterevisionid) VALUES (@revisionid, @tenantid, @mandateid, @mandaterevisionid);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "revisionid", revision.Id);
                            AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                            AdoDatabaseDriver.Add(command, "mandateid", pin.MandateId);
                            AdoDatabaseDriver.Add(command, "mandaterevisionid", pin.MandateRevisionId);
                        }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return revision;
        }

        /// <inheritdoc />
        public async Task<OrgRevision?> ReadRevisionAsync(string tenantId, string revisionId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(revisionId)) throw new ArgumentNullException(nameof(revisionId));
            OrgRevision? revision = await _Driver.QuerySingleAsync("SELECT * FROM " + _Revisions + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", revisionId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapRevision, token).ConfigureAwait(false);
            if (revision == null) return null;
            Action<DbCommand> bind = command => AdoDatabaseDriver.Add(command, "key", revision.Id);
            List<OrgUnit> units = await _Driver.QueryAsync("SELECT u.*, u.unitid AS id, a.name AS leadagentname FROM " + _RevisionUnits + " u LEFT JOIN " + _Agents + " a ON a.id = u.leadagentid WHERE u.revisionid = @key ORDER BY u.position ASC;", bind, reader =>
            {
                OrgUnit unit = MapUnitCore(reader);
                unit.TenantId = revision.TenantId;
                unit.OrganizationId = revision.OrganizationId;
                unit.CreatedUtc = revision.CreatedUtc;
                unit.LastUpdateUtc = revision.CreatedUtc;
                return unit;
            }, token).ConfigureAwait(false);
            await LoadUnitChildrenAsync(units, _RevisionMembers, _RevisionPeerLines, _RevisionBudgets, null, "revisionid = @key", revision.Id, token).ConfigureAwait(false);
            revision.Units = units;
            revision.Mandates = await _Driver.QueryAsync("SELECT p.mandateid AS mandateid, p.mandaterevisionid AS mandaterevisionid, m.name AS mandatename, r.number AS revisionnumber FROM " + _RevisionMandates + " p LEFT JOIN " + _Mandates + " m ON m.id = p.mandateid LEFT JOIN " + _MandateRevisions + " r ON r.id = p.mandaterevisionid WHERE p.revisionid = @key ORDER BY p.mandateid ASC;", bind,
                reader => new OrgRevisionMandate
                {
                    MandateId = AdoConverters.Str(reader, "mandateid"),
                    MandateRevisionId = AdoConverters.Str(reader, "mandaterevisionid"),
                    MandateName = AdoConverters.NullableStr(reader, "mandatename"),
                    MandateRevisionNumber = AdoConverters.NullableInt(reader, "revisionnumber")
                }, token).ConfigureAwait(false);
            return revision;
        }

        /// <inheritdoc />
        public async Task<List<OrgRevision>> ListRevisionsAsync(string tenantId, string organizationId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(organizationId)) throw new ArgumentNullException(nameof(organizationId));
            return await _Driver.QueryAsync("SELECT * FROM " + _Revisions + " WHERE organizationid = @id AND tenantid = @tenantid ORDER BY number DESC;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", organizationId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapRevision, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> PublishRevisionAsync(Organization organization, OrgRevision revision, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            DateTime now = DateTime.UtcNow;
            bool published = false;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                int moved = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Revisions + " SET state = 'Published', publishedutc = @now WHERE id = @id AND tenantid = @tenantid AND state = 'Draft';", command =>
                {
                    AdoDatabaseDriver.Add(command, "now", now);
                    AdoDatabaseDriver.Add(command, "id", revision.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                }, ct).ConfigureAwait(false);
                if (moved == 0) return;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Revisions + " SET state = 'Superseded' WHERE organizationid = @organizationid AND tenantid = @tenantid AND state = 'Published' AND id <> @id;", command =>
                {
                    AdoDatabaseDriver.Add(command, "organizationid", organization.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", organization.TenantId);
                    AdoDatabaseDriver.Add(command, "id", revision.Id);
                }, ct).ConfigureAwait(false);
                OrganizationStatusEnum status = organization.Status == OrganizationStatusEnum.Draft ? OrganizationStatusEnum.Active : organization.Status;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Table + " SET currentrevisionid = @revisionid, currentrevisionnumber = @number, status = @status, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "revisionid", revision.Id);
                    AdoDatabaseDriver.Add(command, "number", revision.Number);
                    AdoDatabaseDriver.Add(command, "status", status.ToString());
                    AdoDatabaseDriver.Add(command, "now", now);
                    AdoDatabaseDriver.Add(command, "id", organization.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", organization.TenantId);
                }, ct).ConfigureAwait(false);
                published = true;
                organization.Status = status;
            }, token).ConfigureAwait(false);
            if (!published) return false;
            revision.State = OrgRevisionStateEnum.Published;
            revision.PublishedUtc = now;
            organization.CurrentRevisionId = revision.Id;
            organization.CurrentRevisionNumber = revision.Number;
            organization.LastUpdateUtc = now;
            return true;
        }

        /// <summary>
        /// Map an organizations row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>Organization.</returns>
        public static Organization Map(DbDataReader reader)
        {
            Organization obj = new Organization();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Mission = AdoConverters.NullableStr(reader, "mission");
            obj.Status = AdoConverters.Enum(reader, "status", OrganizationStatusEnum.Draft);
            obj.RootUnitId = AdoConverters.NullableStr(reader, "rootunitid");
            obj.CurrentRevisionId = AdoConverters.NullableStr(reader, "currentrevisionid");
            obj.CurrentRevisionNumber = AdoConverters.Int(reader, "currentrevisionnumber");
            obj.CreatedBy = AdoConverters.NullableStr(reader, "createdby");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, Organization obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "description", obj.Description);
            AdoDatabaseDriver.Add(command, "mission", obj.Mission);
            AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
            AdoDatabaseDriver.Add(command, "rootunitid", obj.RootUnitId);
            AdoDatabaseDriver.Add(command, "currentrevisionid", obj.CurrentRevisionId);
            AdoDatabaseDriver.Add(command, "currentrevisionnumber", obj.CurrentRevisionNumber);
            AdoDatabaseDriver.Add(command, "createdby", obj.CreatedBy);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private static void BindUnit(DbCommand command, OrgUnit unit)
        {
            AdoDatabaseDriver.Add(command, "id", unit.Id);
            AdoDatabaseDriver.Add(command, "tenantid", unit.TenantId);
            AdoDatabaseDriver.Add(command, "organizationid", unit.OrganizationId);
            AdoDatabaseDriver.Add(command, "parentunitid", unit.ParentUnitId);
            AdoDatabaseDriver.Add(command, "name", unit.Name);
            AdoDatabaseDriver.Add(command, "description", unit.Description);
            AdoDatabaseDriver.Add(command, "leadagentid", unit.LeadAgentId);
            AdoDatabaseDriver.Add(command, "leadtitle", unit.LeadTitle);
            AdoDatabaseDriver.Add(command, "leadmandateid", unit.LeadMandateId);
            AdoDatabaseDriver.Add(command, "appid", unit.AppId);
            AdoDatabaseDriver.Add(command, "createdutc", unit.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", unit.LastUpdateUtc);
        }

        private static OrgUnit MapUnit(DbDataReader reader)
        {
            OrgUnit unit = MapUnitCore(reader);
            unit.TenantId = AdoConverters.Str(reader, "tenantid");
            unit.OrganizationId = AdoConverters.Str(reader, "organizationid");
            unit.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            unit.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return unit;
        }

        private static OrgUnit MapUnitCore(DbDataReader reader)
        {
            OrgUnit unit = new OrgUnit();
            unit.Id = AdoConverters.Str(reader, "id");
            unit.ParentUnitId = AdoConverters.NullableStr(reader, "parentunitid");
            unit.Name = AdoConverters.Str(reader, "name");
            unit.Description = AdoConverters.NullableStr(reader, "description");
            unit.LeadAgentId = AdoConverters.NullableStr(reader, "leadagentid");
            unit.LeadAgentName = AdoConverters.NullableStr(reader, "leadagentname");
            unit.LeadTitle = AdoConverters.NullableStr(reader, "leadtitle");
            unit.LeadMandateId = AdoConverters.NullableStr(reader, "leadmandateid");
            unit.AppId = AdoConverters.NullableStr(reader, "appid");
            return unit;
        }

        private static OrgRevision MapRevision(DbDataReader reader)
        {
            OrgRevision obj = new OrgRevision();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.OrganizationId = AdoConverters.Str(reader, "organizationid");
            obj.Number = AdoConverters.Int(reader, "number");
            obj.State = AdoConverters.Enum(reader, "state", OrgRevisionStateEnum.Draft);
            obj.Note = AdoConverters.NullableStr(reader, "note");
            obj.RollbackOfRevisionId = AdoConverters.NullableStr(reader, "rollbackofrevisionid");
            obj.DraftId = AdoConverters.NullableStr(reader, "draftid");
            obj.RevertDraftId = AdoConverters.NullableStr(reader, "revertdraftid");
            obj.AuthorType = AdoConverters.Enum(reader, "authortype", PrincipalTypeEnum.User);
            obj.AuthorId = AdoConverters.NullableStr(reader, "authorid");
            obj.AuthorName = AdoConverters.NullableStr(reader, "authorname");
            obj.PublishedUtc = AdoConverters.NullableDate(reader, "publishedutc");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        private async Task InsertUnitAsync(DbConnection connection, DbTransaction transaction, OrgUnit unit, CancellationToken token)
        {
            string values = "@" + String.Join(", @", _UnitColumns.Split(", "));
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Units + " (" + _UnitColumns + ") VALUES (" + values + ");", command => BindUnit(command, unit), token).ConfigureAwait(false);
            await InsertUnitChildrenAsync(connection, transaction, unit, token).ConfigureAwait(false);
        }

        private async Task InsertUnitChildrenAsync(DbConnection connection, DbTransaction transaction, OrgUnit unit, CancellationToken token)
        {
            await InsertChildRowsAsync(connection, transaction, _Members, _PeerLines, _Budgets, "organizationid", unit.OrganizationId, unit.TenantId, unit, token).ConfigureAwait(false);
        }

        private static async Task InsertChildRowsAsync(DbConnection connection, DbTransaction transaction, string members, string peerLines, string budgets, string ownerColumn, string ownerId, string tenantId, OrgUnit unit, CancellationToken token)
        {
            for (int i = 0; i < unit.Members.Count; i++)
            {
                OrgUnitMember member = unit.Members[i];
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + members + " (unitid, tenantid, " + ownerColumn + ", position, agentid, title, mandateid) VALUES (@unitid, @tenantid, @owner, @position, @agentid, @title, @mandateid);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "unitid", unit.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                        AdoDatabaseDriver.Add(command, "owner", ownerId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "agentid", member.AgentId);
                        AdoDatabaseDriver.Add(command, "title", member.Title);
                        AdoDatabaseDriver.Add(command, "mandateid", member.MandateId);
                    }, token).ConfigureAwait(false);
            }
            for (int i = 0; i < unit.PeerLines.Count; i++)
            {
                OrgUnitPeerLine line = unit.PeerLines[i];
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + peerLines + " (unitid, tenantid, " + ownerColumn + ", position, peerunitid) VALUES (@unitid, @tenantid, @owner, @position, @peerunitid);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "unitid", unit.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                        AdoDatabaseDriver.Add(command, "owner", ownerId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "peerunitid", line.PeerUnitId);
                    }, token).ConfigureAwait(false);
            }
            foreach (OrgUnitBudget budget in unit.Budgets)
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + budgets + " (unitid, tenantid, " + ownerColumn + ", period, amountusd) VALUES (@unitid, @tenantid, @owner, @period, @amountusd);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "unitid", unit.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                        AdoDatabaseDriver.Add(command, "owner", ownerId);
                        AdoDatabaseDriver.Add(command, "period", budget.Period.ToString());
                        AdoDatabaseDriver.Add(command, "amountusd", budget.AmountUsd);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteUnitChildrenAsync(DbConnection connection, DbTransaction transaction, string tenantId, string unitId, CancellationToken token)
        {
            foreach (string table in new[] { _Members, _PeerLines, _Budgets })
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + table + " WHERE unitid = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", unitId);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, token).ConfigureAwait(false);
            }
        }

        private async Task LoadUnitChildrenAsync(List<OrgUnit> units, string members, string peerLines, string budgets, string? unitTable, string where, string key, CancellationToken token)
        {
            if (units.Count == 0) return;
            Dictionary<string, OrgUnit> byId = units.ToDictionary(u => u.Id, StringComparer.Ordinal);
            Action<DbCommand> bind = command => AdoDatabaseDriver.Add(command, "key", key);
            string prefixed = "m." + where;
            List<KeyValuePair<string, OrgUnitMember>> memberRows = await _Driver.QueryAsync(
                "SELECT m.unitid AS unitid, m.agentid AS agentid, m.title AS title, m.mandateid AS mandateid, a.name AS agentname FROM " + members + " m LEFT JOIN " + _Agents + " a ON a.id = m.agentid WHERE " + prefixed + " ORDER BY m.unitid ASC, m.position ASC;",
                bind,
                reader => new KeyValuePair<string, OrgUnitMember>(AdoConverters.Str(reader, "unitid"), new OrgUnitMember
                {
                    AgentId = AdoConverters.Str(reader, "agentid"),
                    AgentName = AdoConverters.NullableStr(reader, "agentname"),
                    Title = AdoConverters.NullableStr(reader, "title"),
                    MandateId = AdoConverters.NullableStr(reader, "mandateid")
                }), token).ConfigureAwait(false);
            foreach (KeyValuePair<string, OrgUnitMember> row in memberRows)
            {
                if (byId.TryGetValue(row.Key, out OrgUnit? unit)) unit.Members.Add(row.Value);
            }
            List<KeyValuePair<string, OrgUnitPeerLine>> lineRows = await _Driver.QueryAsync(
                "SELECT m.unitid AS unitid, m.peerunitid AS peerunitid FROM " + peerLines + " m WHERE " + prefixed + " ORDER BY m.unitid ASC, m.position ASC;",
                bind,
                reader => new KeyValuePair<string, OrgUnitPeerLine>(AdoConverters.Str(reader, "unitid"), new OrgUnitPeerLine { PeerUnitId = AdoConverters.Str(reader, "peerunitid") }), token).ConfigureAwait(false);
            foreach (KeyValuePair<string, OrgUnitPeerLine> row in lineRows)
            {
                if (!byId.TryGetValue(row.Key, out OrgUnit? unit)) continue;
                if (byId.TryGetValue(row.Value.PeerUnitId, out OrgUnit? peer)) row.Value.PeerUnitName = peer.Name;
                unit.PeerLines.Add(row.Value);
            }
            if (unitTable != null)
            {
                // A single unit's peers live outside the loaded list; name them from the working tree.
                List<OrgUnitPeerLine> unnamed = units.SelectMany(u => u.PeerLines).Where(l => l.PeerUnitName == null).ToList();
                foreach (OrgUnitPeerLine line in unnamed)
                {
                    object? name = await _Driver.ScalarAsync("SELECT name FROM " + unitTable + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", line.PeerUnitId), token).ConfigureAwait(false);
                    line.PeerUnitName = name == null || name is DBNull ? null : Convert.ToString(name, CultureInfo.InvariantCulture);
                }
            }
            List<KeyValuePair<string, OrgUnitBudget>> budgetRows = await _Driver.QueryAsync(
                "SELECT m.unitid AS unitid, m.period AS period, m.amountusd AS amountusd FROM " + budgets + " m WHERE " + prefixed + " ORDER BY m.unitid ASC, m.period ASC;",
                bind,
                reader => new KeyValuePair<string, OrgUnitBudget>(AdoConverters.Str(reader, "unitid"), new OrgUnitBudget
                {
                    Period = AdoConverters.Enum(reader, "period", BudgetPeriodEnum.Day),
                    AmountUsd = Math.Max(0, AdoConverters.Double(reader, "amountusd"))
                }), token).ConfigureAwait(false);
            foreach (KeyValuePair<string, OrgUnitBudget> row in budgetRows)
            {
                if (byId.TryGetValue(row.Key, out OrgUnit? unit)) unit.Budgets.Add(row.Value);
            }
        }

        #endregion
    }
}
