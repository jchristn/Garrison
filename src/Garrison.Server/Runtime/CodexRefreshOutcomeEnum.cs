namespace Garrison.Server.Runtime
{
    /// <summary>
    /// Outcome of one control-plane check of a CodexAuthJson login (G-22).
    /// </summary>
    public enum CodexRefreshOutcomeEnum
    {
        /// <summary>
        /// Nothing to do: the access token is not close to expiry, or the secret holds no refreshable ChatGPT login.
        /// </summary>
        NotNeeded,

        /// <summary>
        /// This replica refreshed the login and wrote the rotated tokens back to the secret.
        /// </summary>
        Refreshed,

        /// <summary>
        /// Another caller (this or another replica) refreshed the login, or an operator replaced it, while this one
        /// waited; the fresh value was read back.
        /// </summary>
        RefreshedByPeer,

        /// <summary>
        /// The token endpoint rejected the refresh token for good (reused, expired, revoked, invalid_grant, or 401).
        /// The secret is marked NeedsReauthentication.
        /// </summary>
        NeedsReauthentication,

        /// <summary>
        /// The refresh could not complete right now (network error, timeout, server error, unreadable response). The
        /// secret is unchanged and the next check tries again.
        /// </summary>
        Failed
    }
}
