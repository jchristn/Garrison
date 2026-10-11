namespace Garrison.Core.Services
{
    using System;

    /// <summary>
    /// Values used by first-boot seeding.
    /// </summary>
    public class SeedOptions
    {
        /// <summary>
        /// Administrator email. Default admin@garrison.
        /// </summary>
        public string AdminEmail { get; set; } = "admin@garrison";

        /// <summary>
        /// Administrator password. Default password. Change it before the server is reachable by anyone else.
        /// </summary>
        public string AdminPassword { get; set; } = "password";

        /// <summary>
        /// PBKDF2 iterations for the seeded users' password hashes. Minimum 10000, maximum 10000000, default 600000.
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
        /// Default credential access key.
        /// </summary>
        public string DefaultAccessKey { get; set; } = "access_garrison_default";

        /// <summary>
        /// Default credential secret key.
        /// </summary>
        public string DefaultSecretKey { get; set; } = "secret_garrison_default_change_me";

        /// <summary>
        /// Node credential access key.
        /// </summary>
        public string NodeAccessKey { get; set; } = "access_garrison_node";

        /// <summary>
        /// Node credential secret key.
        /// </summary>
        public string NodeSecretKey { get; set; } = "secret_garrison_node_change_me";

        private int _PasswordHashIterations = 600000;
    }
}
