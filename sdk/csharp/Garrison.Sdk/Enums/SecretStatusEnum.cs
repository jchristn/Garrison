namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Health of a stored credential, as the control plane last saw it.
    /// </summary>
    public enum SecretStatusEnum
    {
        /// <summary>
        /// Usable, or not checked. Every secret starts here, and setting a new value returns it here.
        /// </summary>
        Ok,

        /// <summary>
        /// The provider rejected the stored login for good (for a CodexAuthJson secret: the refresh token was reused,
        /// expired, or revoked). Runs that bind the secret fail with outcome NotCredentialed until the secret's value
        /// is replaced with a fresh login.
        /// </summary>
        NeedsReauthentication
    }
}
