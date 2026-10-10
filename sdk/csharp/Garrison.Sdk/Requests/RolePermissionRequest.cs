namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Role to permission mapping request.
    /// </summary>
    public class RolePermissionRequest
    {
        /// <summary>
        /// Role identifier.
        /// </summary>
        public string? RoleId { get; set; } = null;

        /// <summary>
        /// Permission identifier.
        /// </summary>
        public string? PermissionId { get; set; } = null;
    }
}
