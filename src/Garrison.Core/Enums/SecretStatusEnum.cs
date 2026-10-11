namespace Garrison.Core.Enums
{
    /// <summary>
    /// Health of a stored credential, as the control plane last saw it (G-22).
    /// </summary>
    public enum SecretStatusEnum
    {
        /// <summary>
        /// Usable, or not checked. Every secret starts here, and setting a new value returns it here.
        /// </summary>
        Ok,

        /// <summary>
        /// The provider rejected the stored login for good (for a CodexAuthJson secret: the refresh token was reused,
        /// expired, or revoked). Runs that bind the secret fail at once until an operator replaces its value with a
        /// fresh login.
        /// </summary>
        NeedsReauthentication
    }
}
