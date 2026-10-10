namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Bulk delete result.
    /// </summary>
    public class DeleteCountResponse
    {
        /// <summary>
        /// Records deleted.
        /// </summary>
        public long DeletedCount { get; set; } = 0;
    }
}
