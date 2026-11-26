-- Garrison reference schema for Sqlite. Generated from Garrison.Core SchemaBuilder (migrations 1 to 54).
-- Apply it, then set Database.ManageSchema=false, if Garrison must not create tables itself.
CREATE TABLE IF NOT EXISTS "schema_migrations" (
    version INTEGER NOT NULL PRIMARY KEY,
    description VARCHAR(1024) NOT NULL,
    appliedutc TEXT NOT NULL
);

-- Migration 1: Initial schema
CREATE TABLE IF NOT EXISTS "tenants" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenants_name" ON "tenants" ("name");
CREATE TABLE IF NOT EXISTS "users" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    firstname VARCHAR(128),
    lastname VARCHAR(128),
    email VARCHAR(256) NOT NULL,
    passwordsha256 VARCHAR(128) NOT NULL,
    isadmin INTEGER NOT NULL,
    istenantadmin INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_users_tenant" ON "users" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("tenantid", "email");
CREATE TABLE IF NOT EXISTS "credentials" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    userid VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    accesskey VARCHAR(128) NOT NULL,
    secretkeyencrypted TEXT NOT NULL,
    secretkeylast4 VARCHAR(8),
    authmode VARCHAR(64) NOT NULL,
    lastusedutc TEXT,
    expiresutc TEXT,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_credentials_tenant" ON "credentials" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_credentials_accesskey" ON "credentials" ("accesskey");
CREATE INDEX IF NOT EXISTS "idx_credentials_user" ON "credentials" ("tenantid", "userid");
CREATE TABLE IF NOT EXISTS "authsessions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64),
    userid VARCHAR(64),
    credentialid VARCHAR(64),
    runid VARCHAR(64),
    originprincipaltype VARCHAR(64),
    originprincipalid VARCHAR(64),
    principaltype VARCHAR(64) NOT NULL,
    authscheme VARCHAR(64) NOT NULL,
    tokenid VARCHAR(64) NOT NULL,
    sourceip VARCHAR(64),
    useragent VARCHAR(512),
    expiresutc TEXT NOT NULL,
    lastusedutc TEXT,
    revokedutc TEXT,
    revocationreason VARCHAR(512),
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_authsessions_tenant" ON "authsessions" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_authsessions_tokenid" ON "authsessions" ("tokenid");
CREATE INDEX IF NOT EXISTS "idx_authsessions_run" ON "authsessions" ("runid");
CREATE TABLE IF NOT EXISTS "userroles" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    description TEXT,
    isbuiltin INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_userroles_tenant" ON "userroles" ("tenantid");
CREATE INDEX IF NOT EXISTS "idx_userroles_name" ON "userroles" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "permissions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    permissiontype VARCHAR(64) NOT NULL,
    isbuiltin INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_permissions_tenant" ON "permissions" ("tenantid");
CREATE INDEX IF NOT EXISTS "idx_permissions_name" ON "permissions" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "permission_resource_types" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    permissionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    resourcetype VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_permission_resource_types_parent" ON "permission_resource_types" ("permissionid");
CREATE TABLE IF NOT EXISTS "permission_operation_types" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    permissionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    operationtype VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_permission_operation_types_parent" ON "permission_operation_types" ("permissionid");
CREATE TABLE IF NOT EXISTS "rolepermissionmaps" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64),
    roleid VARCHAR(64) NOT NULL,
    permissionid VARCHAR(64) NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_rolepermissionmaps_tenant" ON "rolepermissionmaps" ("tenantid");
CREATE INDEX IF NOT EXISTS "idx_rolepermissionmaps_role" ON "rolepermissionmaps" ("roleid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_rolepermissionmaps_rolepermission" ON "rolepermissionmaps" ("roleid", "permissionid");
CREATE TABLE IF NOT EXISTS "userroleassignments" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    userid VARCHAR(64) NOT NULL,
    roleid VARCHAR(64),
    rolename VARCHAR(128),
    resourcescope VARCHAR(64) NOT NULL,
    resourceid VARCHAR(64),
    inheritstochildren INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_userroleassignments_tenant" ON "userroleassignments" ("tenantid");
CREATE INDEX IF NOT EXISTS "idx_userroleassignments_user" ON "userroleassignments" ("tenantid", "userid");
CREATE TABLE IF NOT EXISTS "credentialscopeassignments" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    credentialid VARCHAR(64) NOT NULL,
    roleid VARCHAR(64),
    rolename VARCHAR(128),
    resourcescope VARCHAR(64) NOT NULL,
    resourceid VARCHAR(64),
    inheritstochildren INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_credentialscopeassignments_tenant" ON "credentialscopeassignments" ("tenantid");
CREATE INDEX IF NOT EXISTS "idx_credentialscopeassignments_credential" ON "credentialscopeassignments" ("tenantid", "credentialid");
CREATE TABLE IF NOT EXISTS "audit_records" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64),
    eventtype VARCHAR(64) NOT NULL,
    requestid VARCHAR(64),
    correlationid VARCHAR(64),
    traceid VARCHAR(64),
    authscheme VARCHAR(64),
    principaltype VARCHAR(64),
    principalid VARCHAR(64),
    principalname VARCHAR(256),
    sessionid VARCHAR(64),
    resourcetype VARCHAR(64),
    resourceid VARCHAR(64),
    operation VARCHAR(64),
    requesttype VARCHAR(128),
    method VARCHAR(16),
    path VARCHAR(1024),
    sourceip VARCHAR(64),
    authresult VARCHAR(64),
    authorizationresult VARCHAR(64),
    reason TEXT,
    bypassreason VARCHAR(256),
    statuscode INTEGER NOT NULL,
    description TEXT,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_audit_records_tenant" ON "audit_records" ("tenantid");
CREATE INDEX IF NOT EXISTS "idx_audit_records_created" ON "audit_records" ("tenantid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_audit_records_eventtype" ON "audit_records" ("eventtype");
CREATE TABLE IF NOT EXISTS "request_history" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64),
    userid VARCHAR(64),
    principalname VARCHAR(256),
    method VARCHAR(16) NOT NULL,
    path VARCHAR(1024) NOT NULL,
    url TEXT NOT NULL,
    statuscode INTEGER NOT NULL,
    durationms REAL NOT NULL,
    sourceip VARCHAR(64),
    requestbody TEXT,
    requestbodybytes BIGINT NOT NULL,
    requestbodytruncated INTEGER NOT NULL,
    responsebody TEXT,
    responsebodybytes BIGINT NOT NULL,
    responsebodytruncated INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    completedutc TEXT
);
CREATE INDEX IF NOT EXISTS "idx_request_history_tenant" ON "request_history" ("tenantid");
CREATE INDEX IF NOT EXISTS "idx_request_history_created" ON "request_history" ("createdutc");
CREATE INDEX IF NOT EXISTS "idx_request_history_tenantcreated" ON "request_history" ("tenantid", "createdutc");
CREATE TABLE IF NOT EXISTS "request_history_headers" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    requesthistoryentryid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    direction VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_request_history_headers_parent" ON "request_history_headers" ("requesthistoryentryid");
CREATE TABLE IF NOT EXISTS "harness_profiles" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    description TEXT,
    harnesstype VARCHAR(64) NOT NULL,
    executable VARCHAR(1024) NOT NULL,
    promptdelivery VARCHAR(64) NOT NULL,
    promptargumenttemplate TEXT,
    systempromptdelivery VARCHAR(64) NOT NULL,
    systemprompttarget TEXT,
    mcpconfigformat VARCHAR(64) NOT NULL,
    mcpconfigfilename VARCHAR(256),
    outputparser VARCHAR(64) NOT NULL,
    resultsource VARCHAR(64) NOT NULL,
    resultfilename VARCHAR(256),
    successpolicy VARCHAR(64) NOT NULL,
    generictextfield VARCHAR(256),
    genericfinalfield VARCHAR(256),
    genericsuccessfield VARCHAR(256),
    genericsuccessvalue VARCHAR(256),
    defaulttimeoutseconds INTEGER NOT NULL,
    killgraceseconds INTEGER NOT NULL,
    maxoutputbytes BIGINT NOT NULL,
    stderrtailbytes INTEGER NOT NULL,
    isolatehome INTEGER NOT NULL,
    supportsresume INTEGER NOT NULL,
    isbuiltin INTEGER NOT NULL,
    builtinkey VARCHAR(128),
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_harness_profiles_tenant" ON "harness_profiles" ("tenantid");
CREATE INDEX IF NOT EXISTS "idx_harness_profiles_name" ON "harness_profiles" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "harness_profile_args" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    template TEXT NOT NULL,
    condition TEXT,
    repeatover VARCHAR(256)
);
CREATE INDEX IF NOT EXISTS "idx_harness_profile_args_parent" ON "harness_profile_args" ("harnessprofileid");
CREATE TABLE IF NOT EXISTS "harness_profile_env" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    valuetemplate TEXT NOT NULL,
    condition TEXT,
    issecret INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_harness_profile_env_parent" ON "harness_profile_env" ("harnessprofileid");
CREATE TABLE IF NOT EXISTS "harness_profile_files" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    basedirectory VARCHAR(64) NOT NULL,
    pathtemplate TEXT NOT NULL,
    contenttemplate TEXT NOT NULL,
    condition TEXT,
    mode VARCHAR(8),
    issecret INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_harness_profile_files_parent" ON "harness_profile_files" ("harnessprofileid");
CREATE TABLE IF NOT EXISTS "harness_profile_exit_codes" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    exitcode INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_harness_profile_exit_codes_parent" ON "harness_profile_exit_codes" ("harnessprofileid");
CREATE TABLE IF NOT EXISTS "harness_profile_probe_args" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    argument VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_harness_profile_probe_args_parent" ON "harness_profile_probe_args" ("harnessprofileid");
CREATE TABLE IF NOT EXISTS "harness_profile_cred_env" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_harness_profile_cred_env_parent" ON "harness_profile_cred_env" ("harnessprofileid");
CREATE TABLE IF NOT EXISTS "prompt_templates" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    description TEXT,
    kind VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    currentversion INTEGER NOT NULL,
    isbuiltin INTEGER NOT NULL,
    builtinkey VARCHAR(128),
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_prompt_templates_tenant" ON "prompt_templates" ("tenantid");
CREATE INDEX IF NOT EXISTS "idx_prompt_templates_name" ON "prompt_templates" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "prompt_template_variables" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    prompttemplateid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    description TEXT,
    required INTEGER NOT NULL,
    defaultvalue TEXT
);
CREATE INDEX IF NOT EXISTS "idx_prompt_template_variables_parent" ON "prompt_template_variables" ("prompttemplateid");
CREATE TABLE IF NOT EXISTS "prompt_template_versions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64),
    templateid VARCHAR(64) NOT NULL,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    changenote TEXT,
    createdby VARCHAR(256),
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_prompt_template_versions_tenant" ON "prompt_template_versions" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_prompt_template_versions_templateversion" ON "prompt_template_versions" ("templateid", "version");
CREATE TABLE IF NOT EXISTS "mcp_servers" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    transport VARCHAR(64) NOT NULL,
    url TEXT,
    path VARCHAR(256),
    command TEXT,
    tooltimeoutseconds INTEGER NOT NULL,
    required INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_mcp_servers_tenant" ON "mcp_servers" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mcp_servers_name" ON "mcp_servers" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "mcp_server_args" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    mcpserverid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    argument VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_mcp_server_args_parent" ON "mcp_server_args" ("mcpserverid");
CREATE TABLE IF NOT EXISTS "mcp_server_env" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    mcpserverid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    valuetemplate TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_mcp_server_env_parent" ON "mcp_server_env" ("mcpserverid");
CREATE TABLE IF NOT EXISTS "mcp_server_headers" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    mcpserverid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    valuetemplate TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_mcp_server_headers_parent" ON "mcp_server_headers" ("mcpserverid");
CREATE TABLE IF NOT EXISTS "mcp_server_required_tools" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    mcpserverid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    toolname VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_mcp_server_required_tools_parent" ON "mcp_server_required_tools" ("mcpserverid");
CREATE TABLE IF NOT EXISTS "secrets" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    kind VARCHAR(64) NOT NULL,
    valueencrypted TEXT,
    valuelast4 VARCHAR(8),
    fingerprint VARCHAR(64),
    keyversion INTEGER NOT NULL,
    expiresutc TEXT,
    rotatedutc TEXT,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_secrets_tenant" ON "secrets" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_secrets_name" ON "secrets" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "workspace_templates" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    kind VARCHAR(64) NOT NULL,
    giturl TEXT,
    gitref VARCHAR(256),
    gitdepth INTEGER NOT NULL,
    gitcredentialsecretid VARCHAR(64),
    retention VARCHAR(64) NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_workspace_templates_tenant" ON "workspace_templates" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_workspace_templates_name" ON "workspace_templates" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "workspace_template_files" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    workspacetemplateid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    path TEXT NOT NULL,
    content TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_workspace_template_files_parent" ON "workspace_template_files" ("workspacetemplateid");
CREATE TABLE IF NOT EXISTS "artifact_stores" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    kind VARCHAR(64) NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_artifact_stores_tenant" ON "artifact_stores" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_artifact_stores_name" ON "artifact_stores" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "agents" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    displayname VARCHAR(256),
    description TEXT,
    kind VARCHAR(64) NOT NULL,
    agentversion VARCHAR(64),
    exposea2a INTEGER NOT NULL,
    exposemcptool INTEGER NOT NULL,
    mcptoolname VARCHAR(128),
    tooldescriptiontemplateid VARCHAR(64),
    skilldescriptiontemplateid VARCHAR(64),
    inputmode VARCHAR(64) NOT NULL,
    inputschemajson TEXT,
    outputschemajson TEXT,
    delegationmode VARCHAR(64) NOT NULL,
    delegationmaxdepth INTEGER NOT NULL,
    delegationallowrecursion INTEGER NOT NULL,
    remoteprotocol VARCHAR(64),
    remoteendpointurl TEXT,
    remotecredentialsecretid VARCHAR(64),
    lastregisteredutc TEXT,
    registrationttlseconds INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_agents_tenant" ON "agents" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_agents_name" ON "agents" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "agent_skills" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    agentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    skillid VARCHAR(128) NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT
);
CREATE INDEX IF NOT EXISTS "idx_agent_skills_parent" ON "agent_skills" ("agentid");
CREATE TABLE IF NOT EXISTS "agent_tags" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    agentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    tag VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_agent_tags_parent" ON "agent_tags" ("agentid");
CREATE TABLE IF NOT EXISTS "agent_delegation_allowlist" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    agentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    agentname VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_agent_delegation_allowlist_parent" ON "agent_delegation_allowlist" ("agentid");
CREATE TABLE IF NOT EXISTS "deployments" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    harnessprofileid VARCHAR(64) NOT NULL,
    model VARCHAR(256),
    fallbackmodel VARCHAR(256),
    effort VARCHAR(32),
    maxturns INTEGER,
    maxbudgetusd REAL,
    maxconcurrentruns INTEGER NOT NULL,
    timeoutseconds INTEGER,
    maxattempts INTEGER NOT NULL,
    retryonnodeloss INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    nodepoolid VARCHAR(64),
    workspacetemplateid VARCHAR(64),
    artifactstoreid VARCHAR(64),
    configversion INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_deployments_tenant" ON "deployments" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_deployments_name" ON "deployments" ("tenantid", "name");
CREATE INDEX IF NOT EXISTS "idx_deployments_agent" ON "deployments" ("tenantid", "agentid");
CREATE TABLE IF NOT EXISTS "deployment_prompt_bindings" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    role VARCHAR(64) NOT NULL,
    templateid VARCHAR(64) NOT NULL,
    pinnedversion INTEGER
);
CREATE INDEX IF NOT EXISTS "idx_deployment_prompt_bindings_parent" ON "deployment_prompt_bindings" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_resource_bindings" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    kind VARCHAR(64) NOT NULL,
    alias VARCHAR(128) NOT NULL,
    resourceid VARCHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_deployment_resource_bindings_parent" ON "deployment_resource_bindings" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_arg_overrides" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    operation VARCHAR(64) NOT NULL,
    match TEXT,
    template TEXT,
    condition TEXT
);
CREATE INDEX IF NOT EXISTS "idx_deployment_arg_overrides_parent" ON "deployment_arg_overrides" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_env_overrides" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    valuetemplate TEXT NOT NULL,
    issecret INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_deployment_env_overrides_parent" ON "deployment_env_overrides" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_file_overrides" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    basedirectory VARCHAR(64) NOT NULL,
    pathtemplate TEXT NOT NULL,
    contenttemplate TEXT NOT NULL,
    mode VARCHAR(8),
    issecret INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_deployment_file_overrides_parent" ON "deployment_file_overrides" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_node_selectors" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    key VARCHAR(256) NOT NULL,
    value VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_deployment_node_selectors_parent" ON "deployment_node_selectors" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_parameters" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_deployment_parameters_parent" ON "deployment_parameters" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_run_overrides" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    validation VARCHAR(64) NOT NULL,
    pattern TEXT
);
CREATE INDEX IF NOT EXISTS "idx_deployment_run_overrides_parent" ON "deployment_run_overrides" ("deploymentid");
CREATE TABLE IF NOT EXISTS "node_pools" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_node_pools_name" ON "node_pools" ("name");
CREATE TABLE IF NOT EXISTS "node_pool_tenants" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    nodepoolid VARCHAR(64) NOT NULL,
    allowedtenantid VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_node_pool_tenants_parent" ON "node_pool_tenants" ("nodepoolid");
CREATE TABLE IF NOT EXISTS "nodes" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    nodepoolid VARCHAR(64),
    address VARCHAR(256),
    nodeversion VARCHAR(64),
    status VARCHAR(64) NOT NULL,
    maxconcurrentruns INTEGER NOT NULL,
    activeruns INTEGER NOT NULL,
    credentialid VARCHAR(64),
    lastheartbeatutc TEXT,
    registeredutc TEXT,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_nodes_name" ON "nodes" ("name");
CREATE TABLE IF NOT EXISTS "node_labels" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    nodeid VARCHAR(64) NOT NULL,
    key VARCHAR(256) NOT NULL,
    value VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_node_labels_parent" ON "node_labels" ("nodeid");
CREATE TABLE IF NOT EXISTS "node_capabilities" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    nodeid VARCHAR(64) NOT NULL,
    harnesstype VARCHAR(64) NOT NULL,
    executable VARCHAR(1024),
    detectedversion VARCHAR(256),
    available INTEGER NOT NULL,
    detail TEXT
);
CREATE INDEX IF NOT EXISTS "idx_node_capabilities_parent" ON "node_capabilities" ("nodeid");
CREATE TABLE IF NOT EXISTS "runs" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    agentname VARCHAR(128) NOT NULL,
    deploymentid VARCHAR(64) NOT NULL,
    deploymentversion INTEGER NOT NULL,
    harnesstype VARCHAR(64) NOT NULL,
    nodepoolid VARCHAR(64),
    kind VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL,
    outcome VARCHAR(64) NOT NULL,
    priority INTEGER NOT NULL,
    inputtext TEXT,
    inputcontenttype VARCHAR(128),
    callertype VARCHAR(64) NOT NULL,
    callerid VARCHAR(64),
    callername VARCHAR(256),
    parentrunid VARCHAR(64),
    rootrunid VARCHAR(64),
    depth INTEGER NOT NULL,
    callchain TEXT,
    idempotencykey VARCHAR(256),
    retryofrunid VARCHAR(64),
    attempt INTEGER NOT NULL,
    maxattempts INTEGER NOT NULL,
    leasenodeid VARCHAR(64),
    leasenodename VARCHAR(256),
    leaseepoch BIGINT NOT NULL,
    leaseexpiresutc TEXT,
    queuedutc TEXT,
    leasedutc TEXT,
    startedutc TEXT,
    completedutc TEXT,
    deadlineutc TEXT,
    cancelrequested INTEGER NOT NULL,
    resulttext TEXT,
    structuredoutputjson TEXT,
    sessionid VARCHAR(256),
    servedmodel VARCHAR(256),
    exitcode INTEGER,
    stderrtail TEXT,
    errormessage TEXT,
    inputtokens BIGINT NOT NULL,
    outputtokens BIGINT NOT NULL,
    cachedtokens BIGINT NOT NULL,
    costusd REAL,
    costestimated INTEGER NOT NULL,
    lasteventsequence BIGINT NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_runs_tenant" ON "runs" ("tenantid");
CREATE INDEX IF NOT EXISTS "idx_runs_claim" ON "runs" ("status", "harnesstype", "priority", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_runs_tenantstatus" ON "runs" ("tenantid", "status");
CREATE INDEX IF NOT EXISTS "idx_runs_deployment" ON "runs" ("deploymentid", "status");
CREATE INDEX IF NOT EXISTS "idx_runs_parent" ON "runs" ("parentrunid");
CREATE INDEX IF NOT EXISTS "idx_runs_lease" ON "runs" ("leasenodeid", "status");
CREATE INDEX IF NOT EXISTS "idx_runs_idempotency" ON "runs" ("tenantid", "idempotencykey");
CREATE INDEX IF NOT EXISTS "idx_runs_created" ON "runs" ("tenantid", "createdutc");
CREATE TABLE IF NOT EXISTS "run_parameters" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    runid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_run_parameters_parent" ON "run_parameters" ("runid");
CREATE TABLE IF NOT EXISTS "run_requirements" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    runid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    key VARCHAR(256) NOT NULL,
    value VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_run_requirements_parent" ON "run_requirements" ("runid");
CREATE TABLE IF NOT EXISTS "run_template_versions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    runid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    templateid VARCHAR(64) NOT NULL,
    templatename VARCHAR(256) NOT NULL,
    version INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_run_template_versions_parent" ON "run_template_versions" ("runid");
CREATE TABLE IF NOT EXISTS "run_events" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    runid VARCHAR(64) NOT NULL,
    sequence BIGINT NOT NULL,
    eventtype VARCHAR(64) NOT NULL,
    timestamputc TEXT NOT NULL,
    text TEXT,
    toolname VARCHAR(256),
    toolcallid VARCHAR(256),
    success INTEGER,
    inputtokens BIGINT,
    outputtokens BIGINT,
    raweventjson TEXT,
    createdutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_run_events_tenant" ON "run_events" ("tenantid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_run_events_runsequence" ON "run_events" ("runid", "sequence");
CREATE TABLE IF NOT EXISTS "coordination_leases" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    holder VARCHAR(256),
    epoch BIGINT NOT NULL,
    acquiredutc TEXT,
    expiresutc TEXT,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_coordination_leases_name" ON "coordination_leases" ("name");
CREATE TABLE IF NOT EXISTS "cluster_settings" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    settingkey VARCHAR(256) NOT NULL,
    settingvalue TEXT,
    updatedby VARCHAR(256),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_cluster_settings_key" ON "cluster_settings" ("settingkey");
CREATE TABLE IF NOT EXISTS "manifest_applies" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    principalname VARCHAR(256),
    dryrun INTEGER NOT NULL,
    documentcount INTEGER NOT NULL,
    createdcount INTEGER NOT NULL,
    updatedcount INTEGER NOT NULL,
    unchangedcount INTEGER NOT NULL,
    failedcount INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_manifest_applies_tenant" ON "manifest_applies" ("tenantid");
CREATE TABLE IF NOT EXISTS "manifest_apply_items" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    manifestapplyid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    kind VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    result VARCHAR(64) NOT NULL,
    resourceid VARCHAR(64),
    message TEXT
);
CREATE INDEX IF NOT EXISTS "idx_manifest_apply_items_parent" ON "manifest_apply_items" ("manifestapplyid");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 1, 'Initial schema', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 1);

-- Migration 2: Run timing telemetry
ALTER TABLE "runs" ADD COLUMN firsttokenutc TEXT;
ALTER TABLE "runs" ADD COLUMN lasttokenutc TEXT;
ALTER TABLE "runs" ADD COLUMN ttftms BIGINT;
ALTER TABLE "runs" ADD COLUMN streamingms BIGINT;
ALTER TABLE "runs" ADD COLUMN executionms BIGINT;
ALTER TABLE "runs" ADD COLUMN queuems BIGINT;
ALTER TABLE "runs" ADD COLUMN totalms BIGINT;
ALTER TABLE "runs" ADD COLUMN toolcallcount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "runs" ADD COLUMN reasoningtokens BIGINT NOT NULL DEFAULT 0;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 2, 'Run timing telemetry', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 2);

-- Migration 3: Structured output validation and repair
ALTER TABLE "runs" ADD COLUMN outputschemavalid INTEGER;
ALTER TABLE "runs" ADD COLUMN schemavalidationerrors TEXT;
ALTER TABLE "runs" ADD COLUMN repairattempts INTEGER NOT NULL DEFAULT 0;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 3, 'Structured output validation and repair', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 3);

-- Migration 4: Delegation wait telemetry, manifest field changes, and run event codes
ALTER TABLE "runs" ADD COLUMN delegationwaitms BIGINT;
ALTER TABLE "runs" ADD COLUMN ttftexcldelegationms BIGINT;
ALTER TABLE "run_events" ADD COLUMN code VARCHAR(64);
ALTER TABLE "manifest_apply_items" ADD COLUMN plannedresult VARCHAR(64);
CREATE TABLE IF NOT EXISTS "manifest_apply_changes" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    manifestapplyid VARCHAR(64) NOT NULL,
    manifestapplyitemid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    field VARCHAR(512) NOT NULL,
    beforevalue TEXT,
    aftervalue TEXT
);
CREATE INDEX IF NOT EXISTS "idx_manifest_apply_changes_parent" ON "manifest_apply_changes" ("manifestapplyid");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 4, 'Delegation wait telemetry, manifest field changes, and run event codes', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 4);

-- Migration 5: Run trace identifiers
ALTER TABLE "runs" ADD COLUMN traceid VARCHAR(32);
ALTER TABLE "runs" ADD COLUMN traceparent VARCHAR(64);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 5, 'Run trace identifiers', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 5);

-- Migration 6: Multi-replica state (nonces, rate limits, MCP sessions, backplane) and read path indexes
CREATE TABLE IF NOT EXISTS "request_nonces" (
    noncekey VARCHAR(512) NOT NULL PRIMARY KEY,
    expiresutc TEXT NOT NULL,
    createdutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_request_nonces_expires" ON "request_nonces" ("expiresutc");
CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
    bucketkey VARCHAR(512) NOT NULL PRIMARY KEY,
    hits INTEGER NOT NULL,
    expiresutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_rate_limit_buckets_expires" ON "rate_limit_buckets" ("expiresutc");
CREATE TABLE IF NOT EXISTS "mcp_sessions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    principal VARCHAR(512) NOT NULL,
    protocolversion VARCHAR(64) NOT NULL,
    clientname VARCHAR(256),
    clientversion VARCHAR(128),
    createdutc TEXT NOT NULL,
    lastseenutc TEXT NOT NULL,
    expiresutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_mcp_sessions_expires" ON "mcp_sessions" ("expiresutc");
CREATE TABLE IF NOT EXISTS "backplane_messages" (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    kind VARCHAR(64) NOT NULL,
    subject VARCHAR(256),
    origin VARCHAR(128) NOT NULL,
    createdutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_backplane_messages_created" ON "backplane_messages" ("createdutc");
CREATE INDEX IF NOT EXISTS "idx_runs_tenantstatuscreated" ON "runs" ("tenantid", "status", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_runs_tenantagentcreated" ON "runs" ("tenantid", "agentid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_runs_root" ON "runs" ("rootrunid");
CREATE INDEX IF NOT EXISTS "idx_runs_leaseexpires" ON "runs" ("status", "leaseexpiresutc");
CREATE INDEX IF NOT EXISTS "idx_runs_deadline" ON "runs" ("status", "deadlineutc");
CREATE INDEX IF NOT EXISTS "idx_runs_completed" ON "runs" ("status", "completedutc");
CREATE INDEX IF NOT EXISTS "idx_run_events_created" ON "run_events" ("createdutc");
CREATE INDEX IF NOT EXISTS "idx_authsessions_expires" ON "authsessions" ("expiresutc");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 6, 'Multi-replica state (nonces, rate limits, MCP sessions, backplane) and read path indexes', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 6);

-- Migration 7: Control-plane replicas (control nodes)
CREATE TABLE IF NOT EXISTS "control_nodes" (
    id VARCHAR(256) NOT NULL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    hostname VARCHAR(256),
    address VARCHAR(256),
    version VARCHAR(64),
    schemaversion INTEGER NOT NULL,
    backplane VARCHAR(64),
    status VARCHAR(64) NOT NULL,
    startedutc TEXT NOT NULL,
    lastheartbeatutc TEXT NOT NULL,
    activerequests INTEGER NOT NULL,
    openstreams INTEGER NOT NULL,
    heldlongpolls INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_control_nodes_statusheartbeat" ON "control_nodes" ("status", "lastheartbeatutc");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 7, 'Control-plane replicas (control nodes)', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 7);

-- Migration 8: Run guard limits on deployments
ALTER TABLE "deployments" ADD COLUMN repetitionguard INTEGER;
ALTER TABLE "deployments" ADD COLUMN maxassistantchars BIGINT;
ALTER TABLE "deployments" ADD COLUMN noprogressseconds INTEGER;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 8, 'Run guard limits on deployments', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 8);

-- Migration 9: Run executors, run pod resources, and PersistentVolume workspaces
ALTER TABLE "deployments" ADD COLUMN executor VARCHAR(64);
ALTER TABLE "deployments" ADD COLUMN podcpurequest VARCHAR(64);
ALTER TABLE "deployments" ADD COLUMN podcpulimit VARCHAR(64);
ALTER TABLE "deployments" ADD COLUMN podmemoryrequest VARCHAR(64);
ALTER TABLE "deployments" ADD COLUMN podmemorylimit VARCHAR(64);
ALTER TABLE "deployments" ADD COLUMN podephemeralstoragerequest VARCHAR(64);
ALTER TABLE "deployments" ADD COLUMN podephemeralstoragelimit VARCHAR(64);
ALTER TABLE "node_pools" ADD COLUMN defaultexecutor VARCHAR(64);
ALTER TABLE "runs" ADD COLUMN executor VARCHAR(64);
ALTER TABLE "workspace_templates" ADD COLUMN persistentvolumeclaim VARCHAR(256);
CREATE TABLE IF NOT EXISTS "node_executors" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    nodeid VARCHAR(64) NOT NULL,
    executor VARCHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_node_executors_parent" ON "node_executors" ("nodeid");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 9, 'Run executors, run pod resources, and PersistentVolume workspaces', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 9);

-- Migration 10: Secret credential status and Codex login refresh
ALTER TABLE "secrets" ADD COLUMN status VARCHAR(64);
ALTER TABLE "secrets" ADD COLUMN statusmessage TEXT;
ALTER TABLE "secrets" ADD COLUMN statusutc TEXT;
ALTER TABLE "secrets" ADD COLUMN refreshedutc TEXT;
ALTER TABLE "secrets" ADD COLUMN accesstokenexpiresutc TEXT;
CREATE INDEX IF NOT EXISTS "idx_secrets_kind" ON "secrets" ("kind");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 10, 'Secret credential status and Codex login refresh', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 10);

-- Migration 11: Run token lease epochs and manifest error codes
ALTER TABLE "authsessions" ADD COLUMN leaseepoch BIGINT;
ALTER TABLE "manifest_apply_items" ADD COLUMN errorcode VARCHAR(64);
ALTER TABLE "manifest_apply_items" ADD COLUMN errorfield VARCHAR(512);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 11, 'Run token lease epochs and manifest error codes', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 11);

-- Migration 12: Conversations: harness session resume, node affinity, and transcript fallback
ALTER TABLE "runs" ADD COLUMN conversationid VARCHAR(64);
ALTER TABLE "runs" ADD COLUMN conversationturn INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "runs" ADD COLUMN resumesessionid VARCHAR(256);
ALTER TABLE "runs" ADD COLUMN affinitynodeid VARCHAR(64);
ALTER TABLE "runs" ADD COLUMN affinityuntilutc TEXT;
ALTER TABLE "runs" ADD COLUMN conversationfallbackreason VARCHAR(64);
CREATE TABLE IF NOT EXISTS "conversations" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    agentname VARCHAR(256) NOT NULL,
    deploymentid VARCHAR(64),
    harnesstype VARCHAR(64) NOT NULL,
    contextid VARCHAR(256),
    title VARCHAR(256),
    callertype VARCHAR(64) NOT NULL,
    callerid VARCHAR(64),
    callername VARCHAR(256),
    sessionid VARCHAR(256),
    sessionharnessprofileid VARCHAR(64),
    affinitynodeid VARCHAR(64),
    affinitynodename VARCHAR(256),
    activerunid VARCHAR(64),
    lastrunid VARCHAR(64),
    turncount INTEGER NOT NULL,
    fallbackcount INTEGER NOT NULL,
    lastfallbackreason VARCHAR(64),
    lastfallbackutc TEXT,
    lastactivityutc TEXT,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_conversations_tenantcreated" ON "conversations" ("tenantid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_conversations_tenantagent" ON "conversations" ("tenantid", "agentid");
CREATE INDEX IF NOT EXISTS "idx_conversations_context" ON "conversations" ("tenantid", "agentid", "contextid");
CREATE INDEX IF NOT EXISTS "idx_runs_conversation" ON "runs" ("conversationid", "createdutc");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 12, 'Conversations: harness session resume, node affinity, and transcript fallback', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 12);

-- Migration 13: Permission approvals and deployment approval rules
ALTER TABLE "deployments" ADD COLUMN approvalsenabled INTEGER;
ALTER TABLE "deployments" ADD COLUMN approvaldefaultaction VARCHAR(16);
ALTER TABLE "deployments" ADD COLUMN approvaltimeoutseconds INTEGER;
ALTER TABLE "deployments" ADD COLUMN approvaltimeoutdecision VARCHAR(16);
ALTER TABLE "runs" ADD COLUMN pendingapprovals INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "runs" ADD COLUMN approvalwaitms BIGINT;
CREATE TABLE IF NOT EXISTS "deployment_approval_rules" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    action VARCHAR(16) NOT NULL,
    pattern VARCHAR(1024) NOT NULL,
    inputpattern TEXT,
    description TEXT
);
CREATE INDEX IF NOT EXISTS "idx_deployment_approval_rules_parent" ON "deployment_approval_rules" ("deploymentid");
CREATE TABLE IF NOT EXISTS "approvals" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    runid VARCHAR(64) NOT NULL,
    rootrunid VARCHAR(64),
    agentid VARCHAR(64) NOT NULL,
    agentname VARCHAR(128) NOT NULL,
    deploymentid VARCHAR(64) NOT NULL,
    leaseepoch BIGINT NOT NULL,
    harnesstype VARCHAR(64) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    toolname VARCHAR(256) NOT NULL,
    toolcallid VARCHAR(256),
    inputpreview TEXT,
    summary TEXT,
    suggestedrule VARCHAR(1024),
    status VARCHAR(32) NOT NULL,
    decision VARCHAR(16),
    decisionsource VARCHAR(32),
    ruleid VARCHAR(64),
    rulepattern VARCHAR(1024),
    rememberedruleid VARCHAR(64),
    decidedby VARCHAR(256),
    decidedbyid VARCHAR(64),
    reason TEXT,
    timeoutdecision VARCHAR(16) NOT NULL,
    requestedutc TEXT NOT NULL,
    decidedutc TEXT,
    expiresutc TEXT,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_approvals_tenantstatuscreated" ON "approvals" ("tenantid", "status", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_approvals_tenantcreated" ON "approvals" ("tenantid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_approvals_run" ON "approvals" ("runid");
CREATE INDEX IF NOT EXISTS "idx_approvals_statusexpires" ON "approvals" ("status", "expiresutc");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 13, 'Permission approvals and deployment approval rules', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 13);

-- Migration 14: Operator-configured model prices for run cost estimation
CREATE TABLE IF NOT EXISTS "model_prices" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    model VARCHAR(256) NOT NULL,
    harnesstype VARCHAR(64) NOT NULL,
    inputusdpermillion REAL NOT NULL,
    outputusdpermillion REAL NOT NULL,
    cachedinputusdpermillion REAL,
    reasoningusdpermillion REAL,
    inputincludescachedtokens INTEGER NOT NULL,
    outputincludesreasoningtokens INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_model_prices_tenantname" ON "model_prices" ("tenantid", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_model_prices_tenantmodel" ON "model_prices" ("tenantid", "harnesstype", "model");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 14, 'Operator-configured model prices for run cost estimation', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 14);

-- Migration 15: Daily UTC quotas and retained run usage
CREATE TABLE IF NOT EXISTS "usage_quotas" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    scope VARCHAR(64) NOT NULL,
    resourceid VARCHAR(64) NOT NULL,
    dailyrunlimit BIGINT,
    dailytokenlimit BIGINT,
    dailycostusdlimit REAL,
    maxconcurrentruns INTEGER,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_usage_quotas_tenantname" ON "usage_quotas" ("tenantid", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_usage_quotas_target" ON "usage_quotas" ("tenantid", "scope", "resourceid");
CREATE TABLE IF NOT EXISTS "run_usage" (
    runid VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    deploymentid VARCHAR(64) NOT NULL,
    harnesstype VARCHAR(64) NOT NULL,
    admittedutc TEXT NOT NULL,
    completedutc TEXT,
    inputtokens BIGINT NOT NULL,
    outputtokens BIGINT NOT NULL,
    cachedtokens BIGINT NOT NULL,
    costusd REAL
);
CREATE INDEX IF NOT EXISTS "idx_run_usage_admitted" ON "run_usage" ("tenantid", "admittedutc");
CREATE INDEX IF NOT EXISTS "idx_run_usage_completed" ON "run_usage" ("tenantid", "completedutc");
CREATE INDEX IF NOT EXISTS "idx_run_usage_agent" ON "run_usage" ("tenantid", "agentid");
CREATE INDEX IF NOT EXISTS "idx_run_usage_deployment" ON "run_usage" ("tenantid", "deploymentid");
CREATE VIEW "quota_usage_source" AS SELECT runid, tenantid, agentid, deploymentid, harnesstype, admittedutc, completedutc, inputtokens, outputtokens, cachedtokens, costusd FROM "run_usage" UNION ALL SELECT r.id, r.tenantid, r.agentid, r.deploymentid, r.harnesstype, COALESCE(r.queuedutc, r.createdutc), r.completedutc, r.inputtokens, r.outputtokens, r.cachedtokens, r.costusd FROM "runs" r WHERE NOT EXISTS (SELECT 1 FROM "run_usage" u WHERE u.runid = r.id);
INSERT INTO "run_usage" (runid, tenantid, agentid, deploymentid, harnesstype, admittedutc, completedutc, inputtokens, outputtokens, cachedtokens, costusd) SELECT id, tenantid, agentid, deploymentid, harnesstype, COALESCE(queuedutc, createdutc), completedutc, inputtokens, outputtokens, cachedtokens, costusd FROM "runs";
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 15, 'Daily UTC quotas and retained run usage', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 15);

-- Migration 16: Explicit opt-in quota enforcement
ALTER TABLE "usage_quotas" ADD COLUMN enforcementenabled INTEGER NOT NULL DEFAULT 0;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 16, 'Explicit opt-in quota enforcement', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 16);

-- Migration 17: Executor capability negotiation and run requirements
ALTER TABLE "deployments" ADD COLUMN capisolation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "deployments" ADD COLUMN capegresscontrol INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "deployments" ADD COLUMN capfilesystemsnapshot INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "deployments" ADD COLUMN capsessioncontinuation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "deployments" ADD COLUMN capcrossnoderestore INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "deployments" ADD COLUMN capcoldstartclass VARCHAR(32);
ALTER TABLE "runs" ADD COLUMN capisolation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "runs" ADD COLUMN capegresscontrol INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "runs" ADD COLUMN capfilesystemsnapshot INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "runs" ADD COLUMN capsessioncontinuation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "runs" ADD COLUMN capcrossnoderestore INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "runs" ADD COLUMN capcoldstartclass VARCHAR(32);
ALTER TABLE "node_executors" ADD COLUMN capisolation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "node_executors" ADD COLUMN capegresscontrol INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "node_executors" ADD COLUMN capfilesystemsnapshot INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "node_executors" ADD COLUMN capsessioncontinuation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "node_executors" ADD COLUMN capcrossnoderestore INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "node_executors" ADD COLUMN capcoldstartclass VARCHAR(32);
ALTER TABLE "node_executors" ADD COLUMN capreported INTEGER NOT NULL DEFAULT 0;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 17, 'Executor capability negotiation and run requirements', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 17);

-- Migration 18: Warm-start capability without removing cold execution support
ALTER TABLE "node_executors" ADD COLUMN capwarmstart INTEGER NOT NULL DEFAULT 0;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 18, 'Warm-start capability without removing cold execution support', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 18);

-- Migration 19: Artifact stores, deployment collection globs, and run artifact metadata
ALTER TABLE "artifact_stores" ADD COLUMN pathprefix VARCHAR(512);
ALTER TABLE "artifact_stores" ADD COLUMN bucket VARCHAR(255);
ALTER TABLE "artifact_stores" ADD COLUMN endpoint VARCHAR(2048);
ALTER TABLE "artifact_stores" ADD COLUMN region VARCHAR(128) NOT NULL DEFAULT 'us-east-1';
ALTER TABLE "artifact_stores" ADD COLUMN secretid VARCHAR(64);
ALTER TABLE "artifact_stores" ADD COLUMN forcepathstyle INTEGER NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS "deployment_artifact_globs" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    pattern VARCHAR(512) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_deployment_artifact_globs_parent" ON "deployment_artifact_globs" ("deploymentid", "position");
CREATE TABLE IF NOT EXISTS "artifacts" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    runid VARCHAR(64) NOT NULL,
    artifactstoreid VARCHAR(64) NOT NULL,
    name VARCHAR(1024) NOT NULL,
    mediatype VARCHAR(255) NOT NULL,
    sizebytes BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    location VARCHAR(2048) NOT NULL,
    leaseepoch BIGINT NOT NULL,
    repairattempt INTEGER NOT NULL,
    content BLOB,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_artifacts_tenant" ON "artifacts" ("tenantid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_artifacts_run" ON "artifacts" ("tenantid", "runid");
CREATE INDEX IF NOT EXISTS "idx_artifacts_store" ON "artifacts" ("tenantid", "artifactstoreid");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_artifacts_upload" ON "artifacts" ("tenantid", "runid", "leaseepoch", "repairattempt", "name");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 19, 'Artifact stores, deployment collection globs, and run artifact metadata', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 19);

-- Migration 20: Transient worker stdio MCP diagnostics with structured outcomes
ALTER TABLE "nodes" ADD COLUMN supportsmcptests INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS "mcp_tests" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    serverid VARCHAR(64) NOT NULL,
    nodeid VARCHAR(64) NOT NULL,
    noderegisteredutc TEXT NOT NULL,
    serverupdatedutc TEXT NOT NULL,
    expiresutc TEXT NOT NULL,
    started INTEGER NOT NULL,
    finished INTEGER NOT NULL,
    success INTEGER NOT NULL,
    durationms BIGINT NOT NULL,
    timeoutms INTEGER NOT NULL,
    error VARCHAR(2048)
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mcp_tests_node" ON "mcp_tests" ("nodeid");
CREATE INDEX IF NOT EXISTS "idx_mcp_tests_expires" ON "mcp_tests" ("expiresutc");
CREATE TABLE IF NOT EXISTS "mcp_test_tools" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    testid VARCHAR(64) NOT NULL,
    kind VARCHAR(16) NOT NULL,
    name VARCHAR(512) NOT NULL,
    position INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_mcp_test_tools_parent" ON "mcp_test_tools" ("testid", "position");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 20, 'Transient worker stdio MCP diagnostics with structured outcomes', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 20);

-- Migration 21: Ordered pipelines and stage review gates
ALTER TABLE "runs" ADD COLUMN pipelinerunid VARCHAR(64);
ALTER TABLE "runs" ADD COLUMN pipelineposition INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "runs" ADD COLUMN pipelineexecution INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS "idx_runs_pipelineexecution" ON "runs" ("pipelinerunid", "pipelineposition", "pipelineexecution") WHERE pipelinerunid IS NOT NULL;
CREATE TABLE IF NOT EXISTS "pipelines" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    version INTEGER NOT NULL,
    maxdurationseconds INTEGER NOT NULL,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pipelines_tenantname" ON "pipelines" ("tenantid", "name");
CREATE INDEX IF NOT EXISTS "idx_pipelines_tenantcreated" ON "pipelines" ("tenantid", "createdutc");
CREATE TABLE IF NOT EXISTS "pipeline_stages" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    pipelineid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    agentid VARCHAR(64) NOT NULL,
    deploymentid VARCHAR(64),
    handofftemplateid VARCHAR(64),
    handofftemplateversion INTEGER,
    outputcharlimit INTEGER NOT NULL,
    maxattempts INTEGER NOT NULL,
    continueonfailure INTEGER NOT NULL,
    requiresreview INTEGER NOT NULL,
    reviewtimeoutseconds INTEGER NOT NULL,
    reviewtimeoutaction VARCHAR(32) NOT NULL,
    maxrevisions INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_pipeline_stages_parent" ON "pipeline_stages" ("pipelineid", "position");
CREATE INDEX IF NOT EXISTS "idx_pipeline_stages_agent" ON "pipeline_stages" ("tenantid", "agentid");
CREATE INDEX IF NOT EXISTS "idx_pipeline_stages_deployment" ON "pipeline_stages" ("tenantid", "deploymentid");
CREATE TABLE IF NOT EXISTS "pipeline_stage_parameters" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    stageid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    name VARCHAR(256) NOT NULL,
    value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_pipeline_stage_parameters_parent" ON "pipeline_stage_parameters" ("stageid", "position");
CREATE TABLE IF NOT EXISTS "pipeline_runs" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    pipelineid VARCHAR(64) NOT NULL,
    pipelinename VARCHAR(128) NOT NULL,
    pipelineversion INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    outcome VARCHAR(32) NOT NULL,
    currentposition INTEGER NOT NULL,
    stagecount INTEGER NOT NULL,
    casversion INTEGER NOT NULL,
    inputtext TEXT NOT NULL,
    inputcontenttype VARCHAR(256) NOT NULL,
    callertype VARCHAR(64) NOT NULL,
    callerid VARCHAR(64),
    callername VARCHAR(256),
    idempotencykey VARCHAR(256),
    priority INTEGER NOT NULL,
    finalrunid VARCHAR(64),
    errormessage TEXT,
    deadlineutc TEXT,
    cancelrequested INTEGER NOT NULL,
    traceparent VARCHAR(128),
    startedutc TEXT,
    completedutc TEXT,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_pipeline_runs_tenantstatus" ON "pipeline_runs" ("tenantid", "status", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_pipeline_runs_deadline" ON "pipeline_runs" ("status", "deadlineutc");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pipeline_runs_idempotency" ON "pipeline_runs" ("tenantid", "callerid", "idempotencykey");
CREATE INDEX IF NOT EXISTS "idx_pipeline_runs_pipeline" ON "pipeline_runs" ("tenantid", "pipelineid");
CREATE TABLE IF NOT EXISTS "pipeline_run_stages" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    pipelinerunid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    agentid VARCHAR(64) NOT NULL,
    agentname VARCHAR(256) NOT NULL,
    deploymentid VARCHAR(64),
    handofftemplateid VARCHAR(64),
    handofftemplateversion INTEGER,
    outputcharlimit INTEGER NOT NULL,
    maxattempts INTEGER NOT NULL,
    continueonfailure INTEGER NOT NULL,
    requiresreview INTEGER NOT NULL,
    reviewtimeoutseconds INTEGER NOT NULL,
    reviewtimeoutaction VARCHAR(32) NOT NULL,
    maxrevisions INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    executions INTEGER NOT NULL,
    attempts INTEGER NOT NULL,
    revisions INTEGER NOT NULL,
    currentrunid VARCHAR(64),
    lastrunid VARCHAR(64),
    blockedreason TEXT,
    nextattemptutc TEXT,
    startedutc TEXT,
    completedutc TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pipeline_run_stages_position" ON "pipeline_run_stages" ("pipelinerunid", "position");
CREATE TABLE IF NOT EXISTS "pipeline_run_stage_parameters" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    runstageid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    name VARCHAR(256) NOT NULL,
    value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_pipeline_run_stage_parameters_parent" ON "pipeline_run_stage_parameters" ("runstageid", "position");
CREATE TABLE IF NOT EXISTS "pipeline_reviews" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    pipelinerunid VARCHAR(64) NOT NULL,
    pipelineid VARCHAR(64) NOT NULL,
    pipelinename VARCHAR(128) NOT NULL,
    runstageid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    stagename VARCHAR(128) NOT NULL,
    runid VARCHAR(64) NOT NULL,
    execution INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    decision VARCHAR(32),
    decisionsource VARCHAR(32),
    comment TEXT,
    decidedby VARCHAR(256),
    decidedbyid VARCHAR(64),
    timeoutaction VARCHAR(32) NOT NULL,
    requestedutc TEXT NOT NULL,
    expiresutc TEXT,
    decidedutc TEXT,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pipeline_reviews_execution" ON "pipeline_reviews" ("runstageid", "execution");
CREATE INDEX IF NOT EXISTS "idx_pipeline_reviews_tenantstatus" ON "pipeline_reviews" ("tenantid", "status", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_pipeline_reviews_expires" ON "pipeline_reviews" ("status", "expiresutc");
CREATE INDEX IF NOT EXISTS "idx_pipeline_reviews_pipelinerun" ON "pipeline_reviews" ("pipelinerunid");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 21, 'Ordered pipelines and stage review gates', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 21);

-- Migration 22: Delegation child waits and worker child reserve
ALTER TABLE "nodes" ADD COLUMN childreserveslots INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "nodes" ADD COLUMN maxresidentwaiters INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS "run_child_waits" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    parentrunid VARCHAR(64) NOT NULL,
    childrunid VARCHAR(64) NOT NULL,
    createdutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_run_child_waits_parent" ON "run_child_waits" ("parentrunid");
CREATE INDEX IF NOT EXISTS "idx_run_child_waits_child" ON "run_child_waits" ("childrunid");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 22, 'Delegation child waits and worker child reserve', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 22);

-- Migration 23: Deployment trust level and tenant Untrusted policy
ALTER TABLE "deployments" ADD COLUMN trustlevel VARCHAR(32) NOT NULL DEFAULT 'Trusted';
ALTER TABLE "runs" ADD COLUMN trustlevel VARCHAR(32) NOT NULL DEFAULT 'Trusted';
ALTER TABLE "tenants" ADD COLUMN requireuntrusted INTEGER NOT NULL DEFAULT 0;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 23, 'Deployment trust level and tenant Untrusted policy', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 23);

-- Migration 24: Deployment effect policy replaces retryOnNodeLoss
ALTER TABLE "deployments" ADD COLUMN effectpolicy VARCHAR(32) NOT NULL DEFAULT 'AtMostOnce';
ALTER TABLE "runs" ADD COLUMN effectpolicy VARCHAR(32) NOT NULL DEFAULT 'AtMostOnce';
UPDATE "deployments" SET effectpolicy = 'AtLeastOnce' WHERE retryonnodeloss = 1;
UPDATE "runs" SET effectpolicy = 'AtLeastOnce' WHERE deploymentid IN (SELECT id FROM "deployments" WHERE retryonnodeloss = 1);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 24, 'Deployment effect policy replaces retryOnNodeLoss', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 24);

-- Migration 25: Worker containerized flag
ALTER TABLE "nodes" ADD COLUMN containerized INTEGER NOT NULL DEFAULT 0;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 25, 'Worker containerized flag', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 25);

-- Migration 26: Manifest apply item warnings
CREATE TABLE IF NOT EXISTS "manifest_apply_warnings" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    manifestapplyid VARCHAR(64) NOT NULL,
    manifestapplyitemid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    field VARCHAR(512) NOT NULL,
    code VARCHAR(64) NOT NULL,
    givenvalue VARCHAR(256),
    storedvalue VARCHAR(256),
    message VARCHAR(1024)
);
CREATE INDEX IF NOT EXISTS "idx_manifest_apply_warnings_parent" ON "manifest_apply_warnings" ("manifestapplyid");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 26, 'Manifest apply item warnings', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 26);

-- Migration 27: Deployment egress allowlists
CREATE TABLE IF NOT EXISTS "deployment_egress_rules" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    cidr VARCHAR(64) NOT NULL,
    port INTEGER,
    protocol VARCHAR(8) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_deployment_egress_rules_parent" ON "deployment_egress_rules" ("deploymentid", "position");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 27, 'Deployment egress allowlists', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 27);

-- Migration 28: Cron and webhook triggers, notification endpoints, and the notification outbox
ALTER TABLE "runs" ADD COLUMN triggerid VARCHAR(64);
ALTER TABLE "pipeline_runs" ADD COLUMN triggerid VARCHAR(64);
CREATE INDEX IF NOT EXISTS "idx_runs_trigger" ON "runs" ("tenantid", "triggerid", "createdutc") WHERE triggerid IS NOT NULL;
CREATE TABLE IF NOT EXISTS "triggers" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    triggertype VARCHAR(32) NOT NULL,
    targettype VARCHAR(32) NOT NULL,
    agentid VARCHAR(64),
    deploymentid VARCHAR(64),
    pipelineid VARCHAR(64),
    inputtemplateid VARCHAR(256),
    priority INTEGER NOT NULL,
    cronexpression VARCHAR(256),
    timezone VARCHAR(128) NOT NULL,
    active INTEGER NOT NULL,
    secretencrypted TEXT,
    secretkeyversion INTEGER NOT NULL,
    secretlast4 VARCHAR(8),
    secretrotatedutc TEXT,
    runastype VARCHAR(32) NOT NULL,
    runasid VARCHAR(64),
    runasname VARCHAR(256),
    lastfireutc TEXT,
    lastfireoutcome VARCHAR(32),
    nextfireutc TEXT,
    firecount BIGINT NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_triggers_tenantname" ON "triggers" ("tenantid", "name");
CREATE INDEX IF NOT EXISTS "idx_triggers_due" ON "triggers" ("triggertype", "active", "nextfireutc");
CREATE INDEX IF NOT EXISTS "idx_triggers_tenantcreated" ON "triggers" ("tenantid", "createdutc");
CREATE TABLE IF NOT EXISTS "trigger_fires" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    triggerid VARCHAR(64) NOT NULL,
    triggername VARCHAR(128) NOT NULL,
    source VARCHAR(32) NOT NULL,
    firekey VARCHAR(256) NOT NULL,
    deliveryid VARCHAR(128),
    scheduledutc TEXT NOT NULL,
    firedutc TEXT NOT NULL,
    outcome VARCHAR(32) NOT NULL,
    runid VARCHAR(64),
    pipelinerunid VARCHAR(64),
    errorcode VARCHAR(64),
    errormessage TEXT,
    createdutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_trigger_fires_key" ON "trigger_fires" ("triggerid", "firekey");
CREATE INDEX IF NOT EXISTS "idx_trigger_fires_trigger" ON "trigger_fires" ("tenantid", "triggerid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_trigger_fires_created" ON "trigger_fires" ("createdutc");
CREATE TABLE IF NOT EXISTS "notification_endpoints" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    url VARCHAR(2048) NOT NULL,
    agentid VARCHAR(64),
    deploymentid VARCHAR(64),
    includeresulttext INTEGER NOT NULL,
    resulttextmaxchars INTEGER NOT NULL,
    active INTEGER NOT NULL,
    secretencrypted TEXT,
    secretkeyversion INTEGER NOT NULL,
    secretlast4 VARCHAR(8),
    secretrotatedutc TEXT,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_notification_endpoints_tenantname" ON "notification_endpoints" ("tenantid", "name");
CREATE INDEX IF NOT EXISTS "idx_notification_endpoints_active" ON "notification_endpoints" ("active");
CREATE TABLE IF NOT EXISTS "notification_endpoint_events" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    endpointid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    eventname VARCHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_notification_endpoint_events_parent" ON "notification_endpoint_events" ("endpointid", "position");
CREATE TABLE IF NOT EXISTS "notification_deliveries" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    endpointid VARCHAR(64) NOT NULL,
    eventname VARCHAR(64) NOT NULL,
    eventkey VARCHAR(256) NOT NULL,
    subjecttype VARCHAR(32) NOT NULL,
    subjectid VARCHAR(64),
    status VARCHAR(32) NOT NULL,
    attempts INTEGER NOT NULL,
    maxattempts INTEGER NOT NULL,
    nextattemptutc TEXT,
    claimedby VARCHAR(128),
    claimuntilutc TEXT,
    laststatuscode INTEGER,
    lasterror TEXT,
    lastattemptutc TEXT,
    lastdurationms BIGINT NOT NULL,
    deliveredutc TEXT,
    payload TEXT NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_notification_deliveries_eventkey" ON "notification_deliveries" ("endpointid", "eventkey");
CREATE INDEX IF NOT EXISTS "idx_notification_deliveries_due" ON "notification_deliveries" ("status", "nextattemptutc");
CREATE INDEX IF NOT EXISTS "idx_notification_deliveries_endpoint" ON "notification_deliveries" ("tenantid", "endpointid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_notification_deliveries_created" ON "notification_deliveries" ("createdutc");
CREATE TABLE IF NOT EXISTS "notification_cursors" (
    source VARCHAR(64) NOT NULL PRIMARY KEY,
    cursorutc TEXT NOT NULL,
    cursorid VARCHAR(64),
    lastupdateutc TEXT NOT NULL
);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 28, 'Cron and webhook triggers, notification endpoints, and the notification outbox', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 28);

-- Migration 29: Epoch fenced effect journal and recovery checkpoints
CREATE TABLE IF NOT EXISTS "effect_operations" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    runid VARCHAR(64) NOT NULL,
    leaseepoch BIGINT NOT NULL,
    tool VARCHAR(512) NOT NULL,
    argumentdigest VARCHAR(64) NOT NULL,
    state VARCHAR(32) NOT NULL,
    resultreference VARCHAR(1024),
    createdutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_effect_operations_run" ON "effect_operations" ("tenantid", "runid", "leaseepoch");
CREATE TABLE IF NOT EXISTS "effect_checkpoints" (
    tenantid VARCHAR(64) NOT NULL,
    runid VARCHAR(64) NOT NULL PRIMARY KEY,
    leaseepoch BIGINT NOT NULL,
    gatewayonly INTEGER NOT NULL,
    createdutc TEXT NOT NULL
);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 29, 'Epoch fenced effect journal and recovery checkpoints', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 29);

-- Migration 31: Tenant weighted scheduling
ALTER TABLE "tenants" ADD COLUMN schedulingweight INTEGER NOT NULL DEFAULT 1;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 31, 'Tenant weighted scheduling', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 31);

-- Migration 30: Durable continuation checkpoints and session contracts
ALTER TABLE "deployments" ADD COLUMN suspensionenabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "harness_profiles" ADD COLUMN sessionformat VARCHAR(128);
CREATE TABLE IF NOT EXISTS "run_checkpoints" (
    runid VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    artifactid VARCHAR(64) NOT NULL,
    sessionid VARCHAR(256) NOT NULL,
    sessionformat VARCHAR(128) NOT NULL,
    epoch BIGINT NOT NULL,
    createdutc TEXT NOT NULL
);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 30, 'Durable continuation checkpoints and session contracts', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 30);

-- Migration 32: Revocable provider credential leases
ALTER TABLE "secrets" ADD COLUMN brokerresource VARCHAR(512);
ALTER TABLE "secrets" ADD COLUMN brokeraudience VARCHAR(512);
CREATE TABLE IF NOT EXISTS "credential_leases" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    runid VARCHAR(64) NOT NULL,
    secretid VARCHAR(64) NOT NULL,
    leaseepoch BIGINT NOT NULL,
    resource VARCHAR(512) NOT NULL,
    audience VARCHAR(512),
    state VARCHAR(32) NOT NULL,
    expiresutc TEXT NOT NULL,
    createdutc TEXT NOT NULL,
    revokedutc TEXT,
    revokeattempts INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_credential_leases_attempt" ON "credential_leases" ("runid", "leaseepoch", "secretid");
CREATE INDEX IF NOT EXISTS "idx_credential_leases_pending" ON "credential_leases" ("state", "expiresutc");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 32, 'Revocable provider credential leases', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 32);

-- Migration 33: One-time exact-input durable approval grants
ALTER TABLE "approvals" ADD COLUMN inputdigest VARCHAR(64);
ALTER TABLE "approvals" ADD COLUMN resumeepoch BIGINT;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 33, 'One-time exact-input durable approval grants', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 33);

-- Migration 34: Exact scoped per-run database attribution
CREATE TABLE IF NOT EXISTS "run_database_usage" (
    tenantid VARCHAR(64) NOT NULL,
    runid VARCHAR(64) NOT NULL,
    operation VARCHAR(64) NOT NULL,
    statements BIGINT NOT NULL DEFAULT 0,
    reads BIGINT NOT NULL DEFAULT 0,
    writes BIGINT NOT NULL DEFAULT 0,
    errors BIGINT NOT NULL DEFAULT 0,
    transactions BIGINT NOT NULL DEFAULT 0,
    durationmicroseconds BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (tenantid,runid,operation)
);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 34, 'Exact scoped per-run database attribution', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 34);

-- Migration 35: Agent revisions, environments, and promotions
ALTER TABLE "agents" ADD COLUMN latestpublishedrevisionid VARCHAR(64);
ALTER TABLE "agents" ADD COLUMN draftrevisionid VARCHAR(64);
ALTER TABLE "deployments" ADD COLUMN agentrevisionid VARCHAR(64);
ALTER TABLE "deployments" ADD COLUMN environment VARCHAR(32) NOT NULL DEFAULT 'dev';
ALTER TABLE "runs" ADD COLUMN agentrevisionid VARCHAR(64);
CREATE TABLE IF NOT EXISTS "agent_revisions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    number INTEGER NOT NULL,
    state VARCHAR(16) NOT NULL,
    contenthash VARCHAR(64) NOT NULL,
    displayname VARCHAR(256),
    description TEXT,
    inputmode VARCHAR(64) NOT NULL,
    inputschemajson TEXT,
    outputschemajson TEXT,
    delegationmode VARCHAR(64) NOT NULL,
    delegationmaxdepth INTEGER NOT NULL,
    delegationallowrecursion INTEGER NOT NULL,
    authoruserid VARCHAR(64),
    authorname VARCHAR(256),
    changenote VARCHAR(2000),
    publishedbyuserid VARCHAR(64),
    publishedbyname VARCHAR(256),
    publishedutc TEXT,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_agent_revisions_number" ON "agent_revisions" ("agentid", "number");
CREATE INDEX IF NOT EXISTS "idx_agent_revisions_tenant" ON "agent_revisions" ("tenantid", "agentid");
CREATE TABLE IF NOT EXISTS "agent_revision_prompt_pins" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    role VARCHAR(64) NOT NULL,
    templateid VARCHAR(64) NOT NULL,
    pinnedversion INTEGER
);
CREATE INDEX IF NOT EXISTS "idx_agent_revision_prompt_pins_parent" ON "agent_revision_prompt_pins" ("revisionid", "position");
CREATE TABLE IF NOT EXISTS "agent_revision_allowlist" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    agentname VARCHAR(128) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_agent_revision_allowlist_parent" ON "agent_revision_allowlist" ("revisionid", "position");
CREATE TABLE IF NOT EXISTS "agent_revision_capabilities" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    capability VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_agent_revision_capabilities_parent" ON "agent_revision_capabilities" ("revisionid", "position");
CREATE TABLE IF NOT EXISTS "agent_revision_tags" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    tag VARCHAR(128) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_agent_revision_tags_parent" ON "agent_revision_tags" ("revisionid", "position");
CREATE INDEX IF NOT EXISTS "idx_deployments_environment" ON "deployments" ("tenantid", "environment");
CREATE TABLE IF NOT EXISTS "tenant_environments" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(32) NOT NULL,
    description VARCHAR(1000),
    position INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenant_environments_name" ON "tenant_environments" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "promotion_records" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    kind VARCHAR(16) NOT NULL,
    outcome VARCHAR(16) NOT NULL,
    agentid VARCHAR(64),
    appid VARCHAR(64),
    apprevisionid VARCHAR(64),
    agentrevisionid VARCHAR(64),
    sourceenvironment VARCHAR(32) NOT NULL,
    targetenvironment VARCHAR(32) NOT NULL,
    skippedenvironments INTEGER NOT NULL,
    rollbackofid VARCHAR(64),
    rolledbackbyid VARCHAR(64),
    actortype VARCHAR(32) NOT NULL,
    actorid VARCHAR(128),
    actorname VARCHAR(256),
    note VARCHAR(2000),
    createdutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_promotion_records_tenant" ON "promotion_records" ("tenantid", "createdutc");
CREATE TABLE IF NOT EXISTS "promotion_record_items" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    promotionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    deploymentid VARCHAR(64) NOT NULL,
    deploymentname VARCHAR(128) NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    previousrevisionid VARCHAR(64),
    newrevisionid VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS "idx_promotion_record_items_parent" ON "promotion_record_items" ("promotionid", "position");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 35, 'Agent revisions, environments, and promotions', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 35);

-- Migration 36: Agent assets, asset versions, revision asset pins, and harness asset placements
CREATE TABLE IF NOT EXISTS "agent_assets" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    description TEXT,
    prompttemplateid VARCHAR(64),
    artifactstoreid VARCHAR(64),
    currentversion INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_agent_assets_name" ON "agent_assets" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "agent_asset_tags" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    assetid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    tag VARCHAR(128) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_agent_asset_tags_parent" ON "agent_asset_tags" ("assetid", "position");
CREATE TABLE IF NOT EXISTS "agent_asset_versions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    assetid VARCHAR(64) NOT NULL,
    number INTEGER NOT NULL,
    totalbytes BIGINT NOT NULL,
    authorname VARCHAR(256),
    changenote VARCHAR(2000),
    createdutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_agent_asset_versions_number" ON "agent_asset_versions" ("assetid", "number");
CREATE TABLE IF NOT EXISTS "agent_asset_version_files" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    versionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    path VARCHAR(512) NOT NULL,
    mediatype VARCHAR(255) NOT NULL,
    sizebytes BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    storagekey VARCHAR(1024) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_agent_asset_version_files_parent" ON "agent_asset_version_files" ("versionid", "path");
CREATE TABLE IF NOT EXISTS "agent_asset_blobs" (
    storagekey VARCHAR(1024) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    sizebytes BIGINT NOT NULL,
    content BLOB NOT NULL,
    createdutc TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "agent_revision_asset_pins" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    assetid VARCHAR(64) NOT NULL,
    version INTEGER
);
CREATE INDEX IF NOT EXISTS "idx_agent_revision_asset_pins_parent" ON "agent_revision_asset_pins" ("revisionid", "position");
CREATE INDEX IF NOT EXISTS "idx_agent_revision_asset_pins_asset" ON "agent_revision_asset_pins" ("tenantid", "assetid");
CREATE TABLE IF NOT EXISTS "harness_profile_asset_placements" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    kind VARCHAR(32) NOT NULL,
    pathtemplate VARCHAR(512) NOT NULL,
    listinsystemprompt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_harness_profile_asset_placements_parent" ON "harness_profile_asset_placements" ("harnessprofileid", "position");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 36, 'Agent assets, asset versions, revision asset pins, and harness asset placements', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 36);

-- Migration 37: Conversation file spaces
ALTER TABLE "deployments" ADD COLUMN filespacemountpath VARCHAR(128) NOT NULL DEFAULT 'files';
ALTER TABLE "runs" ADD COLUMN filespaceid VARCHAR(64);
CREATE TABLE IF NOT EXISTS "conversation_file_spaces" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    ownerkey VARCHAR(128) NOT NULL,
    conversationid VARCHAR(64),
    pipelinerunid VARCHAR(64),
    rootrunid VARCHAR(64),
    artifactstoreid VARCHAR(64),
    filecount INTEGER NOT NULL,
    totalbytes BIGINT NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_conversation_file_spaces_owner" ON "conversation_file_spaces" ("tenantid", "ownerkey");
CREATE TABLE IF NOT EXISTS "conversation_files" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    filespaceid VARCHAR(64) NOT NULL,
    path VARCHAR(512) NOT NULL,
    currentversion INTEGER NOT NULL,
    sizebytes BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    mediatype VARCHAR(255) NOT NULL,
    deleted INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_conversation_files_path" ON "conversation_files" ("filespaceid", "path");
CREATE TABLE IF NOT EXISTS "conversation_file_versions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    fileid VARCHAR(64) NOT NULL,
    number INTEGER NOT NULL,
    sizebytes BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    mediatype VARCHAR(255) NOT NULL,
    runid VARCHAR(64),
    leaseepoch BIGINT,
    writtenby VARCHAR(256),
    storagekey VARCHAR(1024) NOT NULL,
    createdutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_conversation_file_versions_number" ON "conversation_file_versions" ("fileid", "number");
CREATE TABLE IF NOT EXISTS "file_space_blobs" (
    storagekey VARCHAR(1024) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    sizebytes BIGINT NOT NULL,
    content BLOB NOT NULL,
    createdutc TEXT NOT NULL
);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 37, 'Conversation file spaces', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 37);

-- Migration 38: Capability descriptors and harness tool probes
ALTER TABLE "mcp_test_tools" ADD COLUMN description TEXT;
ALTER TABLE "mcp_test_tools" ADD COLUMN inputschemajson TEXT;
CREATE TABLE IF NOT EXISTS "capability_descriptors" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64),
    scopekey VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    origin VARCHAR(32) NOT NULL,
    sourcekey VARCHAR(512) NOT NULL,
    sourceagentid VARCHAR(64),
    sourcerevisionid VARCHAR(64),
    sourcemcpserverid VARCHAR(64),
    sourcetoolname VARCHAR(256),
    sourceharnessprofileid VARCHAR(64),
    sourceharnesstype VARCHAR(32),
    summary TEXT,
    inputschemajson TEXT,
    outputschemajson TEXT,
    hintstatus VARCHAR(32) NOT NULL,
    hintsamplesize INTEGER NOT NULL,
    hintmediandurationms BIGINT,
    hintp90durationms BIGINT,
    hintmeancostusd REAL,
    hintwindowdays INTEGER NOT NULL,
    hintcomputedutc TEXT,
    refreshwarning TEXT,
    lastrefreshedutc TEXT,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_capability_descriptors_source" ON "capability_descriptors" ("scopekey", "sourcekey");
CREATE INDEX IF NOT EXISTS "idx_capability_descriptors_tenantkind" ON "capability_descriptors" ("tenantid", "kind", "name");
CREATE TABLE IF NOT EXISTS "capability_descriptor_tags" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    capabilityid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    tag VARCHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_capability_descriptor_tags_parent" ON "capability_descriptor_tags" ("capabilityid", "position");
CREATE TABLE IF NOT EXISTS "capability_descriptor_requirements" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    capabilityid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    labelkey VARCHAR(256) NOT NULL,
    labelvalue VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_capability_descriptor_requirements_parent" ON "capability_descriptor_requirements" ("capabilityid", "position");
CREATE TABLE IF NOT EXISTS "harness_profile_tool_probes" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    name VARCHAR(64) NOT NULL,
    executable VARCHAR(128) NOT NULL,
    argument VARCHAR(32),
    description TEXT
);
CREATE INDEX IF NOT EXISTS "idx_harness_profile_tool_probes_parent" ON "harness_profile_tool_probes" ("harnessprofileid", "position");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 38, 'Capability descriptors and harness tool probes', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 38);

-- Migration 39: Fan-out groups
ALTER TABLE "runs" ADD COLUMN fanoutgroupid VARCHAR(64);
CREATE TABLE IF NOT EXISTS "fan_out_groups" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    parentrunid VARCHAR(64) NOT NULL,
    rootrunid VARCHAR(64) NOT NULL,
    joinpolicy VARCHAR(16) NOT NULL,
    quorum INTEGER NOT NULL,
    timeoutseconds INTEGER NOT NULL,
    deadlineutc TEXT,
    maxcostusd REAL,
    maxtokens BIGINT,
    cancelremaining INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    statusreason TEXT,
    costusd REAL NOT NULL,
    tokens BIGINT NOT NULL,
    requestdigest VARCHAR(64) NOT NULL,
    createdutc TEXT NOT NULL,
    completedutc TEXT,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_fan_out_groups_parent" ON "fan_out_groups" ("tenantid", "parentrunid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_fan_out_groups_status" ON "fan_out_groups" ("status", "createdutc");
CREATE TABLE IF NOT EXISTS "fan_out_group_members" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    groupid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    label VARCHAR(128) NOT NULL,
    agentname VARCHAR(128) NOT NULL,
    childrunid VARCHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_fan_out_group_members_parent" ON "fan_out_group_members" ("groupid", "position");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 39, 'Fan-out groups', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 39);

-- Migration 40: Agentic apps and app revisions
ALTER TABLE "conversations" ADD COLUMN appid VARCHAR(64);
CREATE TABLE IF NOT EXISTS "agentic_apps" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(64) NOT NULL,
    slug VARCHAR(64) NOT NULL,
    description TEXT,
    entryagentid VARCHAR(64) NOT NULL,
    liveenvironment VARCHAR(64) NOT NULL,
    authmode VARCHAR(32) NOT NULL,
    anonymousenabled INTEGER NOT NULL,
    showoperatordetail INTEGER NOT NULL,
    displayname VARCHAR(128),
    logoassetid VARCHAR(64),
    primarycolor VARCHAR(16),
    accentcolor VARCHAR(16),
    welcometext TEXT,
    latestpublishedrevisionid VARCHAR(64),
    active INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_agentic_apps_slug" ON "agentic_apps" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_agentic_apps_name" ON "agentic_apps" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "agentic_app_members" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    appid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    role VARCHAR(256)
);
CREATE INDEX IF NOT EXISTS "idx_agentic_app_members_parent" ON "agentic_app_members" ("appid", "position");
CREATE INDEX IF NOT EXISTS "idx_agentic_app_members_agent" ON "agentic_app_members" ("agentid");
CREATE TABLE IF NOT EXISTS "agentic_app_edges" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    appid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    calleragentid VARCHAR(64) NOT NULL,
    calleeagentid VARCHAR(64) NOT NULL,
    fanoutallowed INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_agentic_app_edges_parent" ON "agentic_app_edges" ("appid", "position");
CREATE TABLE IF NOT EXISTS "agentic_app_environments" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    appid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    environment VARCHAR(64) NOT NULL,
    deploymentid VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS "idx_agentic_app_environments_parent" ON "agentic_app_environments" ("appid", "position");
CREATE TABLE IF NOT EXISTS "app_revisions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    appid VARCHAR(64) NOT NULL,
    number INTEGER NOT NULL,
    state VARCHAR(16) NOT NULL,
    authorname VARCHAR(256),
    changenote TEXT,
    publishedbyname VARCHAR(256),
    publishedutc TEXT,
    createdutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_app_revisions_number" ON "app_revisions" ("appid", "number");
CREATE TABLE IF NOT EXISTS "app_revision_members" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    revisionid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    agentrevisionid VARCHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_app_revision_members_parent" ON "app_revision_members" ("revisionid", "position");
CREATE TABLE IF NOT EXISTS "app_revision_edges" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    revisionid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    calleragentid VARCHAR(64) NOT NULL,
    calleeagentid VARCHAR(64) NOT NULL,
    fanoutallowed INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_app_revision_edges_parent" ON "app_revision_edges" ("revisionid", "position");
CREATE TABLE IF NOT EXISTS "app_sessions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    appid VARCHAR(64) NOT NULL,
    tokenhash VARCHAR(64) NOT NULL,
    userid VARCHAR(64),
    principalname VARCHAR(256) NOT NULL,
    expiresutc TEXT NOT NULL,
    revokedutc TEXT,
    createdutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_app_sessions_token" ON "app_sessions" ("tokenhash");
CREATE INDEX IF NOT EXISTS "idx_app_sessions_expires" ON "app_sessions" ("expiresutc");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 40, 'Agentic apps and app revisions', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 40);

-- Migration 41: Studio drafts and deployment management access
ALTER TABLE "deployments" ADD COLUMN managementaccess VARCHAR(16) NOT NULL DEFAULT 'None';
ALTER TABLE "approvals" ADD COLUMN draftid VARCHAR(64);
CREATE TABLE IF NOT EXISTS "studio_drafts" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    title VARCHAR(256) NOT NULL,
    owneruserid VARCHAR(64),
    ownername VARCHAR(256),
    conversationid VARCHAR(64),
    targetapp VARCHAR(64),
    version INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    approvalid VARCHAR(64),
    publishonapply INTEGER NOT NULL,
    manifestapplyid VARCHAR(64),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_studio_drafts_tenant" ON "studio_drafts" ("tenantid", "lastupdateutc");
CREATE TABLE IF NOT EXISTS "studio_draft_items" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    draftid VARCHAR(64) NOT NULL,
    kind VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    operation VARCHAR(16) NOT NULL,
    document TEXT NOT NULL,
    basehash VARCHAR(64),
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_studio_draft_items_key" ON "studio_draft_items" ("draftid", "kind", "name");
CREATE TABLE IF NOT EXISTS "studio_draft_layout" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    draftid VARCHAR(64) NOT NULL,
    nodekey VARCHAR(320) NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_studio_draft_layout_key" ON "studio_draft_layout" ("draftid", "nodekey");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 41, 'Studio drafts and deployment management access', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 41);

-- Migration 42: App branding colors, typeface, and favicon
ALTER TABLE "agentic_apps" ADD COLUMN backgroundcolor VARCHAR(16);
ALTER TABLE "agentic_apps" ADD COLUMN headercolor VARCHAR(16);
ALTER TABLE "agentic_apps" ADD COLUMN agentbubblecolor VARCHAR(16);
ALTER TABLE "agentic_apps" ADD COLUMN fontfamily VARCHAR(32);
ALTER TABLE "agentic_apps" ADD COLUMN faviconassetid VARCHAR(64);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 42, 'App branding colors, typeface, and favicon', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 42);

-- Migration 43: App branding colors for the conversation list, message input, and file list
ALTER TABLE "agentic_apps" ADD COLUMN conversationlistcolor VARCHAR(16);
ALTER TABLE "agentic_apps" ADD COLUMN composercolor VARCHAR(16);
ALTER TABLE "agentic_apps" ADD COLUMN filescolor VARCHAR(16);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 43, 'App branding colors for the conversation list, message input, and file list', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 43);

-- Migration 44: Typed inference protocols and secret-backed authentication
CREATE TABLE IF NOT EXISTS "deployment_inference_endpoints" (
    deploymentid VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    protocol VARCHAR(32) NOT NULL,
    baseurl TEXT NOT NULL,
    authenticationtype VARCHAR(32) NOT NULL
);
CREATE TABLE IF NOT EXISTS "deployment_inference_credentials" (
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    name VARCHAR(256) NOT NULL,
    location VARCHAR(32) NOT NULL,
    secretid VARCHAR(64) NOT NULL,
    PRIMARY KEY (deploymentid, position)
);
CREATE INDEX IF NOT EXISTS "idx_deployment_inference_credentials_secret" ON "deployment_inference_credentials" ("tenantid", "secretid");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 44, 'Typed inference protocols and secret-backed authentication', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 44);

-- Migration 45: Reusable harness runtime connections
CREATE TABLE IF NOT EXISTS "harness_runtime_settings" (
    profileid VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    model VARCHAR(512),
    endpointname VARCHAR(256),
    credentialsecretid VARCHAR(64),
    protocol VARCHAR(32),
    baseurl TEXT,
    authenticationtype VARCHAR(32)
);
CREATE TABLE IF NOT EXISTS "harness_runtime_credentials" (
    profileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    name VARCHAR(256) NOT NULL,
    location VARCHAR(32) NOT NULL,
    secretid VARCHAR(64) NOT NULL,
    PRIMARY KEY (profileid, position)
);
CREATE INDEX IF NOT EXISTS "idx_harness_runtime_credentials_secret" ON "harness_runtime_credentials" ("tenantid", "secretid");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 45, 'Reusable harness runtime connections', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 45);

-- Migration 46: Mandates, mandate revisions, and keeper ticks
ALTER TABLE "runs" ADD COLUMN mandateid VARCHAR(64);
ALTER TABLE "runs" ADD COLUMN mandatetickid VARCHAR(64);
CREATE INDEX IF NOT EXISTS "idx_runs_mandate" ON "runs" ("tenantid", "mandateid", "createdutc") WHERE mandateid IS NOT NULL;
CREATE TABLE IF NOT EXISTS "mandates" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    agentid VARCHAR(64) NOT NULL,
    deploymentid VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    currentrevisionid VARCHAR(64),
    currentrevisionnumber INTEGER NOT NULL,
    nextwakeutc TEXT,
    pendingwakesource VARCHAR(32),
    currentintervalseconds INTEGER NOT NULL,
    consecutivequietticks INTEGER NOT NULL,
    lasttickutc TEXT,
    lasttickoutcome VARCHAR(32),
    activerunid VARCHAR(64),
    activetickid VARCHAR(64),
    tickcount BIGINT NOT NULL,
    runastype VARCHAR(32) NOT NULL,
    runasid VARCHAR(64),
    runasname VARCHAR(256),
    createdby VARCHAR(256),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mandates_tenantname" ON "mandates" ("tenantid", "name");
CREATE INDEX IF NOT EXISTS "idx_mandates_due" ON "mandates" ("status", "nextwakeutc");
CREATE INDEX IF NOT EXISTS "idx_mandates_agent" ON "mandates" ("tenantid", "agentid");
CREATE INDEX IF NOT EXISTS "idx_mandates_deployment" ON "mandates" ("tenantid", "deploymentid");
CREATE INDEX IF NOT EXISTS "idx_mandates_tenantcreated" ON "mandates" ("tenantid", "createdutc");
CREATE TABLE IF NOT EXISTS "mandate_revisions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    mandateid VARCHAR(64) NOT NULL,
    number INTEGER NOT NULL,
    state VARCHAR(32) NOT NULL,
    objective TEXT NOT NULL,
    healthydefinition TEXT,
    autonomy TEXT,
    escalationpolicy TEXT,
    direction TEXT,
    wakemode VARCHAR(32) NOT NULL,
    minintervalseconds INTEGER NOT NULL,
    maxintervalseconds INTEGER NOT NULL,
    backofffactor REAL NOT NULL,
    jitterpercent INTEGER,
    budgetpertickusd REAL,
    budgetperdayusd REAL,
    maxtokenspertick BIGINT,
    source VARCHAR(32) NOT NULL,
    author VARCHAR(256),
    changenote VARCHAR(1024),
    createdutc TEXT NOT NULL,
    publishedutc TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mandate_revisions_number" ON "mandate_revisions" ("mandateid", "number");
CREATE INDEX IF NOT EXISTS "idx_mandate_revisions_tenantmandate" ON "mandate_revisions" ("tenantid", "mandateid");
CREATE TABLE IF NOT EXISTS "mandate_revision_signals" (
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    PRIMARY KEY (revisionid, position)
);
CREATE INDEX IF NOT EXISTS "idx_mandate_revision_signals_tenant" ON "mandate_revision_signals" ("tenantid", "revisionid");
CREATE TABLE IF NOT EXISTS "mandate_ticks" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    mandateid VARCHAR(64) NOT NULL,
    revisionid VARCHAR(64),
    revisionnumber INTEGER NOT NULL,
    wakesource VARCHAR(32) NOT NULL,
    scheduledutc TEXT NOT NULL,
    startedutc TEXT NOT NULL,
    finishedutc TEXT,
    runid VARCHAR(64),
    outcome VARCHAR(32),
    reported INTEGER NOT NULL,
    requestednextwakeseconds INTEGER,
    appliedintervalseconds INTEGER,
    costusd REAL,
    summary TEXT,
    templatename VARCHAR(256),
    templateversion INTEGER NOT NULL,
    errorcode VARCHAR(64),
    errormessage TEXT,
    createdutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_mandate_ticks_mandate" ON "mandate_ticks" ("tenantid", "mandateid", "startedutc");
CREATE INDEX IF NOT EXISTS "idx_mandate_ticks_run" ON "mandate_ticks" ("runid");
CREATE INDEX IF NOT EXISTS "idx_mandate_ticks_created" ON "mandate_ticks" ("createdutc");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 46, 'Mandates, mandate revisions, and keeper ticks', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 46);

-- Migration 47: Escalations
ALTER TABLE "runs" ADD COLUMN escalationid VARCHAR(64);
ALTER TABLE "mandate_revisions" ADD COLUMN escalationtargetkind VARCHAR(32);
ALTER TABLE "mandate_revisions" ADD COLUMN escalationtargetid VARCHAR(64);
ALTER TABLE "notification_endpoints" ADD COLUMN escalationminseverity VARCHAR(32);
CREATE TABLE IF NOT EXISTS "escalations" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    raisingrunid VARCHAR(64),
    leaseepoch BIGINT NOT NULL,
    agentid VARCHAR(64),
    agentname VARCHAR(256),
    mandateid VARCHAR(64),
    mandatetickid VARCHAR(64),
    targetkind VARCHAR(32) NOT NULL,
    targetid VARCHAR(64),
    targetname VARCHAR(256),
    severity VARCHAR(32) NOT NULL,
    mode VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    question TEXT NOT NULL,
    context TEXT,
    defaultanswer TEXT,
    timeoutseconds INTEGER NOT NULL,
    expiresutc TEXT,
    timeoutaction VARCHAR(32) NOT NULL,
    parentescalationid VARCHAR(64),
    escalatedtoid VARCHAR(64),
    routedrunid VARCHAR(64),
    answerchoice VARCHAR(64),
    answertext TEXT,
    resolvedby VARCHAR(256),
    resolutionsource VARCHAR(32),
    resolvedutc TEXT,
    deliveredtickid VARCHAR(64),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_escalations_tenantstatus" ON "escalations" ("tenantid", "status", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_escalations_run" ON "escalations" ("tenantid", "raisingrunid");
CREATE INDEX IF NOT EXISTS "idx_escalations_mandate" ON "escalations" ("tenantid", "mandateid");
CREATE INDEX IF NOT EXISTS "idx_escalations_target" ON "escalations" ("tenantid", "targetkind", "targetid");
CREATE INDEX IF NOT EXISTS "idx_escalations_expiry" ON "escalations" ("status", "expiresutc");
CREATE TABLE IF NOT EXISTS "escalation_options" (
    escalationid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    optionkey VARCHAR(64) NOT NULL,
    label VARCHAR(512),
    PRIMARY KEY (escalationid, position)
);
CREATE INDEX IF NOT EXISTS "idx_escalation_options_tenant" ON "escalation_options" ("tenantid", "escalationid");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 47, 'Escalations', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 47);

-- Migration 48: Freezes and mandate spend caps
ALTER TABLE "run_usage" ADD COLUMN mandateid VARCHAR(64);
CREATE TABLE IF NOT EXISTS "freezes" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    targetkind VARCHAR(32) NOT NULL,
    targetid VARCHAR(64) NOT NULL,
    targetname VARCHAR(256),
    reason TEXT,
    cancelactiveruns INTEGER NOT NULL,
    cancelledruncount INTEGER NOT NULL,
    createdbyid VARCHAR(64),
    createdbyname VARCHAR(256),
    liftedbyid VARCHAR(64),
    liftedbyname VARCHAR(256),
    liftreason TEXT,
    liftedutc TEXT,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_freezes_target" ON "freezes" ("tenantid", "targetkind", "targetid", "liftedutc");
CREATE INDEX IF NOT EXISTS "idx_freezes_created" ON "freezes" ("tenantid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_freezes_changed" ON "freezes" ("tenantid", "lastupdateutc");
UPDATE "run_usage" SET mandateid = (SELECT r.mandateid FROM "runs" r WHERE r.id = runid) WHERE mandateid IS NULL;
CREATE INDEX IF NOT EXISTS "idx_run_usage_mandate" ON "run_usage" ("tenantid", "mandateid");
DROP VIEW "quota_usage_source";
CREATE VIEW "quota_usage_source" AS SELECT runid, tenantid, agentid, deploymentid, mandateid, harnesstype, admittedutc, completedutc, inputtokens, outputtokens, cachedtokens, costusd FROM "run_usage" UNION ALL SELECT r.id, r.tenantid, r.agentid, r.deploymentid, r.mandateid, r.harnesstype, COALESCE(r.queuedutc, r.createdutc), r.completedutc, r.inputtokens, r.outputtokens, r.cachedtokens, r.costusd FROM "runs" r WHERE NOT EXISTS (SELECT 1 FROM "run_usage" u WHERE u.runid = r.id);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 48, 'Freezes and mandate spend caps', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 48);

-- Migration 49: Scoped memory entries
CREATE TABLE IF NOT EXISTS "memory_entries" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    scopekind VARCHAR(32) NOT NULL,
    scopeid VARCHAR(64) NOT NULL,
    memorykey VARCHAR(256) NOT NULL,
    keyhash VARCHAR(64) NOT NULL,
    legacy INTEGER NOT NULL,
    category VARCHAR(128),
    bytes BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    contentid VARCHAR(128) NOT NULL,
    version BIGINT NOT NULL,
    writeragentid VARCHAR(64),
    writerrunid VARCHAR(64),
    writerprincipaltype VARCHAR(32),
    writerprincipalid VARCHAR(64),
    writername VARCHAR(256),
    lastreadutc TEXT,
    expiresutc TEXT,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_memory_entries_key" ON "memory_entries" ("tenantid", "scopekind", "scopeid", "memorykey");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_memory_entries_keyhash" ON "memory_entries" ("tenantid", "scopekind", "scopeid", "keyhash");
CREATE INDEX IF NOT EXISTS "idx_memory_entries_category" ON "memory_entries" ("tenantid", "category");
CREATE INDEX IF NOT EXISTS "idx_memory_entries_writer" ON "memory_entries" ("tenantid", "writeragentid");
CREATE INDEX IF NOT EXISTS "idx_memory_entries_expires" ON "memory_entries" ("expiresutc");
CREATE TABLE IF NOT EXISTS "memory_entry_tags" (
    entryid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    tag VARCHAR(64) NOT NULL,
    PRIMARY KEY (entryid, tag)
);
CREATE INDEX IF NOT EXISTS "idx_memory_entry_tags_tag" ON "memory_entry_tags" ("tenantid", "tag");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 49, 'Scoped memory entries', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 49);

-- Migration 50: Reports
CREATE TABLE IF NOT EXISTS "reports" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    authoragentid VARCHAR(64),
    authoragentname VARCHAR(256),
    runid VARCHAR(64),
    mandateid VARCHAR(64),
    mandatetickid VARCHAR(64),
    orgunitid VARCHAR(64),
    appid VARCHAR(64),
    appname VARCHAR(256),
    audience VARCHAR(32) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    health VARCHAR(32) NOT NULL,
    title VARCHAR(256) NOT NULL,
    body TEXT,
    periodstartutc TEXT,
    periodendutc TEXT,
    filedbyprincipaltype VARCHAR(32) NOT NULL,
    filedbyprincipalid VARCHAR(64),
    filedbyname VARCHAR(256),
    filingkey VARCHAR(64),
    createdutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_reports_author" ON "reports" ("tenantid", "authoragentid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_reports_orgunit" ON "reports" ("tenantid", "orgunitid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_reports_app" ON "reports" ("tenantid", "appid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_reports_created" ON "reports" ("tenantid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_reports_health" ON "reports" ("health", "createdutc");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_reports_filing" ON "reports" ("tenantid", "filingkey");
CREATE TABLE IF NOT EXISTS "report_metrics" (
    reportid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    authoragentid VARCHAR(64),
    metricname VARCHAR(64) NOT NULL,
    metricvalue REAL NOT NULL,
    unit VARCHAR(32),
    pointutc TEXT NOT NULL,
    createdutc TEXT NOT NULL,
    PRIMARY KEY (reportid, position)
);
CREATE INDEX IF NOT EXISTS "idx_report_metrics_series" ON "report_metrics" ("tenantid", "authoragentid", "metricname", "pointutc");
CREATE TABLE IF NOT EXISTS "report_issues" (
    reportid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    severity VARCHAR(32) NOT NULL,
    issuetext TEXT NOT NULL,
    PRIMARY KEY (reportid, position)
);
CREATE TABLE IF NOT EXISTS "report_decisions" (
    reportid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    decisiontext TEXT NOT NULL,
    PRIMARY KEY (reportid, position)
);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 50, 'Reports', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 50);

-- Migration 51: Agent messages
CREATE TABLE IF NOT EXISTS "agent_messages" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    threadid VARCHAR(64) NOT NULL,
    parentmessageid VARCHAR(64),
    hopcount INTEGER NOT NULL,
    senderagentid VARCHAR(64),
    senderagentname VARCHAR(256),
    senderrunid VARCHAR(64),
    senderprincipaltype VARCHAR(32) NOT NULL,
    senderprincipalid VARCHAR(64),
    sendername VARCHAR(256),
    recipientagentid VARCHAR(64) NOT NULL,
    recipientagentname VARCHAR(256),
    urgency VARCHAR(32) NOT NULL,
    subject VARCHAR(256) NOT NULL,
    body TEXT,
    status VARCHAR(32) NOT NULL,
    rejectionreason VARCHAR(32),
    rejectiondetail VARCHAR(1024),
    escalationid VARCHAR(64),
    wokerecipient INTEGER NOT NULL DEFAULT 0,
    deliveredrunid VARCHAR(64),
    deliveredutc TEXT,
    deliveryclaim VARCHAR(64),
    claimedutc TEXT,
    acknowledgedutc TEXT,
    expiresutc TEXT,
    sendkey VARCHAR(64),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_agent_messages_inbox" ON "agent_messages" ("tenantid", "recipientagentid", "status", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_agent_messages_thread" ON "agent_messages" ("threadid");
CREATE INDEX IF NOT EXISTS "idx_agent_messages_line" ON "agent_messages" ("tenantid", "senderagentid", "recipientagentid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_agent_messages_created" ON "agent_messages" ("tenantid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_agent_messages_expiry" ON "agent_messages" ("status", "expiresutc");
CREATE INDEX IF NOT EXISTS "idx_agent_messages_deliveredrun" ON "agent_messages" ("deliveredrunid");
CREATE INDEX IF NOT EXISTS "idx_agent_messages_claim" ON "agent_messages" ("deliveryclaim");
CREATE INDEX IF NOT EXISTS "idx_agent_messages_changes" ON "agent_messages" ("tenantid", "recipientagentid", "lastupdateutc");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_agent_messages_send" ON "agent_messages" ("tenantid", "sendkey");
CREATE TABLE IF NOT EXISTS "agent_message_artifacts" (
    messageid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    artifactid VARCHAR(64) NOT NULL,
    name VARCHAR(1024) NOT NULL,
    mediatype VARCHAR(255) NOT NULL,
    sizebytes BIGINT NOT NULL,
    PRIMARY KEY (messageid, position)
);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 51, 'Agent messages', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 51);

-- Migration 52: Organizations
ALTER TABLE "promotion_records" ADD COLUMN organizationid VARCHAR(64);
ALTER TABLE "promotion_records" ADD COLUMN orgrevisionid VARCHAR(64);
CREATE TABLE IF NOT EXISTS "organizations" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(2000),
    mission TEXT,
    status VARCHAR(32) NOT NULL,
    rootunitid VARCHAR(64),
    currentrevisionid VARCHAR(64),
    currentrevisionnumber INTEGER NOT NULL DEFAULT 0,
    createdby VARCHAR(256),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_organizations_name" ON "organizations" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "org_units" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    organizationid VARCHAR(64) NOT NULL,
    parentunitid VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    description VARCHAR(2000),
    leadagentid VARCHAR(64),
    leadtitle VARCHAR(128),
    leadmandateid VARCHAR(64),
    appid VARCHAR(64),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_org_units_name" ON "org_units" ("organizationid", "name");
CREATE INDEX IF NOT EXISTS "idx_org_units_org" ON "org_units" ("tenantid", "organizationid");
CREATE INDEX IF NOT EXISTS "idx_org_units_lead" ON "org_units" ("tenantid", "leadagentid");
CREATE TABLE IF NOT EXISTS "org_unit_members" (
    unitid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    organizationid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    title VARCHAR(128),
    mandateid VARCHAR(64),
    PRIMARY KEY (unitid, position)
);
CREATE INDEX IF NOT EXISTS "idx_org_unit_members_agent" ON "org_unit_members" ("tenantid", "agentid");
CREATE INDEX IF NOT EXISTS "idx_org_unit_members_org" ON "org_unit_members" ("organizationid");
CREATE TABLE IF NOT EXISTS "org_unit_peer_lines" (
    unitid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    organizationid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    peerunitid VARCHAR(64) NOT NULL,
    PRIMARY KEY (unitid, position)
);
CREATE INDEX IF NOT EXISTS "idx_org_unit_peer_lines_org" ON "org_unit_peer_lines" ("organizationid");
CREATE TABLE IF NOT EXISTS "org_unit_budgets" (
    unitid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    organizationid VARCHAR(64) NOT NULL,
    period VARCHAR(32) NOT NULL,
    amountusd REAL NOT NULL,
    PRIMARY KEY (unitid, period)
);
CREATE INDEX IF NOT EXISTS "idx_org_unit_budgets_org" ON "org_unit_budgets" ("organizationid");
CREATE TABLE IF NOT EXISTS "org_revisions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    organizationid VARCHAR(64) NOT NULL,
    number INTEGER NOT NULL,
    state VARCHAR(32) NOT NULL,
    note VARCHAR(2000),
    rollbackofrevisionid VARCHAR(64),
    authortype VARCHAR(32) NOT NULL,
    authorid VARCHAR(64),
    authorname VARCHAR(256),
    publishedutc TEXT,
    createdutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_org_revisions_number" ON "org_revisions" ("organizationid", "number");
CREATE INDEX IF NOT EXISTS "idx_org_revisions_tenant" ON "org_revisions" ("tenantid", "organizationid");
CREATE TABLE IF NOT EXISTS "org_revision_units" (
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    unitid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    parentunitid VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    description VARCHAR(2000),
    leadagentid VARCHAR(64),
    leadtitle VARCHAR(128),
    leadmandateid VARCHAR(64),
    appid VARCHAR(64),
    PRIMARY KEY (revisionid, unitid)
);
CREATE TABLE IF NOT EXISTS "org_revision_members" (
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    unitid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    title VARCHAR(128),
    mandateid VARCHAR(64),
    PRIMARY KEY (revisionid, unitid, position)
);
CREATE INDEX IF NOT EXISTS "idx_org_revision_members_agent" ON "org_revision_members" ("tenantid", "agentid");
CREATE TABLE IF NOT EXISTS "org_revision_peer_lines" (
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    unitid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    peerunitid VARCHAR(64) NOT NULL,
    PRIMARY KEY (revisionid, unitid, position)
);
CREATE TABLE IF NOT EXISTS "org_revision_budgets" (
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    unitid VARCHAR(64) NOT NULL,
    period VARCHAR(32) NOT NULL,
    amountusd REAL NOT NULL,
    PRIMARY KEY (revisionid, unitid, period)
);
CREATE TABLE IF NOT EXISTS "org_revision_mandates" (
    revisionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    mandateid VARCHAR(64) NOT NULL,
    mandaterevisionid VARCHAR(64) NOT NULL,
    PRIMARY KEY (revisionid, mandateid)
);
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 52, 'Organizations', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 52);

-- Migration 53: Change rules and executive drafts
ALTER TABLE "studio_drafts" ADD COLUMN originrunid VARCHAR(64);
ALTER TABLE "studio_drafts" ADD COLUMN organizationid VARCHAR(64);
ALTER TABLE "studio_drafts" ADD COLUMN executiveunitid VARCHAR(64);
ALTER TABLE "studio_drafts" ADD COLUMN executiveagentid VARCHAR(64);
ALTER TABLE "org_revisions" ADD COLUMN draftid VARCHAR(64);
ALTER TABLE "org_revisions" ADD COLUMN revertdraftid VARCHAR(64);
CREATE TABLE IF NOT EXISTS "change_rules" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    organizationid VARCHAR(64) NOT NULL,
    unitid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(2000),
    active INTEGER NOT NULL,
    expiresutc TEXT,
    createdbytype VARCHAR(32) NOT NULL,
    createdbyid VARCHAR(64),
    createdbyname VARCHAR(256),
    updatedbyname VARCHAR(256),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_change_rules_org" ON "change_rules" ("tenantid", "organizationid", "active");
CREATE TABLE IF NOT EXISTS "change_rule_classes" (
    ruleid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    changeclass VARCHAR(32) NOT NULL,
    PRIMARY KEY (ruleid, position)
);
CREATE TABLE IF NOT EXISTS "change_rule_limits" (
    ruleid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    changeclass VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    minimum REAL,
    maximum REAL,
    PRIMARY KEY (ruleid, position)
);
CREATE INDEX IF NOT EXISTS "idx_studio_drafts_org" ON "studio_drafts" ("tenantid", "organizationid");
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 53, 'Change rules and executive drafts', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 53);

-- Migration 54: Evaluation, shadow trials, and canary releases
ALTER TABLE "runs" ADD COLUMN evalrunid VARCHAR(64);
ALTER TABLE "runs" ADD COLUMN shadowtrialid VARCHAR(64);
CREATE TABLE IF NOT EXISTS "eval_sets" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(2000),
    version INTEGER NOT NULL,
    previousversionid VARCHAR(64),
    state VARCHAR(16) NOT NULL,
    origin VARCHAR(16) NOT NULL,
    approvedbyid VARCHAR(64),
    approvedbyname VARCHAR(256),
    approvedutc TEXT,
    authoringorgunitid VARCHAR(64),
    authoredbytype VARCHAR(32) NOT NULL,
    authoredbyid VARCHAR(64),
    authoredbyname VARCHAR(256),
    authoredbyagentid VARCHAR(64),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_eval_sets_name" ON "eval_sets" ("tenantid", "name", "version");
CREATE INDEX IF NOT EXISTS "idx_eval_sets_tenant" ON "eval_sets" ("tenantid", "createdutc");
CREATE TABLE IF NOT EXISTS "eval_set_tags" (
    setid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    tag VARCHAR(64) NOT NULL,
    PRIMARY KEY (setid, position)
);
CREATE INDEX IF NOT EXISTS "idx_eval_set_tags_tag" ON "eval_set_tags" ("tenantid", "tag");
CREATE TABLE IF NOT EXISTS "eval_cases" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    setid VARCHAR(64) NOT NULL,
    caseorder INTEGER NOT NULL,
    name VARCHAR(128),
    inputtext TEXT NOT NULL,
    hidden INTEGER NOT NULL,
    expectedtext TEXT,
    sourcerunid VARCHAR(64),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_eval_cases_set" ON "eval_cases" ("tenantid", "setid", "caseorder");
CREATE TABLE IF NOT EXISTS "eval_case_checks" (
    caseid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    scorer VARCHAR(32) NOT NULL,
    argument TEXT,
    weight REAL NOT NULL,
    PRIMARY KEY (caseid, position)
);
CREATE TABLE IF NOT EXISTS "eval_case_files" (
    caseid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    path VARCHAR(512) NOT NULL,
    mediatype VARCHAR(128),
    contenttext TEXT,
    assetid VARCHAR(64),
    assetpath VARCHAR(512),
    PRIMARY KEY (caseid, position)
);
CREATE TABLE IF NOT EXISTS "eval_runs" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    setid VARCHAR(64) NOT NULL,
    setname VARCHAR(128) NOT NULL,
    setversion INTEGER NOT NULL,
    targettype VARCHAR(32) NOT NULL,
    agentid VARCHAR(64),
    agentrevisionid VARCHAR(64),
    deploymentid VARCHAR(64),
    studiodraftid VARCHAR(64),
    status VARCHAR(16) NOT NULL,
    inputmode VARCHAR(16) NOT NULL,
    recentinputcount INTEGER NOT NULL,
    score REAL,
    threshold REAL,
    passed INTEGER,
    budgetusd REAL,
    costusd REAL NOT NULL,
    totalcases INTEGER NOT NULL,
    completedcases INTEGER NOT NULL,
    passedcases INTEGER NOT NULL,
    erroredcases INTEGER NOT NULL,
    failurereason VARCHAR(2000),
    startedbytype VARCHAR(32) NOT NULL,
    startedbyid VARCHAR(64),
    startedbyname VARCHAR(256),
    originrunid VARCHAR(64),
    createdutc TEXT NOT NULL,
    startedutc TEXT,
    completedutc TEXT,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_eval_runs_tenant" ON "eval_runs" ("tenantid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_eval_runs_set" ON "eval_runs" ("tenantid", "setid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_eval_runs_deployment" ON "eval_runs" ("tenantid", "deploymentid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_eval_runs_revision" ON "eval_runs" ("tenantid", "agentrevisionid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_eval_runs_draft" ON "eval_runs" ("tenantid", "studiodraftid");
CREATE INDEX IF NOT EXISTS "idx_eval_runs_status" ON "eval_runs" ("status", "createdutc");
CREATE TABLE IF NOT EXISTS "eval_case_results" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    evalrunid VARCHAR(64) NOT NULL,
    caseid VARCHAR(64),
    resultorder INTEGER NOT NULL,
    sourcerunid VARCHAR(64),
    runid VARCHAR(64),
    outputtext TEXT,
    score REAL NOT NULL,
    passed INTEGER NOT NULL,
    errormessage VARCHAR(2000),
    costusd REAL NOT NULL,
    createdutc TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_eval_case_results_run" ON "eval_case_results" ("tenantid", "evalrunid", "resultorder");
CREATE TABLE IF NOT EXISTS "eval_case_check_results" (
    resultid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    scorer VARCHAR(32) NOT NULL,
    weight REAL NOT NULL,
    score REAL NOT NULL,
    passed INTEGER NOT NULL,
    judgerunid VARCHAR(64),
    note VARCHAR(4000),
    PRIMARY KEY (resultid, position)
);
CREATE TABLE IF NOT EXISTS "shadow_trials" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    name VARCHAR(128),
    agentid VARCHAR(64),
    sourcedeploymentid VARCHAR(64) NOT NULL,
    candidatedeploymentid VARCHAR(64) NOT NULL,
    samplepercent INTEGER NOT NULL,
    endsutc TEXT,
    comparisonevalsetid VARCHAR(64),
    usejudge INTEGER NOT NULL,
    status VARCHAR(16) NOT NULL,
    stopreason VARCHAR(2000),
    comparedcount BIGINT NOT NULL,
    agreedcount BIGINT NOT NULL,
    divergedcount BIGINT NOT NULL,
    candidatefailurecount BIGINT NOT NULL,
    createdbytype VARCHAR(32) NOT NULL,
    createdbyid VARCHAR(64),
    createdbyname VARCHAR(256),
    createdutc TEXT NOT NULL,
    completedutc TEXT,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_shadow_trials_tenant" ON "shadow_trials" ("tenantid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_shadow_trials_source" ON "shadow_trials" ("tenantid", "sourcedeploymentid", "status");
CREATE INDEX IF NOT EXISTS "idx_shadow_trials_status" ON "shadow_trials" ("status", "createdutc");
CREATE TABLE IF NOT EXISTS "canary_releases" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantid VARCHAR(64) NOT NULL,
    agentid VARCHAR(64) NOT NULL,
    candidatedeploymentid VARCHAR(64) NOT NULL,
    baselinedeploymentid VARCHAR(64) NOT NULL,
    baselineinitialweight INTEGER NOT NULL,
    candidateinitialweight INTEGER NOT NULL,
    currentstepindex INTEGER NOT NULL,
    stepstartedutc TEXT,
    maxerrorratepercent REAL NOT NULL,
    minevalscore REAL,
    evalsetid VARCHAR(64),
    status VARCHAR(16) NOT NULL,
    rollbackreason VARCHAR(2000),
    createdbytype VARCHAR(32) NOT NULL,
    createdbyid VARCHAR(64),
    createdbyname VARCHAR(256),
    createdutc TEXT NOT NULL,
    completedutc TEXT,
    lastupdateutc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_canary_releases_tenant" ON "canary_releases" ("tenantid", "createdutc");
CREATE INDEX IF NOT EXISTS "idx_canary_releases_agent" ON "canary_releases" ("tenantid", "agentid", "status");
CREATE INDEX IF NOT EXISTS "idx_canary_releases_candidate" ON "canary_releases" ("tenantid", "candidatedeploymentid", "status");
CREATE INDEX IF NOT EXISTS "idx_canary_releases_status" ON "canary_releases" ("status", "createdutc");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_canary_releases_running" ON "canary_releases" ("tenantid", "agentid") WHERE status = 'Running';
CREATE TABLE IF NOT EXISTS "canary_release_steps" (
    releaseid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64) NOT NULL,
    position INTEGER NOT NULL,
    weightpercent INTEGER NOT NULL,
    minimumruns INTEGER NOT NULL,
    minimumminutes INTEGER NOT NULL,
    PRIMARY KEY (releaseid, position)
);
CREATE INDEX IF NOT EXISTS "idx_runs_evalrun" ON "runs" ("tenantid", "evalrunid") WHERE evalrunid IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_runs_shadowtrial" ON "runs" ("tenantid", "shadowtrialid") WHERE shadowtrialid IS NOT NULL;
INSERT INTO schema_migrations (version, description, appliedutc) SELECT 54, 'Evaluation, shadow trials, and canary releases', strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 54);
