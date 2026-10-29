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
    /// Provider-neutral agentic app and app revision data access (AD6). Thread-safe.
    /// </summary>
    public class AdoAgenticAppMethods : IAgenticAppMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Apps;
        private readonly string _Members;
        private readonly string _Edges;
        private readonly string _Environments;
        private readonly string _Revisions;
        private readonly string _RevisionMembers;
        private readonly string _RevisionEdges;
        private readonly string _Agents;
        private readonly string _AgentRevisions;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoAgenticAppMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Apps = driver.Table("agentic_apps");
            _Members = driver.Table("agentic_app_members");
            _Edges = driver.Table("agentic_app_edges");
            _Environments = driver.Table("agentic_app_environments");
            _Revisions = driver.Table("app_revisions");
            _RevisionMembers = driver.Table("app_revision_members");
            _RevisionEdges = driver.Table("app_revision_edges");
            _Agents = driver.Table("agents");
            _AgentRevisions = driver.Table("agent_revisions");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<AgenticApp> CreateAsync(AgenticApp app, CancellationToken token = default)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            app.CreatedUtc = DateTime.UtcNow;
            app.LastUpdateUtc = app.CreatedUtc;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Apps + " (id, tenantid, name, slug, description, entryagentid, liveenvironment, authmode, anonymousenabled, showoperatordetail, displayname, logoassetid, primarycolor, accentcolor, welcometext, latestpublishedrevisionid, active, createdutc, lastupdateutc) " +
                    "VALUES (@id, @tenantid, @name, @slug, @description, @entryagentid, @liveenvironment, @authmode, @anonymousenabled, @showoperatordetail, @displayname, @logoassetid, @primarycolor, @accentcolor, @welcometext, @latestpublishedrevisionid, @active, @createdutc, @lastupdateutc);",
                    command => Bind(command, app), ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, app, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return app;
        }

        /// <inheritdoc />
        public async Task<AgenticApp> UpdateAsync(AgenticApp app, CancellationToken token = default)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            app.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Apps + " SET name = @name, slug = @slug, description = @description, entryagentid = @entryagentid, liveenvironment = @liveenvironment, authmode = @authmode, anonymousenabled = @anonymousenabled, " +
                    "showoperatordetail = @showoperatordetail, displayname = @displayname, logoassetid = @logoassetid, primarycolor = @primarycolor, accentcolor = @accentcolor, welcometext = @welcometext, " +
                    "latestpublishedrevisionid = @latestpublishedrevisionid, active = @active, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                    command => Bind(command, app), ct).ConfigureAwait(false);
                foreach (string table in new[] { _Members, _Edges, _Environments })
                {
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + table + " WHERE appid = @id;", command => AdoDatabaseDriver.Add(command, "id", app.Id), ct).ConfigureAwait(false);
                }
                await InsertChildrenAsync(connection, transaction, app, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return app;
        }

        /// <inheritdoc />
        public Task<AgenticApp?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return ReadOneAsync("id = @key AND tenantid = @tenantid", id, tenantId, token);
        }

        /// <inheritdoc />
        public Task<AgenticApp?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            return ReadOneAsync("name = @key AND tenantid = @tenantid", name, tenantId, token);
        }

        /// <inheritdoc />
        public Task<AgenticApp?> ReadBySlugAsync(string slug, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(slug)) throw new ArgumentNullException(nameof(slug));
            return ReadOneAsync("slug = @key", slug, null, token);
        }

        /// <inheritdoc />
        public async Task<bool> SlugTakenAsync(string slug, string? exceptId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(slug)) throw new ArgumentNullException(nameof(slug));
            object? count = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Apps + " WHERE slug = @slug AND id <> @except;", command =>
            {
                AdoDatabaseDriver.Add(command, "slug", slug);
                AdoDatabaseDriver.Add(command, "except", exceptId ?? String.Empty);
            }, token).ConfigureAwait(false);
            return count != null && Convert.ToInt64(count, CultureInfo.InvariantCulture) > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<AgenticApp>> EnumerateAsync(string tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            string where = " WHERE tenantid = @tenantid" + (String.IsNullOrEmpty(query.Search) ? String.Empty : " AND " + _Driver.Dialect.CaseInsensitiveLike("name", "search"));
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Apps + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            List<AgenticApp> apps = await _Driver.QueryAsync("SELECT * FROM " + _Apps + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            foreach (AgenticApp app in apps) await LoadChildrenAsync(app, token).ConfigureAwait(false);
            return EnumerationResult<AgenticApp>.Build(query, total, apps);
        }

        /// <inheritdoc />
        public Task<List<string>> AppsWithMemberAsync(string tenantId, string agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            return _Driver.QueryAsync("SELECT DISTINCT a.name AS name FROM " + _Apps + " a JOIN " + _Members + " m ON m.appid = a.id WHERE a.tenantid = @tenantid AND m.agentid = @agentid ORDER BY a.name ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "agentid", agentId);
            }, reader => AdoConverters.Str(reader, "name"), token);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int deleted = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                deleted = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Apps + " WHERE id = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, ct).ConfigureAwait(false);
                if (deleted == 0) return;
                foreach (string table in new[] { _Members, _Edges, _Environments })
                {
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + table + " WHERE appid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                }
                string revisions = "SELECT id FROM " + _Revisions + " WHERE appid = @id";
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _RevisionMembers + " WHERE revisionid IN (" + revisions + ");", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _RevisionEdges + " WHERE revisionid IN (" + revisions + ");", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Revisions + " WHERE appid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return deleted > 0;
        }

        /// <inheritdoc />
        public async Task<AppRevision> CreateRevisionAsync(AppRevision revision, CancellationToken token = default)
        {
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            revision.CreatedUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                List<int> max = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT COALESCE(MAX(number), 0) AS maxnumber FROM " + _Revisions + " WHERE appid = @appid;",
                    command => AdoDatabaseDriver.Add(command, "appid", revision.AppId), reader => AdoConverters.Int(reader, "maxnumber"), ct).ConfigureAwait(false);
                revision.Number = (max.Count == 0 ? 0 : max[0]) + 1;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Revisions + " (id, tenantid, appid, number, state, authorname, changenote, publishedbyname, publishedutc, createdutc) VALUES (@id, @tenantid, @appid, @number, @state, @authorname, @changenote, @publishedbyname, @publishedutc, @createdutc);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", revision.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                        AdoDatabaseDriver.Add(command, "appid", revision.AppId);
                        AdoDatabaseDriver.Add(command, "number", revision.Number);
                        AdoDatabaseDriver.Add(command, "state", revision.State.ToString());
                        AdoDatabaseDriver.Add(command, "authorname", revision.AuthorName);
                        AdoDatabaseDriver.Add(command, "changenote", revision.ChangeNote);
                        AdoDatabaseDriver.Add(command, "publishedbyname", revision.PublishedByName);
                        AdoDatabaseDriver.Add(command, "publishedutc", revision.PublishedUtc);
                        AdoDatabaseDriver.Add(command, "createdutc", revision.CreatedUtc);
                    }, ct).ConfigureAwait(false);
                for (int i = 0; i < revision.Members.Count; i++)
                {
                    int position = i;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _RevisionMembers + " (id, tenantid, revisionid, position, agentid, agentrevisionid) VALUES (@id, @tenantid, @revisionid, @position, @agentid, @agentrevisionid);", command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", revision.Id + "_m" + position.ToString("D4", CultureInfo.InvariantCulture));
                        AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                        AdoDatabaseDriver.Add(command, "revisionid", revision.Id);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "agentid", revision.Members[position].AgentId);
                        AdoDatabaseDriver.Add(command, "agentrevisionid", revision.Members[position].AgentRevisionId);
                    }, ct).ConfigureAwait(false);
                }
                for (int i = 0; i < revision.Edges.Count; i++)
                {
                    int position = i;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _RevisionEdges + " (id, tenantid, revisionid, position, calleragentid, calleeagentid, fanoutallowed) VALUES (@id, @tenantid, @revisionid, @position, @caller, @callee, @fanout);", command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", revision.Id + "_e" + position.ToString("D4", CultureInfo.InvariantCulture));
                        AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                        AdoDatabaseDriver.Add(command, "revisionid", revision.Id);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "caller", revision.Edges[position].CallerAgentId);
                        AdoDatabaseDriver.Add(command, "callee", revision.Edges[position].CalleeAgentId);
                        AdoDatabaseDriver.Add(command, "fanout", revision.Edges[position].FanOutAllowed);
                    }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return revision;
        }

        /// <inheritdoc />
        public async Task<List<AppRevision>> ListRevisionsAsync(string tenantId, string appId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(appId)) throw new ArgumentNullException(nameof(appId));
            List<AppRevision> revisions = await _Driver.QueryAsync("SELECT * FROM " + _Revisions + " WHERE tenantid = @tenantid AND appid = @appid ORDER BY number DESC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "appid", appId);
            }, MapRevision, token).ConfigureAwait(false);
            foreach (AppRevision revision in revisions) await LoadRevisionChildrenAsync(revision, token).ConfigureAwait(false);
            return revisions;
        }

        /// <inheritdoc />
        public async Task<AppRevision?> ReadRevisionAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            AppRevision? revision = await _Driver.QuerySingleAsync("SELECT * FROM " + _Revisions + " WHERE tenantid = @tenantid AND id = @id;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "id", id);
            }, MapRevision, token).ConfigureAwait(false);
            if (revision != null) await LoadRevisionChildrenAsync(revision, token).ConfigureAwait(false);
            return revision;
        }

        /// <inheritdoc />
        public async Task<bool> PublishRevisionAsync(string tenantId, string revisionId, string? publishedByName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(revisionId)) throw new ArgumentNullException(nameof(revisionId));
            int published = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                DateTime now = DateTime.UtcNow;
                published = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Revisions + " SET state = @published, publishedbyname = @by, publishedutc = @now WHERE tenantid = @tenantid AND id = @id AND state = @draft;", command =>
                {
                    AdoDatabaseDriver.Add(command, "published", AgentRevisionStateEnum.Published.ToString());
                    AdoDatabaseDriver.Add(command, "draft", AgentRevisionStateEnum.Draft.ToString());
                    AdoDatabaseDriver.Add(command, "by", publishedByName);
                    AdoDatabaseDriver.Add(command, "now", now);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "id", revisionId);
                }, ct).ConfigureAwait(false);
                if (published == 0) return;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Apps + " SET latestpublishedrevisionid = @id, lastupdateutc = @now WHERE id = (SELECT appid FROM " + _Revisions + " WHERE id = @id);", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", revisionId);
                    AdoDatabaseDriver.Add(command, "now", now);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return published > 0;
        }

        #endregion

        #region Private-Methods

        private async Task<AgenticApp?> ReadOneAsync(string where, string key, string? tenantId, CancellationToken token)
        {
            AgenticApp? app = await _Driver.QuerySingleAsync("SELECT * FROM " + _Apps + " WHERE " + where + ";", command =>
            {
                AdoDatabaseDriver.Add(command, "key", key);
                if (tenantId != null) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (app != null) await LoadChildrenAsync(app, token).ConfigureAwait(false);
            return app;
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, AgenticApp app, CancellationToken token)
        {
            for (int i = 0; i < app.Members.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Members + " (id, tenantid, appid, position, agentid, role) VALUES (@id, @tenantid, @appid, @position, @agentid, @role);", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", app.Id + "_m" + position.ToString("D4", CultureInfo.InvariantCulture));
                    AdoDatabaseDriver.Add(command, "tenantid", app.TenantId);
                    AdoDatabaseDriver.Add(command, "appid", app.Id);
                    AdoDatabaseDriver.Add(command, "position", position);
                    AdoDatabaseDriver.Add(command, "agentid", app.Members[position].AgentId);
                    AdoDatabaseDriver.Add(command, "role", app.Members[position].Role);
                }, token).ConfigureAwait(false);
            }
            for (int i = 0; i < app.Edges.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Edges + " (id, tenantid, appid, position, calleragentid, calleeagentid, fanoutallowed) VALUES (@id, @tenantid, @appid, @position, @caller, @callee, @fanout);", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", app.Id + "_e" + position.ToString("D4", CultureInfo.InvariantCulture));
                    AdoDatabaseDriver.Add(command, "tenantid", app.TenantId);
                    AdoDatabaseDriver.Add(command, "appid", app.Id);
                    AdoDatabaseDriver.Add(command, "position", position);
                    AdoDatabaseDriver.Add(command, "caller", app.Edges[position].CallerAgentId);
                    AdoDatabaseDriver.Add(command, "callee", app.Edges[position].CalleeAgentId);
                    AdoDatabaseDriver.Add(command, "fanout", app.Edges[position].FanOutAllowed);
                }, token).ConfigureAwait(false);
            }
            for (int i = 0; i < app.Environments.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Environments + " (id, tenantid, appid, position, environment, deploymentid) VALUES (@id, @tenantid, @appid, @position, @environment, @deploymentid);", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", app.Id + "_v" + position.ToString("D4", CultureInfo.InvariantCulture));
                    AdoDatabaseDriver.Add(command, "tenantid", app.TenantId);
                    AdoDatabaseDriver.Add(command, "appid", app.Id);
                    AdoDatabaseDriver.Add(command, "position", position);
                    AdoDatabaseDriver.Add(command, "environment", app.Environments[position].Environment);
                    AdoDatabaseDriver.Add(command, "deploymentid", String.IsNullOrEmpty(app.Environments[position].DeploymentId) ? null : app.Environments[position].DeploymentId);
                }, token).ConfigureAwait(false);
            }
        }

        private async Task LoadChildrenAsync(AgenticApp app, CancellationToken token)
        {
            Action<DbCommand> bind = command => AdoDatabaseDriver.Add(command, "id", app.Id);
            app.Members = await _Driver.QueryAsync("SELECT m.agentid AS agentid, m.role AS role, a.name AS agentname FROM " + _Members + " m LEFT JOIN " + _Agents + " a ON a.id = m.agentid WHERE m.appid = @id ORDER BY m.position ASC;", bind,
                reader => new AgenticAppMember { AgentId = AdoConverters.Str(reader, "agentid"), Role = AdoConverters.NullableStr(reader, "role"), AgentName = AdoConverters.NullableStr(reader, "agentname") }, token).ConfigureAwait(false);
            app.Edges = await _Driver.QueryAsync("SELECT * FROM " + _Edges + " WHERE appid = @id ORDER BY position ASC;", bind,
                reader => new AgenticAppEdge { CallerAgentId = AdoConverters.Str(reader, "calleragentid"), CalleeAgentId = AdoConverters.Str(reader, "calleeagentid"), FanOutAllowed = AdoConverters.Bool(reader, "fanoutallowed") }, token).ConfigureAwait(false);
            app.Environments = await _Driver.QueryAsync("SELECT * FROM " + _Environments + " WHERE appid = @id ORDER BY position ASC;", bind,
                reader => new AgenticAppEnvironment { Environment = AdoConverters.Str(reader, "environment"), DeploymentId = AdoConverters.NullableStr(reader, "deploymentid") }, token).ConfigureAwait(false);
        }

        private async Task LoadRevisionChildrenAsync(AppRevision revision, CancellationToken token)
        {
            Action<DbCommand> bind = command => AdoDatabaseDriver.Add(command, "id", revision.Id);
            revision.Members = await _Driver.QueryAsync("SELECT m.agentid AS agentid, m.agentrevisionid AS agentrevisionid, a.name AS agentname, r.number AS revisionnumber FROM " + _RevisionMembers + " m LEFT JOIN " + _Agents + " a ON a.id = m.agentid LEFT JOIN " + _AgentRevisions + " r ON r.id = m.agentrevisionid WHERE m.revisionid = @id ORDER BY m.position ASC;", bind,
                reader => new AppRevisionMember { AgentId = AdoConverters.Str(reader, "agentid"), AgentRevisionId = AdoConverters.Str(reader, "agentrevisionid"), AgentName = AdoConverters.NullableStr(reader, "agentname"), AgentRevisionNumber = AdoConverters.NullableInt(reader, "revisionnumber") }, token).ConfigureAwait(false);
            revision.Edges = await _Driver.QueryAsync("SELECT * FROM " + _RevisionEdges + " WHERE revisionid = @id ORDER BY position ASC;", bind,
                reader => new AgenticAppEdge { CallerAgentId = AdoConverters.Str(reader, "calleragentid"), CalleeAgentId = AdoConverters.Str(reader, "calleeagentid"), FanOutAllowed = AdoConverters.Bool(reader, "fanoutallowed") }, token).ConfigureAwait(false);
        }

        private static void Bind(DbCommand command, AgenticApp app)
        {
            AdoDatabaseDriver.Add(command, "id", app.Id);
            AdoDatabaseDriver.Add(command, "tenantid", app.TenantId);
            AdoDatabaseDriver.Add(command, "name", app.Name);
            AdoDatabaseDriver.Add(command, "slug", app.Slug);
            AdoDatabaseDriver.Add(command, "description", app.Description);
            AdoDatabaseDriver.Add(command, "entryagentid", app.EntryAgentId);
            AdoDatabaseDriver.Add(command, "liveenvironment", app.LiveEnvironment);
            AdoDatabaseDriver.Add(command, "authmode", app.AuthMode.ToString());
            AdoDatabaseDriver.Add(command, "anonymousenabled", app.AnonymousEnabled);
            AdoDatabaseDriver.Add(command, "showoperatordetail", app.ShowOperatorDetail);
            AdoDatabaseDriver.Add(command, "displayname", app.DisplayName);
            AdoDatabaseDriver.Add(command, "logoassetid", app.LogoAssetId);
            AdoDatabaseDriver.Add(command, "primarycolor", app.PrimaryColor);
            AdoDatabaseDriver.Add(command, "accentcolor", app.AccentColor);
            AdoDatabaseDriver.Add(command, "welcometext", app.WelcomeText);
            AdoDatabaseDriver.Add(command, "latestpublishedrevisionid", app.LatestPublishedRevisionId);
            AdoDatabaseDriver.Add(command, "active", app.Active);
            AdoDatabaseDriver.Add(command, "createdutc", app.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", app.LastUpdateUtc);
        }

        private static AgenticApp Map(DbDataReader reader)
        {
            AgenticApp app = new AgenticApp();
            app.Id = AdoConverters.Str(reader, "id");
            app.TenantId = AdoConverters.Str(reader, "tenantid");
            app.Name = AdoConverters.Str(reader, "name");
            app.Slug = AdoConverters.Str(reader, "slug");
            app.Description = AdoConverters.NullableStr(reader, "description");
            app.EntryAgentId = AdoConverters.Str(reader, "entryagentid");
            app.LiveEnvironment = AdoConverters.Str(reader, "liveenvironment");
            app.AuthMode = AdoConverters.Enum(reader, "authmode", AppAuthModeEnum.AppUsers);
            app.AnonymousEnabled = AdoConverters.Bool(reader, "anonymousenabled");
            app.ShowOperatorDetail = AdoConverters.Bool(reader, "showoperatordetail");
            app.DisplayName = AdoConverters.NullableStr(reader, "displayname");
            app.LogoAssetId = AdoConverters.NullableStr(reader, "logoassetid");
            app.PrimaryColor = AdoConverters.NullableStr(reader, "primarycolor");
            app.AccentColor = AdoConverters.NullableStr(reader, "accentcolor");
            app.WelcomeText = AdoConverters.NullableStr(reader, "welcometext");
            app.LatestPublishedRevisionId = AdoConverters.NullableStr(reader, "latestpublishedrevisionid");
            app.Active = AdoConverters.Bool(reader, "active");
            app.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            app.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return app;
        }

        private static AppRevision MapRevision(DbDataReader reader)
        {
            AppRevision revision = new AppRevision();
            revision.Id = AdoConverters.Str(reader, "id");
            revision.TenantId = AdoConverters.Str(reader, "tenantid");
            revision.AppId = AdoConverters.Str(reader, "appid");
            revision.Number = AdoConverters.Int(reader, "number");
            revision.State = AdoConverters.Enum(reader, "state", AgentRevisionStateEnum.Draft);
            revision.AuthorName = AdoConverters.NullableStr(reader, "authorname");
            revision.ChangeNote = AdoConverters.NullableStr(reader, "changenote");
            revision.PublishedByName = AdoConverters.NullableStr(reader, "publishedbyname");
            revision.PublishedUtc = AdoConverters.NullableDate(reader, "publishedutc");
            revision.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return revision;
        }

        #endregion
    }
}
