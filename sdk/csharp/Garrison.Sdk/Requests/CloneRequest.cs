namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Clone a record under a new name.
    /// </summary>
    public class CloneRequest
    {
        /// <summary>
        /// Name of the new record.
        /// </summary>
        public string Name { get; set; } = String.Empty;
    }
}
