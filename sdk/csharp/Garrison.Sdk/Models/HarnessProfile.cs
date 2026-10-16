namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Describes how to run one harness headless.
    /// </summary>
    public class HarnessProfile
    {
        #region Public-Members

        /// <summary>Pinned session format used to validate durable continuation compatibility.</summary>
        public string? SessionFormat { get; set; } = null;

        /// <summary>
        /// Warnings from the create or update request that returned this record (responses only): one entry per value
        /// the server did not store as given, for example code ValueClamped for a number outside its range. Null when
        /// there is nothing to report, and on reads.
        /// </summary>
        public List<FieldWarning>? Warnings { get; set; } = null;

        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? String.Empty : value;
            }
        }

        /// <summary>
        /// Tenant identifier. Null for global or built-in records.
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Profile name, unique per tenant. Built-ins use the builtin/ prefix.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Harness family; workers advertise which types they can run.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Executable template, for example claude.
        /// </summary>
        public string Executable
        {
            get
            {
                return _Executable;
            }
            set
            {
                _Executable = value ?? String.Empty;
            }
        }

        /// <summary>
        /// How the task prompt reaches the harness.
        /// </summary>
        public PromptDeliveryEnum PromptDelivery { get; set; } = PromptDeliveryEnum.Stdin;

        /// <summary>
        /// Argument or file name template used when delivery is Argument or File.
        /// </summary>
        public string? PromptArgumentTemplate { get; set; } = null;

        /// <summary>
        /// How the system prompt reaches the harness.
        /// </summary>
        public SystemPromptDeliveryEnum SystemPromptDelivery { get; set; } = SystemPromptDeliveryEnum.File;

        /// <summary>
        /// Argument flag, environment variable name, or file name for the system prompt.
        /// </summary>
        public string? SystemPromptTarget { get; set; } = null;

        /// <summary>
        /// MCP configuration format.
        /// </summary>
        public McpConfigFormatEnum McpConfigFormat { get; set; } = McpConfigFormatEnum.None;

        /// <summary>
        /// File name (in the config directory) for the MCP configuration.
        /// </summary>
        public string? McpConfigFileName { get; set; } = null;

        /// <summary>
        /// Output parser.
        /// </summary>
        public OutputParserEnum OutputParser { get; set; } = OutputParserEnum.PlainText;

        /// <summary>
        /// Where the final result text comes from.
        /// </summary>
        public ResultSourceEnum ResultSource { get; set; } = ResultSourceEnum.ParserFinalEvent;

        /// <summary>
        /// Result file name (in the config directory) when the result source is LastMessageFile.
        /// </summary>
        public string? ResultFileName { get; set; } = null;

        /// <summary>
        /// How success is decided.
        /// </summary>
        public SuccessPolicyEnum SuccessPolicy { get; set; } = SuccessPolicyEnum.FinalEvent;

        /// <summary>
        /// GenericJsonl: dotted path of assistant text in an event.
        /// </summary>
        public string? GenericTextField { get; set; } = null;

        /// <summary>
        /// GenericJsonl: dotted path of final result text.
        /// </summary>
        public string? GenericFinalField { get; set; } = null;

        /// <summary>
        /// GenericJsonl: dotted path whose value indicates success.
        /// </summary>
        public string? GenericSuccessField { get; set; } = null;

        /// <summary>
        /// GenericJsonl: value of the success field that means success.
        /// </summary>
        public string? GenericSuccessValue { get; set; } = null;

        /// <summary>
        /// Run deadline when the deployment does not set one. Minimum 5, maximum 86400, default 1800.
        /// </summary>
        public int DefaultTimeoutSeconds
        {
            get
            {
                return _DefaultTimeoutSeconds;
            }
            set
            {
                _DefaultTimeoutSeconds = Math.Clamp(value, 5, 86400);
            }
        }

        /// <summary>
        /// Seconds between graceful stop and process tree kill. Minimum 0, maximum 60, default 5.
        /// </summary>
        public int KillGraceSeconds
        {
            get
            {
                return _KillGraceSeconds;
            }
            set
            {
                _KillGraceSeconds = Math.Clamp(value, 0, 60);
            }
        }

        /// <summary>
        /// Maximum stdout bytes before the run fails. Minimum 1024, maximum 1073741824, default 67108864.
        /// </summary>
        public long MaxOutputBytes
        {
            get
            {
                return _MaxOutputBytes;
            }
            set
            {
                _MaxOutputBytes = Math.Clamp(value, 1024, 1073741824);
            }
        }

        /// <summary>
        /// Retained stderr tail size. Minimum 0, maximum 1048576, default 8000.
        /// </summary>
        public int StderrTailBytes
        {
            get
            {
                return _StderrTailBytes;
            }
            set
            {
                _StderrTailBytes = Math.Clamp(value, 0, 1048576);
            }
        }

        /// <summary>
        /// Whether each run gets its own HOME directory.
        /// </summary>
        public bool IsolateHome { get; set; } = true;

        /// <summary>
        /// Whether the harness can resume a session.
        /// </summary>
        public bool SupportsResume { get; set; } = false;

        /// <summary>
        /// Whether the profile is seeded by the platform.
        /// </summary>
        public bool IsBuiltIn { get; set; } = false;

        /// <summary>
        /// Stable built-in key.
        /// </summary>
        public string? BuiltInKey { get; set; } = null;

        /// <summary>
        /// Whether the record is active.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Whether the record is protected from deletion.
        /// </summary>
        public bool IsProtected { get; set; } = false;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc
        {
            get
            {
                return _CreatedUtc;
            }
            set
            {
                _CreatedUtc = value;
            }
        }

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc
        {
            get
            {
                return _LastUpdateUtc;
            }
            set
            {
                _LastUpdateUtc = value;
            }
        }

        /// <summary>
        /// Ordered argument templates.
        /// </summary>
        public List<HarnessArgument> Arguments
        {
            get
            {
                return _Arguments;
            }
            set
            {
                _Arguments = value ?? new List<HarnessArgument>();
            }
        }

        /// <summary>
        /// Environment variable templates.
        /// </summary>
        public List<HarnessEnvironmentVariable> Environment
        {
            get
            {
                return _Environment;
            }
            set
            {
                _Environment = value ?? new List<HarnessEnvironmentVariable>();
            }
        }

        /// <summary>
        /// Files materialized before launch.
        /// </summary>
        public List<HarnessFile> Files
        {
            get
            {
                return _Files;
            }
            set
            {
                _Files = value ?? new List<HarnessFile>();
            }
        }

        /// <summary>
        /// Exit codes considered successful when the success policy involves exit codes.
        /// </summary>
        public List<int> SuccessExitCodes
        {
            get
            {
                return _SuccessExitCodes;
            }
            set
            {
                _SuccessExitCodes = value ?? new List<int>();
            }
        }

        /// <summary>
        /// Version probe argument list (no tokens spent), for example --version.
        /// </summary>
        public List<string> ProbeArguments
        {
            get
            {
                return _ProbeArguments;
            }
            set
            {
                _ProbeArguments = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Environment variable names that may carry secret values for this harness.
        /// </summary>
        public List<string> CredentialEnvironmentAllowlist
        {
            get
            {
                return _CredentialEnvironmentAllowlist;
            }
            set
            {
                _CredentialEnvironmentAllowlist = value ?? new List<string>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _Name = String.Empty;
        private string _Executable = String.Empty;
        private int _DefaultTimeoutSeconds = 1800;
        private int _KillGraceSeconds = 5;
        private long _MaxOutputBytes = 67108864;
        private int _StderrTailBytes = 8000;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<HarnessArgument> _Arguments = new List<HarnessArgument>();
        private List<HarnessEnvironmentVariable> _Environment = new List<HarnessEnvironmentVariable>();
        private List<HarnessFile> _Files = new List<HarnessFile>();
        private List<int> _SuccessExitCodes = new List<int>();
        private List<string> _ProbeArguments = new List<string>();
        private List<string> _CredentialEnvironmentAllowlist = new List<string>();

        #endregion
    }
}
