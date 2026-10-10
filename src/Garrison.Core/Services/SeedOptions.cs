namespace Garrison.Core.Services
{
    using System;

    /// <summary>
    /// Values used by first-boot seeding.
    /// </summary>
    public class SeedOptions
    {
        /// <summary>
        /// Administrator email. Default admin@garrison.local.
        /// </summary>
        public string AdminEmail { get; set; } = "admin@garrison.local";

        /// <summary>
        /// Administrator password.
        /// </summary>
        public string AdminPassword { get; set; } = "garrison";

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
    }
}
