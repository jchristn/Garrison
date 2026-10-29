namespace Garrison.Sdk.Models
{
    using System.Collections.Generic;

    /// <summary>
    /// A tenant's ordered environment ladder.
    /// </summary>
    public class TenantEnvironmentList
    {
        #region Public-Members

        /// <summary>
        /// Environments in promotion order.
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
        /// True when the tenant has not customized the ladder (dev, staging, prod). Read-only.
        /// </summary>
        public bool IsDefault { get; set; } = false;

        #endregion

        #region Private-Members

        private List<TenantEnvironment> _Environments = new List<TenantEnvironment>();

        #endregion
    }
}
