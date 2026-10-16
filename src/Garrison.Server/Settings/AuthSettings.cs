namespace Garrison.Server.Settings
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Authentication settings.
    /// </summary>
    public class AuthSettings
    {
        #region Public-Members

        /// <summary>
        /// Token issuer. Default garrison.
        /// </summary>
        public string Issuer { get; set; } = "garrison";

        /// <summary>
        /// Token signing key. Use at least 32 random bytes; shorter values are logged as weak at startup. Override with
        /// GARRISON_AUTH_SIGNING_KEY; never commit a real value. The built-in default is public, so the server refuses to start
        /// with it unless Security.AllowInsecureDefaults is true. Artifact download tickets use a separate key derived from it.
        /// </summary>
        public string SigningKey { get; set; } = "garrison-default-signing-key-override-me";

        /// <summary>
        /// Session token lifetime in minutes. Minimum 1, maximum 10080, default 480.
        /// </summary>
        public int TokenLifetimeMinutes
        {
            get
            {
                return _TokenLifetimeMinutes;
            }
            set
            {
                _TokenLifetimeMinutes = Math.Clamp(value, 1, 10080);
            }
        }

        /// <summary>
        /// System administrator API key accepted in x-api-key. Override with GARRISON_ADMIN_API_KEY. The built-in default is
        /// public, so the server refuses to start with it unless Security.AllowInsecureDefaults is true.
        /// </summary>
        public string AdminApiKey { get; set; } = "garrisonadmin";

        /// <summary>
        /// Allowed clock skew for signed requests, in seconds. Minimum 10, maximum 3600, default 300.
        /// </summary>
        public int SignedRequestSkewSeconds
        {
            get
            {
                return _SignedRequestSkewSeconds;
            }
            set
            {
                _SignedRequestSkewSeconds = Math.Clamp(value, 10, 3600);
            }
        }

        /// <summary>
        /// Authentication attempts allowed per source IP per minute on token routes, counted in the database across all replicas. Minimum 1, maximum 100000, default 60.
        /// </summary>
        public int RateLimitPerMinute
        {
            get
            {
                return _RateLimitPerMinute;
            }
            set
            {
                _RateLimitPerMinute = Math.Clamp(value, 1, 100000);
            }
        }

        /// <summary>
        /// PBKDF2-HMAC-SHA256 iterations for new password hashes. Minimum 10000, maximum 10000000, default 600000 (OWASP
        /// guidance for PBKDF2-HMAC-SHA256). Existing hashes keep their own iteration count and are rehashed on the next
        /// successful sign-in when they use fewer. Lower values are for tests only.
        /// </summary>
        public int PasswordHashIterations
        {
            get
            {
                return _PasswordHashIterations;
            }
            set
            {
                _PasswordHashIterations = Math.Clamp(value, 10000, 10000000);
            }
        }

        /// <summary>
        /// Lifetime applied to credentials without an explicit expiry, in days. 0 preserves non-expiring credentials;
        /// minimum 0, maximum 36500, default 0. Applies to API-created credentials, not bootstrap credentials.
        /// </summary>
        public int CredentialDefaultLifetimeDays
        {
            get { return _CredentialDefaultLifetimeDays; }
            set { _CredentialDefaultLifetimeDays = Math.Clamp(value, 0, 36500); }
        }

        /// <summary>
        /// Maximum lifetime of newly created or updated credentials, in days. 0 means no ceiling; maximum 36500,
        /// default 0. An explicit expiry beyond the ceiling is rejected rather than silently shortened.
        /// </summary>
        public int CredentialMaxLifetimeDays
        {
            get { return _CredentialMaxLifetimeDays; }
            set { _CredentialMaxLifetimeDays = Math.Clamp(value, 0, 36500); }
        }

        /// <summary>
        /// Maximum run-token lifetime in minutes, bounded by the run deadline as well. Minimum 1, maximum 10080,
        /// default 1440. Expired tokens cannot refresh themselves; configure this for the longest permitted run.
        /// </summary>
        public int RunTokenLifetimeMinutes
        {
            get { return _RunTokenLifetimeMinutes; }
            set { _RunTokenLifetimeMinutes = Math.Clamp(value, 1, 10080); }
        }

        #endregion

        #region Private-Members

        private int _CredentialDefaultLifetimeDays = 0;
        private int _CredentialMaxLifetimeDays = 0;
        private int _RunTokenLifetimeMinutes = 1440;
        private int _TokenLifetimeMinutes = 480;
        private int _SignedRequestSkewSeconds = 300;
        private int _RateLimitPerMinute = 60;
        private int _PasswordHashIterations = 600000;

        #endregion
    }
}
