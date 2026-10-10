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
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral Agent data access. Thread-safe.
    /// </summary>
    public class AdoAgentMethods : IAgentMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _SkillsTable;
        private readonly string _TagsTable;
        private readonly string _DelegationAllowListTable;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoAgentMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("agents");
            _SkillsTable = driver.Table("agent_skills");
            _TagsTable = driver.Table("agent_tags");
            _DelegationAllowListTable = driver.Table("agent_delegation_allowlist");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Agent> CreateAsync(Agent obj, CancellationToken token = default)
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
        public async Task<Agent?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            Agent? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Agent?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            Agent? obj = await _Driver.QuerySingleAsync(
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
        public async Task<Agent?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

            string sql = "SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;";
            Agent? obj = await _Driver.QuerySingleAsync(
                sql,
                command =>
                {
                    AdoDatabaseDriver.Add(command, "name", name);
                    if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Agent> UpdateAsync(Agent obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, name = @name, displayname = @displayname, description = @description, kind = @kind, agentversion = @agentversion, exposea2a = @exposea2a, exposemcptool = @exposemcptool, mcptoolname = @mcptoolname, tooldescriptiontemplateid = @tooldescriptiontemplateid, skilldescriptiontemplateid = @skilldescriptiontemplateid, inputmode = @inputmode, inputschemajson = @inputschemajson, outputschemajson = @outputschemajson, delegationmode = @delegationmode, delegationmaxdepth = @delegationmaxdepth, delegationallowrecursion = @delegationallowrecursion, remoteprotocol = @remoteprotocol, remoteendpointurl = @remoteendpointurl, remotecredentialsecretid = @remotecredentialsecretid, lastregisteredutc = @lastregisteredutc, registrationttlseconds = @registrationttlseconds, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "displayname", obj.DisplayName);
                    AdoDatabaseDriver.Add(command, "description", obj.Description);
                    AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
                    AdoDatabaseDriver.Add(command, "agentversion", obj.AgentVersion);
                    AdoDatabaseDriver.Add(command, "exposea2a", obj.ExposeA2A);
                    AdoDatabaseDriver.Add(command, "exposemcptool", obj.ExposeMcpTool);
                    AdoDatabaseDriver.Add(command, "mcptoolname", obj.McpToolName);
                    AdoDatabaseDriver.Add(command, "tooldescriptiontemplateid", obj.ToolDescriptionTemplateId);
                    AdoDatabaseDriver.Add(command, "skilldescriptiontemplateid", obj.SkillDescriptionTemplateId);
                    AdoDatabaseDriver.Add(command, "inputmode", obj.InputMode.ToString());
                    AdoDatabaseDriver.Add(command, "inputschemajson", obj.InputSchemaJson);
                    AdoDatabaseDriver.Add(command, "outputschemajson", obj.OutputSchemaJson);
                    AdoDatabaseDriver.Add(command, "delegationmode", obj.DelegationMode.ToString());
                    AdoDatabaseDriver.Add(command, "delegationmaxdepth", obj.DelegationMaxDepth);
                    AdoDatabaseDriver.Add(command, "delegationallowrecursion", obj.DelegationAllowRecursion);
                    AdoDatabaseDriver.Add(command, "remoteprotocol", obj.RemoteProtocol?.ToString());
                    AdoDatabaseDriver.Add(command, "remoteendpointurl", obj.RemoteEndpointUrl);
                    AdoDatabaseDriver.Add(command, "remotecredentialsecretid", obj.RemoteCredentialSecretId);
                    AdoDatabaseDriver.Add(command, "lastregisteredutc", obj.LastRegisteredUtc);
                    AdoDatabaseDriver.Add(command, "registrationttlseconds", obj.RegistrationTtlSeconds);
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
        public async Task<EnumerationResult<Agent>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
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
            List<Agent> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            foreach (Agent obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);

            return EnumerationResult<Agent>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a Agent (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static Agent Map(DbDataReader reader)
        {
            Agent obj = new Agent();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.DisplayName = AdoConverters.NullableStr(reader, "displayname");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Kind = AdoConverters.Enum<AgentKindEnum>(reader, "kind", AgentKindEnum.Hosted);
            obj.AgentVersion = AdoConverters.NullableStr(reader, "agentversion");
            obj.ExposeA2A = AdoConverters.Bool(reader, "exposea2a");
            obj.ExposeMcpTool = AdoConverters.Bool(reader, "exposemcptool");
            obj.McpToolName = AdoConverters.NullableStr(reader, "mcptoolname");
            obj.ToolDescriptionTemplateId = AdoConverters.NullableStr(reader, "tooldescriptiontemplateid");
            obj.SkillDescriptionTemplateId = AdoConverters.NullableStr(reader, "skilldescriptiontemplateid");
            obj.InputMode = AdoConverters.Enum<AgentInputModeEnum>(reader, "inputmode", AgentInputModeEnum.Text);
            obj.InputSchemaJson = AdoConverters.NullableStr(reader, "inputschemajson");
            obj.OutputSchemaJson = AdoConverters.NullableStr(reader, "outputschemajson");
            obj.DelegationMode = AdoConverters.Enum<DelegationModeEnum>(reader, "delegationmode", DelegationModeEnum.None);
            obj.DelegationMaxDepth = AdoConverters.Int(reader, "delegationmaxdepth");
            obj.DelegationAllowRecursion = AdoConverters.Bool(reader, "delegationallowrecursion");
            obj.RemoteProtocol = AdoConverters.NullableEnum<RemoteProtocolEnum>(reader, "remoteprotocol");
            obj.RemoteEndpointUrl = AdoConverters.NullableStr(reader, "remoteendpointurl");
            obj.RemoteCredentialSecretId = AdoConverters.NullableStr(reader, "remotecredentialsecretid");
            obj.LastRegisteredUtc = AdoConverters.NullableDate(reader, "lastregisteredutc");
            obj.RegistrationTtlSeconds = AdoConverters.Int(reader, "registrationttlseconds");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <summary>
        /// Load child rows into a Agent.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task LoadChildrenAsync(Agent obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));

            obj.Skills = await _Driver.QueryAsync(
                "SELECT * FROM " + _SkillsTable + " WHERE agentid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapSkills,
                token).ConfigureAwait(false);

            obj.Tags = await _Driver.QueryAsync(
                "SELECT * FROM " + _TagsTable + " WHERE agentid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                reader => AdoConverters.Str(reader, "tag"),
                token).ConfigureAwait(false);

            obj.DelegationAllowList = await _Driver.QueryAsync(
                "SELECT * FROM " + _DelegationAllowListTable + " WHERE agentid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                reader => AdoConverters.Str(reader, "agentname"),
                token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, Agent obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, name, displayname, description, kind, agentversion, exposea2a, exposemcptool, mcptoolname, tooldescriptiontemplateid, skilldescriptiontemplateid, inputmode, inputschemajson, outputschemajson, delegationmode, delegationmaxdepth, delegationallowrecursion, remoteprotocol, remoteendpointurl, remotecredentialsecretid, lastregisteredutc, registrationttlseconds, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @name, @displayname, @description, @kind, @agentversion, @exposea2a, @exposemcptool, @mcptoolname, @tooldescriptiontemplateid, @skilldescriptiontemplateid, @inputmode, @inputschemajson, @outputschemajson, @delegationmode, @delegationmaxdepth, @delegationallowrecursion, @remoteprotocol, @remoteendpointurl, @remotecredentialsecretid, @lastregisteredutc, @registrationttlseconds, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "name", obj.Name);
                AdoDatabaseDriver.Add(command, "displayname", obj.DisplayName);
                AdoDatabaseDriver.Add(command, "description", obj.Description);
                AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
                AdoDatabaseDriver.Add(command, "agentversion", obj.AgentVersion);
                AdoDatabaseDriver.Add(command, "exposea2a", obj.ExposeA2A);
                AdoDatabaseDriver.Add(command, "exposemcptool", obj.ExposeMcpTool);
                AdoDatabaseDriver.Add(command, "mcptoolname", obj.McpToolName);
                AdoDatabaseDriver.Add(command, "tooldescriptiontemplateid", obj.ToolDescriptionTemplateId);
                AdoDatabaseDriver.Add(command, "skilldescriptiontemplateid", obj.SkillDescriptionTemplateId);
                AdoDatabaseDriver.Add(command, "inputmode", obj.InputMode.ToString());
                AdoDatabaseDriver.Add(command, "inputschemajson", obj.InputSchemaJson);
                AdoDatabaseDriver.Add(command, "outputschemajson", obj.OutputSchemaJson);
                AdoDatabaseDriver.Add(command, "delegationmode", obj.DelegationMode.ToString());
                AdoDatabaseDriver.Add(command, "delegationmaxdepth", obj.DelegationMaxDepth);
                AdoDatabaseDriver.Add(command, "delegationallowrecursion", obj.DelegationAllowRecursion);
                AdoDatabaseDriver.Add(command, "remoteprotocol", obj.RemoteProtocol?.ToString());
                AdoDatabaseDriver.Add(command, "remoteendpointurl", obj.RemoteEndpointUrl);
                AdoDatabaseDriver.Add(command, "remotecredentialsecretid", obj.RemoteCredentialSecretId);
                AdoDatabaseDriver.Add(command, "lastregisteredutc", obj.LastRegisteredUtc);
                AdoDatabaseDriver.Add(command, "registrationttlseconds", obj.RegistrationTtlSeconds);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, Agent obj, CancellationToken token)
        {
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < obj.Skills.Count; i++)
            {
                AgentSkillDefinition child = obj.Skills[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "ski";
                child.AgentId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _SkillsTable + " (id, agentid, tenantid, skillid, name, description) VALUES (@id, @agentid, @tenantid, @skillid, @name, @description);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "agentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "skillid", child.SkillId);
                        AdoDatabaseDriver.Add(command, "name", child.Name);
                        AdoDatabaseDriver.Add(command, "description", child.Description);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.Tags.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _TagsTable + " (id, agentid, tenantid, tag) VALUES (@id, @agentid, @tenantid, @tag);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + position.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "s");
                        AdoDatabaseDriver.Add(command, "agentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "tag", obj.Tags[position]);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.DelegationAllowList.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _DelegationAllowListTable + " (id, agentid, tenantid, agentname) VALUES (@id, @agentid, @tenantid, @agentname);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + position.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "s");
                        AdoDatabaseDriver.Add(command, "agentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "agentname", obj.DelegationAllowList[position]);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string parentId, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _SkillsTable + " WHERE agentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _TagsTable + " WHERE agentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _DelegationAllowListTable + " WHERE agentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
        }

        private static AgentSkillDefinition MapSkills(DbDataReader reader)
        {
            AgentSkillDefinition child = new AgentSkillDefinition();
            child.Id = AdoConverters.Str(reader, "id");
            child.AgentId = AdoConverters.Str(reader, "agentid");
            child.SkillId = AdoConverters.Str(reader, "skillid");
            child.Name = AdoConverters.Str(reader, "name");
            child.Description = AdoConverters.NullableStr(reader, "description");
            return child;
        }

        #endregion
    }
}
