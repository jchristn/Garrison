namespace Garrison.Core.Compilation
{
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Core.Serialization;

    /// <summary>
    /// Session settings for a harness the worker drives over the Codex app-server protocol (JSON-RPC on stdin and
    /// stdout), present only when the profile's prompt delivery is <c>CodexAppServer</c>. The prompt itself stays in
    /// <see cref="ExecutionSpec.Stdin"/>; the worker sends it as the input of one turn instead of writing it raw.
    /// </summary>
    public class ExecutionAppServer
    {
        /// <summary>
        /// Codex thread to resume with <c>thread/resume</c> (a structured output repair, or a later conversation
        /// turn); null starts a new thread with <c>thread/start</c>.
        /// </summary>
        public string? ResumeThreadId { get; set; } = null;

        /// <summary>
        /// Compact JSON Schema that constrains the final assistant message of the turn (<c>outputSchema</c> on
        /// <c>turn/start</c>); null when the agent has no output schema.
        /// </summary>
        [JsonIgnore]
        public string? OutputSchemaJson { get; set; } = null;

        /// <summary>
        /// JSON Schema for the final assistant message, as a JSON object; null for free text.
        /// </summary>
        public JsonElement? OutputSchema
        {
            get
            {
                return JsonText.Value(OutputSchemaJson);
            }
            set
            {
                OutputSchemaJson = JsonText.Text(value);
            }
        }

        /// <summary>
        /// Approval policy sent on <c>thread/start</c> and <c>thread/resume</c>: <c>never</c>, <c>on-request</c>,
        /// or <c>untrusted</c>. Default <c>never</c>, which matches <c>codex exec</c>: a headless run cannot answer
        /// an approval prompt.
        /// </summary>
        public string ApprovalPolicy
        {
            get
            {
                return _ApprovalPolicy;
            }
            set
            {
                _ApprovalPolicy = String.IsNullOrWhiteSpace(value) ? "never" : value;
            }
        }

        private string _ApprovalPolicy = "never";
    }
}
