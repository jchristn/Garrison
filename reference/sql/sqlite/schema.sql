-- Garrison reference schema for Sqlite. Generated from Garrison.Core SchemaBuilder (migrations 1 to 18).
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

-- Migration 3: Structured output validation and repair
ALTER TABLE "runs" ADD COLUMN outputschemavalid INTEGER;
ALTER TABLE "runs" ADD COLUMN schemavalidationerrors TEXT;
ALTER TABLE "runs" ADD COLUMN repairattempts INTEGER NOT NULL DEFAULT 0;

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

-- Migration 5: Run trace identifiers
ALTER TABLE "runs" ADD COLUMN traceid VARCHAR(32);
ALTER TABLE "runs" ADD COLUMN traceparent VARCHAR(64);

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

-- Migration 8: Run guard limits on deployments
ALTER TABLE "deployments" ADD COLUMN repetitionguard INTEGER;
ALTER TABLE "deployments" ADD COLUMN maxassistantchars BIGINT;
ALTER TABLE "deployments" ADD COLUMN noprogressseconds INTEGER;

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

-- Migration 10: Secret credential status and Codex login refresh
ALTER TABLE "secrets" ADD COLUMN status VARCHAR(64);
ALTER TABLE "secrets" ADD COLUMN statusmessage TEXT;
ALTER TABLE "secrets" ADD COLUMN statusutc TEXT;
ALTER TABLE "secrets" ADD COLUMN refreshedutc TEXT;
ALTER TABLE "secrets" ADD COLUMN accesstokenexpiresutc TEXT;
CREATE INDEX IF NOT EXISTS "idx_secrets_kind" ON "secrets" ("kind");

-- Migration 11: Run token lease epochs and manifest error codes
ALTER TABLE "authsessions" ADD COLUMN leaseepoch BIGINT;
ALTER TABLE "manifest_apply_items" ADD COLUMN errorcode VARCHAR(64);
ALTER TABLE "manifest_apply_items" ADD COLUMN errorfield VARCHAR(512);

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

-- Migration 16: Explicit opt-in quota enforcement
ALTER TABLE "usage_quotas" ADD COLUMN enforcementenabled INTEGER NOT NULL DEFAULT 0;

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

-- Migration 18: Warm-start capability without removing cold execution support
ALTER TABLE "node_executors" ADD COLUMN capwarmstart INTEGER NOT NULL DEFAULT 0;
