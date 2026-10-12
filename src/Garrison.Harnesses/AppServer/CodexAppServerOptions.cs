namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Settings for one <see cref="CodexAppServerDriver"/> session. Not thread-safe; set before the session starts.
    /// </summary>
    public class CodexAppServerOptions
    {
        #region Public-Members

        /// <summary>
        /// Prompt sent as the input of the turn <see cref="CodexAppServerDriver.DriveAsync"/> runs. Default empty.
        /// </summary>
        public string Prompt
        {
            get
            {
                return _Prompt;
            }
            set
            {
                _Prompt = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Working directory sent on <c>thread/start</c> and <c>thread/resume</c>, or null for the process working
        /// directory.
        /// </summary>
        public string? Cwd { get; set; } = null;

        /// <summary>
        /// Thread to resume, or null to start a new thread.
        /// </summary>
        public string? ResumeThreadId { get; set; } = null;

        /// <summary>
        /// JSON Schema for the final assistant message of the turn, or null.
        /// </summary>
        public string? OutputSchemaJson { get; set; } = null;

        /// <summary>
        /// Approval policy sent on <c>thread/start</c> and <c>thread/resume</c>: <c>never</c>, <c>on-request</c>, or
        /// <c>untrusted</c>. Default <c>never</c>. Null or empty sends nothing, so the configured policy applies.
        /// </summary>
        public string? ApprovalPolicy { get; set; } = "never";

        /// <summary>
        /// OpenAI API key to log in with (<c>account/login/start</c>, type <c>apiKey</c>) before the thread starts, or
        /// null to use the login already in <c>CODEX_HOME</c> (a ChatGPT <c>auth.json</c>). <c>codex app-server</c>
        /// does not read <c>CODEX_API_KEY</c> or <c>OPENAI_API_KEY</c> from its environment the way <c>codex exec</c>
        /// does, so the driver logs in explicitly. Secret: never logged.
        /// </summary>
        public string? ApiKey { get; set; } = null;

        /// <summary>
        /// Environment variables <see cref="UseApiKeyFrom"/> reads the API key from, in order. Default
        /// <c>CODEX_API_KEY</c>, then <c>OPENAI_API_KEY</c> (the variables the built-in Codex profiles set from an
        /// <c>OpenAiApiKey</c> secret).
        /// </summary>
        public List<string> ApiKeyVariables
        {
            get
            {
                return _ApiKeyVariables;
            }
            set
            {
                _ApiKeyVariables = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Client name sent in <c>initialize</c>. Default garrison.
        /// </summary>
        public string ClientName
        {
            get
            {
                return _ClientName;
            }
            set
            {
                _ClientName = String.IsNullOrWhiteSpace(value) ? "garrison" : value;
            }
        }

        /// <summary>
        /// Client version sent in <c>initialize</c>. Default 0.0.0.
        /// </summary>
        public string ClientVersion
        {
            get
            {
                return _ClientVersion;
            }
            set
            {
                _ClientVersion = String.IsNullOrWhiteSpace(value) ? "0.0.0" : value;
            }
        }

        #endregion

        #region Private-Members

        private string _Prompt = String.Empty;
        private List<string> _ApiKeyVariables = new List<string> { "CODEX_API_KEY", "OPENAI_API_KEY" };
        private string _ClientName = "garrison";
        private string _ClientVersion = "0.0.0";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Set <see cref="ApiKey"/> from the first non-empty variable in <see cref="ApiKeyVariables"/>; leave it
        /// unchanged when none is set.
        /// </summary>
        /// <param name="environment">Harness environment.</param>
        /// <exception cref="ArgumentNullException">Thrown when environment is null.</exception>
        public void UseApiKeyFrom(IReadOnlyDictionary<string, string> environment)
        {
            if (environment == null) throw new ArgumentNullException(nameof(environment));
            foreach (string name in _ApiKeyVariables)
            {
                if (environment.TryGetValue(name, out string? value) && !String.IsNullOrWhiteSpace(value))
                {
                    ApiKey = value;
                    return;
                }
            }
        }

        #endregion
    }
}
