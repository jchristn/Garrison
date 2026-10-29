namespace Garrison.Core.Enums
{
    /// <summary>
    /// Who may use an agentic app's chat UI (AD6.5, AD-021).
    /// </summary>
    public enum AppAuthModeEnum
    {
        /// <summary>
        /// Any user of the app's tenant who signs in.
        /// </summary>
        TenantUsers,

        /// <summary>
        /// Users of the tenant who hold the AppUser role on this app (default).
        /// </summary>
        AppUsers,

        /// <summary>
        /// Anyone with the URL, through a short-lived anonymous app session. Refused unless the tenant allows anonymous
        /// apps and the app's anonymousEnabled is set.
        /// </summary>
        Anonymous
    }
}
