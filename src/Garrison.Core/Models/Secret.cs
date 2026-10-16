namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Encrypted credential or secret value.
    /// </summary>
    public class Secret
    {
        #region Public-Members

        /// <summary>Provider resource identifier for LeaseBroker secrets; not a credential value. Maximum 512 characters.</summary>
        public string? BrokerResource { get; set; } = null;
        /// <summary>Optional provider audience for LeaseBroker secrets. Maximum 512 characters.</summary>
        public string? BrokerAudience { get; set; } = null;

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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewSecretId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Secret name.
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
        /// Secret kind.
        /// </summary>
        public SecretKindEnum Kind { get; set; } = SecretKindEnum.GenericEnv;

        /// <summary>
        /// Encrypted value. Never returned by the API.
        /// </summary>
        [JsonIgnore]
        public string? ValueEncrypted { get; set; } = null;

        /// <summary>
        /// Last four characters of the value.
        /// </summary>
        public string? ValueLast4 { get; set; } = null;

        /// <summary>
        /// SHA-256 fingerprint prefix of the value.
        /// </summary>
        public string? Fingerprint { get; set; } = null;

        /// <summary>
        /// Master key version used for encryption.
        /// </summary>
        public int KeyVersion { get; set; } = 1;

        /// <summary>
        /// Expiration (UTC).
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// Last value change (UTC).
        /// </summary>
        public DateTime? RotatedUtc { get; set; } = null;

        /// <summary>
        /// Health of the stored credential. Default <see cref="SecretStatusEnum.Ok"/>. The control plane sets
        /// <see cref="SecretStatusEnum.NeedsReauthentication"/> when a CodexAuthJson login can no longer be refreshed;
        /// setting a new value returns the secret to Ok.
        /// </summary>
        public SecretStatusEnum Status { get; set; } = SecretStatusEnum.Ok;

        /// <summary>
        /// Why the secret is in its current status, for example the provider error that made a login unusable. Null
        /// when the status is Ok.
        /// </summary>
        public string? StatusMessage { get; set; } = null;

        /// <summary>
        /// When the status last changed away from Ok (UTC), or null.
        /// </summary>
        public DateTime? StatusUtc { get; set; } = null;

        /// <summary>
        /// When the control plane last refreshed the stored login itself (UTC), or null when it never has. Only
        /// CodexAuthJson secrets holding a ChatGPT login are refreshed.
        /// </summary>
        public DateTime? RefreshedUtc { get; set; } = null;

        /// <summary>
        /// When the access token in the stored login expires (UTC, from the token's exp claim), or null when the value
        /// holds no readable access token. Set for CodexAuthJson secrets holding a ChatGPT login.
        /// </summary>
        public DateTime? AccessTokenExpiresUtc { get; set; } = null;

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
                _CreatedUtc = TimestampHelper.Normalize(value);
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
                _LastUpdateUtc = TimestampHelper.Normalize(value);
            }
        }

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewSecretId();
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;

        #endregion
    }
}
