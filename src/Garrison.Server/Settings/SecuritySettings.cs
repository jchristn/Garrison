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
        /// Master key for secret encryption (base64 of 32 bytes, or a passphrase). Override with GARRISON_MASTER_KEY.
        /// </summary>
        public string MasterKey { get; set; } = "garrison-default-master-key-override-me";

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
        /// Password for the seeded administrator (first boot only). Default password. Override with GARRISON_ADMIN_PASSWORD.
        /// </summary>
        public string AdminPassword { get; set; } = "password";

        /// <summary>
        /// Access key of the default administrator credential seeded on first boot. Override with GARRISON_DEFAULT_ACCESS_KEY.
        /// </summary>
        public string DefaultAccessKey { get; set; } = "access_garrison_default";

        /// <summary>
        /// Secret key of the default administrator credential seeded on first boot. Override with GARRISON_DEFAULT_SECRET_KEY.
        /// </summary>
        public string DefaultSecretKey { get; set; } = "secret_garrison_default_change_me";

        /// <summary>
        /// Access key of the worker node credential seeded on first boot. Override with GARRISON_NODE_ACCESS_KEY.
        /// </summary>
        public string NodeAccessKey { get; set; } = "access_garrison_node";

        /// <summary>
        /// Secret key of the worker node credential seeded on first boot. Override with GARRISON_NODE_SECRET_KEY.
        /// </summary>
        public string NodeSecretKey { get; set; } = "secret_garrison_node_change_me";

        #endregion

        #region Private-Members

        private int _MasterKeyVersion = 1;

        #endregion
    }
}
