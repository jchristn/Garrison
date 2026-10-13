namespace Garrison.Server.Storage
{
    using System;

    /// <summary>Typed encrypted secret value for an S3-compatible store. Never returned in artifact/store responses.</summary>
    public class ArtifactS3Credentials
    {
        /// <summary>S3 access key identifier.</summary>
        public string AccessKey { get; set; } = String.Empty;
        /// <summary>S3 secret access key.</summary>
        public string SecretKey { get; set; } = String.Empty;
        /// <summary>Optional AWS session token.</summary>
        public string? SessionToken { get; set; } = null;
    }
}
