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
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral pipeline definition data access (P12.9). Stages and stage parameters are child tables replaced
    /// with the pipeline in one transaction. Thread-safe.
    /// </summary>
    public class AdoPipelineMethods : IPipelineMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Stages;
        private readonly string _Parameters;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoPipelineMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("pipelines");
            _Stages = driver.Table("pipeline_stages");
            _Parameters = driver.Table("pipeline_stage_parameters");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Pipeline> CreateAsync(Pipeline obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Table + " (id, tenantid, name, description, version, maxdurationseconds, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @name, @description, @version, @maxdurationseconds, @active, @isprotected, @createdutc, @lastupdateutc);",
                    command => Bind(command, obj), ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Pipeline?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            Pipeline? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Pipeline?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            Pipeline? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Pipeline?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            Pipeline? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "name", name);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Pipeline> UpdateAsync(Pipeline obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Table + " SET name = @name, description = @description, version = @version, maxdurationseconds = @maxdurationseconds, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                    command => Bind(command, obj), ct).ConfigureAwait(false);
                await DeleteChildrenAsync(connection, transaction, obj.Id, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await DeleteChildrenAsync(connection, transaction, id, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Pipeline>> EnumerateAsync(string tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<Pipeline> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            foreach (Pipeline obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return EnumerationResult<Pipeline>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<string>> NamesByAgentAsync(string tenantId, string agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            return await NamesAsync(tenantId, "agentid", agentId, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<string>> NamesByDeploymentAsync(string tenantId, string deploymentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(deploymentId)) throw new ArgumentNullException(nameof(deploymentId));
            return await NamesAsync(tenantId, "deploymentid", deploymentId, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a pipeline row (children not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static Pipeline Map(DbDataReader reader)
        {
            Pipeline obj = new Pipeline();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Version = AdoConverters.Int(reader, "version");
            obj.MaxDurationSeconds = AdoConverters.Int(reader, "maxdurationseconds");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, Pipeline obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "description", obj.Description);
            AdoDatabaseDriver.Add(command, "version", obj.Version);
            AdoDatabaseDriver.Add(command, "maxdurationseconds", obj.MaxDurationSeconds);
            AdoDatabaseDriver.Add(command, "active", obj.Active);
            AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private async Task<List<string>> NamesAsync(string tenantId, string column, string value, CancellationToken token)
        {
            return await _Driver.QueryAsync(
                "SELECT DISTINCT p.name FROM " + _Table + " p WHERE p.tenantid = @tenantid AND p.id IN (SELECT s.pipelineid FROM " + _Stages + " s WHERE s.tenantid = @tenantid AND s." + column + " = @value) ORDER BY p.name;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "value", value);
                },
                reader => AdoConverters.Str(reader, "name"),
                token).ConfigureAwait(false);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, Pipeline obj, CancellationToken token)
        {
            for (int i = 0; i < obj.Stages.Count; i++)
            {
                PipelineStage stage = obj.Stages[i];
                stage.PipelineId = obj.Id;
                stage.TenantId = obj.TenantId;
                stage.Position = i + 1;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Stages + " (id, pipelineid, tenantid, position, name, description, agentid, deploymentid, handofftemplateid, handofftemplateversion, outputcharlimit, maxattempts, continueonfailure, requiresreview, reviewtimeoutseconds, reviewtimeoutaction, maxrevisions) VALUES (@id, @pipelineid, @tenantid, @position, @name, @description, @agentid, @deploymentid, @handofftemplateid, @handofftemplateversion, @outputcharlimit, @maxattempts, @continueonfailure, @requiresreview, @reviewtimeoutseconds, @reviewtimeoutaction, @maxrevisions);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", stage.Id);
                        AdoDatabaseDriver.Add(command, "pipelineid", stage.PipelineId);
                        AdoDatabaseDriver.Add(command, "tenantid", stage.TenantId);
                        AdoDatabaseDriver.Add(command, "position", stage.Position);
                        AdoDatabaseDriver.Add(command, "name", stage.Name);
                        AdoDatabaseDriver.Add(command, "description", stage.Description);
                        AdoDatabaseDriver.Add(command, "agentid", stage.AgentId);
                        AdoDatabaseDriver.Add(command, "deploymentid", String.IsNullOrEmpty(stage.DeploymentId) ? null : stage.DeploymentId);
                        AdoDatabaseDriver.Add(command, "handofftemplateid", String.IsNullOrEmpty(stage.HandoffTemplateId) ? null : stage.HandoffTemplateId);
                        AdoDatabaseDriver.Add(command, "handofftemplateversion", stage.HandoffTemplateVersion);
                        AdoDatabaseDriver.Add(command, "outputcharlimit", stage.OutputCharLimit);
                        AdoDatabaseDriver.Add(command, "maxattempts", stage.MaxAttempts);
                        AdoDatabaseDriver.Add(command, "continueonfailure", stage.ContinueOnFailure);
                        AdoDatabaseDriver.Add(command, "requiresreview", stage.RequiresReview);
                        AdoDatabaseDriver.Add(command, "reviewtimeoutseconds", stage.ReviewTimeoutSeconds);
                        AdoDatabaseDriver.Add(command, "reviewtimeoutaction", stage.ReviewTimeoutAction.ToString());
                        AdoDatabaseDriver.Add(command, "maxrevisions", stage.MaxRevisions);
                    }, token).ConfigureAwait(false);
                for (int j = 0; j < stage.Parameters.Count; j++)
                {
                    PipelineStageParameter parameter = stage.Parameters[j];
                    parameter.StageId = stage.Id;
                    parameter.TenantId = obj.TenantId;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _Parameters + " (id, stageid, tenantid, position, name, value) VALUES (@id, @stageid, @tenantid, @position, @name, @value);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "id", parameter.Id);
                            AdoDatabaseDriver.Add(command, "stageid", parameter.StageId);
                            AdoDatabaseDriver.Add(command, "tenantid", parameter.TenantId);
                            AdoDatabaseDriver.Add(command, "position", j);
                            AdoDatabaseDriver.Add(command, "name", parameter.Name);
                            AdoDatabaseDriver.Add(command, "value", parameter.Value);
                        }, token).ConfigureAwait(false);
                }
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string pipelineId, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Parameters + " WHERE stageid IN (SELECT id FROM " + _Stages + " WHERE pipelineid = @id);", command => AdoDatabaseDriver.Add(command, "id", pipelineId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Stages + " WHERE pipelineid = @id;", command => AdoDatabaseDriver.Add(command, "id", pipelineId), token).ConfigureAwait(false);
        }

        private async Task LoadChildrenAsync(Pipeline obj, CancellationToken token)
        {
            obj.Stages = await _Driver.QueryAsync("SELECT * FROM " + _Stages + " WHERE pipelineid = @id ORDER BY position ASC;", command => AdoDatabaseDriver.Add(command, "id", obj.Id), MapStage, token).ConfigureAwait(false);
            if (obj.Stages.Count == 0) return;
            List<PipelineStageParameter> parameters = await _Driver.QueryAsync(
                "SELECT * FROM " + _Parameters + " WHERE stageid IN (SELECT id FROM " + _Stages + " WHERE pipelineid = @id) ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "id", obj.Id),
                reader => new PipelineStageParameter
                {
                    Id = AdoConverters.Str(reader, "id"),
                    StageId = AdoConverters.Str(reader, "stageid"),
                    TenantId = AdoConverters.Str(reader, "tenantid"),
                    Name = AdoConverters.Str(reader, "name"),
                    Value = AdoConverters.Str(reader, "value")
                },
                token).ConfigureAwait(false);
            foreach (PipelineStage stage in obj.Stages) stage.Parameters = parameters.Where(p => p.StageId == stage.Id).ToList();
        }

        private static PipelineStage MapStage(DbDataReader reader)
        {
            PipelineStage stage = new PipelineStage();
            stage.Id = AdoConverters.Str(reader, "id");
            stage.PipelineId = AdoConverters.Str(reader, "pipelineid");
            stage.TenantId = AdoConverters.Str(reader, "tenantid");
            stage.Position = AdoConverters.Int(reader, "position");
            stage.Name = AdoConverters.Str(reader, "name");
            stage.Description = AdoConverters.NullableStr(reader, "description");
            stage.AgentId = AdoConverters.Str(reader, "agentid");
            stage.DeploymentId = AdoConverters.NullableStr(reader, "deploymentid");
            stage.HandoffTemplateId = AdoConverters.NullableStr(reader, "handofftemplateid");
            stage.HandoffTemplateVersion = AdoConverters.NullableInt(reader, "handofftemplateversion");
            stage.OutputCharLimit = AdoConverters.Int(reader, "outputcharlimit");
            stage.MaxAttempts = AdoConverters.Int(reader, "maxattempts");
            stage.ContinueOnFailure = AdoConverters.Bool(reader, "continueonfailure");
            stage.RequiresReview = AdoConverters.Bool(reader, "requiresreview");
            stage.ReviewTimeoutSeconds = AdoConverters.Int(reader, "reviewtimeoutseconds");
            stage.ReviewTimeoutAction = AdoConverters.Enum<PipelineReviewDecisionEnum>(reader, "reviewtimeoutaction", PipelineReviewDecisionEnum.Reject);
            stage.MaxRevisions = AdoConverters.Int(reader, "maxrevisions");
            return stage;
        }

        #endregion
    }
}
