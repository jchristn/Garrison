namespace Garrison.Sdk.Enums
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
        /// A caller with Admin on Secret read a secret's decrypted value through the reveal route.
        /// </summary>
        SecretRevealed,

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
        QueueFull,

        /// <summary>A person applied a freeze.</summary>
        FreezeApplied,

        /// <summary>A person lifted a freeze.</summary>
        FreezeLifted,

        /// <summary>A person turned the autonomy kill switch on or off.</summary>
        KillSwitchChanged,

        /// <summary>A person gave direction to an organization's top agent from the board.</summary>
        BoardDirectionGiven,

        /// <summary>A person cancelled everything in an organization unit's subtree.</summary>
        UnitCascadeCancelled,

        /// <summary>The budget guard froze a unit whose subtree spend passed its budget plus the freeze margin.</summary>
        OrgBudgetFrozen,

        /// <summary>A keeper (mandate) was paused, by a person or by an organization change.</summary>
        MandatePaused,

        /// <summary>A keeper (mandate) was resumed.</summary>
        MandateResumed,

        /// <summary>A wake of a keeper (mandate) was requested now.</summary>
        MandateWoken,

        /// <summary>A keeper (mandate) was deleted.</summary>
        MandateDeleted,

        /// <summary>An escalation was answered. The record names the escalation, never the answer.</summary>
        EscalationAnswered,

        /// <summary>An escalation was cancelled.</summary>
        EscalationCancelled
    }
}
