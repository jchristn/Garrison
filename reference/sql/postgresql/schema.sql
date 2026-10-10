-- Garrison reference schema for Postgresql. Generated from Garrison.Core SchemaBuilder (migrations 1 to 3).
-- Tables are shown in the refschema schema; replace it with your schema or remove the prefix.
\restrict Ngc1ynqz82xCzePAwWJBY9OVtHtJ1PGRQmIrUCdkVVpoxWPpQNcSOEcpHHh7TFv
CREATE SCHEMA refschema;
CREATE TABLE refschema.agent_delegation_allowlist (
    id character varying(64) NOT NULL,
    agentid character varying(64) NOT NULL,
    tenantid character varying(64),
    agentname character varying(256) NOT NULL
);
CREATE TABLE refschema.agent_skills (
    id character varying(64) NOT NULL,
    agentid character varying(64) NOT NULL,
    tenantid character varying(64),
    skillid character varying(128) NOT NULL,
    name character varying(256) NOT NULL,
    description text
);
CREATE TABLE refschema.agent_tags (
    id character varying(64) NOT NULL,
    agentid character varying(64) NOT NULL,
    tenantid character varying(64),
    tag character varying(256) NOT NULL
);
CREATE TABLE refschema.agents (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    displayname character varying(256),
    description text,
    kind character varying(64) NOT NULL,
    agentversion character varying(64),
    exposea2a boolean NOT NULL,
    exposemcptool boolean NOT NULL,
    mcptoolname character varying(128),
    tooldescriptiontemplateid character varying(64),
    skilldescriptiontemplateid character varying(64),
    inputmode character varying(64) NOT NULL,
    inputschemajson text,
    outputschemajson text,
    delegationmode character varying(64) NOT NULL,
    delegationmaxdepth integer NOT NULL,
    delegationallowrecursion boolean NOT NULL,
    remoteprotocol character varying(64),
    remoteendpointurl text,
    remotecredentialsecretid character varying(64),
    lastregisteredutc timestamp with time zone,
    registrationttlseconds integer NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.artifact_stores (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    description text,
    kind character varying(64) NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.audit_records (
    id character varying(64) NOT NULL,
    tenantid character varying(64),
    eventtype character varying(64) NOT NULL,
    requestid character varying(64),
    correlationid character varying(64),
    traceid character varying(64),
    authscheme character varying(64),
    principaltype character varying(64),
    principalid character varying(64),
    principalname character varying(256),
    sessionid character varying(64),
    resourcetype character varying(64),
    resourceid character varying(64),
    operation character varying(64),
    requesttype character varying(128),
    method character varying(16),
    path character varying(1024),
    sourceip character varying(64),
    authresult character varying(64),
    authorizationresult character varying(64),
    reason text,
    bypassreason character varying(256),
    statuscode integer NOT NULL,
    description text,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.authsessions (
    id character varying(64) NOT NULL,
    tenantid character varying(64),
    userid character varying(64),
    credentialid character varying(64),
    runid character varying(64),
    originprincipaltype character varying(64),
    originprincipalid character varying(64),
    principaltype character varying(64) NOT NULL,
    authscheme character varying(64) NOT NULL,
    tokenid character varying(64) NOT NULL,
    sourceip character varying(64),
    useragent character varying(512),
    expiresutc timestamp with time zone NOT NULL,
    lastusedutc timestamp with time zone,
    revokedutc timestamp with time zone,
    revocationreason character varying(512),
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.cluster_settings (
    id character varying(64) NOT NULL,
    settingkey character varying(256) NOT NULL,
    settingvalue text,
    updatedby character varying(256),
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.coordination_leases (
    id character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    holder character varying(256),
    epoch bigint NOT NULL,
    acquiredutc timestamp with time zone,
    expiresutc timestamp with time zone,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.credentials (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    userid character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    accesskey character varying(128) NOT NULL,
    secretkeyencrypted text NOT NULL,
    secretkeylast4 character varying(8),
    authmode character varying(64) NOT NULL,
    lastusedutc timestamp with time zone,
    expiresutc timestamp with time zone,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.credentialscopeassignments (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    credentialid character varying(64) NOT NULL,
    roleid character varying(64),
    rolename character varying(128),
    resourcescope character varying(64) NOT NULL,
    resourceid character varying(64),
    inheritstochildren boolean NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.deployment_arg_overrides (
    id character varying(64) NOT NULL,
    deploymentid character varying(64) NOT NULL,
    tenantid character varying(64),
    "position" integer NOT NULL,
    operation character varying(64) NOT NULL,
    match text,
    template text,
    condition text
);
CREATE TABLE refschema.deployment_env_overrides (
    id character varying(64) NOT NULL,
    deploymentid character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(256) NOT NULL,
    valuetemplate text NOT NULL,
    issecret boolean NOT NULL
);
CREATE TABLE refschema.deployment_file_overrides (
    id character varying(64) NOT NULL,
    deploymentid character varying(64) NOT NULL,
    tenantid character varying(64),
    basedirectory character varying(64) NOT NULL,
    pathtemplate text NOT NULL,
    contenttemplate text NOT NULL,
    mode character varying(8),
    issecret boolean NOT NULL
);
CREATE TABLE refschema.deployment_node_selectors (
    id character varying(64) NOT NULL,
    deploymentid character varying(64) NOT NULL,
    tenantid character varying(64),
    key character varying(256) NOT NULL,
    value character varying(256) NOT NULL
);
CREATE TABLE refschema.deployment_parameters (
    id character varying(64) NOT NULL,
    deploymentid character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(128) NOT NULL,
    value text NOT NULL
);
CREATE TABLE refschema.deployment_prompt_bindings (
    id character varying(64) NOT NULL,
    deploymentid character varying(64) NOT NULL,
    tenantid character varying(64),
    role character varying(64) NOT NULL,
    templateid character varying(64) NOT NULL,
    pinnedversion integer
);
CREATE TABLE refschema.deployment_resource_bindings (
    id character varying(64) NOT NULL,
    deploymentid character varying(64) NOT NULL,
    tenantid character varying(64),
    kind character varying(64) NOT NULL,
    alias character varying(128) NOT NULL,
    resourceid character varying(64) NOT NULL
);
CREATE TABLE refschema.deployment_run_overrides (
    id character varying(64) NOT NULL,
    deploymentid character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(128) NOT NULL,
    validation character varying(64) NOT NULL,
    pattern text
);
CREATE TABLE refschema.deployments (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    agentid character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    description text,
    harnessprofileid character varying(64) NOT NULL,
    model character varying(256),
    fallbackmodel character varying(256),
    effort character varying(32),
    maxturns integer,
    maxbudgetusd double precision,
    maxconcurrentruns integer NOT NULL,
    timeoutseconds integer,
    maxattempts integer NOT NULL,
    retryonnodeloss boolean NOT NULL,
    weight integer NOT NULL,
    nodepoolid character varying(64),
    workspacetemplateid character varying(64),
    artifactstoreid character varying(64),
    configversion integer NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.harness_profile_args (
    id character varying(64) NOT NULL,
    harnessprofileid character varying(64) NOT NULL,
    tenantid character varying(64),
    "position" integer NOT NULL,
    template text NOT NULL,
    condition text,
    repeatover character varying(256)
);
CREATE TABLE refschema.harness_profile_cred_env (
    id character varying(64) NOT NULL,
    harnessprofileid character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(256) NOT NULL
);
CREATE TABLE refschema.harness_profile_env (
    id character varying(64) NOT NULL,
    harnessprofileid character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(256) NOT NULL,
    valuetemplate text NOT NULL,
    condition text,
    issecret boolean NOT NULL
);
CREATE TABLE refschema.harness_profile_exit_codes (
    id character varying(64) NOT NULL,
    harnessprofileid character varying(64) NOT NULL,
    tenantid character varying(64),
    exitcode integer NOT NULL
);
CREATE TABLE refschema.harness_profile_files (
    id character varying(64) NOT NULL,
    harnessprofileid character varying(64) NOT NULL,
    tenantid character varying(64),
    basedirectory character varying(64) NOT NULL,
    pathtemplate text NOT NULL,
    contenttemplate text NOT NULL,
    condition text,
    mode character varying(8),
    issecret boolean NOT NULL
);
CREATE TABLE refschema.harness_profile_probe_args (
    id character varying(64) NOT NULL,
    harnessprofileid character varying(64) NOT NULL,
    tenantid character varying(64),
    "position" integer NOT NULL,
    argument character varying(256) NOT NULL
);
CREATE TABLE refschema.harness_profiles (
    id character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(256) NOT NULL,
    description text,
    harnesstype character varying(64) NOT NULL,
    executable character varying(1024) NOT NULL,
    promptdelivery character varying(64) NOT NULL,
    promptargumenttemplate text,
    systempromptdelivery character varying(64) NOT NULL,
    systemprompttarget text,
    mcpconfigformat character varying(64) NOT NULL,
    mcpconfigfilename character varying(256),
    outputparser character varying(64) NOT NULL,
    resultsource character varying(64) NOT NULL,
    resultfilename character varying(256),
    successpolicy character varying(64) NOT NULL,
    generictextfield character varying(256),
    genericfinalfield character varying(256),
    genericsuccessfield character varying(256),
    genericsuccessvalue character varying(256),
    defaulttimeoutseconds integer NOT NULL,
    killgraceseconds integer NOT NULL,
    maxoutputbytes bigint NOT NULL,
    stderrtailbytes integer NOT NULL,
    isolatehome boolean NOT NULL,
    supportsresume boolean NOT NULL,
    isbuiltin boolean NOT NULL,
    builtinkey character varying(128),
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.manifest_applies (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    principalname character varying(256),
    dryrun boolean NOT NULL,
    documentcount integer NOT NULL,
    createdcount integer NOT NULL,
    updatedcount integer NOT NULL,
    unchangedcount integer NOT NULL,
    failedcount integer NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.manifest_apply_items (
    id character varying(64) NOT NULL,
    manifestapplyid character varying(64) NOT NULL,
    tenantid character varying(64),
    "position" integer NOT NULL,
    kind character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    result character varying(64) NOT NULL,
    resourceid character varying(64),
    message text
);
CREATE TABLE refschema.mcp_server_args (
    id character varying(64) NOT NULL,
    mcpserverid character varying(64) NOT NULL,
    tenantid character varying(64),
    "position" integer NOT NULL,
    argument character varying(256) NOT NULL
);
CREATE TABLE refschema.mcp_server_env (
    id character varying(64) NOT NULL,
    mcpserverid character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(256) NOT NULL,
    valuetemplate text NOT NULL
);
CREATE TABLE refschema.mcp_server_headers (
    id character varying(64) NOT NULL,
    mcpserverid character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(256) NOT NULL,
    valuetemplate text NOT NULL
);
CREATE TABLE refschema.mcp_server_required_tools (
    id character varying(64) NOT NULL,
    mcpserverid character varying(64) NOT NULL,
    tenantid character varying(64),
    toolname character varying(256) NOT NULL
);
CREATE TABLE refschema.mcp_servers (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    description text,
    transport character varying(64) NOT NULL,
    url text,
    path character varying(256),
    command text,
    tooltimeoutseconds integer NOT NULL,
    required boolean NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.node_capabilities (
    id character varying(64) NOT NULL,
    nodeid character varying(64) NOT NULL,
    harnesstype character varying(64) NOT NULL,
    executable character varying(1024),
    detectedversion character varying(256),
    available boolean NOT NULL,
    detail text
);
CREATE TABLE refschema.node_labels (
    id character varying(64) NOT NULL,
    nodeid character varying(64) NOT NULL,
    key character varying(256) NOT NULL,
    value character varying(256) NOT NULL
);
CREATE TABLE refschema.node_pool_tenants (
    id character varying(64) NOT NULL,
    nodepoolid character varying(64) NOT NULL,
    allowedtenantid character varying(256) NOT NULL
);
CREATE TABLE refschema.node_pools (
    id character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    description text,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.nodes (
    id character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    nodepoolid character varying(64),
    address character varying(256),
    nodeversion character varying(64),
    status character varying(64) NOT NULL,
    maxconcurrentruns integer NOT NULL,
    activeruns integer NOT NULL,
    credentialid character varying(64),
    lastheartbeatutc timestamp with time zone,
    registeredutc timestamp with time zone,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.permission_operation_types (
    id character varying(64) NOT NULL,
    permissionid character varying(64) NOT NULL,
    tenantid character varying(64),
    operationtype character varying(256) NOT NULL
);
CREATE TABLE refschema.permission_resource_types (
    id character varying(64) NOT NULL,
    permissionid character varying(64) NOT NULL,
    tenantid character varying(64),
    resourcetype character varying(256) NOT NULL
);
CREATE TABLE refschema.permissions (
    id character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(256) NOT NULL,
    permissiontype character varying(64) NOT NULL,
    isbuiltin boolean NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.prompt_template_variables (
    id character varying(64) NOT NULL,
    prompttemplateid character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(256) NOT NULL,
    description text,
    required boolean NOT NULL,
    defaultvalue text
);
CREATE TABLE refschema.prompt_template_versions (
    id character varying(64) NOT NULL,
    tenantid character varying(64),
    templateid character varying(64) NOT NULL,
    version integer NOT NULL,
    content text NOT NULL,
    changenote text,
    createdby character varying(256),
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.prompt_templates (
    id character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(256) NOT NULL,
    description text,
    kind character varying(64) NOT NULL,
    content text NOT NULL,
    currentversion integer NOT NULL,
    isbuiltin boolean NOT NULL,
    builtinkey character varying(128),
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.request_history (
    id character varying(64) NOT NULL,
    tenantid character varying(64),
    userid character varying(64),
    principalname character varying(256),
    method character varying(16) NOT NULL,
    path character varying(1024) NOT NULL,
    url text NOT NULL,
    statuscode integer NOT NULL,
    durationms double precision NOT NULL,
    sourceip character varying(64),
    requestbody text,
    requestbodybytes bigint NOT NULL,
    requestbodytruncated boolean NOT NULL,
    responsebody text,
    responsebodybytes bigint NOT NULL,
    responsebodytruncated boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    completedutc timestamp with time zone
);
CREATE TABLE refschema.request_history_headers (
    id character varying(64) NOT NULL,
    requesthistoryentryid character varying(64) NOT NULL,
    tenantid character varying(64),
    direction character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    value text NOT NULL
);
CREATE TABLE refschema.rolepermissionmaps (
    id character varying(64) NOT NULL,
    tenantid character varying(64),
    roleid character varying(64) NOT NULL,
    permissionid character varying(64) NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.run_events (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    runid character varying(64) NOT NULL,
    sequence bigint NOT NULL,
    eventtype character varying(64) NOT NULL,
    timestamputc timestamp with time zone NOT NULL,
    text text,
    toolname character varying(256),
    toolcallid character varying(256),
    success boolean,
    inputtokens bigint,
    outputtokens bigint,
    raweventjson text,
    createdutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.run_parameters (
    id character varying(64) NOT NULL,
    runid character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(128) NOT NULL,
    value text NOT NULL
);
CREATE TABLE refschema.run_requirements (
    id character varying(64) NOT NULL,
    runid character varying(64) NOT NULL,
    tenantid character varying(64),
    key character varying(256) NOT NULL,
    value character varying(256) NOT NULL
);
CREATE TABLE refschema.run_template_versions (
    id character varying(64) NOT NULL,
    runid character varying(64) NOT NULL,
    tenantid character varying(64),
    templateid character varying(64) NOT NULL,
    templatename character varying(256) NOT NULL,
    version integer NOT NULL
);
CREATE TABLE refschema.runs (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    agentid character varying(64) NOT NULL,
    agentname character varying(128) NOT NULL,
    deploymentid character varying(64) NOT NULL,
    deploymentversion integer NOT NULL,
    harnesstype character varying(64) NOT NULL,
    nodepoolid character varying(64),
    kind character varying(64) NOT NULL,
    status character varying(64) NOT NULL,
    outcome character varying(64) NOT NULL,
    priority integer NOT NULL,
    inputtext text,
    inputcontenttype character varying(128),
    callertype character varying(64) NOT NULL,
    callerid character varying(64),
    callername character varying(256),
    parentrunid character varying(64),
    rootrunid character varying(64),
    depth integer NOT NULL,
    callchain text,
    idempotencykey character varying(256),
    retryofrunid character varying(64),
    attempt integer NOT NULL,
    maxattempts integer NOT NULL,
    leasenodeid character varying(64),
    leasenodename character varying(256),
    leaseepoch bigint NOT NULL,
    leaseexpiresutc timestamp with time zone,
    queuedutc timestamp with time zone,
    leasedutc timestamp with time zone,
    startedutc timestamp with time zone,
    completedutc timestamp with time zone,
    deadlineutc timestamp with time zone,
    cancelrequested boolean NOT NULL,
    resulttext text,
    structuredoutputjson text,
    sessionid character varying(256),
    servedmodel character varying(256),
    exitcode integer,
    stderrtail text,
    errormessage text,
    inputtokens bigint NOT NULL,
    outputtokens bigint NOT NULL,
    cachedtokens bigint NOT NULL,
    costusd double precision,
    costestimated boolean NOT NULL,
    lasteventsequence bigint NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL,
    firsttokenutc timestamp with time zone,
    lasttokenutc timestamp with time zone,
    ttftms bigint,
    streamingms bigint,
    executionms bigint,
    queuems bigint,
    totalms bigint,
    toolcallcount integer DEFAULT 0 NOT NULL,
    reasoningtokens bigint DEFAULT 0 NOT NULL,
    outputschemavalid boolean,
    schemavalidationerrors text,
    repairattempts integer DEFAULT 0 NOT NULL
);
CREATE TABLE refschema.schema_migrations (
    version integer NOT NULL,
    description character varying(1024) NOT NULL,
    appliedutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.secrets (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    description text,
    kind character varying(64) NOT NULL,
    valueencrypted text,
    valuelast4 character varying(8),
    fingerprint character varying(64),
    keyversion integer NOT NULL,
    expiresutc timestamp with time zone,
    rotatedutc timestamp with time zone,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.tenants (
    id character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    description text,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.userroleassignments (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    userid character varying(64) NOT NULL,
    roleid character varying(64),
    rolename character varying(128),
    resourcescope character varying(64) NOT NULL,
    resourceid character varying(64),
    inheritstochildren boolean NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.userroles (
    id character varying(64) NOT NULL,
    tenantid character varying(64),
    name character varying(128) NOT NULL,
    description text,
    isbuiltin boolean NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.users (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    firstname character varying(128),
    lastname character varying(128),
    email character varying(256) NOT NULL,
    passwordsha256 character varying(128) NOT NULL,
    isadmin boolean NOT NULL,
    istenantadmin boolean NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
CREATE TABLE refschema.workspace_template_files (
    id character varying(64) NOT NULL,
    workspacetemplateid character varying(64) NOT NULL,
    tenantid character varying(64),
    path text NOT NULL,
    content text NOT NULL
);
CREATE TABLE refschema.workspace_templates (
    id character varying(64) NOT NULL,
    tenantid character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    description text,
    kind character varying(64) NOT NULL,
    giturl text,
    gitref character varying(256),
    gitdepth integer NOT NULL,
    gitcredentialsecretid character varying(64),
    retention character varying(64) NOT NULL,
    active boolean NOT NULL,
    isprotected boolean NOT NULL,
    createdutc timestamp with time zone NOT NULL,
    lastupdateutc timestamp with time zone NOT NULL
);
ALTER TABLE ONLY refschema.agent_delegation_allowlist
    ADD CONSTRAINT agent_delegation_allowlist_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.agent_skills
    ADD CONSTRAINT agent_skills_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.agent_tags
    ADD CONSTRAINT agent_tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.artifact_stores
    ADD CONSTRAINT artifact_stores_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.audit_records
    ADD CONSTRAINT audit_records_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.authsessions
    ADD CONSTRAINT authsessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.cluster_settings
    ADD CONSTRAINT cluster_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.coordination_leases
    ADD CONSTRAINT coordination_leases_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.credentials
    ADD CONSTRAINT credentials_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.credentialscopeassignments
    ADD CONSTRAINT credentialscopeassignments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.deployment_arg_overrides
    ADD CONSTRAINT deployment_arg_overrides_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.deployment_env_overrides
    ADD CONSTRAINT deployment_env_overrides_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.deployment_file_overrides
    ADD CONSTRAINT deployment_file_overrides_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.deployment_node_selectors
    ADD CONSTRAINT deployment_node_selectors_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.deployment_parameters
    ADD CONSTRAINT deployment_parameters_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.deployment_prompt_bindings
    ADD CONSTRAINT deployment_prompt_bindings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.deployment_resource_bindings
    ADD CONSTRAINT deployment_resource_bindings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.deployment_run_overrides
    ADD CONSTRAINT deployment_run_overrides_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.deployments
    ADD CONSTRAINT deployments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.harness_profile_args
    ADD CONSTRAINT harness_profile_args_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.harness_profile_cred_env
    ADD CONSTRAINT harness_profile_cred_env_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.harness_profile_env
    ADD CONSTRAINT harness_profile_env_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.harness_profile_exit_codes
    ADD CONSTRAINT harness_profile_exit_codes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.harness_profile_files
    ADD CONSTRAINT harness_profile_files_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.harness_profile_probe_args
    ADD CONSTRAINT harness_profile_probe_args_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.harness_profiles
    ADD CONSTRAINT harness_profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.manifest_applies
    ADD CONSTRAINT manifest_applies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.manifest_apply_items
    ADD CONSTRAINT manifest_apply_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.mcp_server_args
    ADD CONSTRAINT mcp_server_args_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.mcp_server_env
    ADD CONSTRAINT mcp_server_env_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.mcp_server_headers
    ADD CONSTRAINT mcp_server_headers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.mcp_server_required_tools
    ADD CONSTRAINT mcp_server_required_tools_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.mcp_servers
    ADD CONSTRAINT mcp_servers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.node_capabilities
    ADD CONSTRAINT node_capabilities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.node_labels
    ADD CONSTRAINT node_labels_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.node_pool_tenants
    ADD CONSTRAINT node_pool_tenants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.node_pools
    ADD CONSTRAINT node_pools_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.nodes
    ADD CONSTRAINT nodes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.permission_operation_types
    ADD CONSTRAINT permission_operation_types_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.permission_resource_types
    ADD CONSTRAINT permission_resource_types_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.prompt_template_variables
    ADD CONSTRAINT prompt_template_variables_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.prompt_template_versions
    ADD CONSTRAINT prompt_template_versions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.prompt_templates
    ADD CONSTRAINT prompt_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.request_history_headers
    ADD CONSTRAINT request_history_headers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.request_history
    ADD CONSTRAINT request_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.rolepermissionmaps
    ADD CONSTRAINT rolepermissionmaps_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.run_events
    ADD CONSTRAINT run_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.run_parameters
    ADD CONSTRAINT run_parameters_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.run_requirements
    ADD CONSTRAINT run_requirements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.run_template_versions
    ADD CONSTRAINT run_template_versions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.runs
    ADD CONSTRAINT runs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);
ALTER TABLE ONLY refschema.secrets
    ADD CONSTRAINT secrets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.userroleassignments
    ADD CONSTRAINT userroleassignments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.userroles
    ADD CONSTRAINT userroles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.workspace_template_files
    ADD CONSTRAINT workspace_template_files_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refschema.workspace_templates
    ADD CONSTRAINT workspace_templates_pkey PRIMARY KEY (id);
CREATE INDEX idx_agent_delegation_allowlist_parent ON refschema.agent_delegation_allowlist USING btree (agentid);
CREATE INDEX idx_agent_skills_parent ON refschema.agent_skills USING btree (agentid);
CREATE INDEX idx_agent_tags_parent ON refschema.agent_tags USING btree (agentid);
CREATE UNIQUE INDEX idx_agents_name ON refschema.agents USING btree (tenantid, name);
CREATE INDEX idx_agents_tenant ON refschema.agents USING btree (tenantid);
CREATE UNIQUE INDEX idx_artifact_stores_name ON refschema.artifact_stores USING btree (tenantid, name);
CREATE INDEX idx_artifact_stores_tenant ON refschema.artifact_stores USING btree (tenantid);
CREATE INDEX idx_audit_records_created ON refschema.audit_records USING btree (tenantid, createdutc);
CREATE INDEX idx_audit_records_eventtype ON refschema.audit_records USING btree (eventtype);
CREATE INDEX idx_audit_records_tenant ON refschema.audit_records USING btree (tenantid);
CREATE INDEX idx_authsessions_run ON refschema.authsessions USING btree (runid);
CREATE INDEX idx_authsessions_tenant ON refschema.authsessions USING btree (tenantid);
CREATE UNIQUE INDEX idx_authsessions_tokenid ON refschema.authsessions USING btree (tokenid);
CREATE UNIQUE INDEX idx_cluster_settings_key ON refschema.cluster_settings USING btree (settingkey);
CREATE UNIQUE INDEX idx_coordination_leases_name ON refschema.coordination_leases USING btree (name);
CREATE UNIQUE INDEX idx_credentials_accesskey ON refschema.credentials USING btree (accesskey);
CREATE INDEX idx_credentials_tenant ON refschema.credentials USING btree (tenantid);
CREATE INDEX idx_credentials_user ON refschema.credentials USING btree (tenantid, userid);
CREATE INDEX idx_credentialscopeassignments_credential ON refschema.credentialscopeassignments USING btree (tenantid, credentialid);
CREATE INDEX idx_credentialscopeassignments_tenant ON refschema.credentialscopeassignments USING btree (tenantid);
CREATE INDEX idx_deployment_arg_overrides_parent ON refschema.deployment_arg_overrides USING btree (deploymentid);
CREATE INDEX idx_deployment_env_overrides_parent ON refschema.deployment_env_overrides USING btree (deploymentid);
CREATE INDEX idx_deployment_file_overrides_parent ON refschema.deployment_file_overrides USING btree (deploymentid);
CREATE INDEX idx_deployment_node_selectors_parent ON refschema.deployment_node_selectors USING btree (deploymentid);
CREATE INDEX idx_deployment_parameters_parent ON refschema.deployment_parameters USING btree (deploymentid);
CREATE INDEX idx_deployment_prompt_bindings_parent ON refschema.deployment_prompt_bindings USING btree (deploymentid);
CREATE INDEX idx_deployment_resource_bindings_parent ON refschema.deployment_resource_bindings USING btree (deploymentid);
CREATE INDEX idx_deployment_run_overrides_parent ON refschema.deployment_run_overrides USING btree (deploymentid);
CREATE INDEX idx_deployments_agent ON refschema.deployments USING btree (tenantid, agentid);
CREATE UNIQUE INDEX idx_deployments_name ON refschema.deployments USING btree (tenantid, name);
CREATE INDEX idx_deployments_tenant ON refschema.deployments USING btree (tenantid);
CREATE INDEX idx_harness_profile_args_parent ON refschema.harness_profile_args USING btree (harnessprofileid);
CREATE INDEX idx_harness_profile_cred_env_parent ON refschema.harness_profile_cred_env USING btree (harnessprofileid);
CREATE INDEX idx_harness_profile_env_parent ON refschema.harness_profile_env USING btree (harnessprofileid);
CREATE INDEX idx_harness_profile_exit_codes_parent ON refschema.harness_profile_exit_codes USING btree (harnessprofileid);
CREATE INDEX idx_harness_profile_files_parent ON refschema.harness_profile_files USING btree (harnessprofileid);
CREATE INDEX idx_harness_profile_probe_args_parent ON refschema.harness_profile_probe_args USING btree (harnessprofileid);
CREATE INDEX idx_harness_profiles_name ON refschema.harness_profiles USING btree (tenantid, name);
CREATE INDEX idx_harness_profiles_tenant ON refschema.harness_profiles USING btree (tenantid);
CREATE INDEX idx_manifest_applies_tenant ON refschema.manifest_applies USING btree (tenantid);
CREATE INDEX idx_manifest_apply_items_parent ON refschema.manifest_apply_items USING btree (manifestapplyid);
CREATE INDEX idx_mcp_server_args_parent ON refschema.mcp_server_args USING btree (mcpserverid);
CREATE INDEX idx_mcp_server_env_parent ON refschema.mcp_server_env USING btree (mcpserverid);
CREATE INDEX idx_mcp_server_headers_parent ON refschema.mcp_server_headers USING btree (mcpserverid);
CREATE INDEX idx_mcp_server_required_tools_parent ON refschema.mcp_server_required_tools USING btree (mcpserverid);
CREATE UNIQUE INDEX idx_mcp_servers_name ON refschema.mcp_servers USING btree (tenantid, name);
CREATE INDEX idx_mcp_servers_tenant ON refschema.mcp_servers USING btree (tenantid);
CREATE INDEX idx_node_capabilities_parent ON refschema.node_capabilities USING btree (nodeid);
CREATE INDEX idx_node_labels_parent ON refschema.node_labels USING btree (nodeid);
CREATE INDEX idx_node_pool_tenants_parent ON refschema.node_pool_tenants USING btree (nodepoolid);
CREATE UNIQUE INDEX idx_node_pools_name ON refschema.node_pools USING btree (name);
CREATE UNIQUE INDEX idx_nodes_name ON refschema.nodes USING btree (name);
CREATE INDEX idx_permission_operation_types_parent ON refschema.permission_operation_types USING btree (permissionid);
CREATE INDEX idx_permission_resource_types_parent ON refschema.permission_resource_types USING btree (permissionid);
CREATE INDEX idx_permissions_name ON refschema.permissions USING btree (tenantid, name);
CREATE INDEX idx_permissions_tenant ON refschema.permissions USING btree (tenantid);
CREATE INDEX idx_prompt_template_variables_parent ON refschema.prompt_template_variables USING btree (prompttemplateid);
CREATE UNIQUE INDEX idx_prompt_template_versions_templateversion ON refschema.prompt_template_versions USING btree (templateid, version);
CREATE INDEX idx_prompt_template_versions_tenant ON refschema.prompt_template_versions USING btree (tenantid);
CREATE INDEX idx_prompt_templates_name ON refschema.prompt_templates USING btree (tenantid, name);
CREATE INDEX idx_prompt_templates_tenant ON refschema.prompt_templates USING btree (tenantid);
CREATE INDEX idx_request_history_created ON refschema.request_history USING btree (createdutc);
CREATE INDEX idx_request_history_headers_parent ON refschema.request_history_headers USING btree (requesthistoryentryid);
CREATE INDEX idx_request_history_tenant ON refschema.request_history USING btree (tenantid);
CREATE INDEX idx_request_history_tenantcreated ON refschema.request_history USING btree (tenantid, createdutc);
CREATE INDEX idx_rolepermissionmaps_role ON refschema.rolepermissionmaps USING btree (roleid);
CREATE UNIQUE INDEX idx_rolepermissionmaps_rolepermission ON refschema.rolepermissionmaps USING btree (roleid, permissionid);
CREATE INDEX idx_rolepermissionmaps_tenant ON refschema.rolepermissionmaps USING btree (tenantid);
CREATE UNIQUE INDEX idx_run_events_runsequence ON refschema.run_events USING btree (runid, sequence);
CREATE INDEX idx_run_events_tenant ON refschema.run_events USING btree (tenantid);
CREATE INDEX idx_run_parameters_parent ON refschema.run_parameters USING btree (runid);
CREATE INDEX idx_run_requirements_parent ON refschema.run_requirements USING btree (runid);
CREATE INDEX idx_run_template_versions_parent ON refschema.run_template_versions USING btree (runid);
CREATE INDEX idx_runs_claim ON refschema.runs USING btree (status, harnesstype, priority, createdutc);
CREATE INDEX idx_runs_created ON refschema.runs USING btree (tenantid, createdutc);
CREATE INDEX idx_runs_deployment ON refschema.runs USING btree (deploymentid, status);
CREATE INDEX idx_runs_idempotency ON refschema.runs USING btree (tenantid, idempotencykey);
CREATE INDEX idx_runs_lease ON refschema.runs USING btree (leasenodeid, status);
CREATE INDEX idx_runs_parent ON refschema.runs USING btree (parentrunid);
CREATE INDEX idx_runs_tenant ON refschema.runs USING btree (tenantid);
CREATE INDEX idx_runs_tenantstatus ON refschema.runs USING btree (tenantid, status);
CREATE UNIQUE INDEX idx_secrets_name ON refschema.secrets USING btree (tenantid, name);
CREATE INDEX idx_secrets_tenant ON refschema.secrets USING btree (tenantid);
CREATE UNIQUE INDEX idx_tenants_name ON refschema.tenants USING btree (name);
CREATE INDEX idx_userroleassignments_tenant ON refschema.userroleassignments USING btree (tenantid);
CREATE INDEX idx_userroleassignments_user ON refschema.userroleassignments USING btree (tenantid, userid);
CREATE INDEX idx_userroles_name ON refschema.userroles USING btree (tenantid, name);
CREATE INDEX idx_userroles_tenant ON refschema.userroles USING btree (tenantid);
CREATE UNIQUE INDEX idx_users_email ON refschema.users USING btree (tenantid, email);
CREATE INDEX idx_users_tenant ON refschema.users USING btree (tenantid);
CREATE INDEX idx_workspace_template_files_parent ON refschema.workspace_template_files USING btree (workspacetemplateid);
CREATE UNIQUE INDEX idx_workspace_templates_name ON refschema.workspace_templates USING btree (tenantid, name);
CREATE INDEX idx_workspace_templates_tenant ON refschema.workspace_templates USING btree (tenantid);
\unrestrict Ngc1ynqz82xCzePAwWJBY9OVtHtJ1PGRQmIrUCdkVVpoxWPpQNcSOEcpHHh7TFv
