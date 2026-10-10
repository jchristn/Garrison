namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// User create or update request. Omitted fields are left unchanged on update.
    /// </summary>
    public class UserRequest
    {
        /// <summary>
        /// Email, unique within the tenant. Required on create.
        /// </summary>
        public string? Email { get; set; } = null;

        /// <summary>
        /// Password. Required on create; supplying it on update changes the password.
        /// </summary>
        public string? Password { get; set; } = null;

        /// <summary>
        /// First name.
        /// </summary>
        public string? FirstName { get; set; } = null;

        /// <summary>
        /// Last name.
        /// </summary>
        public string? LastName { get; set; } = null;

        /// <summary>
        /// Whether the user is a tenant administrator.
        /// </summary>
        public bool? IsTenantAdmin { get; set; } = null;

        /// <summary>
        /// Whether the user is a system administrator. Only system administrators may set it.
        /// </summary>
        public bool? IsAdmin { get; set; } = null;

        /// <summary>
        /// Whether the user is active.
        /// </summary>
        public bool? Active { get; set; } = null;
    }
}
