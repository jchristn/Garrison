namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Created or rotated credential. The secret key is shown only in this response.
    /// </summary>
    public class CredentialCreateResponse
    {
        /// <summary>
        /// Credential record.
        /// </summary>
        public Garrison.Sdk.Models.Credential Credential { get; set; } = new Garrison.Sdk.Models.Credential();

        /// <summary>
        /// Access key.
        /// </summary>
        public string AccessKey { get; set; } = String.Empty;

        /// <summary>
        /// Secret key. Store it now; it is never returned again.
        /// </summary>
        public string SecretKey { get; set; } = String.Empty;
    }
}
