namespace Garrison.Sdk.Compilation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Resolved file materialized before launch.
    /// </summary>
    public class ExecutionFile
    {
        /// <summary>
        /// Base directory.
        /// </summary>
        public FileBaseDirectoryEnum BaseDirectory { get; set; } = FileBaseDirectoryEnum.Config;

        /// <summary>
        /// Path relative to the base directory. Must not escape it.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Content.
        /// </summary>
        public string Content { get; set; } = String.Empty;

        /// <summary>
        /// Optional octal mode, for example 600.
        /// </summary>
        public string? Mode { get; set; } = null;

        /// <summary>
        /// Whether the content is secret.
        /// </summary>
        public bool IsSecret { get; set; } = false;
    }
}
