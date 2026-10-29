namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Who may use an agentic app's chat UI.
    /// </summary>
    public enum AppAuthModeEnum
    {
        /// <summary>
        /// Any active user of the app's tenant.
        /// </summary>
        TenantUsers,

        /// <summary>
        /// Tenant users who hold the built-in AppUser role on the app, assigned with resource scope on the app identifier.
        /// The default.
        /// </summary>
        AppUsers,

        /// <summary>
        /// Anyone with the URL, but only when the app's AnonymousEnabled is also true. Signed-in users still work.
        /// </summary>
        Anonymous
    }
}
