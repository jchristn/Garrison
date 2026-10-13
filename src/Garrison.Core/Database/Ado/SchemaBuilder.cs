namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Database.Sql;

    /// <summary>
    /// Builds the Garrison schema for a provider from a <see cref="SqlDialect"/> and a <see cref="TableCatalog"/>.
    /// String columns use explicit VARCHAR lengths; provider-divergent types come from dialect tokens.
    /// Migrations are additive: append a new version, never edit a shipped one.
    /// </summary>
    public class SchemaBuilder
    {
        #region Private-Members

        private readonly TableCatalog _Catalog;
        private readonly SqlDialect _Dialect;
        private readonly List<string> _Statements = new List<string>();
        private readonly List<SchemaColumnAddition> _Columns = new List<SchemaColumnAddition>();

        #endregion

        #region Constructors-and-Factories

        private SchemaBuilder(TableCatalog catalog, SqlDialect dialect)
        {
            _Catalog = catalog;
            _Dialect = dialect;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the ordered, tracked migration list.
        /// </summary>
        /// <param name="catalog">Table catalog.</param>
        /// <param name="dialect">Provider dialect.</param>
        /// <returns>Migrations in ascending version order.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static List<SchemaMigration> Build(TableCatalog catalog, SqlDialect dialect)
        {
            if (catalog == null) throw new ArgumentNullException(nameof(catalog));
            if (dialect == null) throw new ArgumentNullException(nameof(dialect));

            List<SchemaMigration> migrations = new List<SchemaMigration>();

            SchemaBuilder v1 = new SchemaBuilder(catalog, dialect);
            v1.BuildVersion1();
            migrations.Add(new SchemaMigration(1, "Initial schema", v1._Statements));

            SchemaBuilder v2 = new SchemaBuilder(catalog, dialect);
            v2.BuildVersion2();
            migrations.Add(new SchemaMigration(2, "Run timing telemetry", v2._Statements, v2._Columns));

            SchemaBuilder v3 = new SchemaBuilder(catalog, dialect);
            v3.BuildVersion3();
            migrations.Add(new SchemaMigration(3, "Structured output validation and repair", v3._Statements, v3._Columns));

            SchemaBuilder v4 = new SchemaBuilder(catalog, dialect);
            v4.BuildVersion4();
            migrations.Add(new SchemaMigration(4, "Delegation wait telemetry, manifest field changes, and run event codes", v4._Statements, v4._Columns));

            SchemaBuilder v5 = new SchemaBuilder(catalog, dialect);
            v5.BuildVersion5();
            migrations.Add(new SchemaMigration(5, "Run trace identifiers", v5._Statements, v5._Columns));

            SchemaBuilder v6 = new SchemaBuilder(catalog, dialect);
            v6.BuildVersion6();
            migrations.Add(new SchemaMigration(6, "Multi-replica state (nonces, rate limits, MCP sessions, backplane) and read path indexes", v6._Statements, v6._Columns));

            SchemaBuilder v7 = new SchemaBuilder(catalog, dialect);
            v7.BuildVersion7();
            migrations.Add(new SchemaMigration(7, "Control-plane replicas (control nodes)", v7._Statements, v7._Columns));

            SchemaBuilder v8 = new SchemaBuilder(catalog, dialect);
            v8.BuildVersion8();
            migrations.Add(new SchemaMigration(8, "Run guard limits on deployments", v8._Statements, v8._Columns));

            SchemaBuilder v9 = new SchemaBuilder(catalog, dialect);
            v9.BuildVersion9();
            migrations.Add(new SchemaMigration(9, "Run executors, run pod resources, and PersistentVolume workspaces", v9._Statements, v9._Columns));

            SchemaBuilder v10 = new SchemaBuilder(catalog, dialect);
            v10.BuildVersion10();
            migrations.Add(new SchemaMigration(10, "Secret credential status and Codex login refresh", v10._Statements, v10._Columns));

            SchemaBuilder v11 = new SchemaBuilder(catalog, dialect);
            v11.BuildVersion11();
            migrations.Add(new SchemaMigration(11, "Run token lease epochs and manifest error codes", v11._Statements, v11._Columns));

            SchemaBuilder v12 = new SchemaBuilder(catalog, dialect);
            v12.BuildVersion12();
            migrations.Add(new SchemaMigration(12, "Conversations: harness session resume, node affinity, and transcript fallback", v12._Statements, v12._Columns));
            SchemaBuilder v13 = new SchemaBuilder(catalog, dialect);
            v13.BuildVersion13();
            migrations.Add(new SchemaMigration(13, "Permission approvals and deployment approval rules", v13._Statements, v13._Columns));

            SchemaBuilder v14 = new SchemaBuilder(catalog, dialect);
            v14.BuildVersion14();
            migrations.Add(new SchemaMigration(14, "Operator-configured model prices for run cost estimation", v14._Statements, v14._Columns));

            SchemaBuilder v15 = new SchemaBuilder(catalog, dialect);
            v15.BuildVersion15();
            migrations.Add(new SchemaMigration(15, "Daily UTC quotas and retained run usage", v15._Statements, v15._Columns));

            SchemaBuilder v16 = new SchemaBuilder(catalog, dialect);
            v16.Column("usage_quotas", "enforcementenabled", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            migrations.Add(new SchemaMigration(16, "Explicit opt-in quota enforcement", v16._Statements, v16._Columns));

            SchemaBuilder v17 = new SchemaBuilder(catalog, dialect);
            v17.Column("deployments", "capisolation", dialect.TypeInt + " NOT NULL DEFAULT 0");
            v17.Column("deployments", "capegresscontrol", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("deployments", "capfilesystemsnapshot", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("deployments", "capsessioncontinuation", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("deployments", "capcrossnoderestore", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("deployments", "capcoldstartclass", "VARCHAR(32)");
            v17.Column("runs", "capisolation", dialect.TypeInt + " NOT NULL DEFAULT 0");
            v17.Column("runs", "capegresscontrol", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("runs", "capfilesystemsnapshot", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("runs", "capsessioncontinuation", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("runs", "capcrossnoderestore", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("runs", "capcoldstartclass", "VARCHAR(32)");
            v17.Column("node_executors", "capisolation", dialect.TypeInt + " NOT NULL DEFAULT 0");
            v17.Column("node_executors", "capegresscontrol", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("node_executors", "capfilesystemsnapshot", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("node_executors", "capsessioncontinuation", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("node_executors", "capcrossnoderestore", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v17.Column("node_executors", "capcoldstartclass", "VARCHAR(32)");
            v17.Column("node_executors", "capreported", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            migrations.Add(new SchemaMigration(17, "Executor capability negotiation and run requirements", v17._Statements, v17._Columns));

            SchemaBuilder v18 = new SchemaBuilder(catalog, dialect);
            v18.Column("node_executors", "capwarmstart", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            migrations.Add(new SchemaMigration(18, "Warm-start capability without removing cold execution support", v18._Statements, v18._Columns));

            return migrations;
        }

        /// <summary>
        /// Highest migration version this build knows. A database at a lower version is not ready for this build.
        /// </summary>
        public static int LatestVersion
        {
            get
            {
                SqlDialect dialect = new Garrison.Core.Database.Sqlite.Queries.SqliteDialect();
                int latest = 0;
                foreach (SchemaMigration migration in Build(new TableCatalog(null, null, dialect), dialect)) latest = Math.Max(latest, migration.Version);
                return latest;
            }
        }

        /// <summary>
        /// Build the DDL that creates the migration tracking table.
        /// </summary>
        /// <param name="catalog">Table catalog.</param>
        /// <param name="dialect">Provider dialect.</param>
        /// <returns>DDL statement.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static string MigrationsTableDdl(TableCatalog catalog, SqlDialect dialect)
        {
            if (catalog == null) throw new ArgumentNullException(nameof(catalog));
            if (dialect == null) throw new ArgumentNullException(nameof(dialect));

            return dialect.CreateTable(catalog.Schema, catalog.RawName("schema_migrations"),
                "    version " + dialect.TypeInt + " NOT NULL PRIMARY KEY,\n" +
                "    description VARCHAR(1024) NOT NULL,\n" +
                "    appliedutc " + dialect.TypeTimestamp + " NOT NULL");
        }

        #endregion

        #region Private-Methods

        private void Table(string rawName, params string[] columns)
        {
            _Statements.Add(_Dialect.CreateTable(_Catalog.Schema, _Catalog.RawName(rawName), "    " + String.Join(",\n    ", columns)));
        }

        private void Index(string rawTable, string suffix, bool unique, params string[] columns)
        {
            List<string> quoted = new List<string>();
            foreach (string column in columns) quoted.Add(_Dialect.Quote(column));
            string name = "idx_" + _Catalog.RawName(rawTable) + "_" + suffix;
            _Statements.Add(_Dialect.CreateIndex(name, _Catalog.Schema, _Catalog.RawName(rawTable), String.Join(", ", quoted), unique));
        }

        private void Column(string rawTable, string column, string definition)
        {
            _Columns.Add(new SchemaColumnAddition(rawTable, column, definition));
        }

        private void BuildVersion8()
        {
            SqlDialect d = _Dialect;

            // deployments: run guard limits; null means the cluster default (P3.15)
            Column("deployments", "repetitionguard", d.TypeBool);
            Column("deployments", "maxassistantchars", d.TypeBigInt);
            Column("deployments", "noprogressseconds", d.TypeInt);
        }

        private void BuildVersion9()
        {
            SqlDialect d = _Dialect;

            // Pod-per-run executor (plan D-033, Phase 11). Null executors mean Process (deployments: the pool default).
            Column("deployments", "executor", "VARCHAR(64)");
            Column("deployments", "podcpurequest", "VARCHAR(64)");
            Column("deployments", "podcpulimit", "VARCHAR(64)");
            Column("deployments", "podmemoryrequest", "VARCHAR(64)");
            Column("deployments", "podmemorylimit", "VARCHAR(64)");
            Column("deployments", "podephemeralstoragerequest", "VARCHAR(64)");
            Column("deployments", "podephemeralstoragelimit", "VARCHAR(64)");
            Column("node_pools", "defaultexecutor", "VARCHAR(64)");
            Column("runs", "executor", "VARCHAR(64)");
            Column("workspace_templates", "persistentvolumeclaim", "VARCHAR(256)");

            // node_executors: executors a node reports at registration (none from older workers means Process)
            Table("node_executors",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "nodeid " + d.TypeId + " NOT NULL",
                "executor VARCHAR(64) NOT NULL");
            Index("node_executors", "parent", false, "nodeid");
        }

        private void BuildVersion10()
        {
            SqlDialect d = _Dialect;

            // secrets: credential health and control-plane refresh of CodexAuthJson logins (G-22). Null status is Ok.
            Column("secrets", "status", "VARCHAR(64)");
            Column("secrets", "statusmessage", d.TypeText);
            Column("secrets", "statusutc", d.TypeTimestamp);
            Column("secrets", "refreshedutc", d.TypeTimestamp);
            Column("secrets", "accesstokenexpiresutc", d.TypeTimestamp);
            Index("secrets", "kind", false, "kind");
        }

        private void BuildVersion11()
        {
            SqlDialect d = _Dialect;

            // authsessions: the lease epoch a run token was minted for (P10.21). Null for every other session.
            Column("authsessions", "leaseepoch", d.TypeBigInt);

            // manifest_apply_items: stable error code and failing field of a failed document (G-26).
            Column("manifest_apply_items", "errorcode", "VARCHAR(64)");
            Column("manifest_apply_items", "errorfield", "VARCHAR(512)");
        }

        private void BuildVersion12()
        {
            SqlDialect d = _Dialect;

            // conversations: multi-turn conversations with one agent (P12.1). The session to resume and the node that
            // holds the conversation's directories live here; turns are runs with a conversationid.
            Table("conversations",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "agentid " + d.TypeId + " NOT NULL",
                "agentname VARCHAR(256) NOT NULL",
                "deploymentid " + d.TypeId,
                "harnesstype VARCHAR(64) NOT NULL",
                "contextid VARCHAR(256)",
                "title VARCHAR(256)",
                "callertype VARCHAR(64) NOT NULL",
                "callerid " + d.TypeId,
                "callername VARCHAR(256)",
                "sessionid VARCHAR(256)",
                "sessionharnessprofileid " + d.TypeId,
                "affinitynodeid " + d.TypeId,
                "affinitynodename VARCHAR(256)",
                "activerunid " + d.TypeId,
                "lastrunid " + d.TypeId,
                "turncount " + d.TypeInt + " NOT NULL",
                "fallbackcount " + d.TypeInt + " NOT NULL",
                "lastfallbackreason VARCHAR(64)",
                "lastfallbackutc " + d.TypeTimestamp,
                "lastactivityutc " + d.TypeTimestamp,
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("conversations", "tenantcreated", false, "tenantid", "createdutc");
            Index("conversations", "tenantagent", false, "tenantid", "agentid");
            Index("conversations", "context", false, "tenantid", "agentid", "contextid");

            // runs: the conversation a run is a turn of, the session it resumes, and its node affinity
            Column("runs", "conversationid", d.TypeId);
            Column("runs", "conversationturn", d.TypeInt + " NOT NULL DEFAULT 0");
            Column("runs", "resumesessionid", "VARCHAR(256)");
            Column("runs", "affinitynodeid", d.TypeId);
            Column("runs", "affinityuntilutc", d.TypeTimestamp);
            Column("runs", "conversationfallbackreason", "VARCHAR(64)");
            Index("runs", "conversation", false, "conversationid", "createdutc");
        }

        private void BuildVersion15()
        {
            SqlDialect d = _Dialect;
            Table("usage_quotas",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY", "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(128) NOT NULL", "description " + d.TypeText, "scope VARCHAR(64) NOT NULL", "resourceid " + d.TypeId + " NOT NULL",
                "dailyrunlimit " + d.TypeBigInt, "dailytokenlimit " + d.TypeBigInt, "dailycostusdlimit " + d.TypeDouble,
                "maxconcurrentruns " + d.TypeInt, "active " + d.TypeBool + " NOT NULL", "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL", "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("usage_quotas", "tenantname", true, "tenantid", "name");
            Index("usage_quotas", "target", true, "tenantid", "scope", "resourceid");
            Table("run_usage", "runid " + d.TypeId + " NOT NULL PRIMARY KEY", "tenantid " + d.TypeId + " NOT NULL",
                "agentid " + d.TypeId + " NOT NULL", "deploymentid " + d.TypeId + " NOT NULL", "harnesstype VARCHAR(64) NOT NULL",
                "admittedutc " + d.TypeTimestamp + " NOT NULL", "completedutc " + d.TypeTimestamp,
                "inputtokens " + d.TypeBigInt + " NOT NULL", "outputtokens " + d.TypeBigInt + " NOT NULL", "cachedtokens " + d.TypeBigInt + " NOT NULL", "costusd " + d.TypeDouble);
            Index("run_usage", "admitted", false, "tenantid", "admittedutc");
            Index("run_usage", "completed", false, "tenantid", "completedutc");
            Index("run_usage", "agent", false, "tenantid", "agentid");
            Index("run_usage", "deployment", false, "tenantid", "deploymentid");
            // Older replicas can create runs during a rolling upgrade after the initial backfill.
            _Statements.Add("CREATE VIEW " + _Catalog.Reference("quota_usage_source") + " AS SELECT runid, tenantid, agentid, deploymentid, harnesstype, admittedutc, completedutc, inputtokens, outputtokens, cachedtokens, costusd FROM " + _Catalog.Reference("run_usage")
                + " UNION ALL SELECT r.id, r.tenantid, r.agentid, r.deploymentid, r.harnesstype, COALESCE(r.queuedutc, r.createdutc), r.completedutc, r.inputtokens, r.outputtokens, r.cachedtokens, r.costusd FROM " + _Catalog.Reference("runs") + " r WHERE NOT EXISTS (SELECT 1 FROM " + _Catalog.Reference("run_usage") + " u WHERE u.runid = r.id);");
            _Statements.Add("INSERT INTO " + _Catalog.Reference("run_usage") + " (runid, tenantid, agentid, deploymentid, harnesstype, admittedutc, completedutc, inputtokens, outputtokens, cachedtokens, costusd) SELECT id, tenantid, agentid, deploymentid, harnesstype, COALESCE(queuedutc, createdutc), completedutc, inputtokens, outputtokens, cachedtokens, costusd FROM " + _Catalog.Reference("runs") + ";");
        }

        private void BuildVersion14()
        {
            SqlDialect d = _Dialect;
            Table("model_prices",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(128) NOT NULL",
                "description " + d.TypeText,
                "model VARCHAR(256) NOT NULL",
                "harnesstype VARCHAR(64) NOT NULL",
                "inputusdpermillion " + d.TypeDouble + " NOT NULL",
                "outputusdpermillion " + d.TypeDouble + " NOT NULL",
                "cachedinputusdpermillion " + d.TypeDouble,
                "reasoningusdpermillion " + d.TypeDouble,
                "inputincludescachedtokens " + d.TypeBool + " NOT NULL",
                "outputincludesreasoningtokens " + d.TypeBool + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("model_prices", "tenantname", true, "tenantid", "name");
            Index("model_prices", "tenantmodel", true, "tenantid", "harnesstype", "model");
        }

        private void BuildVersion13()
        {
            SqlDialect d = _Dialect;

            // deployments: permission approvals (P12.3). Null means disabled, Ask, 300 seconds, and Deny.
            Column("deployments", "approvalsenabled", d.TypeBool);
            Column("deployments", "approvaldefaultaction", "VARCHAR(16)");
            Column("deployments", "approvaltimeoutseconds", d.TypeInt);
            Column("deployments", "approvaltimeoutdecision", "VARCHAR(16)");

            // runs: approvals waiting for a person (targeted updates only) and total time spent waiting
            Column("runs", "pendingapprovals", d.TypeInt + " NOT NULL DEFAULT 0");
            Column("runs", "approvalwaitms", d.TypeBigInt);

            // deployment_approval_rules: ordered allow, deny, and ask rules per deployment
            Table("deployment_approval_rules",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "deploymentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "position " + d.TypeInt + " NOT NULL",
                "action VARCHAR(16) NOT NULL",
                "pattern VARCHAR(1024) NOT NULL",
                "inputpattern " + d.TypeText + "",
                "description " + d.TypeText + "");
            Index("deployment_approval_rules", "parent", false, "deploymentid");

            // approvals: permission requests relayed by harnesses and their decisions
            Table("approvals",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "runid " + d.TypeId + " NOT NULL",
                "rootrunid " + d.TypeId + "",
                "agentid " + d.TypeId + " NOT NULL",
                "agentname VARCHAR(128) NOT NULL",
                "deploymentid " + d.TypeId + " NOT NULL",
                "leaseepoch " + d.TypeBigInt + " NOT NULL",
                "harnesstype VARCHAR(64) NOT NULL",
                "kind VARCHAR(32) NOT NULL",
                "toolname VARCHAR(256) NOT NULL",
                "toolcallid VARCHAR(256)",
                "inputpreview " + d.TypeText + "",
                "summary " + d.TypeText + "",
                "suggestedrule VARCHAR(1024)",
                "status VARCHAR(32) NOT NULL",
                "decision VARCHAR(16)",
                "decisionsource VARCHAR(32)",
                "ruleid " + d.TypeId + "",
                "rulepattern VARCHAR(1024)",
                "rememberedruleid " + d.TypeId + "",
                "decidedby VARCHAR(256)",
                "decidedbyid " + d.TypeId + "",
                "reason " + d.TypeText + "",
                "timeoutdecision VARCHAR(16) NOT NULL",
                "requestedutc " + d.TypeTimestamp + " NOT NULL",
                "decidedutc " + d.TypeTimestamp + "",
                "expiresutc " + d.TypeTimestamp + "",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("approvals", "tenantstatuscreated", false, "tenantid", "status", "createdutc");
            Index("approvals", "tenantcreated", false, "tenantid", "createdutc");
            Index("approvals", "run", false, "runid");
            Index("approvals", "statusexpires", false, "status", "expiresutc");
        }

        private void BuildVersion7()
        {
            SqlDialect d = _Dialect;

            // control_nodes: one row per control-plane replica, registered and heartbeated by the replica itself (P10.19)
            Table("control_nodes",
                "id VARCHAR(256) NOT NULL PRIMARY KEY",
                "name VARCHAR(256) NOT NULL",
                "hostname VARCHAR(256)",
                "address VARCHAR(256)",
                "version VARCHAR(64)",
                "schemaversion " + d.TypeInt + " NOT NULL",
                "backplane VARCHAR(64)",
                "status VARCHAR(64) NOT NULL",
                "startedutc " + d.TypeTimestamp + " NOT NULL",
                "lastheartbeatutc " + d.TypeTimestamp + " NOT NULL",
                "activerequests " + d.TypeInt + " NOT NULL",
                "openstreams " + d.TypeInt + " NOT NULL",
                "heldlongpolls " + d.TypeInt + " NOT NULL");
            Index("control_nodes", "statusheartbeat", false, "status", "lastheartbeatutc");
        }

        private void BuildVersion6()
        {
            SqlDialect d = _Dialect;

            // request_nonces: signed-request nonces shared by every replica until they expire (P10.2)
            Table("request_nonces",
                "noncekey VARCHAR(512) NOT NULL PRIMARY KEY",
                "expiresutc " + d.TypeTimestamp + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL");
            Index("request_nonces", "expires", false, "expiresutc");

            // rate_limit_buckets: fixed-window counters shared by every replica (P10.3)
            Table("rate_limit_buckets",
                "bucketkey VARCHAR(512) NOT NULL PRIMARY KEY",
                "hits " + d.TypeInt + " NOT NULL",
                "expiresutc " + d.TypeTimestamp + " NOT NULL");
            Index("rate_limit_buckets", "expires", false, "expiresutc");

            // mcp_sessions: cluster MCP sessions, so any replica can serve a session another replica opened (G-1)
            Table("mcp_sessions",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "principal VARCHAR(512) NOT NULL",
                "protocolversion VARCHAR(64) NOT NULL",
                "clientname VARCHAR(256)",
                "clientversion VARCHAR(128)",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastseenutc " + d.TypeTimestamp + " NOT NULL",
                "expiresutc " + d.TypeTimestamp + " NOT NULL");
            Index("mcp_sessions", "expires", false, "expiresutc");

            // backplane_messages: wake-ups and cache invalidations for the polling backplane (P10.4)
            Table("backplane_messages",
                "seq " + d.TypeAutoIncrementPrimaryKey,
                "kind VARCHAR(64) NOT NULL",
                "subject VARCHAR(256)",
                "origin VARCHAR(128) NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL");
            Index("backplane_messages", "created", false, "createdutc");

            // read path (P10.11): run lists filtered by status or agent and ordered by creation, delegation trees,
            // leader scans of leases, deadlines, and retention, and event retention
            Index("runs", "tenantstatuscreated", false, "tenantid", "status", "createdutc");
            Index("runs", "tenantagentcreated", false, "tenantid", "agentid", "createdutc");
            Index("runs", "root", false, "rootrunid");
            Index("runs", "leaseexpires", false, "status", "leaseexpiresutc");
            Index("runs", "deadline", false, "status", "deadlineutc");
            Index("runs", "completed", false, "status", "completedutc");
            Index("run_events", "created", false, "createdutc");
            Index("authsessions", "expires", false, "expiresutc");
        }

        private void BuildVersion5()
        {
            // runs: W3C trace the run was created and compiled in, for Grafana deep links (P13.16)
            Column("runs", "traceid", "VARCHAR(32)");
            Column("runs", "traceparent", "VARCHAR(64)");
        }

        private void BuildVersion4()
        {
            SqlDialect d = _Dialect;

            // runs: time spent waiting on delegated child runs, and time to first token without it (M1-08)
            Column("runs", "delegationwaitms", d.TypeBigInt);
            Column("runs", "ttftexcldelegationms", d.TypeBigInt);

            // run events: machine code for text Garrison generates (M1-24)
            Column("run_events", "code", "VARCHAR(64)");

            // manifest applies: the planned result in dry runs and per-field changes for updated documents (M1-14)
            Column("manifest_apply_items", "plannedresult", "VARCHAR(64)");
            Table("manifest_apply_changes",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "manifestapplyid " + d.TypeId + " NOT NULL",
                "manifestapplyitemid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "position " + d.TypeInt + " NOT NULL",
                "field VARCHAR(512) NOT NULL",
                "beforevalue " + d.TypeText + "",
                "aftervalue " + d.TypeText + "");
            Index("manifest_apply_changes", "parent", false, "manifestapplyid");
        }

        private void BuildVersion3()
        {
            SqlDialect d = _Dialect;

            // runs: structured output validation against the agent's output schema and the repair attempt (P3.2.7)
            Column("runs", "outputschemavalid", d.TypeBool);
            Column("runs", "schemavalidationerrors", d.TypeText);
            Column("runs", "repairattempts", d.TypeInt + " NOT NULL DEFAULT 0");
        }

        private void BuildVersion2()
        {
            SqlDialect d = _Dialect;

            // runs: timing telemetry (plan section 10.6)
            Column("runs", "firsttokenutc", d.TypeTimestamp);
            Column("runs", "lasttokenutc", d.TypeTimestamp);
            Column("runs", "ttftms", d.TypeBigInt);
            Column("runs", "streamingms", d.TypeBigInt);
            Column("runs", "executionms", d.TypeBigInt);
            Column("runs", "queuems", d.TypeBigInt);
            Column("runs", "totalms", d.TypeBigInt);
            Column("runs", "toolcallcount", d.TypeInt + " NOT NULL DEFAULT 0");
            Column("runs", "reasoningtokens", d.TypeBigInt + " NOT NULL DEFAULT 0");
        }

        private void BuildVersion1()
        {
            SqlDialect d = _Dialect;

            // tenants
            Table("tenants",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "name VARCHAR(256) NOT NULL",
                "description " + d.TypeText + "",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("tenants", "name", true, "name");

            // users
            Table("users",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "firstname VARCHAR(128)",
                "lastname VARCHAR(128)",
                "email VARCHAR(256) NOT NULL",
                "passwordsha256 VARCHAR(128) NOT NULL",
                "isadmin " + d.TypeBool + " NOT NULL",
                "istenantadmin " + d.TypeBool + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("users", "tenant", false, "tenantid");
            Index("users", "email", true, "tenantid", "email");

            // credentials
            Table("credentials",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "userid " + d.TypeId + " NOT NULL",
                "name VARCHAR(256) NOT NULL",
                "accesskey VARCHAR(128) NOT NULL",
                "secretkeyencrypted " + d.TypeText + " NOT NULL",
                "secretkeylast4 VARCHAR(8)",
                "authmode VARCHAR(64) NOT NULL",
                "lastusedutc " + d.TypeTimestamp + "",
                "expiresutc " + d.TypeTimestamp + "",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("credentials", "tenant", false, "tenantid");
            Index("credentials", "accesskey", true, "accesskey");
            Index("credentials", "user", false, "tenantid", "userid");

            // authsessions
            Table("authsessions",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + "",
                "userid " + d.TypeId + "",
                "credentialid " + d.TypeId + "",
                "runid " + d.TypeId + "",
                "originprincipaltype VARCHAR(64)",
                "originprincipalid " + d.TypeId + "",
                "principaltype VARCHAR(64) NOT NULL",
                "authscheme VARCHAR(64) NOT NULL",
                "tokenid VARCHAR(64) NOT NULL",
                "sourceip VARCHAR(64)",
                "useragent VARCHAR(512)",
                "expiresutc " + d.TypeTimestamp + " NOT NULL",
                "lastusedutc " + d.TypeTimestamp + "",
                "revokedutc " + d.TypeTimestamp + "",
                "revocationreason VARCHAR(512)",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("authsessions", "tenant", false, "tenantid");
            Index("authsessions", "tokenid", true, "tokenid");
            Index("authsessions", "run", false, "runid");

            // userroles
            Table("userroles",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(128) NOT NULL",
                "description " + d.TypeText + "",
                "isbuiltin " + d.TypeBool + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("userroles", "tenant", false, "tenantid");
            Index("userroles", "name", false, "tenantid", "name");

            // permissions
            Table("permissions",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(256) NOT NULL",
                "permissiontype VARCHAR(64) NOT NULL",
                "isbuiltin " + d.TypeBool + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("permissions", "tenant", false, "tenantid");
            Index("permissions", "name", false, "tenantid", "name");
            Table("permission_resource_types",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "permissionid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "resourcetype VARCHAR(256) NOT NULL");
            Index("permission_resource_types", "parent", false, "permissionid");
            Table("permission_operation_types",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "permissionid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "operationtype VARCHAR(256) NOT NULL");
            Index("permission_operation_types", "parent", false, "permissionid");

            // rolepermissionmaps
            Table("rolepermissionmaps",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + "",
                "roleid " + d.TypeId + " NOT NULL",
                "permissionid " + d.TypeId + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("rolepermissionmaps", "tenant", false, "tenantid");
            Index("rolepermissionmaps", "role", false, "roleid");
            Index("rolepermissionmaps", "rolepermission", true, "roleid", "permissionid");

            // userroleassignments
            Table("userroleassignments",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "userid " + d.TypeId + " NOT NULL",
                "roleid " + d.TypeId + "",
                "rolename VARCHAR(128)",
                "resourcescope VARCHAR(64) NOT NULL",
                "resourceid " + d.TypeId + "",
                "inheritstochildren " + d.TypeBool + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("userroleassignments", "tenant", false, "tenantid");
            Index("userroleassignments", "user", false, "tenantid", "userid");

            // credentialscopeassignments
            Table("credentialscopeassignments",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "credentialid " + d.TypeId + " NOT NULL",
                "roleid " + d.TypeId + "",
                "rolename VARCHAR(128)",
                "resourcescope VARCHAR(64) NOT NULL",
                "resourceid " + d.TypeId + "",
                "inheritstochildren " + d.TypeBool + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("credentialscopeassignments", "tenant", false, "tenantid");
            Index("credentialscopeassignments", "credential", false, "tenantid", "credentialid");

            // audit_records
            Table("audit_records",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + "",
                "eventtype VARCHAR(64) NOT NULL",
                "requestid VARCHAR(64)",
                "correlationid VARCHAR(64)",
                "traceid VARCHAR(64)",
                "authscheme VARCHAR(64)",
                "principaltype VARCHAR(64)",
                "principalid " + d.TypeId + "",
                "principalname VARCHAR(256)",
                "sessionid " + d.TypeId + "",
                "resourcetype VARCHAR(64)",
                "resourceid " + d.TypeId + "",
                "operation VARCHAR(64)",
                "requesttype VARCHAR(128)",
                "method VARCHAR(16)",
                "path VARCHAR(1024)",
                "sourceip VARCHAR(64)",
                "authresult VARCHAR(64)",
                "authorizationresult VARCHAR(64)",
                "reason " + d.TypeText + "",
                "bypassreason VARCHAR(256)",
                "statuscode " + d.TypeInt + " NOT NULL",
                "description " + d.TypeText + "",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("audit_records", "tenant", false, "tenantid");
            Index("audit_records", "created", false, "tenantid", "createdutc");
            Index("audit_records", "eventtype", false, "eventtype");

            // request_history
            Table("request_history",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + "",
                "userid " + d.TypeId + "",
                "principalname VARCHAR(256)",
                "method VARCHAR(16) NOT NULL",
                "path VARCHAR(1024) NOT NULL",
                "url " + d.TypeText + " NOT NULL",
                "statuscode " + d.TypeInt + " NOT NULL",
                "durationms " + d.TypeDouble + " NOT NULL",
                "sourceip VARCHAR(64)",
                "requestbody " + d.TypeText + "",
                "requestbodybytes " + d.TypeBigInt + " NOT NULL",
                "requestbodytruncated " + d.TypeBool + " NOT NULL",
                "responsebody " + d.TypeText + "",
                "responsebodybytes " + d.TypeBigInt + " NOT NULL",
                "responsebodytruncated " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "completedutc " + d.TypeTimestamp + "");
            Index("request_history", "tenant", false, "tenantid");
            Index("request_history", "created", false, "createdutc");
            Index("request_history", "tenantcreated", false, "tenantid", "createdutc");
            Table("request_history_headers",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "requesthistoryentryid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "direction VARCHAR(64) NOT NULL",
                "name VARCHAR(256) NOT NULL",
                "value " + d.TypeText + " NOT NULL");
            Index("request_history_headers", "parent", false, "requesthistoryentryid");

            // harness_profiles
            Table("harness_profiles",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(256) NOT NULL",
                "description " + d.TypeText + "",
                "harnesstype VARCHAR(64) NOT NULL",
                "executable VARCHAR(1024) NOT NULL",
                "promptdelivery VARCHAR(64) NOT NULL",
                "promptargumenttemplate " + d.TypeText + "",
                "systempromptdelivery VARCHAR(64) NOT NULL",
                "systemprompttarget " + d.TypeText + "",
                "mcpconfigformat VARCHAR(64) NOT NULL",
                "mcpconfigfilename VARCHAR(256)",
                "outputparser VARCHAR(64) NOT NULL",
                "resultsource VARCHAR(64) NOT NULL",
                "resultfilename VARCHAR(256)",
                "successpolicy VARCHAR(64) NOT NULL",
                "generictextfield VARCHAR(256)",
                "genericfinalfield VARCHAR(256)",
                "genericsuccessfield VARCHAR(256)",
                "genericsuccessvalue VARCHAR(256)",
                "defaulttimeoutseconds " + d.TypeInt + " NOT NULL",
                "killgraceseconds " + d.TypeInt + " NOT NULL",
                "maxoutputbytes " + d.TypeBigInt + " NOT NULL",
                "stderrtailbytes " + d.TypeInt + " NOT NULL",
                "isolatehome " + d.TypeBool + " NOT NULL",
                "supportsresume " + d.TypeBool + " NOT NULL",
                "isbuiltin " + d.TypeBool + " NOT NULL",
                "builtinkey VARCHAR(128)",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("harness_profiles", "tenant", false, "tenantid");
            Index("harness_profiles", "name", false, "tenantid", "name");
            Table("harness_profile_args",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "harnessprofileid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "position " + d.TypeInt + " NOT NULL",
                "template " + d.TypeText + " NOT NULL",
                "condition " + d.TypeText + "",
                "repeatover VARCHAR(256)");
            Index("harness_profile_args", "parent", false, "harnessprofileid");
            Table("harness_profile_env",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "harnessprofileid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(256) NOT NULL",
                "valuetemplate " + d.TypeText + " NOT NULL",
                "condition " + d.TypeText + "",
                "issecret " + d.TypeBool + " NOT NULL");
            Index("harness_profile_env", "parent", false, "harnessprofileid");
            Table("harness_profile_files",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "harnessprofileid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "basedirectory VARCHAR(64) NOT NULL",
                "pathtemplate " + d.TypeText + " NOT NULL",
                "contenttemplate " + d.TypeText + " NOT NULL",
                "condition " + d.TypeText + "",
                "mode VARCHAR(8)",
                "issecret " + d.TypeBool + " NOT NULL");
            Index("harness_profile_files", "parent", false, "harnessprofileid");
            Table("harness_profile_exit_codes",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "harnessprofileid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "exitcode " + d.TypeInt + " NOT NULL");
            Index("harness_profile_exit_codes", "parent", false, "harnessprofileid");
            Table("harness_profile_probe_args",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "harnessprofileid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "position " + d.TypeInt + " NOT NULL",
                "argument VARCHAR(256) NOT NULL");
            Index("harness_profile_probe_args", "parent", false, "harnessprofileid");
            Table("harness_profile_cred_env",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "harnessprofileid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(256) NOT NULL");
            Index("harness_profile_cred_env", "parent", false, "harnessprofileid");

            // prompt_templates
            Table("prompt_templates",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(256) NOT NULL",
                "description " + d.TypeText + "",
                "kind VARCHAR(64) NOT NULL",
                "content " + d.TypeText + " NOT NULL",
                "currentversion " + d.TypeInt + " NOT NULL",
                "isbuiltin " + d.TypeBool + " NOT NULL",
                "builtinkey VARCHAR(128)",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("prompt_templates", "tenant", false, "tenantid");
            Index("prompt_templates", "name", false, "tenantid", "name");
            Table("prompt_template_variables",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "prompttemplateid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(256) NOT NULL",
                "description " + d.TypeText + "",
                "required " + d.TypeBool + " NOT NULL",
                "defaultvalue " + d.TypeText + "");
            Index("prompt_template_variables", "parent", false, "prompttemplateid");

            // prompt_template_versions
            Table("prompt_template_versions",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + "",
                "templateid " + d.TypeId + " NOT NULL",
                "version " + d.TypeInt + " NOT NULL",
                "content " + d.TypeText + " NOT NULL",
                "changenote " + d.TypeText + "",
                "createdby VARCHAR(256)",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("prompt_template_versions", "tenant", false, "tenantid");
            Index("prompt_template_versions", "templateversion", true, "templateid", "version");

            // mcp_servers
            Table("mcp_servers",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(128) NOT NULL",
                "description " + d.TypeText + "",
                "transport VARCHAR(64) NOT NULL",
                "url " + d.TypeText + "",
                "path VARCHAR(256)",
                "command " + d.TypeText + "",
                "tooltimeoutseconds " + d.TypeInt + " NOT NULL",
                "required " + d.TypeBool + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("mcp_servers", "tenant", false, "tenantid");
            Index("mcp_servers", "name", true, "tenantid", "name");
            Table("mcp_server_args",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "mcpserverid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "position " + d.TypeInt + " NOT NULL",
                "argument VARCHAR(256) NOT NULL");
            Index("mcp_server_args", "parent", false, "mcpserverid");
            Table("mcp_server_env",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "mcpserverid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(256) NOT NULL",
                "valuetemplate " + d.TypeText + " NOT NULL");
            Index("mcp_server_env", "parent", false, "mcpserverid");
            Table("mcp_server_headers",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "mcpserverid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(256) NOT NULL",
                "valuetemplate " + d.TypeText + " NOT NULL");
            Index("mcp_server_headers", "parent", false, "mcpserverid");
            Table("mcp_server_required_tools",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "mcpserverid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "toolname VARCHAR(256) NOT NULL");
            Index("mcp_server_required_tools", "parent", false, "mcpserverid");

            // secrets
            Table("secrets",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(256) NOT NULL",
                "description " + d.TypeText + "",
                "kind VARCHAR(64) NOT NULL",
                "valueencrypted " + d.TypeText + "",
                "valuelast4 VARCHAR(8)",
                "fingerprint VARCHAR(64)",
                "keyversion " + d.TypeInt + " NOT NULL",
                "expiresutc " + d.TypeTimestamp + "",
                "rotatedutc " + d.TypeTimestamp + "",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("secrets", "tenant", false, "tenantid");
            Index("secrets", "name", true, "tenantid", "name");

            // workspace_templates
            Table("workspace_templates",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(256) NOT NULL",
                "description " + d.TypeText + "",
                "kind VARCHAR(64) NOT NULL",
                "giturl " + d.TypeText + "",
                "gitref VARCHAR(256)",
                "gitdepth " + d.TypeInt + " NOT NULL",
                "gitcredentialsecretid " + d.TypeId + "",
                "retention VARCHAR(64) NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("workspace_templates", "tenant", false, "tenantid");
            Index("workspace_templates", "name", true, "tenantid", "name");
            Table("workspace_template_files",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "workspacetemplateid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "path " + d.TypeText + " NOT NULL",
                "content " + d.TypeText + " NOT NULL");
            Index("workspace_template_files", "parent", false, "workspacetemplateid");

            // artifact_stores
            Table("artifact_stores",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(256) NOT NULL",
                "description " + d.TypeText + "",
                "kind VARCHAR(64) NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("artifact_stores", "tenant", false, "tenantid");
            Index("artifact_stores", "name", true, "tenantid", "name");

            // agents
            Table("agents",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(128) NOT NULL",
                "displayname VARCHAR(256)",
                "description " + d.TypeText + "",
                "kind VARCHAR(64) NOT NULL",
                "agentversion VARCHAR(64)",
                "exposea2a " + d.TypeBool + " NOT NULL",
                "exposemcptool " + d.TypeBool + " NOT NULL",
                "mcptoolname VARCHAR(128)",
                "tooldescriptiontemplateid " + d.TypeId + "",
                "skilldescriptiontemplateid " + d.TypeId + "",
                "inputmode VARCHAR(64) NOT NULL",
                "inputschemajson " + d.TypeText + "",
                "outputschemajson " + d.TypeText + "",
                "delegationmode VARCHAR(64) NOT NULL",
                "delegationmaxdepth " + d.TypeInt + " NOT NULL",
                "delegationallowrecursion " + d.TypeBool + " NOT NULL",
                "remoteprotocol VARCHAR(64)",
                "remoteendpointurl " + d.TypeText + "",
                "remotecredentialsecretid " + d.TypeId + "",
                "lastregisteredutc " + d.TypeTimestamp + "",
                "registrationttlseconds " + d.TypeInt + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("agents", "tenant", false, "tenantid");
            Index("agents", "name", true, "tenantid", "name");
            Table("agent_skills",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "agentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "skillid VARCHAR(128) NOT NULL",
                "name VARCHAR(256) NOT NULL",
                "description " + d.TypeText + "");
            Index("agent_skills", "parent", false, "agentid");
            Table("agent_tags",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "agentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "tag VARCHAR(256) NOT NULL");
            Index("agent_tags", "parent", false, "agentid");
            Table("agent_delegation_allowlist",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "agentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "agentname VARCHAR(256) NOT NULL");
            Index("agent_delegation_allowlist", "parent", false, "agentid");

            // deployments
            Table("deployments",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "agentid " + d.TypeId + " NOT NULL",
                "name VARCHAR(128) NOT NULL",
                "description " + d.TypeText + "",
                "harnessprofileid " + d.TypeId + " NOT NULL",
                "model VARCHAR(256)",
                "fallbackmodel VARCHAR(256)",
                "effort VARCHAR(32)",
                "maxturns " + d.TypeInt + "",
                "maxbudgetusd " + d.TypeDouble + "",
                "maxconcurrentruns " + d.TypeInt + " NOT NULL",
                "timeoutseconds " + d.TypeInt + "",
                "maxattempts " + d.TypeInt + " NOT NULL",
                "retryonnodeloss " + d.TypeBool + " NOT NULL",
                "weight " + d.TypeInt + " NOT NULL",
                "nodepoolid " + d.TypeId + "",
                "workspacetemplateid " + d.TypeId + "",
                "artifactstoreid " + d.TypeId + "",
                "configversion " + d.TypeInt + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("deployments", "tenant", false, "tenantid");
            Index("deployments", "name", true, "tenantid", "name");
            Index("deployments", "agent", false, "tenantid", "agentid");
            Table("deployment_prompt_bindings",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "deploymentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "role VARCHAR(64) NOT NULL",
                "templateid " + d.TypeId + " NOT NULL",
                "pinnedversion " + d.TypeInt + "");
            Index("deployment_prompt_bindings", "parent", false, "deploymentid");
            Table("deployment_resource_bindings",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "deploymentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "kind VARCHAR(64) NOT NULL",
                "alias VARCHAR(128) NOT NULL",
                "resourceid " + d.TypeId + " NOT NULL");
            Index("deployment_resource_bindings", "parent", false, "deploymentid");
            Table("deployment_arg_overrides",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "deploymentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "position " + d.TypeInt + " NOT NULL",
                "operation VARCHAR(64) NOT NULL",
                "match " + d.TypeText + "",
                "template " + d.TypeText + "",
                "condition " + d.TypeText + "");
            Index("deployment_arg_overrides", "parent", false, "deploymentid");
            Table("deployment_env_overrides",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "deploymentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(256) NOT NULL",
                "valuetemplate " + d.TypeText + " NOT NULL",
                "issecret " + d.TypeBool + " NOT NULL");
            Index("deployment_env_overrides", "parent", false, "deploymentid");
            Table("deployment_file_overrides",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "deploymentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "basedirectory VARCHAR(64) NOT NULL",
                "pathtemplate " + d.TypeText + " NOT NULL",
                "contenttemplate " + d.TypeText + " NOT NULL",
                "mode VARCHAR(8)",
                "issecret " + d.TypeBool + " NOT NULL");
            Index("deployment_file_overrides", "parent", false, "deploymentid");
            Table("deployment_node_selectors",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "deploymentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "key VARCHAR(256) NOT NULL",
                "value VARCHAR(256) NOT NULL");
            Index("deployment_node_selectors", "parent", false, "deploymentid");
            Table("deployment_parameters",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "deploymentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(128) NOT NULL",
                "value " + d.TypeText + " NOT NULL");
            Index("deployment_parameters", "parent", false, "deploymentid");
            Table("deployment_run_overrides",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "deploymentid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(128) NOT NULL",
                "validation VARCHAR(64) NOT NULL",
                "pattern " + d.TypeText + "");
            Index("deployment_run_overrides", "parent", false, "deploymentid");

            // node_pools
            Table("node_pools",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "name VARCHAR(128) NOT NULL",
                "description " + d.TypeText + "",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("node_pools", "name", true, "name");
            Table("node_pool_tenants",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "nodepoolid " + d.TypeId + " NOT NULL",
                "allowedtenantid VARCHAR(256) NOT NULL");
            Index("node_pool_tenants", "parent", false, "nodepoolid");

            // nodes
            Table("nodes",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "name VARCHAR(256) NOT NULL",
                "nodepoolid " + d.TypeId + "",
                "address VARCHAR(256)",
                "nodeversion VARCHAR(64)",
                "status VARCHAR(64) NOT NULL",
                "maxconcurrentruns " + d.TypeInt + " NOT NULL",
                "activeruns " + d.TypeInt + " NOT NULL",
                "credentialid " + d.TypeId + "",
                "lastheartbeatutc " + d.TypeTimestamp + "",
                "registeredutc " + d.TypeTimestamp + "",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("nodes", "name", true, "name");
            Table("node_labels",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "nodeid " + d.TypeId + " NOT NULL",
                "key VARCHAR(256) NOT NULL",
                "value VARCHAR(256) NOT NULL");
            Index("node_labels", "parent", false, "nodeid");
            Table("node_capabilities",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "nodeid " + d.TypeId + " NOT NULL",
                "harnesstype VARCHAR(64) NOT NULL",
                "executable VARCHAR(1024)",
                "detectedversion VARCHAR(256)",
                "available " + d.TypeBool + " NOT NULL",
                "detail " + d.TypeText + "");
            Index("node_capabilities", "parent", false, "nodeid");

            // runs
            Table("runs",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "agentid " + d.TypeId + " NOT NULL",
                "agentname VARCHAR(128) NOT NULL",
                "deploymentid " + d.TypeId + " NOT NULL",
                "deploymentversion " + d.TypeInt + " NOT NULL",
                "harnesstype VARCHAR(64) NOT NULL",
                "nodepoolid " + d.TypeId + "",
                "kind VARCHAR(64) NOT NULL",
                "status VARCHAR(64) NOT NULL",
                "outcome VARCHAR(64) NOT NULL",
                "priority " + d.TypeInt + " NOT NULL",
                "inputtext " + d.TypeText + "",
                "inputcontenttype VARCHAR(128)",
                "callertype VARCHAR(64) NOT NULL",
                "callerid " + d.TypeId + "",
                "callername VARCHAR(256)",
                "parentrunid " + d.TypeId + "",
                "rootrunid " + d.TypeId + "",
                "depth " + d.TypeInt + " NOT NULL",
                "callchain " + d.TypeText + "",
                "idempotencykey VARCHAR(256)",
                "retryofrunid " + d.TypeId + "",
                "attempt " + d.TypeInt + " NOT NULL",
                "maxattempts " + d.TypeInt + " NOT NULL",
                "leasenodeid " + d.TypeId + "",
                "leasenodename VARCHAR(256)",
                "leaseepoch " + d.TypeBigInt + " NOT NULL",
                "leaseexpiresutc " + d.TypeTimestamp + "",
                "queuedutc " + d.TypeTimestamp + "",
                "leasedutc " + d.TypeTimestamp + "",
                "startedutc " + d.TypeTimestamp + "",
                "completedutc " + d.TypeTimestamp + "",
                "deadlineutc " + d.TypeTimestamp + "",
                "cancelrequested " + d.TypeBool + " NOT NULL",
                "resulttext " + d.TypeText + "",
                "structuredoutputjson " + d.TypeText + "",
                "sessionid VARCHAR(256)",
                "servedmodel VARCHAR(256)",
                "exitcode " + d.TypeInt + "",
                "stderrtail " + d.TypeText + "",
                "errormessage " + d.TypeText + "",
                "inputtokens " + d.TypeBigInt + " NOT NULL",
                "outputtokens " + d.TypeBigInt + " NOT NULL",
                "cachedtokens " + d.TypeBigInt + " NOT NULL",
                "costusd " + d.TypeDouble + "",
                "costestimated " + d.TypeBool + " NOT NULL",
                "lasteventsequence " + d.TypeBigInt + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("runs", "tenant", false, "tenantid");
            Index("runs", "claim", false, "status", "harnesstype", "priority", "createdutc");
            Index("runs", "tenantstatus", false, "tenantid", "status");
            Index("runs", "deployment", false, "deploymentid", "status");
            Index("runs", "parent", false, "parentrunid");
            Index("runs", "lease", false, "leasenodeid", "status");
            Index("runs", "idempotency", false, "tenantid", "idempotencykey");
            Index("runs", "created", false, "tenantid", "createdutc");
            Table("run_parameters",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "runid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "name VARCHAR(128) NOT NULL",
                "value " + d.TypeText + " NOT NULL");
            Index("run_parameters", "parent", false, "runid");
            Table("run_requirements",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "runid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "key VARCHAR(256) NOT NULL",
                "value VARCHAR(256) NOT NULL");
            Index("run_requirements", "parent", false, "runid");
            Table("run_template_versions",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "runid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "templateid " + d.TypeId + " NOT NULL",
                "templatename VARCHAR(256) NOT NULL",
                "version " + d.TypeInt + " NOT NULL");
            Index("run_template_versions", "parent", false, "runid");

            // run_events
            Table("run_events",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "runid " + d.TypeId + " NOT NULL",
                "sequence " + d.TypeBigInt + " NOT NULL",
                "eventtype VARCHAR(64) NOT NULL",
                "timestamputc " + d.TypeTimestamp + " NOT NULL",
                "text " + d.TypeText + "",
                "toolname VARCHAR(256)",
                "toolcallid VARCHAR(256)",
                "success " + d.TypeBool + "",
                "inputtokens " + d.TypeBigInt + "",
                "outputtokens " + d.TypeBigInt + "",
                "raweventjson " + d.TypeText + "",
                "createdutc " + d.TypeTimestamp + " NOT NULL");
            Index("run_events", "tenant", false, "tenantid");
            Index("run_events", "runsequence", true, "runid", "sequence");

            // coordination_leases
            Table("coordination_leases",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "name VARCHAR(128) NOT NULL",
                "holder VARCHAR(256)",
                "epoch " + d.TypeBigInt + " NOT NULL",
                "acquiredutc " + d.TypeTimestamp + "",
                "expiresutc " + d.TypeTimestamp + "",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("coordination_leases", "name", true, "name");

            // cluster_settings
            Table("cluster_settings",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "settingkey VARCHAR(256) NOT NULL",
                "settingvalue " + d.TypeText + "",
                "updatedby VARCHAR(256)",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("cluster_settings", "key", true, "settingkey");

            // manifest_applies
            Table("manifest_applies",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "principalname VARCHAR(256)",
                "dryrun " + d.TypeBool + " NOT NULL",
                "documentcount " + d.TypeInt + " NOT NULL",
                "createdcount " + d.TypeInt + " NOT NULL",
                "updatedcount " + d.TypeInt + " NOT NULL",
                "unchangedcount " + d.TypeInt + " NOT NULL",
                "failedcount " + d.TypeInt + " NOT NULL",
                "active " + d.TypeBool + " NOT NULL",
                "isprotected " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("manifest_applies", "tenant", false, "tenantid");
            Table("manifest_apply_items",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "manifestapplyid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + "",
                "position " + d.TypeInt + " NOT NULL",
                "kind VARCHAR(64) NOT NULL",
                "name VARCHAR(256) NOT NULL",
                "result VARCHAR(64) NOT NULL",
                "resourceid " + d.TypeId + "",
                "message " + d.TypeText + "");
            Index("manifest_apply_items", "parent", false, "manifestapplyid");
        }

        #endregion
    }
}
