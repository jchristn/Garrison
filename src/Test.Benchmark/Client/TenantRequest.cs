namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Tenant create request.
    /// </summary>
    public class TenantRequest
    {
        /// <summary>
        /// Tenant name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; }
    }
}
