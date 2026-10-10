namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Health check result.
    /// </summary>
    public class HealthResponse
    {
        /// <summary>
        /// healthy or degraded.
        /// </summary>
        public string Status { get; set; } = "healthy";

        /// <summary>
        /// Node identifier.
        /// </summary>
        public string Node { get; set; } = String.Empty;

        /// <summary>
        /// Product version.
        /// </summary>
        public string Version { get; set; } = String.Empty;

        /// <summary>
        /// Database status: ok or unreachable.
        /// </summary>
        public string Database { get; set; } = "ok";

        /// <summary>
        /// Server time (UTC).
        /// </summary>
        public DateTime Utc { get; set; } = DateTime.UtcNow;
    }
}
