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

        #endregion

        #region Private-Members

        private int _TokenLifetimeMinutes = 480;
        private int _SignedRequestSkewSeconds = 300;
        private int _RateLimitPerMinute = 60;
        private int _PasswordHashIterations = 600000;

        #endregion
    }
}
