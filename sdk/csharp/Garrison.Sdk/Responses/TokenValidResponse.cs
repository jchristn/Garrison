namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Token validation result.
    /// </summary>
    public class TokenValidResponse
    {
        /// <summary>
        /// Whether the token is valid.
        /// </summary>
        public bool Valid { get; set; } = false;
    }
}
