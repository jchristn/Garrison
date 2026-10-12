namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// A hypothetical permission request to evaluate against a deployment's approval rules without recording anything,
    /// for testing rules in the deployment editor.
    /// </summary>
    public class ApprovalCheckRequest
    {
        /// <summary>
        /// Tool name, for example Bash. Required.
        /// </summary>
        public string ToolName { get; set; } = String.Empty;

        /// <summary>
        /// Tool input fields (command, url, file_path, and so on), or null.
        /// </summary>
        public ApprovalToolInput? Input { get; set; } = null;
    }
}
