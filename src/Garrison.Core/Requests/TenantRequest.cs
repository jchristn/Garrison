namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Tenant create or update request.
    /// </summary>
    public class TenantRequest
    {
        /// <summary>
        /// Tenant name. Required on create.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Whether the tenant is active.
        /// </summary>
        public bool? Active { get; set; } = null;

        /// <summary>
        /// Require every deployment in the tenant to be Untrusted. Null leaves the current value (default false on
        /// create). Turning it on does not change existing deployments; their next update must set Untrusted.
        /// </summary>
        public bool? RequireUntrustedDeployments { get; set; } = null;
    }
}
