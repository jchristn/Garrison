namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Inputs for one harness process launch. Paths and values must already have placeholders resolved.
    /// </summary>
    public class ProcessRunRequest
    {
        /// <summary>
        /// Executable name or path.
        /// </summary>
        public string Executable { get; set; } = String.Empty;

        /// <summary>
        /// Arguments passed with ArgumentList.
        /// </summary>
        public List<string> Arguments { get; set; } = new List<string>();

        /// <summary>
        /// Complete child environment; the runner clears the inherited environment first.
        /// </summary>
        public Dictionary<string, string> Environment { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Working directory.
        /// </summary>
        public string WorkingDirectory { get; set; } = String.Empty;

        /// <summary>
        /// Text written to stdin before it is closed.
        /// </summary>
        public string? Stdin { get; set; } = null;

        /// <summary>
        /// Deadline in seconds from start.
        /// </summary>
        public int TimeoutSeconds { get; set; } = 1800;

        /// <summary>
        /// Seconds between graceful stop and process tree kill.
        /// </summary>
        public int KillGraceSeconds { get; set; } = 5;

        /// <summary>
        /// Maximum stdout bytes before the process is killed.
        /// </summary>
        public long MaxOutputBytes { get; set; } = 67108864;

        /// <summary>
        /// Retained stderr tail size in characters.
        /// </summary>
        public int StderrTailBytes { get; set; } = 8000;
    }
}
