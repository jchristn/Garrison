namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Seeded workspace file.
    /// </summary>
    public class ExecutionWorkspaceFile
    {
        /// <summary>
        /// Path relative to the workspace.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Content.
        /// </summary>
        public string Content { get; set; } = String.Empty;
    }
}
