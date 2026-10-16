namespace Garrison.Core.Enums
{
    /// <summary>
    /// Kind of audit record.
    /// </summary>
    public enum AuditEventTypeEnum
    {
        /// <summary>
        /// AuthSuccess.
        /// </summary>
        AuthSuccess,

        /// <summary>
        /// AuthFailure.
        /// </summary>
        AuthFailure,

        /// <summary>
        /// SessionIssued.
        /// </summary>
        SessionIssued,

        /// <summary>
        /// SessionRevoked.
        /// </summary>
        SessionRevoked,

        /// <summary>
        /// CredentialCreated.
        /// </summary>
        CredentialCreated,

        /// <summary>
        /// CredentialRotated.
        /// </summary>
        CredentialRotated,

        /// <summary>
        /// CredentialUsed.
        /// </summary>
        CredentialUsed,

        /// <summary>
        /// AuthorizationDenied.
        /// </summary>
        AuthorizationDenied,

        /// <summary>
        /// AuthorizationBypass.
        /// </summary>
        AuthorizationBypass,

        /// <summary>
        /// RoleChanged.
        /// </summary>
        RoleChanged,

        /// <summary>
        /// PermissionChanged.
        /// </summary>
        PermissionChanged,

        /// <summary>
        /// AssignmentChanged.
        /// </summary>
        AssignmentChanged,

        /// <summary>
        /// ConfigurationChanged.
        /// </summary>
        ConfigurationChanged,

        /// <summary>
        /// SecretChanged.
        /// </summary>
        SecretChanged,

        /// <summary>
        /// SettingsChanged.
        /// </summary>
        SettingsChanged,

        /// <summary>
        /// RestartRequested.
        /// </summary>
        RestartRequested,

        /// <summary>
        /// ManifestApplied.
        /// </summary>
        ManifestApplied,

        /// <summary>
        /// NodeRegistered.
        /// </summary>
        NodeRegistered,

        /// <summary>
        /// NodeStatusChanged.
        /// </summary>
        NodeStatusChanged,

        /// <summary>
        /// RunCancelled.
        /// </summary>
        RunCancelled,

        /// <summary>
        /// ConversationDeleted.
        /// </summary>
        ConversationDeleted,

        /// <summary>
        /// A person decided a permission approval (P12.3).
        /// </summary>
        ApprovalDecided,

        /// <summary>
        /// A person decided a pipeline stage review (P12.9).
        /// </summary>
        PipelineReviewDecided,

        /// <summary>
        /// A pipeline run was cancelled (P12.9).
        /// </summary>
        PipelineRunCancelled,

        /// <summary>
        /// A trigger or notification endpoint signing secret was rotated (P12.5, P12.14).
        /// </summary>
        SigningSecretRotated,

        /// <summary>A queued-run depth limit refused admission.</summary>
        QueueFull
    }
}
