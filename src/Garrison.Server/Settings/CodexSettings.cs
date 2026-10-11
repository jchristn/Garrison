namespace Garrison.Server.Settings
{
    using System;

    /// <summary>
    /// Control-plane refresh of ChatGPT logins stored in CodexAuthJson secrets (G-22). The control plane, not the run,
    /// refreshes a login before it expires and writes the rotated tokens back to the secret, because OpenAI rotates the
    /// refresh token on every refresh and a run's copy of the login is thrown away. Every value applies live.
    /// </summary>
    public class CodexSettings
    {
        #region Public-Members

        /// <summary>
        /// Refresh a stored login when its access token expires within this many seconds (from the token's exp claim).
        /// Minimum 300, maximum 2592000 (30 days), default 86400 (1 day). For tokens that live less than twice this
        /// long, half the token's lifetime is used instead, so a short-lived token is not refreshed on every run. Keep
        /// it above Runtime.MaxRunSeconds so that a token handed to a run outlives the run.
        /// </summary>
        public int RefreshBeforeExpirySeconds
        {
            get
            {
                return _RefreshBeforeExpirySeconds;
            }
            set
            {
                _RefreshBeforeExpirySeconds = Math.Clamp(value, 300, 2592000);
            }
        }

        /// <summary>
        /// How often the leader checks every active CodexAuthJson secret and refreshes the ones within
        /// <see cref="RefreshBeforeExpirySeconds"/> of expiry, so that logins no run has used lately do not lapse.
        /// Minimum 0, maximum 86400, default 900. 0 turns the background check off; runs still refresh what they use.
        /// </summary>
        public int RefreshCheckIntervalSeconds
        {
            get
            {
                return _RefreshCheckIntervalSeconds;
            }
            set
            {
                _RefreshCheckIntervalSeconds = Math.Clamp(value, 0, 86400);
            }
        }

        /// <summary>
        /// Longest one refresh request to the token endpoint may take, in seconds. Minimum 5, maximum 300, default 15.
        /// The refresh runs while a run is being handed to a worker, and a caller waiting on another replica's refresh
        /// waits up to this plus 5 seconds, so keep it well below Scheduling.LeaseDurationMs.
        /// </summary>
        public int RefreshTimeoutSeconds
        {
            get
            {
                return _RefreshTimeoutSeconds;
            }
            set
            {
                _RefreshTimeoutSeconds = Math.Clamp(value, 5, 300);
            }
        }

        /// <summary>
        /// OAuth token endpoint the refresh is sent to. Default https://auth.openai.com/oauth/token, the endpoint the
        /// Codex CLI uses (codex-rs login crate, REFRESH_TOKEN_URL). Null or empty restores the default. Override with
        /// GARRISON_CODEX_TOKEN_ENDPOINT.
        /// </summary>
        public string TokenEndpoint
        {
            get
            {
                return _TokenEndpoint;
            }
            set
            {
                _TokenEndpoint = String.IsNullOrWhiteSpace(value) ? DefaultTokenEndpoint : value.Trim();
            }
        }

        /// <summary>
        /// OAuth client identifier sent with the refresh. Default app_EMoamEEZ73f0CkXaXp7hrann, the Codex CLI's client
        /// (codex-rs login crate, CLIENT_ID). It must match the client the login was issued to. Null or empty restores
        /// the default. Override with GARRISON_CODEX_CLIENT_ID.
        /// </summary>
        public string ClientId
        {
            get
            {
                return _ClientId;
            }
            set
            {
                _ClientId = String.IsNullOrWhiteSpace(value) ? DefaultClientId : value.Trim();
            }
        }

        /// <summary>
        /// Default <see cref="TokenEndpoint"/>.
        /// </summary>
        public static string DefaultTokenEndpoint
        {
            get
            {
                return "https://auth.openai.com/oauth/token";
            }
        }

        /// <summary>
        /// Default <see cref="ClientId"/>.
        /// </summary>
        public static string DefaultClientId
        {
            get
            {
                return "app_EMoamEEZ73f0CkXaXp7hrann";
            }
        }

        #endregion

        #region Private-Members

        private int _RefreshBeforeExpirySeconds = 86400;
        private int _RefreshCheckIntervalSeconds = 900;
        private int _RefreshTimeoutSeconds = 15;
        private string _TokenEndpoint = DefaultTokenEndpoint;
        private string _ClientId = DefaultClientId;

        #endregion
    }
}
