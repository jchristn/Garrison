namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Association between a role and a permission.
    /// </summary>
    public class RolePermissionMap
    {
        #region Public-Members

        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? String.Empty : value;
            }
        }

        /// <summary>
        /// Tenant identifier. Null for global or built-in records.
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Role identifier.
        /// </summary>
        public string RoleId
        {
            get
            {
                return _RoleId;
            }
            set
            {
                _RoleId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Permission identifier.
        /// </summary>
        public string PermissionId
        {
            get
            {
                return _PermissionId;
            }
            set
            {
                _PermissionId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether the record is active.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Whether the record is protected from deletion.
        /// </summary>
        public bool IsProtected { get; set; } = false;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc
        {
            get
            {
                return _CreatedUtc;
            }
            set
            {
                _CreatedUtc = value;
            }
        }

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc
        {
            get
            {
                return _LastUpdateUtc;
            }
            set
            {
                _LastUpdateUtc = value;
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _RoleId = String.Empty;
        private string _PermissionId = String.Empty;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;

        #endregion
    }
}
