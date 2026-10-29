namespace Garrison.Core.Models
{
    using System.Collections.Generic;

    /// <summary>
    /// A tenant's ordered environment list (AD1.3), as read and written through the environments routes.
    /// </summary>
    public class TenantEnvironmentList
    {
        #region Public-Members

        /// <summary>
        /// Environments in promotion order. Between 1 and 16 entries, names unique.
        /// </summary>
        public List<TenantEnvironment> Environments
        {
            get
            {
                return _Environments;
            }
            set
            {
                _Environments = value ?? new List<TenantEnvironment>();
            }
        }

        /// <summary>
        /// True when the tenant has never stored a list and the default (dev, staging, prod) applies. Ignored on write.
        /// </summary>
        public bool IsDefault { get; set; } = false;

        #endregion

        #region Private-Members

        private List<TenantEnvironment> _Environments = new List<TenantEnvironment>();

        #endregion
    }
}
