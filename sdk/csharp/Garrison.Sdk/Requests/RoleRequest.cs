namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Custom role create or update request.
    /// </summary>
    public class RoleRequest
    {
        /// <summary>
        /// Role name. Required on create.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Whether the role is active.
        /// </summary>
        public bool? Active { get; set; } = null;
    }
}
