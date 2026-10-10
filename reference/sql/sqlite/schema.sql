-- Garrison reference schema for Sqlite. Generated from Garrison.Core SchemaBuilder (migrations 1 to 3).
-- Apply it, then set Database.ManageSchema=false, if Garrison must not create tables itself.
CREATE TABLE IF NOT EXISTS "schema_migrations" (
    version INTEGER NOT NULL PRIMARY KEY,
    description VARCHAR(1024) NOT NULL,
    appliedutc TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "tenants" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX "idx_tenants_name" ON "tenants" ("name");
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
CREATE INDEX "idx_users_tenant" ON "users" ("tenantid");
CREATE UNIQUE INDEX "idx_users_email" ON "users" ("tenantid", "email");
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
CREATE INDEX "idx_credentials_tenant" ON "credentials" ("tenantid");
CREATE UNIQUE INDEX "idx_credentials_accesskey" ON "credentials" ("accesskey");
CREATE INDEX "idx_credentials_user" ON "credentials" ("tenantid", "userid");
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
CREATE INDEX "idx_authsessions_tenant" ON "authsessions" ("tenantid");
CREATE UNIQUE INDEX "idx_authsessions_tokenid" ON "authsessions" ("tokenid");
CREATE INDEX "idx_authsessions_run" ON "authsessions" ("runid");
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
CREATE INDEX "idx_userroles_tenant" ON "userroles" ("tenantid");
CREATE INDEX "idx_userroles_name" ON "userroles" ("tenantid", "name");
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
CREATE INDEX "idx_permissions_tenant" ON "permissions" ("tenantid");
CREATE INDEX "idx_permissions_name" ON "permissions" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "permission_resource_types" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    permissionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    resourcetype VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_permission_resource_types_parent" ON "permission_resource_types" ("permissionid");
CREATE TABLE IF NOT EXISTS "permission_operation_types" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    permissionid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    operationtype VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_permission_operation_types_parent" ON "permission_operation_types" ("permissionid");
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
CREATE INDEX "idx_rolepermissionmaps_tenant" ON "rolepermissionmaps" ("tenantid");
CREATE INDEX "idx_rolepermissionmaps_role" ON "rolepermissionmaps" ("roleid");
CREATE UNIQUE INDEX "idx_rolepermissionmaps_rolepermission" ON "rolepermissionmaps" ("roleid", "permissionid");
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
CREATE INDEX "idx_userroleassignments_tenant" ON "userroleassignments" ("tenantid");
CREATE INDEX "idx_userroleassignments_user" ON "userroleassignments" ("tenantid", "userid");
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
CREATE INDEX "idx_credentialscopeassignments_tenant" ON "credentialscopeassignments" ("tenantid");
CREATE INDEX "idx_credentialscopeassignments_credential" ON "credentialscopeassignments" ("tenantid", "credentialid");
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
CREATE INDEX "idx_audit_records_tenant" ON "audit_records" ("tenantid");
CREATE INDEX "idx_audit_records_created" ON "audit_records" ("tenantid", "createdutc");
CREATE INDEX "idx_audit_records_eventtype" ON "audit_records" ("eventtype");
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
CREATE INDEX "idx_request_history_tenant" ON "request_history" ("tenantid");
CREATE INDEX "idx_request_history_created" ON "request_history" ("createdutc");
CREATE INDEX "idx_request_history_tenantcreated" ON "request_history" ("tenantid", "createdutc");
CREATE TABLE IF NOT EXISTS "request_history_headers" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    requesthistoryentryid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    direction VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    value TEXT NOT NULL
);
CREATE INDEX "idx_request_history_headers_parent" ON "request_history_headers" ("requesthistoryentryid");
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
CREATE INDEX "idx_harness_profiles_tenant" ON "harness_profiles" ("tenantid");
CREATE INDEX "idx_harness_profiles_name" ON "harness_profiles" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "harness_profile_args" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    template TEXT NOT NULL,
    condition TEXT,
    repeatover VARCHAR(256)
);
CREATE INDEX "idx_harness_profile_args_parent" ON "harness_profile_args" ("harnessprofileid");
CREATE TABLE IF NOT EXISTS "harness_profile_env" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    valuetemplate TEXT NOT NULL,
    condition TEXT,
    issecret INTEGER NOT NULL
);
CREATE INDEX "idx_harness_profile_env_parent" ON "harness_profile_env" ("harnessprofileid");
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
CREATE INDEX "idx_harness_profile_files_parent" ON "harness_profile_files" ("harnessprofileid");
CREATE TABLE IF NOT EXISTS "harness_profile_exit_codes" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    exitcode INTEGER NOT NULL
);
CREATE INDEX "idx_harness_profile_exit_codes_parent" ON "harness_profile_exit_codes" ("harnessprofileid");
CREATE TABLE IF NOT EXISTS "harness_profile_probe_args" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    argument VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_harness_profile_probe_args_parent" ON "harness_profile_probe_args" ("harnessprofileid");
CREATE TABLE IF NOT EXISTS "harness_profile_cred_env" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    harnessprofileid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_harness_profile_cred_env_parent" ON "harness_profile_cred_env" ("harnessprofileid");
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
CREATE INDEX "idx_prompt_templates_tenant" ON "prompt_templates" ("tenantid");
CREATE INDEX "idx_prompt_templates_name" ON "prompt_templates" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "prompt_template_variables" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    prompttemplateid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    description TEXT,
    required INTEGER NOT NULL,
    defaultvalue TEXT
);
CREATE INDEX "idx_prompt_template_variables_parent" ON "prompt_template_variables" ("prompttemplateid");
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
CREATE INDEX "idx_prompt_template_versions_tenant" ON "prompt_template_versions" ("tenantid");
CREATE UNIQUE INDEX "idx_prompt_template_versions_templateversion" ON "prompt_template_versions" ("templateid", "version");
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
CREATE INDEX "idx_mcp_servers_tenant" ON "mcp_servers" ("tenantid");
CREATE UNIQUE INDEX "idx_mcp_servers_name" ON "mcp_servers" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "mcp_server_args" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    mcpserverid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    position INTEGER NOT NULL,
    argument VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_mcp_server_args_parent" ON "mcp_server_args" ("mcpserverid");
CREATE TABLE IF NOT EXISTS "mcp_server_env" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    mcpserverid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    valuetemplate TEXT NOT NULL
);
CREATE INDEX "idx_mcp_server_env_parent" ON "mcp_server_env" ("mcpserverid");
CREATE TABLE IF NOT EXISTS "mcp_server_headers" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    mcpserverid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    valuetemplate TEXT NOT NULL
);
CREATE INDEX "idx_mcp_server_headers_parent" ON "mcp_server_headers" ("mcpserverid");
CREATE TABLE IF NOT EXISTS "mcp_server_required_tools" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    mcpserverid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    toolname VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_mcp_server_required_tools_parent" ON "mcp_server_required_tools" ("mcpserverid");
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
CREATE INDEX "idx_secrets_tenant" ON "secrets" ("tenantid");
CREATE UNIQUE INDEX "idx_secrets_name" ON "secrets" ("tenantid", "name");
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
CREATE INDEX "idx_workspace_templates_tenant" ON "workspace_templates" ("tenantid");
CREATE UNIQUE INDEX "idx_workspace_templates_name" ON "workspace_templates" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "workspace_template_files" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    workspacetemplateid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    path TEXT NOT NULL,
    content TEXT NOT NULL
);
CREATE INDEX "idx_workspace_template_files_parent" ON "workspace_template_files" ("workspacetemplateid");
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
CREATE INDEX "idx_artifact_stores_tenant" ON "artifact_stores" ("tenantid");
CREATE UNIQUE INDEX "idx_artifact_stores_name" ON "artifact_stores" ("tenantid", "name");
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
CREATE INDEX "idx_agents_tenant" ON "agents" ("tenantid");
CREATE UNIQUE INDEX "idx_agents_name" ON "agents" ("tenantid", "name");
CREATE TABLE IF NOT EXISTS "agent_skills" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    agentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    skillid VARCHAR(128) NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT
);
CREATE INDEX "idx_agent_skills_parent" ON "agent_skills" ("agentid");
CREATE TABLE IF NOT EXISTS "agent_tags" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    agentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    tag VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_agent_tags_parent" ON "agent_tags" ("agentid");
CREATE TABLE IF NOT EXISTS "agent_delegation_allowlist" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    agentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    agentname VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_agent_delegation_allowlist_parent" ON "agent_delegation_allowlist" ("agentid");
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
CREATE INDEX "idx_deployments_tenant" ON "deployments" ("tenantid");
CREATE UNIQUE INDEX "idx_deployments_name" ON "deployments" ("tenantid", "name");
CREATE INDEX "idx_deployments_agent" ON "deployments" ("tenantid", "agentid");
CREATE TABLE IF NOT EXISTS "deployment_prompt_bindings" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    role VARCHAR(64) NOT NULL,
    templateid VARCHAR(64) NOT NULL,
    pinnedversion INTEGER
);
CREATE INDEX "idx_deployment_prompt_bindings_parent" ON "deployment_prompt_bindings" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_resource_bindings" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    kind VARCHAR(64) NOT NULL,
    alias VARCHAR(128) NOT NULL,
    resourceid VARCHAR(64) NOT NULL
);
CREATE INDEX "idx_deployment_resource_bindings_parent" ON "deployment_resource_bindings" ("deploymentid");
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
CREATE INDEX "idx_deployment_arg_overrides_parent" ON "deployment_arg_overrides" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_env_overrides" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(256) NOT NULL,
    valuetemplate TEXT NOT NULL,
    issecret INTEGER NOT NULL
);
CREATE INDEX "idx_deployment_env_overrides_parent" ON "deployment_env_overrides" ("deploymentid");
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
CREATE INDEX "idx_deployment_file_overrides_parent" ON "deployment_file_overrides" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_node_selectors" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    key VARCHAR(256) NOT NULL,
    value VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_deployment_node_selectors_parent" ON "deployment_node_selectors" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_parameters" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    value TEXT NOT NULL
);
CREATE INDEX "idx_deployment_parameters_parent" ON "deployment_parameters" ("deploymentid");
CREATE TABLE IF NOT EXISTS "deployment_run_overrides" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    deploymentid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    validation VARCHAR(64) NOT NULL,
    pattern TEXT
);
CREATE INDEX "idx_deployment_run_overrides_parent" ON "deployment_run_overrides" ("deploymentid");
CREATE TABLE IF NOT EXISTS "node_pools" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    active INTEGER NOT NULL,
    isprotected INTEGER NOT NULL,
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX "idx_node_pools_name" ON "node_pools" ("name");
CREATE TABLE IF NOT EXISTS "node_pool_tenants" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    nodepoolid VARCHAR(64) NOT NULL,
    allowedtenantid VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_node_pool_tenants_parent" ON "node_pool_tenants" ("nodepoolid");
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
CREATE UNIQUE INDEX "idx_nodes_name" ON "nodes" ("name");
CREATE TABLE IF NOT EXISTS "node_labels" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    nodeid VARCHAR(64) NOT NULL,
    key VARCHAR(256) NOT NULL,
    value VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_node_labels_parent" ON "node_labels" ("nodeid");
CREATE TABLE IF NOT EXISTS "node_capabilities" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    nodeid VARCHAR(64) NOT NULL,
    harnesstype VARCHAR(64) NOT NULL,
    executable VARCHAR(1024),
    detectedversion VARCHAR(256),
    available INTEGER NOT NULL,
    detail TEXT
);
CREATE INDEX "idx_node_capabilities_parent" ON "node_capabilities" ("nodeid");
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
    lastupdateutc TEXT NOT NULL,
    firsttokenutc TEXT,
    lasttokenutc TEXT,
    ttftms BIGINT,
    streamingms BIGINT,
    executionms BIGINT,
    queuems BIGINT,
    totalms BIGINT,
    toolcallcount INTEGER NOT NULL DEFAULT 0,
    reasoningtokens BIGINT NOT NULL DEFAULT 0,
    outputschemavalid INTEGER,
    schemavalidationerrors TEXT,
    repairattempts INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX "idx_runs_tenant" ON "runs" ("tenantid");
CREATE INDEX "idx_runs_claim" ON "runs" ("status", "harnesstype", "priority", "createdutc");
CREATE INDEX "idx_runs_tenantstatus" ON "runs" ("tenantid", "status");
CREATE INDEX "idx_runs_deployment" ON "runs" ("deploymentid", "status");
CREATE INDEX "idx_runs_parent" ON "runs" ("parentrunid");
CREATE INDEX "idx_runs_lease" ON "runs" ("leasenodeid", "status");
CREATE INDEX "idx_runs_idempotency" ON "runs" ("tenantid", "idempotencykey");
CREATE INDEX "idx_runs_created" ON "runs" ("tenantid", "createdutc");
CREATE TABLE IF NOT EXISTS "run_parameters" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    runid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    value TEXT NOT NULL
);
CREATE INDEX "idx_run_parameters_parent" ON "run_parameters" ("runid");
CREATE TABLE IF NOT EXISTS "run_requirements" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    runid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    key VARCHAR(256) NOT NULL,
    value VARCHAR(256) NOT NULL
);
CREATE INDEX "idx_run_requirements_parent" ON "run_requirements" ("runid");
CREATE TABLE IF NOT EXISTS "run_template_versions" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    runid VARCHAR(64) NOT NULL,
    tenantid VARCHAR(64),
    templateid VARCHAR(64) NOT NULL,
    templatename VARCHAR(256) NOT NULL,
    version INTEGER NOT NULL
);
CREATE INDEX "idx_run_template_versions_parent" ON "run_template_versions" ("runid");
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
CREATE INDEX "idx_run_events_tenant" ON "run_events" ("tenantid");
CREATE UNIQUE INDEX "idx_run_events_runsequence" ON "run_events" ("runid", "sequence");
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
CREATE UNIQUE INDEX "idx_coordination_leases_name" ON "coordination_leases" ("name");
CREATE TABLE IF NOT EXISTS "cluster_settings" (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    settingkey VARCHAR(256) NOT NULL,
    settingvalue TEXT,
    updatedby VARCHAR(256),
    createdutc TEXT NOT NULL,
    lastupdateutc TEXT NOT NULL
);
CREATE UNIQUE INDEX "idx_cluster_settings_key" ON "cluster_settings" ("settingkey");
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
CREATE INDEX "idx_manifest_applies_tenant" ON "manifest_applies" ("tenantid");
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
CREATE INDEX "idx_manifest_apply_items_parent" ON "manifest_apply_items" ("manifestapplyid");
