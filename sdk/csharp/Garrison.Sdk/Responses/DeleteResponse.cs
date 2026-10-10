namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Delete result.
    /// </summary>
    public class DeleteResponse
    {
        /// <summary>
        /// Whether something was deleted.
        /// </summary>
        public bool Deleted { get; set; } = false;

        /// <summary>
        /// Dependent records deleted with it.
        /// </summary>
        public int Cascaded { get; set; } = 0;
    }
}
