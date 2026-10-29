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
    /// Provider-neutral Deployment data access. Thread-safe.
    /// </summary>
    public class AdoDeploymentMethods : IDeploymentMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _PromptBindingsTable;
        private readonly string _ResourceBindingsTable;
        private readonly string _ArgumentOverridesTable;
        private readonly string _EnvironmentOverridesTable;
        private readonly string _FileOverridesTable;
        private readonly string _NodeSelectorTable;
        private readonly string _ParametersTable;
        private readonly string _AllowedRunOverridesTable;
        private readonly string _ApprovalRulesTable;
        private readonly string _ArtifactGlobsTable;
        private readonly string _EgressRulesTable;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoDeploymentMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("deployments");
            _PromptBindingsTable = driver.Table("deployment_prompt_bindings");
            _ResourceBindingsTable = driver.Table("deployment_resource_bindings");
            _ArgumentOverridesTable = driver.Table("deployment_arg_overrides");
            _EnvironmentOverridesTable = driver.Table("deployment_env_overrides");
            _FileOverridesTable = driver.Table("deployment_file_overrides");
            _NodeSelectorTable = driver.Table("deployment_node_selectors");
            _ParametersTable = driver.Table("deployment_parameters");
            _AllowedRunOverridesTable = driver.Table("deployment_run_overrides");
            _ApprovalRulesTable = driver.Table("deployment_approval_rules");
            _ArtifactGlobsTable = driver.Table("deployment_artifact_globs");
            _EgressRulesTable = driver.Table("deployment_egress_rules");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Deployment> CreateAsync(Deployment obj, CancellationToken token = default)
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
        public async Task<Deployment?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            Deployment? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Deployment?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            Deployment? obj = await _Driver.QuerySingleAsync(
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
        public async Task<Deployment?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

            string sql = "SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;";
            Deployment? obj = await _Driver.QuerySingleAsync(
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
        public async Task<Deployment> UpdateAsync(Deployment obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, agentid = @agentid, name = @name, description = @description, harnessprofileid = @harnessprofileid, model = @model, fallbackmodel = @fallbackmodel, effort = @effort, maxturns = @maxturns, maxbudgetusd = @maxbudgetusd, maxconcurrentruns = @maxconcurrentruns, timeoutseconds = @timeoutseconds, repetitionguard = @repetitionguard, maxassistantchars = @maxassistantchars, noprogressseconds = @noprogressseconds, maxattempts = @maxattempts, retryonnodeloss = @retryonnodeloss, executor = @executor, capisolation = @capisolation, capegresscontrol = @capegresscontrol, capfilesystemsnapshot = @capfilesystemsnapshot, capsessioncontinuation = @capsessioncontinuation, capcrossnoderestore = @capcrossnoderestore, capcoldstartclass = @capcoldstartclass, trustlevel = @trustlevel, effectpolicy = @effectpolicy, podcpurequest = @podcpurequest, podcpulimit = @podcpulimit, podmemoryrequest = @podmemoryrequest, podmemorylimit = @podmemorylimit, podephemeralstoragerequest = @podephemeralstoragerequest, podephemeralstoragelimit = @podephemeralstoragelimit, weight = @weight, nodepoolid = @nodepoolid, workspacetemplateid = @workspacetemplateid, artifactstoreid = @artifactstoreid, approvalsenabled = @approvalsenabled, approvaldefaultaction = @approvaldefaultaction, approvaltimeoutseconds = @approvaltimeoutseconds, approvaltimeoutdecision = @approvaltimeoutdecision, configversion = @configversion, suspensionenabled = @suspensionenabled, active = @active, agentrevisionid = @agentrevisionid, environment = @environment, filespacemountpath = @filespacemountpath, managementaccess = @managementaccess, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "description", obj.Description);
                    AdoDatabaseDriver.Add(command, "harnessprofileid", obj.HarnessProfileId);
                    AdoDatabaseDriver.Add(command, "model", obj.Model);
                    AdoDatabaseDriver.Add(command, "fallbackmodel", obj.FallbackModel);
                    AdoDatabaseDriver.Add(command, "effort", obj.Effort);
                    AdoDatabaseDriver.Add(command, "maxturns", obj.MaxTurns);
                    AdoDatabaseDriver.Add(command, "maxbudgetusd", obj.MaxBudgetUsd);
                    AdoDatabaseDriver.Add(command, "maxconcurrentruns", obj.MaxConcurrentRuns);
                    AdoDatabaseDriver.Add(command, "timeoutseconds", obj.TimeoutSeconds);
                    AdoDatabaseDriver.Add(command, "repetitionguard", obj.RepetitionGuard);
                    AdoDatabaseDriver.Add(command, "maxassistantchars", obj.MaxAssistantChars);
                    AdoDatabaseDriver.Add(command, "noprogressseconds", obj.NoProgressSeconds);
                    AdoDatabaseDriver.Add(command, "maxattempts", obj.MaxAttempts);
                    AdoDatabaseDriver.Add(command, "executor", obj.Executor.HasValue ? obj.Executor.Value.ToString() : null);
                    ExecutorCapabilitySql.Bind(command, obj.RequiredCapabilities);
                    AdoDatabaseDriver.Add(command, "trustlevel", obj.TrustLevel.ToString());
                    AdoDatabaseDriver.Add(command, "effectpolicy", obj.EffectPolicy.ToString());
                    AdoDatabaseDriver.Add(command, "podcpurequest", obj.PodResources.CpuRequest);
                    AdoDatabaseDriver.Add(command, "podcpulimit", obj.PodResources.CpuLimit);
                    AdoDatabaseDriver.Add(command, "podmemoryrequest", obj.PodResources.MemoryRequest);
                    AdoDatabaseDriver.Add(command, "podmemorylimit", obj.PodResources.MemoryLimit);
                    AdoDatabaseDriver.Add(command, "podephemeralstoragerequest", obj.PodResources.EphemeralStorageRequest);
                    AdoDatabaseDriver.Add(command, "podephemeralstoragelimit", obj.PodResources.EphemeralStorageLimit);
                    AdoDatabaseDriver.Add(command, "retryonnodeloss", obj.RetryOnNodeLoss);
                    AdoDatabaseDriver.Add(command, "weight", obj.Weight);
                    AdoDatabaseDriver.Add(command, "nodepoolid", obj.NodePoolId);
                    AdoDatabaseDriver.Add(command, "workspacetemplateid", obj.WorkspaceTemplateId);
                    AdoDatabaseDriver.Add(command, "artifactstoreid", obj.ArtifactStoreId);
                    AdoDatabaseDriver.Add(command, "approvalsenabled", obj.ApprovalsEnabled);
                    AdoDatabaseDriver.Add(command, "approvaldefaultaction", obj.ApprovalDefaultAction.ToString());
                    AdoDatabaseDriver.Add(command, "approvaltimeoutseconds", obj.ApprovalTimeoutSeconds);
                    AdoDatabaseDriver.Add(command, "approvaltimeoutdecision", obj.ApprovalTimeoutDecision.ToString());
                    AdoDatabaseDriver.Add(command, "configversion", obj.ConfigVersion);
                    AdoDatabaseDriver.Add(command, "suspensionenabled", obj.SuspensionEnabled);
                    AdoDatabaseDriver.Add(command, "active", obj.Active);
                    AdoDatabaseDriver.Add(command, "agentrevisionid", String.IsNullOrEmpty(obj.AgentRevisionId) ? null : obj.AgentRevisionId);
                    AdoDatabaseDriver.Add(command, "environment", obj.Environment);
                    AdoDatabaseDriver.Add(command, "filespacemountpath", obj.FileSpaceMountPath);
                    AdoDatabaseDriver.Add(command, "managementaccess", obj.ManagementAccess.ToString());
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
        public async Task<EnumerationResult<Deployment>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
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
            List<Deployment> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            foreach (Deployment obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);

            return EnumerationResult<Deployment>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Deployment>> EnumerateArchitectsAsync(string tenantId, string? architectAgentId, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));

            List<string> clauses = new List<string>();
            clauses.Add("tenantid = @tenantid");
            clauses.Add(String.IsNullOrEmpty(architectAgentId) ? "managementaccess = @drafts" : "(managementaccess = @drafts OR agentid = @architectagentid)");
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            string where = " WHERE " + String.Join(" AND ", clauses);

            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "drafts", ManagementAccessEnum.Drafts.ToString());
                if (!String.IsNullOrEmpty(architectAgentId)) AdoDatabaseDriver.Add(command, "architectagentid", architectAgentId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string sql = "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";";
            List<Deployment> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            foreach (Deployment obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);

            return EnumerationResult<Deployment>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a Deployment (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static Deployment Map(DbDataReader reader)
        {
            Deployment obj = new Deployment();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.AgentId = AdoConverters.Str(reader, "agentid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.HarnessProfileId = AdoConverters.Str(reader, "harnessprofileid");
            obj.Model = AdoConverters.NullableStr(reader, "model");
            obj.FallbackModel = AdoConverters.NullableStr(reader, "fallbackmodel");
            obj.Effort = AdoConverters.NullableStr(reader, "effort");
            obj.MaxTurns = AdoConverters.NullableInt(reader, "maxturns");
            obj.MaxBudgetUsd = AdoConverters.NullableDouble(reader, "maxbudgetusd");
            obj.MaxConcurrentRuns = AdoConverters.Int(reader, "maxconcurrentruns");
            obj.TimeoutSeconds = AdoConverters.NullableInt(reader, "timeoutseconds");
            obj.RepetitionGuard = AdoConverters.NullableBool(reader, "repetitionguard");
            obj.MaxAssistantChars = AdoConverters.NullableLong(reader, "maxassistantchars");
            obj.NoProgressSeconds = AdoConverters.NullableInt(reader, "noprogressseconds");
            obj.MaxAttempts = AdoConverters.Int(reader, "maxattempts");
            obj.Executor = AdoConverters.NullableEnum<RunExecutorEnum>(reader, "executor");
            obj.RequiredCapabilities = ExecutorCapabilitySql.Read(reader);
            obj.TrustLevel = AdoConverters.Enum<DeploymentTrustLevelEnum>(reader, "trustlevel", DeploymentTrustLevelEnum.Trusted);
            obj.LoadEffectPolicy(AdoConverters.Enum<DeploymentEffectPolicyEnum>(reader, "effectpolicy", DeploymentEffectPolicyEnum.AtMostOnce));
            obj.PodResources.CpuRequest = AdoConverters.NullableStr(reader, "podcpurequest");
            obj.PodResources.CpuLimit = AdoConverters.NullableStr(reader, "podcpulimit");
            obj.PodResources.MemoryRequest = AdoConverters.NullableStr(reader, "podmemoryrequest");
            obj.PodResources.MemoryLimit = AdoConverters.NullableStr(reader, "podmemorylimit");
            obj.PodResources.EphemeralStorageRequest = AdoConverters.NullableStr(reader, "podephemeralstoragerequest");
            obj.PodResources.EphemeralStorageLimit = AdoConverters.NullableStr(reader, "podephemeralstoragelimit");
            obj.Weight = AdoConverters.Int(reader, "weight");
            obj.NodePoolId = AdoConverters.NullableStr(reader, "nodepoolid");
            obj.WorkspaceTemplateId = AdoConverters.NullableStr(reader, "workspacetemplateid");
            obj.ArtifactStoreId = AdoConverters.NullableStr(reader, "artifactstoreid");
            obj.ApprovalsEnabled = AdoConverters.NullableBool(reader, "approvalsenabled") ?? false;
            obj.ApprovalDefaultAction = AdoConverters.Enum<ApprovalRuleActionEnum>(reader, "approvaldefaultaction", ApprovalRuleActionEnum.Ask);
            obj.ApprovalTimeoutSeconds = AdoConverters.NullableInt(reader, "approvaltimeoutseconds") ?? 300;
            obj.ApprovalTimeoutDecision = AdoConverters.Enum<ApprovalDecisionEnum>(reader, "approvaltimeoutdecision", ApprovalDecisionEnum.Deny);
            obj.ConfigVersion = AdoConverters.Int(reader, "configversion");
            obj.SuspensionEnabled = AdoConverters.Bool(reader, "suspensionenabled");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.ManagementAccess = AdoConverters.Enum<ManagementAccessEnum>(reader, "managementaccess", ManagementAccessEnum.None);
            obj.FileSpaceMountPath = AdoConverters.NullableStr(reader, "filespacemountpath") ?? "files";
            obj.AgentRevisionId = AdoConverters.NullableStr(reader, "agentrevisionid");
            obj.Environment = AdoConverters.NullableStr(reader, "environment") ?? "dev";
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <summary>
        /// Load child rows into a Deployment.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task LoadChildrenAsync(Deployment obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));

            obj.PromptBindings = await _Driver.QueryAsync(
                "SELECT * FROM " + _PromptBindingsTable + " WHERE deploymentid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapPromptBindings,
                token).ConfigureAwait(false);

            obj.ResourceBindings = await _Driver.QueryAsync(
                "SELECT * FROM " + _ResourceBindingsTable + " WHERE deploymentid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapResourceBindings,
                token).ConfigureAwait(false);

            obj.ArgumentOverrides = await _Driver.QueryAsync(
                "SELECT * FROM " + _ArgumentOverridesTable + " WHERE deploymentid = @parentid ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapArgumentOverrides,
                token).ConfigureAwait(false);

            obj.EnvironmentOverrides = await _Driver.QueryAsync(
                "SELECT * FROM " + _EnvironmentOverridesTable + " WHERE deploymentid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapEnvironmentOverrides,
                token).ConfigureAwait(false);

            obj.FileOverrides = await _Driver.QueryAsync(
                "SELECT * FROM " + _FileOverridesTable + " WHERE deploymentid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapFileOverrides,
                token).ConfigureAwait(false);

            obj.NodeSelector = await _Driver.QueryAsync(
                "SELECT * FROM " + _NodeSelectorTable + " WHERE deploymentid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapNodeSelector,
                token).ConfigureAwait(false);

            obj.Parameters = await _Driver.QueryAsync(
                "SELECT * FROM " + _ParametersTable + " WHERE deploymentid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapParameters,
                token).ConfigureAwait(false);

            obj.AllowedRunOverrides = await _Driver.QueryAsync(
                "SELECT * FROM " + _AllowedRunOverridesTable + " WHERE deploymentid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapAllowedRunOverrides,
                token).ConfigureAwait(false);

            obj.ArtifactGlobs = await _Driver.QueryAsync("SELECT pattern FROM " + _ArtifactGlobsTable + " WHERE deploymentid = @parentid ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id), reader => AdoConverters.Str(reader, "pattern"), token).ConfigureAwait(false);

            obj.ApprovalRules = await _Driver.QueryAsync(
                "SELECT * FROM " + _ApprovalRulesTable + " WHERE deploymentid = @parentid ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapApprovalRules,
                token).ConfigureAwait(false);

            obj.EgressRules = await _Driver.QueryAsync(
                "SELECT * FROM " + _EgressRulesTable + " WHERE deploymentid = @parentid ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapEgressRules,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Deployment>> ListByAgentAsync(string tenantId, string agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));

            List<Deployment> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND agentid = @agentid ORDER BY createdutc ASC;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "agentid", agentId);
                },
                Map,
                token).ConfigureAwait(false);
            foreach (Deployment obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return objects;
        }

        /// <inheritdoc />
        public async Task<List<Deployment>> ListByTenantAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));

            List<Deployment> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid ORDER BY createdutc ASC;",
                command => AdoDatabaseDriver.Add(command, "tenantid", tenantId),
                Map,
                token).ConfigureAwait(false);
            foreach (Deployment obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return objects;
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, Deployment obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, agentid, name, description, harnessprofileid, model, fallbackmodel, effort, maxturns, maxbudgetusd, maxconcurrentruns, timeoutseconds, repetitionguard, maxassistantchars, noprogressseconds, maxattempts, retryonnodeloss, executor, capisolation, capegresscontrol, capfilesystemsnapshot, capsessioncontinuation, capcrossnoderestore, capcoldstartclass, trustlevel, effectpolicy, podcpurequest, podcpulimit, podmemoryrequest, podmemorylimit, podephemeralstoragerequest, podephemeralstoragelimit, weight, nodepoolid, workspacetemplateid, artifactstoreid, approvalsenabled, approvaldefaultaction, approvaltimeoutseconds, approvaltimeoutdecision, configversion, suspensionenabled, active, agentrevisionid, environment, filespacemountpath, managementaccess, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @agentid, @name, @description, @harnessprofileid, @model, @fallbackmodel, @effort, @maxturns, @maxbudgetusd, @maxconcurrentruns, @timeoutseconds, @repetitionguard, @maxassistantchars, @noprogressseconds, @maxattempts, @retryonnodeloss, @executor, @capisolation, @capegresscontrol, @capfilesystemsnapshot, @capsessioncontinuation, @capcrossnoderestore, @capcoldstartclass, @trustlevel, @effectpolicy, @podcpurequest, @podcpulimit, @podmemoryrequest, @podmemorylimit, @podephemeralstoragerequest, @podephemeralstoragelimit, @weight, @nodepoolid, @workspacetemplateid, @artifactstoreid, @approvalsenabled, @approvaldefaultaction, @approvaltimeoutseconds, @approvaltimeoutdecision, @configversion, @suspensionenabled, @active, @agentrevisionid, @environment, @filespacemountpath, @managementaccess, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
                AdoDatabaseDriver.Add(command, "name", obj.Name);
                AdoDatabaseDriver.Add(command, "description", obj.Description);
                AdoDatabaseDriver.Add(command, "harnessprofileid", obj.HarnessProfileId);
                AdoDatabaseDriver.Add(command, "model", obj.Model);
                AdoDatabaseDriver.Add(command, "fallbackmodel", obj.FallbackModel);
                AdoDatabaseDriver.Add(command, "effort", obj.Effort);
                AdoDatabaseDriver.Add(command, "maxturns", obj.MaxTurns);
                AdoDatabaseDriver.Add(command, "maxbudgetusd", obj.MaxBudgetUsd);
                AdoDatabaseDriver.Add(command, "maxconcurrentruns", obj.MaxConcurrentRuns);
                AdoDatabaseDriver.Add(command, "timeoutseconds", obj.TimeoutSeconds);
                    AdoDatabaseDriver.Add(command, "repetitionguard", obj.RepetitionGuard);
                    AdoDatabaseDriver.Add(command, "maxassistantchars", obj.MaxAssistantChars);
                    AdoDatabaseDriver.Add(command, "noprogressseconds", obj.NoProgressSeconds);
                AdoDatabaseDriver.Add(command, "maxattempts", obj.MaxAttempts);
                AdoDatabaseDriver.Add(command, "executor", obj.Executor.HasValue ? obj.Executor.Value.ToString() : null);
                ExecutorCapabilitySql.Bind(command, obj.RequiredCapabilities);
                AdoDatabaseDriver.Add(command, "trustlevel", obj.TrustLevel.ToString());
                AdoDatabaseDriver.Add(command, "effectpolicy", obj.EffectPolicy.ToString());
                AdoDatabaseDriver.Add(command, "podcpurequest", obj.PodResources.CpuRequest);
                AdoDatabaseDriver.Add(command, "podcpulimit", obj.PodResources.CpuLimit);
                AdoDatabaseDriver.Add(command, "podmemoryrequest", obj.PodResources.MemoryRequest);
                AdoDatabaseDriver.Add(command, "podmemorylimit", obj.PodResources.MemoryLimit);
                AdoDatabaseDriver.Add(command, "podephemeralstoragerequest", obj.PodResources.EphemeralStorageRequest);
                AdoDatabaseDriver.Add(command, "podephemeralstoragelimit", obj.PodResources.EphemeralStorageLimit);
                AdoDatabaseDriver.Add(command, "retryonnodeloss", obj.RetryOnNodeLoss);
                AdoDatabaseDriver.Add(command, "weight", obj.Weight);
                AdoDatabaseDriver.Add(command, "nodepoolid", obj.NodePoolId);
                AdoDatabaseDriver.Add(command, "workspacetemplateid", obj.WorkspaceTemplateId);
                AdoDatabaseDriver.Add(command, "artifactstoreid", obj.ArtifactStoreId);
                AdoDatabaseDriver.Add(command, "approvalsenabled", obj.ApprovalsEnabled);
                AdoDatabaseDriver.Add(command, "approvaldefaultaction", obj.ApprovalDefaultAction.ToString());
                AdoDatabaseDriver.Add(command, "approvaltimeoutseconds", obj.ApprovalTimeoutSeconds);
                AdoDatabaseDriver.Add(command, "approvaltimeoutdecision", obj.ApprovalTimeoutDecision.ToString());
                AdoDatabaseDriver.Add(command, "configversion", obj.ConfigVersion);
                    AdoDatabaseDriver.Add(command, "suspensionenabled", obj.SuspensionEnabled);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "agentrevisionid", String.IsNullOrEmpty(obj.AgentRevisionId) ? null : obj.AgentRevisionId);
                AdoDatabaseDriver.Add(command, "environment", obj.Environment);
                AdoDatabaseDriver.Add(command, "filespacemountpath", obj.FileSpaceMountPath);
                AdoDatabaseDriver.Add(command, "managementaccess", obj.ManagementAccess.ToString());
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, Deployment obj, CancellationToken token)
        {
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < obj.PromptBindings.Count; i++)
            {
                DeploymentPromptBinding child = obj.PromptBindings[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "pro";
                child.DeploymentId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _PromptBindingsTable + " (id, deploymentid, tenantid, role, templateid, pinnedversion) VALUES (@id, @deploymentid, @tenantid, @role, @templateid, @pinnedversion);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "deploymentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "role", child.Role);
                        AdoDatabaseDriver.Add(command, "templateid", child.TemplateId);
                        AdoDatabaseDriver.Add(command, "pinnedversion", child.PinnedVersion);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.ResourceBindings.Count; i++)
            {
                DeploymentResourceBinding child = obj.ResourceBindings[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "res";
                child.DeploymentId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _ResourceBindingsTable + " (id, deploymentid, tenantid, kind, alias, resourceid) VALUES (@id, @deploymentid, @tenantid, @kind, @alias, @resourceid);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "deploymentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "kind", child.Kind.ToString());
                        AdoDatabaseDriver.Add(command, "alias", child.Alias);
                        AdoDatabaseDriver.Add(command, "resourceid", child.ResourceId);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.ArgumentOverrides.Count; i++)
            {
                DeploymentArgumentOverride child = obj.ArgumentOverrides[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "arg";
                child.DeploymentId = obj.Id;
                child.Position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _ArgumentOverridesTable + " (id, deploymentid, tenantid, position, operation, match, template, condition) VALUES (@id, @deploymentid, @tenantid, @position, @operation, @match, @template, @condition);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "deploymentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", child.Position);
                        AdoDatabaseDriver.Add(command, "operation", child.Operation.ToString());
                        AdoDatabaseDriver.Add(command, "match", child.Match);
                        AdoDatabaseDriver.Add(command, "template", child.Template);
                        AdoDatabaseDriver.Add(command, "condition", child.Condition);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.EnvironmentOverrides.Count; i++)
            {
                DeploymentEnvironmentOverride child = obj.EnvironmentOverrides[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "env";
                child.DeploymentId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _EnvironmentOverridesTable + " (id, deploymentid, tenantid, name, valuetemplate, issecret) VALUES (@id, @deploymentid, @tenantid, @name, @valuetemplate, @issecret);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "deploymentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "name", child.Name);
                        AdoDatabaseDriver.Add(command, "valuetemplate", child.ValueTemplate);
                        AdoDatabaseDriver.Add(command, "issecret", child.IsSecret);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.FileOverrides.Count; i++)
            {
                DeploymentFileOverride child = obj.FileOverrides[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "fil";
                child.DeploymentId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _FileOverridesTable + " (id, deploymentid, tenantid, basedirectory, pathtemplate, contenttemplate, mode, issecret) VALUES (@id, @deploymentid, @tenantid, @basedirectory, @pathtemplate, @contenttemplate, @mode, @issecret);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "deploymentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "basedirectory", child.BaseDirectory.ToString());
                        AdoDatabaseDriver.Add(command, "pathtemplate", child.PathTemplate);
                        AdoDatabaseDriver.Add(command, "contenttemplate", child.ContentTemplate);
                        AdoDatabaseDriver.Add(command, "mode", child.Mode);
                        AdoDatabaseDriver.Add(command, "issecret", child.IsSecret);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.NodeSelector.Count; i++)
            {
                DeploymentNodeSelector child = obj.NodeSelector[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "nod";
                child.DeploymentId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _NodeSelectorTable + " (id, deploymentid, tenantid, key, value) VALUES (@id, @deploymentid, @tenantid, @key, @value);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "deploymentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "key", child.Key);
                        AdoDatabaseDriver.Add(command, "value", child.Value);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.Parameters.Count; i++)
            {
                DeploymentParameter child = obj.Parameters[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "par";
                child.DeploymentId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _ParametersTable + " (id, deploymentid, tenantid, name, value) VALUES (@id, @deploymentid, @tenantid, @name, @value);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "deploymentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "name", child.Name);
                        AdoDatabaseDriver.Add(command, "value", child.Value);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.AllowedRunOverrides.Count; i++)
            {
                DeploymentRunOverrideRule child = obj.AllowedRunOverrides[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "all";
                child.DeploymentId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _AllowedRunOverridesTable + " (id, deploymentid, tenantid, name, validation, pattern) VALUES (@id, @deploymentid, @tenantid, @name, @validation, @pattern);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "deploymentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "name", child.Name);
                        AdoDatabaseDriver.Add(command, "validation", child.Validation.ToString());
                        AdoDatabaseDriver.Add(command, "pattern", child.Pattern);
                    }, token).ConfigureAwait(false);
            }

            // Approval rule identifiers stay stable across updates, because approvals record the rule that decided them.
            HashSet<string> ruleIds = new HashSet<string>(StringComparer.Ordinal);
            for (int i = 0; i < obj.ArtifactGlobs.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _ArtifactGlobsTable + " (id, deploymentid, tenantid, position, pattern) VALUES (@id, @parentid, @tenantid, @position, @pattern);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", IdGenerator.New("dag_"));
                        AdoDatabaseDriver.Add(command, "parentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "pattern", obj.ArtifactGlobs[position]);
                    }, token).ConfigureAwait(false);
            }
            for (int i = 0; i < obj.ApprovalRules.Count; i++)
            {
                DeploymentApprovalRule child = obj.ApprovalRules[i];
                if (!child.Id.StartsWith("dar_", StringComparison.Ordinal) || !ruleIds.Add(child.Id))
                {
                    child.Id = IdGenerator.NewDeploymentApprovalRuleId();
                    ruleIds.Add(child.Id);
                }
                child.DeploymentId = obj.Id;
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _ApprovalRulesTable + " (id, deploymentid, tenantid, position, action, pattern, inputpattern, description) VALUES (@id, @deploymentid, @tenantid, @position, @action, @pattern, @inputpattern, @description);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "deploymentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "action", child.Action.ToString());
                        AdoDatabaseDriver.Add(command, "pattern", child.Pattern);
                        AdoDatabaseDriver.Add(command, "inputpattern", child.InputPattern);
                        AdoDatabaseDriver.Add(command, "description", child.Description);
                    }, token).ConfigureAwait(false);
            }
            for (int i = 0; i < obj.EgressRules.Count; i++)
            {
                DeploymentEgressRule child = obj.EgressRules[i];
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _EgressRulesTable + " (id, deploymentid, tenantid, position, cidr, port, protocol) VALUES (@id, @deploymentid, @tenantid, @position, @cidr, @port, @protocol);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", IdGenerator.NewDeploymentEgressRuleId());
                        AdoDatabaseDriver.Add(command, "deploymentid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "cidr", child.Cidr);
                        AdoDatabaseDriver.Add(command, "port", child.Port);
                        AdoDatabaseDriver.Add(command, "protocol", child.Protocol.ToString());
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string parentId, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ArtifactGlobsTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _PromptBindingsTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ResourceBindingsTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ArgumentOverridesTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _EnvironmentOverridesTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _FileOverridesTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _NodeSelectorTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ParametersTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _AllowedRunOverridesTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ApprovalRulesTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _EgressRulesTable + " WHERE deploymentid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
        }

        private static DeploymentPromptBinding MapPromptBindings(DbDataReader reader)
        {
            DeploymentPromptBinding child = new DeploymentPromptBinding();
            child.Id = AdoConverters.Str(reader, "id");
            child.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            child.Role = AdoConverters.Str(reader, "role");
            child.TemplateId = AdoConverters.Str(reader, "templateid");
            child.PinnedVersion = AdoConverters.NullableInt(reader, "pinnedversion");
            return child;
        }

        private static DeploymentResourceBinding MapResourceBindings(DbDataReader reader)
        {
            DeploymentResourceBinding child = new DeploymentResourceBinding();
            child.Id = AdoConverters.Str(reader, "id");
            child.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            child.Kind = AdoConverters.Enum<ResourceBindingKindEnum>(reader, "kind", ResourceBindingKindEnum.Secret);
            child.Alias = AdoConverters.Str(reader, "alias");
            child.ResourceId = AdoConverters.Str(reader, "resourceid");
            return child;
        }

        private static DeploymentArgumentOverride MapArgumentOverrides(DbDataReader reader)
        {
            DeploymentArgumentOverride child = new DeploymentArgumentOverride();
            child.Id = AdoConverters.Str(reader, "id");
            child.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            child.Position = AdoConverters.Int(reader, "position");
            child.Operation = AdoConverters.Enum<ArgumentOverrideOperationEnum>(reader, "operation", ArgumentOverrideOperationEnum.Append);
            child.Match = AdoConverters.NullableStr(reader, "match");
            child.Template = AdoConverters.NullableStr(reader, "template");
            child.Condition = AdoConverters.NullableStr(reader, "condition");
            return child;
        }

        private static DeploymentEnvironmentOverride MapEnvironmentOverrides(DbDataReader reader)
        {
            DeploymentEnvironmentOverride child = new DeploymentEnvironmentOverride();
            child.Id = AdoConverters.Str(reader, "id");
            child.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            child.Name = AdoConverters.Str(reader, "name");
            child.ValueTemplate = AdoConverters.Str(reader, "valuetemplate");
            child.IsSecret = AdoConverters.Bool(reader, "issecret");
            return child;
        }

        private static DeploymentFileOverride MapFileOverrides(DbDataReader reader)
        {
            DeploymentFileOverride child = new DeploymentFileOverride();
            child.Id = AdoConverters.Str(reader, "id");
            child.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            child.BaseDirectory = AdoConverters.Enum<FileBaseDirectoryEnum>(reader, "basedirectory", FileBaseDirectoryEnum.Config);
            child.PathTemplate = AdoConverters.Str(reader, "pathtemplate");
            child.ContentTemplate = AdoConverters.Str(reader, "contenttemplate");
            child.Mode = AdoConverters.NullableStr(reader, "mode");
            child.IsSecret = AdoConverters.Bool(reader, "issecret");
            return child;
        }

        private static DeploymentNodeSelector MapNodeSelector(DbDataReader reader)
        {
            DeploymentNodeSelector child = new DeploymentNodeSelector();
            child.Id = AdoConverters.Str(reader, "id");
            child.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            child.Key = AdoConverters.Str(reader, "key");
            child.Value = AdoConverters.Str(reader, "value");
            return child;
        }

        private static DeploymentParameter MapParameters(DbDataReader reader)
        {
            DeploymentParameter child = new DeploymentParameter();
            child.Id = AdoConverters.Str(reader, "id");
            child.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            child.Name = AdoConverters.Str(reader, "name");
            child.Value = AdoConverters.Str(reader, "value");
            return child;
        }

        private static DeploymentRunOverrideRule MapAllowedRunOverrides(DbDataReader reader)
        {
            DeploymentRunOverrideRule child = new DeploymentRunOverrideRule();
            child.Id = AdoConverters.Str(reader, "id");
            child.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            child.Name = AdoConverters.Str(reader, "name");
            child.Validation = AdoConverters.Enum<RunOverrideValidationEnum>(reader, "validation", RunOverrideValidationEnum.Any);
            child.Pattern = AdoConverters.NullableStr(reader, "pattern");
            return child;
        }

        private static DeploymentApprovalRule MapApprovalRules(DbDataReader reader)
        {
            DeploymentApprovalRule child = new DeploymentApprovalRule();
            child.Id = AdoConverters.Str(reader, "id");
            child.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            child.Action = AdoConverters.Enum<ApprovalRuleActionEnum>(reader, "action", ApprovalRuleActionEnum.Ask);
            child.Pattern = AdoConverters.Str(reader, "pattern");
            child.InputPattern = AdoConverters.NullableStr(reader, "inputpattern");
            child.Description = AdoConverters.NullableStr(reader, "description");
            return child;
        }

        private static DeploymentEgressRule MapEgressRules(DbDataReader reader)
        {
            DeploymentEgressRule child = new DeploymentEgressRule();
            child.Cidr = AdoConverters.Str(reader, "cidr");
            child.Port = AdoConverters.NullableInt(reader, "port");
            child.Protocol = AdoConverters.Enum<EgressProtocolEnum>(reader, "protocol", EgressProtocolEnum.TCP);
            return child;
        }

        #endregion
    }
}
