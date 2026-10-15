namespace Garrison.Core.Database
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Database.Sql;

    /// <summary>
    /// Resolves raw table names to prefixed, quoted, optionally schema-qualified references. Thread-safe.
    /// </summary>
    public class TableCatalog
    {
        #region Public-Members

        /// <summary>
        /// Every data table in the schema, unprefixed.
        /// </summary>
        public static IReadOnlyList<string> AllTables
        {
            get
            {
                return _AllTables;
            }
        }

        /// <summary>
        /// Optional schema.
        /// </summary>
        public string? Schema { get; }

        /// <summary>
        /// Table name prefix.
        /// </summary>
        public string Prefix { get; }

        #endregion

        #region Private-Members

        private static readonly List<string> _AllTables = new List<string>
        {
                "tenants",
                "users",
                "credentials",
                "authsessions",
                "userroles",
                "permissions",
                "permission_resource_types",
                "permission_operation_types",
                "rolepermissionmaps",
                "userroleassignments",
                "credentialscopeassignments",
                "audit_records",
                "request_history",
                "request_history_headers",
                "harness_profiles",
                "harness_profile_args",
                "harness_profile_env",
                "harness_profile_files",
                "harness_profile_exit_codes",
                "harness_profile_probe_args",
                "harness_profile_cred_env",
                "prompt_templates",
                "prompt_template_variables",
                "prompt_template_versions",
                "mcp_servers",
                "mcp_server_args",
                "mcp_server_env",
                "mcp_server_headers",
                "mcp_server_required_tools",
                "secrets",
                "workspace_templates",
                "workspace_template_files",
                "artifact_stores",
                "artifacts", "mcp_tests", "mcp_test_tools",
                "deployment_artifact_globs",
                "model_prices",
                "usage_quotas",
                "run_usage",
                "agents",
                "agent_skills",
                "agent_tags",
                "agent_delegation_allowlist",
                "deployments",
                "deployment_prompt_bindings",
                "deployment_resource_bindings",
                "deployment_arg_overrides",
                "deployment_env_overrides",
                "deployment_file_overrides",
                "deployment_node_selectors",
                "deployment_parameters",
                "deployment_run_overrides",
                "node_pools",
                "node_pool_tenants",
                "nodes",
                "node_labels",
                "node_capabilities",
                "node_executors",
                "runs",
                "run_parameters",
                "run_requirements",
                "run_template_versions",
                "run_events",
                "coordination_leases",
                "cluster_settings",
                "manifest_applies",
                "manifest_apply_items",
                "manifest_apply_changes",
                "manifest_apply_warnings",
                "request_nonces",
                "rate_limit_buckets",
                "mcp_sessions",
                "backplane_messages",
                "control_nodes",
                "conversations",
                "deployment_approval_rules",
                "approvals",
                "pipelines",
                "pipeline_stages",
                "pipeline_stage_parameters",
                "pipeline_runs",
                "pipeline_run_stages",
                "pipeline_run_stage_parameters",
                "pipeline_reviews",
                "run_child_waits",
                "deployment_egress_rules",
        };

        private readonly SqlDialect _Dialect;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="prefix">Table name prefix, or null for none.</param>
        /// <param name="schema">Optional schema.</param>
        /// <param name="dialect">Dialect.</param>
        /// <exception cref="ArgumentNullException">Thrown when dialect is null.</exception>
        public TableCatalog(string? prefix, string? schema, SqlDialect dialect)
        {
            _Dialect = dialect ?? throw new ArgumentNullException(nameof(dialect));
            Prefix = prefix ?? String.Empty;
            Schema = String.IsNullOrWhiteSpace(schema) ? null : schema;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Prefixed raw table name.
        /// </summary>
        /// <param name="rawName">Unprefixed name.</param>
        /// <returns>Prefixed name.</returns>
        public string RawName(string rawName)
        {
            if (String.IsNullOrEmpty(rawName)) throw new ArgumentNullException(nameof(rawName));
            return Prefix + rawName;
        }

        /// <summary>
        /// Quoted, prefixed, optionally schema-qualified reference.
        /// </summary>
        /// <param name="rawName">Unprefixed name.</param>
        /// <returns>Reference.</returns>
        public string Reference(string rawName)
        {
            return _Dialect.QualifiedReference(Schema, RawName(rawName));
        }

        #endregion
    }
}
