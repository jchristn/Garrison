namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Where run artifacts are stored.
    /// </summary>
    public class ArtifactStore
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
        /// Store name.
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
        /// Store kind.
        /// </summary>
        public ArtifactStoreKindEnum Kind { get; set; } = ArtifactStoreKindEnum.Database;

        /// <summary>Relative filesystem folder or S3 object-key prefix. Null uses the store identifier.</summary>
        public string? PathPrefix { get; set; } = null;

        /// <summary>S3 bucket name. Required for S3 stores.</summary>
        public string? Bucket { get; set; } = null;

        /// <summary>S3-compatible service URL. Null uses the AWS regional endpoint.</summary>
        public string? Endpoint { get; set; } = null;

        /// <summary>S3 signing region. Default us-east-1.</summary>
        public string Region
        {
            get { return _Region; }
            set { _Region = String.IsNullOrWhiteSpace(value) ? "us-east-1" : value; }
        }

        /// <summary>Tenant secret containing typed accessKey/secretKey/sessionToken credentials. Never sent to workers.</summary>
        public string? SecretId { get; set; } = null;

        /// <summary>Use bucket-in-path addressing for compatible endpoints. Default true.</summary>
        public bool ForcePathStyle { get; set; } = true;

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

        private string _Region = "us-east-1";
        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;

        #endregion
    }
}
