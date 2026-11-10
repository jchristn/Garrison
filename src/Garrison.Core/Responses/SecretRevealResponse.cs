namespace Garrison.Core.Responses
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// The decrypted value of one secret, returned by the reveal route to callers holding Admin on Secret.
    /// Callers should show the value briefly and never store it. Not thread-safe.
    /// </summary>
    public class SecretRevealResponse
    {
        #region Public-Members

        /// <summary>
        /// Secret identifier (sec_...). Never null; empty when unset.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Secret name. Never null; empty when unset.
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
        /// Secret kind.
        /// </summary>
        public SecretKindEnum Kind { get; set; } = SecretKindEnum.GenericEnv;

        /// <summary>
        /// The decrypted value. Never null; empty when unset.
        /// </summary>
        public string Value
        {
            get
            {
                return _Value;
            }
            set
            {
                _Value = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Last four characters of the value, matching the secret's metadata.
        /// </summary>
        public string? ValueLast4 { get; set; } = null;

        /// <summary>
        /// When the server decrypted the value, UTC.
        /// </summary>
        public DateTime RevealedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _Name = String.Empty;
        private string _Value = String.Empty;

        #endregion
    }
}
