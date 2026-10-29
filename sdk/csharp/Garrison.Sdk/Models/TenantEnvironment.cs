namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A named environment in a tenant's promotion ladder.
    /// </summary>
    public class TenantEnvironment
    {
        #region Public-Members

        /// <summary>
        /// Environment name, for example dev.
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
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Position in the ladder, lowest first.
        /// </summary>
        public int Position { get; set; } = 0;

        #endregion

        #region Private-Members

        private string _Name = String.Empty;

        #endregion
    }
}
