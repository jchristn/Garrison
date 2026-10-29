namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// One environment label in a tenant's ordered environment list (AD1.3, AD-013). Environments are labels on
    /// deployments, not a tenancy concept; promotion moves a revision from one environment to the next in this order.
    /// A tenant with no stored list uses dev, staging, prod.
    /// </summary>
    public class TenantEnvironment
    {
        #region Public-Members

        /// <summary>
        /// Environment name: 1 to 32 lowercase letters, digits, and hyphens, starting with a letter. The name draft is
        /// reserved for playground runs (AD9.1).
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Optional description, at most 1000 characters.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Zero-based position in the promotion order. Set by the server from the list order.
        /// </summary>
        public int Position { get; set; } = 0;

        #endregion

        #region Private-Members

        private string _Name = String.Empty;

        #endregion
    }
}
