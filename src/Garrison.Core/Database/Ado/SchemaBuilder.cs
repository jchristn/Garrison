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

            return migrations;
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
