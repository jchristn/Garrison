namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Compile preview input.
    /// </summary>
    public class CompilePreviewRequest
    {
        /// <summary>
        /// Sample input message.
        /// </summary>
        public string Input { get; set; } = "Hello from the compile preview.";

        /// <summary>
        /// Sample run parameters.
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();
    }
}
