namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>Typed inference configuration; credential values remain in tenant secrets. Mutable and not thread-safe.</summary>
    public class InferenceCredential
    {
        /// <summary>Header/query parameter name; Basic uses username or password. Empty for BearerToken.</summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>API-key placement. Default Header; QueryString places it in the URL.</summary>
        public InferenceCredentialLocationEnum Location { get; set; } = InferenceCredentialLocationEnum.Header;

        /// <summary>Identifier of an active tenant secret containing the credential value. Plaintext values are never returned here.</summary>
        public string SecretId { get; set; } = String.Empty;
    }
}
