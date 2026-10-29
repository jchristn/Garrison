namespace Garrison.Core
{
    /// <summary>
    /// Product-wide constants that are not operator-configurable (protocol names, header names, product identity).
    /// Configurable values live in settings classes.
    /// </summary>
    public static class Constants
    {
        /// <summary>Brokered provider credential lease prefix.</summary>
        public const string CredentialLeaseIdPrefix = "crl_";

        /// <summary>Effect intent identifier prefix.</summary>
        public const string EffectOperationIdPrefix = "eop_";

        /// <summary>Prefix for tenant-owned model price records.</summary>
        public const string ModelPriceIdPrefix = "mpr_";

        /// <summary>Transient worker MCP diagnostic identifier prefix.</summary>
        public const string McpTestIdPrefix = "mct_";

        /// <summary>Worker MCP diagnostic tool outcome child prefix.</summary>
        public const string McpTestToolIdPrefix = "mtt_";

        /// <summary>Usage quota identifier prefix.</summary>
        public const string UsageQuotaIdPrefix = "uqt_";

        /// <summary>Pipeline definition identifier prefix (P12.9).</summary>
        public const string PipelineIdPrefix = "ppl_";

        /// <summary>Pipeline definition stage identifier prefix (P12.9).</summary>
        public const string PipelineStageIdPrefix = "pst_";

        /// <summary>Pipeline definition stage run parameter identifier prefix (P12.9).</summary>
        public const string PipelineStageParameterIdPrefix = "psp_";

        /// <summary>Pipeline run identifier prefix (P12.9).</summary>
        public const string PipelineRunIdPrefix = "plr_";

        /// <summary>Pipeline run stage snapshot identifier prefix (P12.9).</summary>
        public const string PipelineRunStageIdPrefix = "prs_";

        /// <summary>Pipeline run stage parameter snapshot identifier prefix (P12.9).</summary>
        public const string PipelineRunStageParameterIdPrefix = "prp_";

        /// <summary>Pipeline stage review identifier prefix (P12.9).</summary>
        public const string PipelineReviewIdPrefix = "prv_";

        /// <summary>Child wait record identifier prefix: a parent run waiting synchronously on a child run (P12.38).</summary>
        public const string RunChildWaitIdPrefix = "rcw_";

        /// <summary>Deployment egress allowlist rule row identifier prefix (P11.15).</summary>
        public const string DeploymentEgressRuleIdPrefix = "der_";

        /// <summary>Trigger identifier prefix: a cron schedule or signed webhook that starts runs (P12.5).</summary>
        public const string TriggerIdPrefix = "trg_";

        /// <summary>Trigger fire history record identifier prefix (P12.5).</summary>
        public const string TriggerFireIdPrefix = "tfr_";

        /// <summary>Notification endpoint identifier prefix: an outbound webhook subscription (P12.14).</summary>
        public const string NotificationEndpointIdPrefix = "nep_";

        /// <summary>Notification endpoint subscribed event row identifier prefix (P12.14).</summary>
        public const string NotificationEndpointEventIdPrefix = "nev_";

        /// <summary>Notification delivery (outbox and delivery log) identifier prefix (P12.14).</summary>
        public const string NotificationDeliveryIdPrefix = "ndl_";

        /// <summary>Agent revision identifier prefix (AD1).</summary>
        public const string AgentRevisionIdPrefix = "arv_";

        /// <summary>Promotion record identifier prefix (AD1.4).</summary>
        public const string PromotionRecordIdPrefix = "pro_";

        /// <summary>Promotion record item identifier prefix: one repinned deployment (AD1.4).</summary>
        public const string PromotionRecordItemIdPrefix = "pri_";

        /// <summary>Agent asset identifier prefix (AD2).</summary>
        public const string AgentAssetIdPrefix = "aas_";

        /// <summary>Agent asset version identifier prefix (AD2).</summary>
        public const string AgentAssetVersionIdPrefix = "aav_";

        /// <summary>Key prefix for asset content inside an artifact store (AD-011). Never used for artifacts.</summary>
        public const string AssetKeyPrefix = ".garrison-assets/";

        /// <summary>Conversation file space identifier prefix (AD3).</summary>
        public const string FileSpaceIdPrefix = "cfs_";

        /// <summary>Conversation file identifier prefix (AD3).</summary>
        public const string FileSpaceFileIdPrefix = "cff_";

        /// <summary>Conversation file version identifier prefix (AD3).</summary>
        public const string FileSpaceVersionIdPrefix = "cfv_";

        /// <summary>Key prefix for file space content inside an artifact store (AD3.2). Never used for artifacts.</summary>
        public const string FileSpaceKeyPrefix = ".garrison-files/";

        /// <summary>Capability descriptor identifier prefix (AD4).</summary>
        public const string CapabilityIdPrefix = "cap_";

        /// <summary>Fan-out group identifier prefix (AD5).</summary>
        public const string FanOutGroupIdPrefix = "fog_";

        /// <summary>Fan-out group member identifier prefix (AD5).</summary>
        public const string FanOutMemberIdPrefix = "fom_";

        /// <summary>Agentic app identifier prefix (AD6).</summary>
        public const string AgenticAppIdPrefix = "app_";

        /// <summary>App revision identifier prefix (AD6).</summary>
        public const string AppRevisionIdPrefix = "apv_";

        /// <summary>Studio draft identifier prefix (AD7).</summary>
        public const string StudioDraftIdPrefix = "sdr_";

        /// <summary>App session identifier prefix (AD6.5).</summary>
        public const string AppSessionIdPrefix = "aps_";

        /// <summary>Prefix of app session tokens (AD6.5), so they are easy to tell apart from management tokens.</summary>
        public const string AppSessionTokenPrefix = "gas_";

        /// <summary>
        /// Node label prefix a worker uses to report a harness tool probe that succeeded (AD4.4), for example
        /// garrison.io/tool-pandoc=true. A HarnessBuiltIn capability requires its label, so runs that need the tool are
        /// placed on nodes that report it.
        /// </summary>
        public const string ToolLabelPrefix = "garrison.io/tool-";

        /// <summary>
        /// Header carrying a Garrison webhook signature, inbound on trigger webhooks and outbound on notifications:
        /// <c>t=&lt;unix seconds&gt;,v1=&lt;hex HMAC-SHA256 of "&lt;t&gt;.&lt;raw body&gt;"&gt;</c> (P12.5, P12.14).
        /// </summary>
        public const string HeaderWebhookSignature = "X-Garrison-Signature";

        /// <summary>
        /// Header carrying a webhook delivery identifier. Inbound on a trigger webhook it makes a repeated delivery
        /// idempotent; outbound on a notification it is the delivery identifier, the same on every retry.
        /// </summary>
        public const string HeaderWebhookDelivery = "X-Garrison-Delivery";

        /// <summary>Header carrying the event name of an outbound notification (P12.14).</summary>
        public const string HeaderWebhookEvent = "X-Garrison-Event";

        /// <summary>
        /// Product name.
        /// </summary>
        public const string ProductName = "Garrison";

        /// <summary>
        /// Product version. Mirrors src/Directory.Build.props; never change without explicit approval.
        /// </summary>
        public const string ProductVersion = "0.2.0";

        /// <summary>
        /// Repository URL.
        /// </summary>
        public const string RepositoryUrl = "https://github.com/jchristn/Garrison";

        /// <summary>
        /// Name of the Garrison MCP server as seen by harnesses.
        /// </summary>
        public const string McpServerName = "garrison";

        /// <summary>
        /// Prefix reserved for built-in harness profiles and prompt templates.
        /// </summary>
        public const string BuiltInPrefix = "builtin/";

        /// <summary>
        /// Identifier of the default tenant seeded on first boot.
        /// </summary>
        public const string DefaultTenantId = "default";

        /// <summary>
        /// Name of the default tenant seeded on first boot.
        /// </summary>
        public const string DefaultTenantName = "Default";

        /// <summary>
        /// Header carrying a bearer token alternative.
        /// </summary>
        public const string HeaderToken = "x-token";

        /// <summary>
        /// Header carrying the system administrator API key.
        /// </summary>
        public const string HeaderApiKey = "x-api-key";

        /// <summary>
        /// Header carrying a tenant identifier.
        /// </summary>
        public const string HeaderTenantId = "x-tenant-id";

        /// <summary>
        /// Header carrying a user email for token issuance.
        /// </summary>
        public const string HeaderEmail = "x-email";

        /// <summary>
        /// Header carrying a user password for token issuance.
        /// </summary>
        public const string HeaderPassword = "x-password";

        /// <summary>
        /// Header carrying a credential access key.
        /// </summary>
        public const string HeaderAccessKey = "x-access-key";

        /// <summary>
        /// Header carrying a credential secret key.
        /// </summary>
        public const string HeaderSecretKey = "x-secret-key";

        /// <summary>
        /// Header carrying the signed-request timestamp.
        /// </summary>
        public const string HeaderDate = "x-date";

        /// <summary>
        /// Header carrying the signed-request nonce.
        /// </summary>
        public const string HeaderNonce = "x-nonce";

        /// <summary>
        /// Header carrying the signed-request signature.
        /// </summary>
        public const string HeaderSignature = "x-signature";

        /// <summary>
        /// Header carrying a request identifier.
        /// </summary>
        public const string HeaderRequestId = "x-request-id";

        /// <summary>
        /// Header carrying an idempotency key on run creation.
        /// </summary>
        public const string HeaderIdempotencyKey = "Idempotency-Key";

        /// <summary>
        /// Coordination lease name for the maintenance leader.
        /// </summary>
        public const string LeaderLeaseName = "garrison-leader";
    }
}
