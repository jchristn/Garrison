namespace Garrison.Server.Settings
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Secret encryption and seeding settings.
    /// </summary>
    public class SecuritySettings
    {
        #region Public-Members

        /// <summary>
        /// Master key for secret encryption. Use base64 of 32 random bytes (for example <c>openssl rand -base64 32</c>); any
        /// other value is hashed with SHA-256 and logged as weak at startup. Override with GARRISON_MASTER_KEY. The built-in
        /// default is public, so the server refuses to start with it unless <see cref="AllowInsecureDefaults"/> is true.
        /// </summary>
        public string MasterKey { get; set; } = "garrison-default-master-key-override-me";

        /// <summary>
        /// Previous master keys indexed by version, for reading during rotation. Default empty. Configure only in the
        /// protected settings file; never place keys in manifests. All replicas must hold the ring before rotation.
        /// </summary>
        public Dictionary<int, string> PreviousMasterKeys { get; set; } = new Dictionary<int, string>();

        /// <summary>
        /// Master key version written with encrypted values. Minimum 1, maximum 255, default 1.
        /// </summary>
        public int MasterKeyVersion
        {
            get
            {
                return _MasterKeyVersion;
            }
            set
            {
                _MasterKeyVersion = Math.Clamp(value, 1, 255);
            }
        }

        /// <summary>
        /// Email for the seeded administrator (first boot only). Default admin@garrison. Override with GARRISON_ADMIN_EMAIL.
        /// </summary>
        public string AdminEmail { get; set; } = "admin@garrison";

        /// <summary>
        /// Password for the seeded administrator (first boot only). Default password, which is public, so the server
        /// refuses to start with it unless <see cref="AllowInsecureDefaults"/> is true. Override with GARRISON_ADMIN_PASSWORD.
        /// </summary>
        public string AdminPassword { get; set; } = "password";

        /// <summary>
        /// Access key of the default administrator credential seeded on first boot. Override with GARRISON_DEFAULT_ACCESS_KEY.
        /// </summary>
        public string DefaultAccessKey { get; set; } = "access_garrison_default";

        /// <summary>
        /// Secret key of the default administrator credential, set only when the credential is first created; a restart never
        /// overwrites it, so rotate it through the API. The built-in default is public, so the server refuses to start with it
        /// unless <see cref="AllowInsecureDefaults"/> is true. Override with GARRISON_DEFAULT_SECRET_KEY.
        /// </summary>
        public string DefaultSecretKey { get; set; } = "secret_garrison_default_change_me";

        /// <summary>
        /// Access key of the worker node credential seeded on first boot. Override with GARRISON_NODE_ACCESS_KEY.
        /// </summary>
        public string NodeAccessKey { get; set; } = "access_garrison_node";

        /// <summary>
        /// Secret key of the worker node credential, set only when the credential is first created; a restart never overwrites
        /// it, so rotate it through the API. The built-in default is public, so the server refuses to start with it unless
        /// <see cref="AllowInsecureDefaults"/> is true. Override with GARRISON_NODE_SECRET_KEY.
        /// </summary>
        public string NodeSecretKey { get; set; } = "secret_garrison_node_change_me";

        /// <summary>
        /// Development mode for keys and credentials. Default false: the server refuses to start while the master key,
        /// signing key, administrator API key, administrator password, default secret key, or node secret key is empty or
        /// equal to its public built-in default. True starts anyway with a warning, for local development and tests only.
        /// Override with GARRISON_ALLOW_INSECURE_DEFAULTS.
        /// </summary>
        public bool AllowInsecureDefaults { get; set; } = false;

        #endregion

        #region Private-Members

        private int _MasterKeyVersion = 1;

        #endregion
    }
}
