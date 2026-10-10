namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Set or rotate a secret value.
    /// </summary>
    public class SecretValueRequest
    {
        /// <summary>
        /// New value.
        /// </summary>
        public string Value { get; set; } = String.Empty;
    }
}
