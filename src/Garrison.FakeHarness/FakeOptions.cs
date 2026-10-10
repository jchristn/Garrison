namespace Garrison.FakeHarness
{
    using System;
    using System.Globalization;

    /// <summary>
    /// Parsed command-line options. Unknown arguments are ignored so harness profiles can pass extra flags.
    /// </summary>
    public class FakeOptions
    {
        #region Public-Members

        /// <summary>
        /// Output format: claude, codex, mux, or plain. Default plain.
        /// </summary>
        public string Format { get; set; } = "plain";

        /// <summary>
        /// Whether to print the version and exit.
        /// </summary>
        public bool Version { get; set; } = false;

        /// <summary>
        /// Optional scenario file whose contents replace the answer text.
        /// </summary>
        public string? ScenarioFile { get; set; } = null;

        /// <summary>
        /// Delay between emitted events in milliseconds.
        /// </summary>
        public int DelayMs { get; set; } = 0;

        /// <summary>
        /// Whether to report failure.
        /// </summary>
        public bool Fail { get; set; } = false;

        /// <summary>
        /// Exit code override.
        /// </summary>
        public int? ExitCode { get; set; } = null;

        /// <summary>
        /// Whether to hang after the first event until killed.
        /// </summary>
        public bool Hang { get; set; } = false;

        /// <summary>
        /// Number of 100-character filler lines to emit before the answer.
        /// </summary>
        public int LargeOutputLines { get; set; } = 0;

        /// <summary>
        /// MCP call specification: url,token,tool,argsjson.
        /// </summary>
        public string? McpCall { get; set; } = null;

        /// <summary>
        /// File to write the final answer to (mirrors --output-last-message).
        /// </summary>
        public string? OutputLastMessage { get; set; } = null;

        /// <summary>
        /// Text written to stderr before exiting.
        /// </summary>
        public string? Stderr { get; set; } = null;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parse arguments.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <returns>Options.</returns>
        public static FakeOptions Parse(string[] args)
        {
            FakeOptions options = new FakeOptions();
            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];
                string? next = i + 1 < args.Length ? args[i + 1] : null;
                switch (arg)
                {
                    case "--version":
                        options.Version = true;
                        break;
                    case "--format":
                        if (next != null) { options.Format = next.ToLowerInvariant(); i++; }
                        break;
                    case "--scenario":
                        if (next != null) { options.ScenarioFile = next; i++; }
                        break;
                    case "--delay-ms":
                        if (next != null) { options.DelayMs = Int32.Parse(next, CultureInfo.InvariantCulture); i++; }
                        break;
                    case "--fail":
                        options.Fail = true;
                        break;
                    case "--exit-code":
                        if (next != null) { options.ExitCode = Int32.Parse(next, CultureInfo.InvariantCulture); i++; }
                        break;
                    case "--hang":
                        options.Hang = true;
                        break;
                    case "--large-output":
                        if (next != null) { options.LargeOutputLines = Int32.Parse(next, CultureInfo.InvariantCulture); i++; }
                        break;
                    case "--mcp-call":
                        if (next != null) { options.McpCall = next; i++; }
                        break;
                    case "--output-last-message":
                        if (next != null) { options.OutputLastMessage = next; i++; }
                        break;
                    case "--stderr":
                        if (next != null) { options.Stderr = next; i++; }
                        break;
                    default:
                        break;
                }
            }
            return options;
        }

        #endregion
    }
}
