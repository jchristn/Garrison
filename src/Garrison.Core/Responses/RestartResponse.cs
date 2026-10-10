namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Restart acknowledgement.
    /// </summary>
    public class RestartResponse
    {
        /// <summary>
        /// Whether the process will exit.
        /// </summary>
        public bool Restarting { get; set; } = true;

        /// <summary>
        /// Node identifier.
        /// </summary>
        public string Node { get; set; } = String.Empty;
    }
}
