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

            SchemaBuilder v19 = new SchemaBuilder(catalog, dialect);
            v19.Column("artifact_stores", "pathprefix", "VARCHAR(512)");
            v19.Column("artifact_stores", "bucket", "VARCHAR(255)");
            v19.Column("artifact_stores", "endpoint", "VARCHAR(2048)");
            v19.Column("artifact_stores", "region", "VARCHAR(128) NOT NULL DEFAULT 'us-east-1'");
            v19.Column("artifact_stores", "secretid", dialect.TypeId);
            v19.Column("artifact_stores", "forcepathstyle", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(true));
            v19.Table("deployment_artifact_globs", "id " + dialect.TypeId + " NOT NULL PRIMARY KEY", "deploymentid " + dialect.TypeId + " NOT NULL", "tenantid " + dialect.TypeId + " NOT NULL", "position INTEGER NOT NULL", "pattern VARCHAR(512) NOT NULL");
            v19.Index("deployment_artifact_globs", "parent", false, "deploymentid", "position");
            v19.Table("artifacts", "id " + dialect.TypeId + " NOT NULL PRIMARY KEY", "tenantid " + dialect.TypeId + " NOT NULL", "runid " + dialect.TypeId + " NOT NULL", "artifactstoreid " + dialect.TypeId + " NOT NULL",
                "name VARCHAR(1024) NOT NULL", "mediatype VARCHAR(255) NOT NULL", "sizebytes " + dialect.TypeBigInt + " NOT NULL", "sha256 VARCHAR(64) NOT NULL", "location VARCHAR(2048) NOT NULL",
                "leaseepoch " + dialect.TypeBigInt + " NOT NULL", "repairattempt INTEGER NOT NULL", "content " + (dialect.DatabaseType == Garrison.Core.Enums.DatabaseTypeEnum.Postgresql ? "BYTEA" : "BLOB"),
                "createdutc " + dialect.TypeTimestamp + " NOT NULL", "lastupdateutc " + dialect.TypeTimestamp + " NOT NULL");
            v19.Index("artifacts", "tenant", false, "tenantid", "createdutc");
            v19.Index("artifacts", "run", false, "tenantid", "runid");
            v19.Index("artifacts", "store", false, "tenantid", "artifactstoreid");
            v19.Index("artifacts", "upload", true, "tenantid", "runid", "leaseepoch", "repairattempt", "name");
            migrations.Add(new SchemaMigration(19, "Artifact stores, deployment collection globs, and run artifact metadata", v19._Statements, v19._Columns));

            SchemaBuilder v20 = new SchemaBuilder(catalog, dialect);
            v20.Column("nodes", "supportsmcptests", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            v20.Table("mcp_tests", "id " + dialect.TypeId + " NOT NULL PRIMARY KEY", "tenantid " + dialect.TypeId + " NOT NULL", "serverid " + dialect.TypeId + " NOT NULL", "nodeid " + dialect.TypeId + " NOT NULL",
                "noderegisteredutc " + dialect.TypeTimestamp + " NOT NULL", "serverupdatedutc " + dialect.TypeTimestamp + " NOT NULL", "expiresutc " + dialect.TypeTimestamp + " NOT NULL",
                "started " + dialect.TypeBool + " NOT NULL", "finished " + dialect.TypeBool + " NOT NULL", "success " + dialect.TypeBool + " NOT NULL", "durationms " + dialect.TypeBigInt + " NOT NULL", "timeoutms INTEGER NOT NULL", "error VARCHAR(2048)");
            v20.Index("mcp_tests", "node", true, "nodeid");
            v20.Index("mcp_tests", "expires", false, "expiresutc");
            v20.Table("mcp_test_tools", "id " + dialect.TypeId + " NOT NULL PRIMARY KEY", "tenantid " + dialect.TypeId + " NOT NULL", "testid " + dialect.TypeId + " NOT NULL", "kind VARCHAR(16) NOT NULL", "name VARCHAR(512) NOT NULL", "position INTEGER NOT NULL");
            v20.Index("mcp_test_tools", "parent", false, "testid", "position");
            migrations.Add(new SchemaMigration(20, "Transient worker stdio MCP diagnostics with structured outcomes", v20._Statements, v20._Columns));

            SchemaBuilder v21 = new SchemaBuilder(catalog, dialect);
            v21.BuildVersion21();
            migrations.Add(new SchemaMigration(21, "Ordered pipelines and stage review gates", v21._Statements, v21._Columns));

            // P12.38: workers report their child reserve and resident waiter cap; run_child_waits records each parent run
            // waiting synchronously on a child, written before the child is created (the delegation wait handshake).
            SchemaBuilder v22 = new SchemaBuilder(catalog, dialect);
            v22.Column("nodes", "childreserveslots", dialect.TypeInt + " NOT NULL DEFAULT 0");
            v22.Column("nodes", "maxresidentwaiters", dialect.TypeInt + " NOT NULL DEFAULT 0");
            v22.Table("run_child_waits", "id " + dialect.TypeId + " NOT NULL PRIMARY KEY", "tenantid " + dialect.TypeId + " NOT NULL", "parentrunid " + dialect.TypeId + " NOT NULL",
                "childrunid " + dialect.TypeId + " NOT NULL", "createdutc " + dialect.TypeTimestamp + " NOT NULL");
            v22.Index("run_child_waits", "parent", false, "parentrunid");
            v22.Index("run_child_waits", "child", false, "childrunid");
            migrations.Add(new SchemaMigration(22, "Delegation child waits and worker child reserve", v22._Statements, v22._Columns));

            // P11.14: deployment trust level (existing deployments and runs stay Trusted), the admitted level on runs, and
            // the tenant policy that requires Untrusted deployments.
            SchemaBuilder v23 = new SchemaBuilder(catalog, dialect);
            v23.Column("deployments", "trustlevel", "VARCHAR(32) NOT NULL DEFAULT 'Trusted'");
            v23.Column("runs", "trustlevel", "VARCHAR(32) NOT NULL DEFAULT 'Trusted'");
            v23.Column("tenants", "requireuntrusted", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            migrations.Add(new SchemaMigration(23, "Deployment trust level and tenant Untrusted policy", v23._Statements, v23._Columns));

            // P12.29: the effect policy replaces retryOnNodeLoss. Existing deployments keep their behaviour (true becomes
            // AtLeastOnce, false AtMostOnce), and existing runs take their deployment's mapped policy so in-flight runs are
            // handled exactly as before. The retryonnodeloss column stays and is written as a derived value.
            SchemaBuilder v24 = new SchemaBuilder(catalog, dialect);
            v24.Column("deployments", "effectpolicy", "VARCHAR(32) NOT NULL DEFAULT 'AtMostOnce'");
            v24.Column("runs", "effectpolicy", "VARCHAR(32) NOT NULL DEFAULT 'AtMostOnce'");
            v24._Statements.Add("UPDATE " + catalog.Reference("deployments") + " SET effectpolicy = 'AtLeastOnce' WHERE retryonnodeloss = " + dialect.BooleanLiteral(true) + ";");
            v24._Statements.Add("UPDATE " + catalog.Reference("runs") + " SET effectpolicy = 'AtLeastOnce' WHERE deploymentid IN (SELECT id FROM " + catalog.Reference("deployments") + " WHERE retryonnodeloss = " + dialect.BooleanLiteral(true) + ");");
            migrations.Add(new SchemaMigration(24, "Deployment effect policy replaces retryOnNodeLoss", v24._Statements, v24._Columns));

            // G-29: workers report whether they run in a container, so harness profiles can treat the container as the
            // sandbox. Existing nodes read false until they register again.
            SchemaBuilder v25 = new SchemaBuilder(catalog, dialect);
            v25.Column("nodes", "containerized", dialect.TypeBool + " NOT NULL DEFAULT " + dialect.BooleanLiteral(false));
            migrations.Add(new SchemaMigration(25, "Worker containerized flag", v25._Statements, v25._Columns));

            // I-08: manifest apply items report values that were accepted but not stored as written (clamped numbers).
            SchemaBuilder v26 = new SchemaBuilder(catalog, dialect);
            v26.Table("manifest_apply_warnings",
                "id " + dialect.TypeId + " NOT NULL PRIMARY KEY",
                "manifestapplyid " + dialect.TypeId + " NOT NULL",
                "manifestapplyitemid " + dialect.TypeId + " NOT NULL",
                "tenantid " + dialect.TypeId,
                "position " + dialect.TypeInt + " NOT NULL",
                "field VARCHAR(512) NOT NULL",
                "code VARCHAR(64) NOT NULL",
                "givenvalue VARCHAR(256)",
                "storedvalue VARCHAR(256)",
                "message VARCHAR(1024)");
            v26.Index("manifest_apply_warnings", "parent", false, "manifestapplyid");
            migrations.Add(new SchemaMigration(26, "Manifest apply item warnings", v26._Statements, v26._Columns));

            // P11.15: per-deployment egress allowlists. Existing deployments have no rows, so their runs keep the
            // default run egress and their placement is unchanged.
            SchemaBuilder v27 = new SchemaBuilder(catalog, dialect);
            v27.Table("deployment_egress_rules",
                "id " + dialect.TypeId + " NOT NULL PRIMARY KEY",
                "deploymentid " + dialect.TypeId + " NOT NULL",
                "tenantid " + dialect.TypeId + " NOT NULL",
                "position " + dialect.TypeInt + " NOT NULL",
                "cidr VARCHAR(64) NOT NULL",
                "port " + dialect.TypeInt,
                "protocol VARCHAR(8) NOT NULL");
            v27.Index("deployment_egress_rules", "parent", false, "deploymentid", "position");
            migrations.Add(new SchemaMigration(27, "Deployment egress allowlists", v27._Statements, v27._Columns));

            // P12.5 and P12.14: triggers with fire history, notification endpoints with subscribed events, the
            // notification outbox and delivery log, and the leader's event sweep cursors. Runs and pipeline runs record
            // the trigger that started them.
            SchemaBuilder v28 = new SchemaBuilder(catalog, dialect);
            v28.BuildVersion28();
            migrations.Add(new SchemaMigration(28, "Cron and webhook triggers, notification endpoints, and the notification outbox", v28._Statements, v28._Columns));

            SchemaBuilder v29 = new SchemaBuilder(catalog, dialect);
            v29.Table("effect_operations",
                "id " + dialect.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + dialect.TypeId + " NOT NULL",
                "runid " + dialect.TypeId + " NOT NULL",
                "leaseepoch " + "BIGINT" + " NOT NULL",
                "tool VARCHAR(512) NOT NULL",
                "argumentdigest VARCHAR(64) NOT NULL",
                "state VARCHAR(32) NOT NULL",
                "resultreference VARCHAR(1024)",
                "createdutc " + dialect.TypeTimestamp + " NOT NULL");
            v29.Index("effect_operations", "run", false, "tenantid", "runid", "leaseepoch");
            v29.Table("effect_checkpoints",
                "tenantid " + dialect.TypeId + " NOT NULL",
                "runid " + dialect.TypeId + " NOT NULL PRIMARY KEY",
                "leaseepoch " + "BIGINT" + " NOT NULL",
                "gatewayonly " + dialect.TypeBool + " NOT NULL",
                "createdutc " + dialect.TypeTimestamp + " NOT NULL");
            migrations.Add(new SchemaMigration(29, "Epoch fenced effect journal and recovery checkpoints", v29._Statements, v29._Columns));

            SchemaBuilder v31 = new SchemaBuilder(catalog, dialect);
            v31.Column("tenants", "schedulingweight", "INTEGER NOT NULL DEFAULT 1");
            migrations.Add(new SchemaMigration(31, "Tenant weighted scheduling", v31._Statements, v31._Columns));

            SchemaBuilder v30 = new SchemaBuilder(catalog, dialect);
            v30.BuildVersion30();
            migrations.Add(new SchemaMigration(30, "Durable continuation checkpoints and session contracts", v30._Statements, v30._Columns));

            SchemaBuilder v32 = new SchemaBuilder(catalog, dialect);
            v32.Column("secrets", "brokerresource", "VARCHAR(512)");
            v32.Column("secrets", "brokeraudience", "VARCHAR(512)");
            v32.Table("credential_leases",
                "id " + dialect.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + dialect.TypeId + " NOT NULL",
                "runid " + dialect.TypeId + " NOT NULL",
                "secretid " + dialect.TypeId + " NOT NULL",
                "leaseepoch BIGINT NOT NULL",
                "resource VARCHAR(512) NOT NULL",
                "audience VARCHAR(512)",
                "state VARCHAR(32) NOT NULL",
                "expiresutc " + dialect.TypeTimestamp + " NOT NULL",
                "createdutc " + dialect.TypeTimestamp + " NOT NULL",
                "revokedutc " + dialect.TypeTimestamp,
                "revokeattempts " + dialect.TypeInt + " NOT NULL DEFAULT 0");
            v32.Index("credential_leases", "attempt", true, "runid", "leaseepoch", "secretid");
            v32.Index("credential_leases", "pending", false, "state", "expiresutc");
            migrations.Add(new SchemaMigration(32, "Revocable provider credential leases", v32._Statements, v32._Columns));

            SchemaBuilder v33 = new SchemaBuilder(catalog, dialect);
            v33.Column("approvals", "inputdigest", "VARCHAR(64)");
            v33.Column("approvals", "resumeepoch", "BIGINT");
            migrations.Add(new SchemaMigration(33, "One-time exact-input durable approval grants", v33._Statements, v33._Columns));

            SchemaBuilder v34 = new SchemaBuilder(catalog, dialect);
            v34.Table("run_database_usage",
                "tenantid " + dialect.TypeId + " NOT NULL",
                "runid " + dialect.TypeId + " NOT NULL",
                "operation VARCHAR(64) NOT NULL",
                "statements BIGINT NOT NULL DEFAULT 0",
                "reads BIGINT NOT NULL DEFAULT 0",
                "writes BIGINT NOT NULL DEFAULT 0",
                "errors BIGINT NOT NULL DEFAULT 0",
                "transactions BIGINT NOT NULL DEFAULT 0",
                "durationmicroseconds BIGINT NOT NULL DEFAULT 0",
                "PRIMARY KEY (tenantid,runid,operation)");
            migrations.Add(new SchemaMigration(34, "Exact scoped per-run database attribution", v34._Statements, v34._Columns));

            // AD1: agent revisions with their child lists, tenant environment lists, promotion records, deployment
            // revision pins and environment labels, and the revision a run compiled from. Revision 1 of every existing
            // agent is written by the driver after migration, because its content hash is computed in code.
            SchemaBuilder v35 = new SchemaBuilder(catalog, dialect);
            v35.BuildVersion35();
            migrations.Add(new SchemaMigration(35, "Agent revisions, environments, and promotions", v35._Statements, v35._Columns));

            // AD2: agent assets with versions and per-file rows, database-held asset content, revision asset pins, and
            // harness asset placements.
            SchemaBuilder v36 = new SchemaBuilder(catalog, dialect);
            v36.BuildVersion36();
            migrations.Add(new SchemaMigration(36, "Agent assets, asset versions, revision asset pins, and harness asset placements", v36._Statements, v36._Columns));

            // AD3: conversation file spaces with files, versions, and database-held content; the deployment mount path;
            // the file space each run uses.
            SchemaBuilder v37 = new SchemaBuilder(catalog, dialect);
            v37.BuildVersion37();
            migrations.Add(new SchemaMigration(37, "Conversation file spaces", v37._Statements, v37._Columns));

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

        private void PartialIndex(string rawTable, string suffix, bool unique, string where, params string[] columns)
        {
            List<string> quoted = new List<string>();
            foreach (string column in columns) quoted.Add(_Dialect.Quote(column));
            string name = "idx_" + _Catalog.RawName(rawTable) + "_" + suffix;
            _Statements.Add(_Dialect.CreateIndex(name, _Catalog.Schema, _Catalog.RawName(rawTable), String.Join(", ", quoted), unique, where));
        }

        private void Column(string rawTable, string column, string definition)
        {
            _Columns.Add(new SchemaColumnAddition(rawTable, column, definition));
        }

        private void BuildVersion37()
        {
            SqlDialect d = _Dialect;
            string blob = d.DatabaseType == Garrison.Core.Enums.DatabaseTypeEnum.Postgresql ? "BYTEA" : "BLOB";
            Table("conversation_file_spaces",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "ownerkey VARCHAR(128) NOT NULL",
                "conversationid " + d.TypeId,
                "pipelinerunid " + d.TypeId,
                "rootrunid " + d.TypeId,
                "artifactstoreid " + d.TypeId,
                "filecount " + d.TypeInt + " NOT NULL",
                "totalbytes " + d.TypeBigInt + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("conversation_file_spaces", "owner", true, "tenantid", "ownerkey");
            Table("conversation_files",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "filespaceid " + d.TypeId + " NOT NULL",
                "path VARCHAR(512) NOT NULL",
                "currentversion " + d.TypeInt + " NOT NULL",
                "sizebytes " + d.TypeBigInt + " NOT NULL",
                "sha256 VARCHAR(64) NOT NULL",
                "mediatype VARCHAR(256) NOT NULL",
                "deleted " + d.TypeBool + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("conversation_files", "path", true, "filespaceid", "path");
            Table("conversation_file_versions",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "fileid " + d.TypeId + " NOT NULL",
                "number " + d.TypeInt + " NOT NULL",
                "sizebytes " + d.TypeBigInt + " NOT NULL",
                "sha256 VARCHAR(64) NOT NULL",
                "mediatype VARCHAR(256) NOT NULL",
                "runid " + d.TypeId,
                "leaseepoch " + d.TypeBigInt,
                "writtenby VARCHAR(256)",
                "storagekey VARCHAR(1024) NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL");
            Index("conversation_file_versions", "number", true, "fileid", "number");
            Table("file_space_blobs",
                "storagekey VARCHAR(1024) NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "sizebytes " + d.TypeBigInt + " NOT NULL",
                "content " + blob + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL");
            Column("deployments", "filespacemountpath", "VARCHAR(128) NOT NULL DEFAULT 'files'");
            Column("runs", "filespaceid", d.TypeId);
        }

        private void BuildVersion36()
        {
            SqlDialect d = _Dialect;
            string blob = d.DatabaseType == Garrison.Core.Enums.DatabaseTypeEnum.Postgresql ? "BYTEA" : "BLOB";
            Table("agent_assets",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(128) NOT NULL",
                "kind VARCHAR(32) NOT NULL",
                "description " + d.TypeText,
                "prompttemplateid " + d.TypeId,
                "artifactstoreid " + d.TypeId,
                "currentversion " + d.TypeInt + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("agent_assets", "name", true, "tenantid", "name");
            Table("agent_asset_tags",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "assetid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "tag VARCHAR(128) NOT NULL");
            Index("agent_asset_tags", "parent", false, "assetid", "position");
            Table("agent_asset_versions",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "assetid " + d.TypeId + " NOT NULL",
                "number " + d.TypeInt + " NOT NULL",
                "totalbytes " + d.TypeBigInt + " NOT NULL",
                "authorname VARCHAR(256)",
                "changenote VARCHAR(2000)",
                "createdutc " + d.TypeTimestamp + " NOT NULL");
            Index("agent_asset_versions", "number", true, "assetid", "number");
            Table("agent_asset_version_files",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "versionid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "path VARCHAR(512) NOT NULL",
                "mediatype VARCHAR(256) NOT NULL",
                "sizebytes " + d.TypeBigInt + " NOT NULL",
                "sha256 VARCHAR(64) NOT NULL",
                "storagekey VARCHAR(1024) NOT NULL");
            Index("agent_asset_version_files", "parent", true, "versionid", "path");
            Table("agent_asset_blobs",
                "storagekey VARCHAR(1024) NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "sizebytes " + d.TypeBigInt + " NOT NULL",
                "content " + blob + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL");
            Table("agent_revision_asset_pins",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "revisionid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "assetid " + d.TypeId + " NOT NULL",
                "version " + d.TypeInt);
            Index("agent_revision_asset_pins", "parent", false, "revisionid", "position");
            Index("agent_revision_asset_pins", "asset", false, "tenantid", "assetid");
            Table("harness_profile_asset_placements",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "harnessprofileid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId,
                "position " + d.TypeInt + " NOT NULL",
                "kind VARCHAR(32) NOT NULL",
                "pathtemplate VARCHAR(512) NOT NULL",
                "listinsystemprompt " + d.TypeBool + " NOT NULL");
            Index("harness_profile_asset_placements", "parent", false, "harnessprofileid", "position");
        }

        private void BuildVersion35()
        {
            SqlDialect d = _Dialect;
            Table("agent_revisions",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "agentid " + d.TypeId + " NOT NULL",
                "number " + d.TypeInt + " NOT NULL",
                "state VARCHAR(16) NOT NULL",
                "contenthash VARCHAR(64) NOT NULL",
                "displayname VARCHAR(256)",
                "description " + d.TypeText,
                "inputmode VARCHAR(64) NOT NULL",
                "inputschemajson " + d.TypeText,
                "outputschemajson " + d.TypeText,
                "delegationmode VARCHAR(64) NOT NULL",
                "delegationmaxdepth " + d.TypeInt + " NOT NULL",
                "delegationallowrecursion " + d.TypeBool + " NOT NULL",
                "authoruserid " + d.TypeId,
                "authorname VARCHAR(256)",
                "changenote VARCHAR(2000)",
                "publishedbyuserid " + d.TypeId,
                "publishedbyname VARCHAR(256)",
                "publishedutc " + d.TypeTimestamp,
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("agent_revisions", "number", true, "agentid", "number");
            Index("agent_revisions", "tenant", false, "tenantid", "agentid");
            Table("agent_revision_prompt_pins",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "revisionid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "role VARCHAR(64) NOT NULL",
                "templateid " + d.TypeId + " NOT NULL",
                "pinnedversion " + d.TypeInt);
            Index("agent_revision_prompt_pins", "parent", false, "revisionid", "position");
            Table("agent_revision_allowlist",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "revisionid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "agentname VARCHAR(128) NOT NULL");
            Index("agent_revision_allowlist", "parent", false, "revisionid", "position");
            Table("agent_revision_capabilities",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "revisionid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "capability VARCHAR(256) NOT NULL");
            Index("agent_revision_capabilities", "parent", false, "revisionid", "position");
            Table("agent_revision_tags",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "revisionid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "tag VARCHAR(128) NOT NULL");
            Index("agent_revision_tags", "parent", false, "revisionid", "position");
            Column("agents", "latestpublishedrevisionid", d.TypeId);
            Column("agents", "draftrevisionid", d.TypeId);
            Column("deployments", "agentrevisionid", d.TypeId);
            Column("deployments", "environment", "VARCHAR(32) NOT NULL DEFAULT 'dev'");
            Column("runs", "agentrevisionid", d.TypeId);
            Index("deployments", "environment", false, "tenantid", "environment");
            Table("tenant_environments",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(32) NOT NULL",
                "description VARCHAR(1000)",
                "position " + d.TypeInt + " NOT NULL");
            Index("tenant_environments", "name", true, "tenantid", "name");
            Table("promotion_records",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "kind VARCHAR(16) NOT NULL",
                "outcome VARCHAR(16) NOT NULL",
                "agentid " + d.TypeId,
                "appid " + d.TypeId,
                "apprevisionid " + d.TypeId,
                "agentrevisionid " + d.TypeId,
                "sourceenvironment VARCHAR(32) NOT NULL",
                "targetenvironment VARCHAR(32) NOT NULL",
                "skippedenvironments " + d.TypeBool + " NOT NULL",
                "rollbackofid " + d.TypeId,
                "rolledbackbyid " + d.TypeId,
                "actortype VARCHAR(32) NOT NULL",
                "actorid VARCHAR(128)",
                "actorname VARCHAR(256)",
                "note VARCHAR(2000)",
                "createdutc " + d.TypeTimestamp + " NOT NULL");
            Index("promotion_records", "tenant", false, "tenantid", "createdutc");
            Table("promotion_record_items",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "promotionid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "deploymentid " + d.TypeId + " NOT NULL",
                "deploymentname VARCHAR(128) NOT NULL",
                "agentid " + d.TypeId + " NOT NULL",
                "previousrevisionid " + d.TypeId,
                "newrevisionid " + d.TypeId);
            Index("promotion_record_items", "parent", false, "promotionid", "position");
        }

        private void BuildVersion30()
        {
            SqlDialect d = _Dialect;
            Column("deployments", "suspensionenabled", d.TypeBool + " NOT NULL DEFAULT " + d.BooleanLiteral(false));
            Column("harness_profiles", "sessionformat", "VARCHAR(128)");
            Table("run_checkpoints", "runid " + d.TypeId + " NOT NULL PRIMARY KEY", "tenantid " + d.TypeId + " NOT NULL",
                "artifactid " + d.TypeId + " NOT NULL", "sessionid VARCHAR(256) NOT NULL", "sessionformat VARCHAR(128) NOT NULL",
                "epoch BIGINT NOT NULL", "createdutc " + d.TypeTimestamp + " NOT NULL");
        }

        private void BuildVersion28()
        {
            SqlDialect d = _Dialect;
            string boolean = d.TypeBool + " NOT NULL";

            Column("runs", "triggerid", d.TypeId);
            Column("pipeline_runs", "triggerid", d.TypeId);
            PartialIndex("runs", "trigger", false, "triggerid IS NOT NULL", "tenantid", "triggerid", "createdutc");

            Table("triggers",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(128) NOT NULL",
                "description " + d.TypeText,
                "triggertype VARCHAR(32) NOT NULL",
                "targettype VARCHAR(32) NOT NULL",
                "agentid " + d.TypeId,
                "deploymentid " + d.TypeId,
                "pipelineid " + d.TypeId,
                "inputtemplateid VARCHAR(256)",
                "priority " + d.TypeInt + " NOT NULL",
                "cronexpression VARCHAR(256)",
                "timezone VARCHAR(128) NOT NULL",
                "active " + boolean,
                "secretencrypted " + d.TypeText,
                "secretkeyversion " + d.TypeInt + " NOT NULL",
                "secretlast4 VARCHAR(8)",
                "secretrotatedutc " + d.TypeTimestamp,
                "runastype VARCHAR(32) NOT NULL",
                "runasid " + d.TypeId,
                "runasname VARCHAR(256)",
                "lastfireutc " + d.TypeTimestamp,
                "lastfireoutcome VARCHAR(32)",
                "nextfireutc " + d.TypeTimestamp,
                "firecount " + d.TypeBigInt + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("triggers", "tenantname", true, "tenantid", "name");
            Index("triggers", "due", false, "triggertype", "active", "nextfireutc");
            Index("triggers", "tenantcreated", false, "tenantid", "createdutc");

            Table("trigger_fires",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "triggerid " + d.TypeId + " NOT NULL",
                "triggername VARCHAR(128) NOT NULL",
                "source VARCHAR(32) NOT NULL",
                "firekey VARCHAR(256) NOT NULL",
                "deliveryid VARCHAR(128)",
                "scheduledutc " + d.TypeTimestamp + " NOT NULL",
                "firedutc " + d.TypeTimestamp + " NOT NULL",
                "outcome VARCHAR(32) NOT NULL",
                "runid " + d.TypeId,
                "pipelinerunid " + d.TypeId,
                "errorcode VARCHAR(64)",
                "errormessage " + d.TypeText,
                "createdutc " + d.TypeTimestamp + " NOT NULL");
            Index("trigger_fires", "key", true, "triggerid", "firekey");
            Index("trigger_fires", "trigger", false, "tenantid", "triggerid", "createdutc");
            Index("trigger_fires", "created", false, "createdutc");

            Table("notification_endpoints",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(128) NOT NULL",
                "description " + d.TypeText,
                "url VARCHAR(2048) NOT NULL",
                "agentid " + d.TypeId,
                "deploymentid " + d.TypeId,
                "includeresulttext " + boolean,
                "resulttextmaxchars " + d.TypeInt + " NOT NULL",
                "active " + boolean,
                "secretencrypted " + d.TypeText,
                "secretkeyversion " + d.TypeInt + " NOT NULL",
                "secretlast4 VARCHAR(8)",
                "secretrotatedutc " + d.TypeTimestamp,
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("notification_endpoints", "tenantname", true, "tenantid", "name");
            Index("notification_endpoints", "active", false, "active");
            Table("notification_endpoint_events",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "endpointid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "eventname VARCHAR(64) NOT NULL");
            Index("notification_endpoint_events", "parent", false, "endpointid", "position");

            Table("notification_deliveries",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "endpointid " + d.TypeId + " NOT NULL",
                "eventname VARCHAR(64) NOT NULL",
                "eventkey VARCHAR(256) NOT NULL",
                "subjecttype VARCHAR(32) NOT NULL",
                "subjectid " + d.TypeId,
                "status VARCHAR(32) NOT NULL",
                "attempts " + d.TypeInt + " NOT NULL",
                "maxattempts " + d.TypeInt + " NOT NULL",
                "nextattemptutc " + d.TypeTimestamp,
                "claimedby VARCHAR(128)",
                "claimuntilutc " + d.TypeTimestamp,
                "laststatuscode " + d.TypeInt,
                "lasterror " + d.TypeText,
                "lastattemptutc " + d.TypeTimestamp,
                "lastdurationms " + d.TypeBigInt + " NOT NULL",
                "deliveredutc " + d.TypeTimestamp,
                "payload " + d.TypeText + " NOT NULL",
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("notification_deliveries", "eventkey", true, "endpointid", "eventkey");
            Index("notification_deliveries", "due", false, "status", "nextattemptutc");
            Index("notification_deliveries", "endpoint", false, "tenantid", "endpointid", "createdutc");
            Index("notification_deliveries", "created", false, "createdutc");

            Table("notification_cursors",
                "source VARCHAR(64) NOT NULL PRIMARY KEY",
                "cursorutc " + d.TypeTimestamp + " NOT NULL",
                "cursorid VARCHAR(64)",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
        }

        private void BuildVersion21()
        {
            SqlDialect d = _Dialect;
            string boolean = d.TypeBool + " NOT NULL";

            // runs: the pipeline run, stage position, and stage execution a run belongs to (P12.9); null and 0 otherwise.
            Column("runs", "pipelinerunid", d.TypeId);
            Column("runs", "pipelineposition", d.TypeInt + " NOT NULL DEFAULT 0");
            Column("runs", "pipelineexecution", d.TypeInt + " NOT NULL DEFAULT 0");
            // One run per stage execution, with no time window (the run idempotency key only looks back 24 hours). Partial:
            // runs outside pipelines (pipelinerunid null, position and execution 0) are not indexed. It also serves
            // lookups by pipelinerunid.
            PartialIndex("runs", "pipelineexecution", true, "pipelinerunid IS NOT NULL", "pipelinerunid", "pipelineposition", "pipelineexecution");

            // pipelines: ordered agent stages with optional review gates; stages and their run parameters are child tables.
            Table("pipelines",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "name VARCHAR(128) NOT NULL",
                "description " + d.TypeText,
                "version " + d.TypeInt + " NOT NULL",
                "maxdurationseconds " + d.TypeInt + " NOT NULL",
                "active " + boolean,
                "isprotected " + boolean,
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("pipelines", "tenantname", true, "tenantid", "name");
            Index("pipelines", "tenantcreated", false, "tenantid", "createdutc");
            Table("pipeline_stages",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "pipelineid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "name VARCHAR(128) NOT NULL",
                "description " + d.TypeText,
                "agentid " + d.TypeId + " NOT NULL",
                "deploymentid " + d.TypeId,
                "handofftemplateid " + d.TypeId,
                "handofftemplateversion " + d.TypeInt,
                "outputcharlimit " + d.TypeInt + " NOT NULL",
                "maxattempts " + d.TypeInt + " NOT NULL",
                "continueonfailure " + boolean,
                "requiresreview " + boolean,
                "reviewtimeoutseconds " + d.TypeInt + " NOT NULL",
                "reviewtimeoutaction VARCHAR(32) NOT NULL",
                "maxrevisions " + d.TypeInt + " NOT NULL");
            Index("pipeline_stages", "parent", false, "pipelineid", "position");
            Index("pipeline_stages", "agent", false, "tenantid", "agentid");
            Index("pipeline_stages", "deployment", false, "tenantid", "deploymentid");
            Table("pipeline_stage_parameters",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "stageid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "name VARCHAR(256) NOT NULL",
                "value " + d.TypeText + " NOT NULL");
            Index("pipeline_stage_parameters", "parent", false, "stageid", "position");

            // pipeline_runs: one execution of a pipeline, advanced with compare-and-set on casversion.
            Table("pipeline_runs",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "pipelineid " + d.TypeId + " NOT NULL",
                "pipelinename VARCHAR(128) NOT NULL",
                "pipelineversion " + d.TypeInt + " NOT NULL",
                "status VARCHAR(32) NOT NULL",
                "outcome VARCHAR(32) NOT NULL",
                "currentposition " + d.TypeInt + " NOT NULL",
                "stagecount " + d.TypeInt + " NOT NULL",
                "casversion " + d.TypeInt + " NOT NULL",
                "inputtext " + d.TypeText + " NOT NULL",
                "inputcontenttype VARCHAR(256) NOT NULL",
                "callertype VARCHAR(64) NOT NULL",
                "callerid " + d.TypeId,
                "callername VARCHAR(256)",
                "idempotencykey VARCHAR(256)",
                "priority " + d.TypeInt + " NOT NULL",
                "finalrunid " + d.TypeId,
                "errormessage " + d.TypeText,
                "deadlineutc " + d.TypeTimestamp,
                "cancelrequested " + boolean,
                "traceparent VARCHAR(128)",
                "startedutc " + d.TypeTimestamp,
                "completedutc " + d.TypeTimestamp,
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("pipeline_runs", "tenantstatus", false, "tenantid", "status", "createdutc");
            Index("pipeline_runs", "deadline", false, "status", "deadlineutc");
            Index("pipeline_runs", "idempotency", true, "tenantid", "callerid", "idempotencykey");
            Index("pipeline_runs", "pipeline", false, "tenantid", "pipelineid");
            Table("pipeline_run_stages",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "pipelinerunid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "name VARCHAR(128) NOT NULL",
                "description " + d.TypeText,
                "agentid " + d.TypeId + " NOT NULL",
                "agentname VARCHAR(256) NOT NULL",
                "deploymentid " + d.TypeId,
                "handofftemplateid " + d.TypeId,
                "handofftemplateversion " + d.TypeInt,
                "outputcharlimit " + d.TypeInt + " NOT NULL",
                "maxattempts " + d.TypeInt + " NOT NULL",
                "continueonfailure " + boolean,
                "requiresreview " + boolean,
                "reviewtimeoutseconds " + d.TypeInt + " NOT NULL",
                "reviewtimeoutaction VARCHAR(32) NOT NULL",
                "maxrevisions " + d.TypeInt + " NOT NULL",
                "status VARCHAR(32) NOT NULL",
                "executions " + d.TypeInt + " NOT NULL",
                "attempts " + d.TypeInt + " NOT NULL",
                "revisions " + d.TypeInt + " NOT NULL",
                "currentrunid " + d.TypeId,
                "lastrunid " + d.TypeId,
                "blockedreason " + d.TypeText,
                "nextattemptutc " + d.TypeTimestamp,
                "startedutc " + d.TypeTimestamp,
                "completedutc " + d.TypeTimestamp);
            Index("pipeline_run_stages", "position", true, "pipelinerunid", "position");
            Table("pipeline_run_stage_parameters",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "runstageid " + d.TypeId + " NOT NULL",
                "tenantid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "name VARCHAR(256) NOT NULL",
                "value " + d.TypeText + " NOT NULL");
            Index("pipeline_run_stage_parameters", "parent", false, "runstageid", "position");

            // pipeline_reviews: human review gates, decided with a compare-and-set from Pending.
            Table("pipeline_reviews",
                "id " + d.TypeId + " NOT NULL PRIMARY KEY",
                "tenantid " + d.TypeId + " NOT NULL",
                "pipelinerunid " + d.TypeId + " NOT NULL",
                "pipelineid " + d.TypeId + " NOT NULL",
                "pipelinename VARCHAR(128) NOT NULL",
                "runstageid " + d.TypeId + " NOT NULL",
                "position " + d.TypeInt + " NOT NULL",
                "stagename VARCHAR(128) NOT NULL",
                "runid " + d.TypeId + " NOT NULL",
                "execution " + d.TypeInt + " NOT NULL",
                "status VARCHAR(32) NOT NULL",
                "decision VARCHAR(32)",
                "decisionsource VARCHAR(32)",
                "comment " + d.TypeText,
                "decidedby VARCHAR(256)",
                "decidedbyid " + d.TypeId,
                "timeoutaction VARCHAR(32) NOT NULL",
                "requestedutc " + d.TypeTimestamp + " NOT NULL",
                "expiresutc " + d.TypeTimestamp,
                "decidedutc " + d.TypeTimestamp,
                "createdutc " + d.TypeTimestamp + " NOT NULL",
                "lastupdateutc " + d.TypeTimestamp + " NOT NULL");
            Index("pipeline_reviews", "execution", true, "runstageid", "execution");
            Index("pipeline_reviews", "tenantstatus", false, "tenantid", "status", "createdutc");
            Index("pipeline_reviews", "expires", false, "status", "expiresutc");
            Index("pipeline_reviews", "pipelinerun", false, "pipelinerunid");
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
