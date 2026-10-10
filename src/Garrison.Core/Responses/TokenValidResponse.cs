namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

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
