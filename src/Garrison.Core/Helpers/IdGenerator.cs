namespace Garrison.Core.Helpers
{
    using System;

    /// <summary>
    /// Generates prefixed, K-sortable PrettyId identifiers. Thread-safe.
    /// </summary>
    public static class IdGenerator
    {
        #region Private-Members

        private static readonly PrettyId.IdGenerator _Generator = new PrettyId.IdGenerator();
        private static readonly int _RandomLength = 32;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Generate an identifier with an arbitrary prefix.
        /// </summary>
        /// <param name="prefix">Prefix including the trailing underscore.</param>
        /// <returns>Identifier.</returns>
        /// <exception cref="ArgumentNullException">Thrown when prefix is null or empty.</exception>
        public static string New(string prefix)
        {
            if (String.IsNullOrEmpty(prefix)) throw new ArgumentNullException(nameof(prefix));
            return _Generator.GenerateKSortable(prefix, _RandomLength);
        }

        /// <summary>
        /// Generate a Tenant identifier (prefix ten_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewTenantId()
        {
            return _Generator.GenerateKSortable("ten_", _RandomLength);
        }

        /// <summary>
        /// Generate a User identifier (prefix usr_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewUserId()
        {
            return _Generator.GenerateKSortable("usr_", _RandomLength);
        }

        /// <summary>
        /// Generate a Credential identifier (prefix crd_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewCredentialId()
        {
            return _Generator.GenerateKSortable("crd_", _RandomLength);
        }

        /// <summary>
        /// Generate a AuthSession identifier (prefix ses_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewAuthSessionId()
        {
            return _Generator.GenerateKSortable("ses_", _RandomLength);
        }

        /// <summary>
        /// Generate a Role identifier (prefix rol_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewRoleId()
        {
            return _Generator.GenerateKSortable("rol_", _RandomLength);
        }

        /// <summary>
        /// Generate a Permission identifier (prefix prm_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPermissionId()
        {
            return _Generator.GenerateKSortable("prm_", _RandomLength);
        }

        /// <summary>
        /// Generate a RolePermissionMap identifier (prefix rpm_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewRolePermissionMapId()
        {
            return _Generator.GenerateKSortable("rpm_", _RandomLength);
        }

        /// <summary>
        /// Generate a UserRoleAssignment identifier (prefix ura_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewUserRoleAssignmentId()
        {
            return _Generator.GenerateKSortable("ura_", _RandomLength);
        }

        /// <summary>
        /// Generate a CredentialScopeAssignment identifier (prefix csa_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewCredentialScopeAssignmentId()
        {
            return _Generator.GenerateKSortable("csa_", _RandomLength);
        }

        /// <summary>
        /// Generate a AuditRecord identifier (prefix aud_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewAuditRecordId()
        {
            return _Generator.GenerateKSortable("aud_", _RandomLength);
        }

        /// <summary>
        /// Generate a RequestHistoryEntry identifier (prefix req_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewRequestHistoryEntryId()
        {
            return _Generator.GenerateKSortable("req_", _RandomLength);
        }

        /// <summary>
        /// Generate a RequestHistoryHeader identifier (prefix rqh_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewRequestHistoryHeaderId()
        {
            return _Generator.GenerateKSortable("rqh_", _RandomLength);
        }

        /// <summary>
        /// Generate a HarnessProfile identifier (prefix hrn_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewHarnessProfileId()
        {
            return _Generator.GenerateKSortable("hrn_", _RandomLength);
        }

        /// <summary>
        /// Generate a HarnessArgument identifier (prefix hra_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewHarnessArgumentId()
        {
            return _Generator.GenerateKSortable("hra_", _RandomLength);
        }

        /// <summary>
        /// Generate a HarnessEnvironmentVariable identifier (prefix hre_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewHarnessEnvironmentVariableId()
        {
            return _Generator.GenerateKSortable("hre_", _RandomLength);
        }

        /// <summary>
        /// Generate a HarnessFile identifier (prefix hrf_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewHarnessFileId()
        {
            return _Generator.GenerateKSortable("hrf_", _RandomLength);
        }

        /// <summary>
        /// Generate a PromptTemplate identifier (prefix tpl_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPromptTemplateId()
        {
            return _Generator.GenerateKSortable("tpl_", _RandomLength);
        }

        /// <summary>
        /// Generate a PromptTemplateVariable identifier (prefix tpv_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPromptTemplateVariableId()
        {
            return _Generator.GenerateKSortable("tpv_", _RandomLength);
        }

        /// <summary>
        /// Generate a PromptTemplateVersion identifier (prefix tpr_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPromptTemplateVersionId()
        {
            return _Generator.GenerateKSortable("tpr_", _RandomLength);
        }

        /// <summary>
        /// Generate a McpServer identifier (prefix mcp_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewMcpServerId()
        {
            return _Generator.GenerateKSortable("mcp_", _RandomLength);
        }

        /// <summary>
        /// Generate a McpServerVariable identifier (prefix mse_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewMcpServerVariableId()
        {
            return _Generator.GenerateKSortable("mse_", _RandomLength);
        }

        /// <summary>
        /// Generate a McpServerHeader identifier (prefix msh_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewMcpServerHeaderId()
        {
            return _Generator.GenerateKSortable("msh_", _RandomLength);
        }

        /// <summary>
        /// Generate a Secret identifier (prefix sec_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewSecretId()
        {
            return _Generator.GenerateKSortable("sec_", _RandomLength);
        }

        /// <summary>
        /// Generate a WorkspaceTemplate identifier (prefix wsp_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewWorkspaceTemplateId()
        {
            return _Generator.GenerateKSortable("wsp_", _RandomLength);
        }

        /// <summary>
        /// Generate a WorkspaceFile identifier (prefix wsf_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewWorkspaceFileId()
        {
            return _Generator.GenerateKSortable("wsf_", _RandomLength);
        }

        /// <summary>
        /// Generate a model price identifier (prefix mpr_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewModelPriceId()
        {
            return New(Constants.ModelPriceIdPrefix);
        }

        /// <summary>
        /// Generate a usage quota identifier (prefix mpr_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewUsageQuotaId()
        {
            return New(Constants.UsageQuotaIdPrefix);
        }

        /// <summary>
        /// Generate a pipeline definition identifier (prefix ppl_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPipelineId()
        {
            return New(Constants.PipelineIdPrefix);
        }

        /// <summary>
        /// Generate a pipeline definition stage identifier (prefix pst_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPipelineStageId()
        {
            return New(Constants.PipelineStageIdPrefix);
        }

        /// <summary>
        /// Generate a pipeline stage parameter identifier (prefix psp_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPipelineStageParameterId()
        {
            return New(Constants.PipelineStageParameterIdPrefix);
        }

        /// <summary>
        /// Generate a pipeline run identifier (prefix plr_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPipelineRunId()
        {
            return New(Constants.PipelineRunIdPrefix);
        }

        /// <summary>
        /// Generate a pipeline run stage identifier (prefix prs_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPipelineRunStageId()
        {
            return New(Constants.PipelineRunStageIdPrefix);
        }

        /// <summary>
        /// Generate a pipeline run stage parameter identifier (prefix prp_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPipelineRunStageParameterId()
        {
            return New(Constants.PipelineRunStageParameterIdPrefix);
        }

        /// <summary>
        /// Generate a pipeline review identifier (prefix prv_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewPipelineReviewId()
        {
            return New(Constants.PipelineReviewIdPrefix);
        }

        /// <summary>
        /// Generate a child wait identifier (prefix rcw_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewRunChildWaitId()
        {
            return New(Constants.RunChildWaitIdPrefix);
        }

        /// <summary>
        /// Generate a deployment egress rule row identifier (prefix der_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentEgressRuleId()
        {
            return New(Constants.DeploymentEgressRuleIdPrefix);
        }

        /// <summary>Generate an artifact identifier (prefix art_).</summary>
        /// <returns>Identifier.</returns>
        public static string NewArtifactId()
        {
            return _Generator.GenerateKSortable("art_", _RandomLength);
        }

        /// <summary>
        /// Generate a ArtifactStore identifier (prefix ast_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewArtifactStoreId()
        {
            return _Generator.GenerateKSortable("ast_", _RandomLength);
        }

        /// <summary>
        /// Generate a Agent identifier (prefix agt_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewAgentId()
        {
            return _Generator.GenerateKSortable("agt_", _RandomLength);
        }

        /// <summary>
        /// Generate a AgentSkillDefinition identifier (prefix ags_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewAgentSkillDefinitionId()
        {
            return _Generator.GenerateKSortable("ags_", _RandomLength);
        }

        /// <summary>
        /// Generate a Deployment identifier (prefix dep_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentId()
        {
            return _Generator.GenerateKSortable("dep_", _RandomLength);
        }

        /// <summary>
        /// Generate a DeploymentPromptBinding identifier (prefix dpb_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentPromptBindingId()
        {
            return _Generator.GenerateKSortable("dpb_", _RandomLength);
        }

        /// <summary>
        /// Generate a DeploymentResourceBinding identifier (prefix drb_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentResourceBindingId()
        {
            return _Generator.GenerateKSortable("drb_", _RandomLength);
        }

        /// <summary>
        /// Generate a DeploymentArgumentOverride identifier (prefix dao_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentArgumentOverrideId()
        {
            return _Generator.GenerateKSortable("dao_", _RandomLength);
        }

        /// <summary>
        /// Generate a DeploymentEnvironmentOverride identifier (prefix deo_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentEnvironmentOverrideId()
        {
            return _Generator.GenerateKSortable("deo_", _RandomLength);
        }

        /// <summary>
        /// Generate a DeploymentFileOverride identifier (prefix dfo_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentFileOverrideId()
        {
            return _Generator.GenerateKSortable("dfo_", _RandomLength);
        }

        /// <summary>
        /// Generate a DeploymentNodeSelector identifier (prefix dns_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentNodeSelectorId()
        {
            return _Generator.GenerateKSortable("dns_", _RandomLength);
        }

        /// <summary>
        /// Generate a DeploymentParameter identifier (prefix dpp_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentParameterId()
        {
            return _Generator.GenerateKSortable("dpp_", _RandomLength);
        }

        /// <summary>
        /// Generate a DeploymentRunOverrideRule identifier (prefix dro_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentRunOverrideRuleId()
        {
            return _Generator.GenerateKSortable("dro_", _RandomLength);
        }

        /// <summary>
        /// Generate a DeploymentApprovalRule identifier (prefix dar_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewDeploymentApprovalRuleId()
        {
            return _Generator.GenerateKSortable("dar_", _RandomLength);
        }

        /// <summary>
        /// Generate an Approval identifier (prefix apr_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewApprovalId()
        {
            return _Generator.GenerateKSortable("apr_", _RandomLength);
        }

        /// <summary>
        /// Generate a NodePool identifier (prefix npl_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewNodePoolId()
        {
            return _Generator.GenerateKSortable("npl_", _RandomLength);
        }

        /// <summary>
        /// Generate a Node identifier (prefix nod_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewNodeId()
        {
            return _Generator.GenerateKSortable("nod_", _RandomLength);
        }

        /// <summary>
        /// Generate a NodeLabel identifier (prefix nlb_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewNodeLabelId()
        {
            return _Generator.GenerateKSortable("nlb_", _RandomLength);
        }

        /// <summary>
        /// Generate a NodeCapability identifier (prefix ncp_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewNodeCapabilityId()
        {
            return _Generator.GenerateKSortable("ncp_", _RandomLength);
        }

        /// <summary>
        /// Generate a Run identifier (prefix run_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewRunId()
        {
            return _Generator.GenerateKSortable("run_", _RandomLength);
        }

        /// <summary>
        /// Generate a RunParameter identifier (prefix rpa_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewRunParameterId()
        {
            return _Generator.GenerateKSortable("rpa_", _RandomLength);
        }

        /// <summary>
        /// Generate a RunRequirement identifier (prefix rrq_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewRunRequirementId()
        {
            return _Generator.GenerateKSortable("rrq_", _RandomLength);
        }

        /// <summary>
        /// Generate a RunTemplateVersion identifier (prefix rtv_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewRunTemplateVersionId()
        {
            return _Generator.GenerateKSortable("rtv_", _RandomLength);
        }

        /// <summary>
        /// Generate a RunEvent identifier (prefix rev_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewRunEventId()
        {
            return _Generator.GenerateKSortable("rev_", _RandomLength);
        }

        /// <summary>
        /// Generate a CoordinationLease identifier (prefix lea_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewCoordinationLeaseId()
        {
            return _Generator.GenerateKSortable("lea_", _RandomLength);
        }

        /// <summary>
        /// Generate a ClusterSetting identifier (prefix cst_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewClusterSettingId()
        {
            return _Generator.GenerateKSortable("cst_", _RandomLength);
        }

        /// <summary>
        /// Generate a ManifestApply identifier (prefix man_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewManifestApplyId()
        {
            return _Generator.GenerateKSortable("man_", _RandomLength);
        }

        /// <summary>
        /// Generate a ManifestApplyItem identifier (prefix mai_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewManifestApplyItemId()
        {
            return _Generator.GenerateKSortable("mai_", _RandomLength);
        }

        /// <summary>
        /// Generate a cluster MCP session identifier (prefix mcs_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewMcpSessionId()
        {
            return _Generator.GenerateKSortable("mcs_", _RandomLength);
        }

        /// <summary>
        /// Generate a Conversation identifier (prefix cnv_).
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewConversationId()
        {
            return _Generator.GenerateKSortable("cnv_", _RandomLength);
        }

        /// <summary>
        /// Generate an identifier for a scalar child row.
        /// </summary>
        /// <returns>Identifier.</returns>
        public static string NewChildRowId()
        {
            return _Generator.GenerateKSortable("chr_", _RandomLength);
        }

        #endregion
    }
}
