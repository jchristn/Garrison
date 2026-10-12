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
        /// A person decided a permission approval.
        /// </summary>
        ApprovalDecided
    }
}
