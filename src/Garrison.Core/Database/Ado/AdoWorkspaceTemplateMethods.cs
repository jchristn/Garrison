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
    /// Provider-neutral WorkspaceTemplate data access. Thread-safe.
    /// </summary>
    public class AdoWorkspaceTemplateMethods : IWorkspaceTemplateMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _FilesTable;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoWorkspaceTemplateMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("workspace_templates");
            _FilesTable = driver.Table("workspace_template_files");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<WorkspaceTemplate> CreateAsync(WorkspaceTemplate obj, CancellationToken token = default)
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
        public async Task<WorkspaceTemplate?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            WorkspaceTemplate? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<WorkspaceTemplate?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            WorkspaceTemplate? obj = await _Driver.QuerySingleAsync(
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
        public async Task<WorkspaceTemplate?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

            string sql = "SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;";
            WorkspaceTemplate? obj = await _Driver.QuerySingleAsync(
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
        public async Task<WorkspaceTemplate> UpdateAsync(WorkspaceTemplate obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, name = @name, description = @description, kind = @kind, giturl = @giturl, gitref = @gitref, gitdepth = @gitdepth, gitcredentialsecretid = @gitcredentialsecretid, persistentvolumeclaim = @persistentvolumeclaim, retention = @retention, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "description", obj.Description);
                    AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
                    AdoDatabaseDriver.Add(command, "giturl", obj.GitUrl);
                    AdoDatabaseDriver.Add(command, "gitref", obj.GitRef);
                    AdoDatabaseDriver.Add(command, "gitdepth", obj.GitDepth);
                    AdoDatabaseDriver.Add(command, "gitcredentialsecretid", obj.GitCredentialSecretId);
                    AdoDatabaseDriver.Add(command, "persistentvolumeclaim", obj.PersistentVolumeClaim);
                    AdoDatabaseDriver.Add(command, "retention", obj.Retention.ToString());
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
        public async Task<EnumerationResult<WorkspaceTemplate>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
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
            List<WorkspaceTemplate> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            foreach (WorkspaceTemplate obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);

            return EnumerationResult<WorkspaceTemplate>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a WorkspaceTemplate (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static WorkspaceTemplate Map(DbDataReader reader)
        {
            WorkspaceTemplate obj = new WorkspaceTemplate();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Kind = AdoConverters.Enum<WorkspaceKindEnum>(reader, "kind", WorkspaceKindEnum.Empty);
            obj.GitUrl = AdoConverters.NullableStr(reader, "giturl");
            obj.GitRef = AdoConverters.NullableStr(reader, "gitref");
            obj.GitDepth = AdoConverters.Int(reader, "gitdepth");
            obj.GitCredentialSecretId = AdoConverters.NullableStr(reader, "gitcredentialsecretid");
            obj.PersistentVolumeClaim = AdoConverters.NullableStr(reader, "persistentvolumeclaim");
            obj.Retention = AdoConverters.Enum<WorkspaceRetentionEnum>(reader, "retention", WorkspaceRetentionEnum.Delete);
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <summary>
        /// Load child rows into a WorkspaceTemplate.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task LoadChildrenAsync(WorkspaceTemplate obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));

            obj.Files = await _Driver.QueryAsync(
                "SELECT * FROM " + _FilesTable + " WHERE workspacetemplateid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapFiles,
                token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, WorkspaceTemplate obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, name, description, kind, giturl, gitref, gitdepth, gitcredentialsecretid, persistentvolumeclaim, retention, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @name, @description, @kind, @giturl, @gitref, @gitdepth, @gitcredentialsecretid, @persistentvolumeclaim, @retention, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "name", obj.Name);
                AdoDatabaseDriver.Add(command, "description", obj.Description);
                AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
                AdoDatabaseDriver.Add(command, "giturl", obj.GitUrl);
                AdoDatabaseDriver.Add(command, "gitref", obj.GitRef);
                AdoDatabaseDriver.Add(command, "gitdepth", obj.GitDepth);
                AdoDatabaseDriver.Add(command, "gitcredentialsecretid", obj.GitCredentialSecretId);
                AdoDatabaseDriver.Add(command, "persistentvolumeclaim", obj.PersistentVolumeClaim);
                AdoDatabaseDriver.Add(command, "retention", obj.Retention.ToString());
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, WorkspaceTemplate obj, CancellationToken token)
        {
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < obj.Files.Count; i++)
            {
                WorkspaceFile child = obj.Files[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "fil";
                child.WorkspaceTemplateId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _FilesTable + " (id, workspacetemplateid, tenantid, path, content) VALUES (@id, @workspacetemplateid, @tenantid, @path, @content);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "workspacetemplateid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "path", child.Path);
                        AdoDatabaseDriver.Add(command, "content", child.Content);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string parentId, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _FilesTable + " WHERE workspacetemplateid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
        }

        private static WorkspaceFile MapFiles(DbDataReader reader)
        {
            WorkspaceFile child = new WorkspaceFile();
            child.Id = AdoConverters.Str(reader, "id");
            child.WorkspaceTemplateId = AdoConverters.Str(reader, "workspacetemplateid");
            child.Path = AdoConverters.Str(reader, "path");
            child.Content = AdoConverters.Str(reader, "content");
            return child;
        }

        #endregion
    }
}
