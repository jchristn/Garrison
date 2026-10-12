namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Options for the GenericJsonl parser.
    /// </summary>
    public class ExecutionParserOptions
    {
        /// <summary>
        /// Dotted path of assistant text.
        /// </summary>
        public string? TextField { get; set; } = null;

        /// <summary>
        /// Dotted path of final result text.
        /// </summary>
        public string? FinalField { get; set; } = null;

        /// <summary>
        /// Dotted path whose value indicates success.
        /// </summary>
        public string? SuccessField { get; set; } = null;

        /// <summary>
        /// Success field value meaning success.
        /// </summary>
        public string? SuccessValue { get; set; } = null;

        /// <summary>
        /// Whether the worker relays the harness's approval requests to Garrison (P12.3). When false, the Codex app-server
        /// parser notes that a headless run declines approval requests; when true, approvals appear as run events the
        /// worker records from the control plane instead.
        /// </summary>
        public bool ApprovalsRelayed { get; set; } = false;
    }
}
