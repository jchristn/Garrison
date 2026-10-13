namespace Garrison.ProviderHarness
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.Json.Serialization;

    /// <summary>Resolved per-run configuration. No API key is persisted here; the worker provides it in the environment.</summary>
    public class ProviderApiConfig
    {
        /// <summary>Adapter name. Initially OpenAiCompatible.</summary>
        public string Provider { get; set; } = "OpenAiCompatible";
        /// <summary>Operator-selected provider base URL. Required.</summary>
        public string Endpoint { get; set; } = String.Empty;
        /// <summary>Operator-selected model. Required.</summary>
        public string Model { get; set; } = String.Empty;
        /// <summary>Environment variable containing the provider API key. Default GARRISON_PROVIDER_API_KEY.</summary>
        public string ApiKeyVariable { get; set; } = "GARRISON_PROVIDER_API_KEY";
        /// <summary>Explicitly permit an endpoint that needs no API key. Default false.</summary>
        [JsonConverter(typeof(ProviderBooleanConverter))]
        public bool AllowAnonymous { get; set; } = false;
        /// <summary>Rendered system prompt from Garrison prompt templates.</summary>
        public string? SystemPrompt { get; set; } = null;
        /// <summary>Persisted session identifier, or null for a one-off run.</summary>
        public string? SessionId { get; set; } = null;
        /// <summary>Resume an existing session rather than starting a new one. Default false.</summary>
        public bool Resume { get; set; } = false;
        /// <summary>Relay every MCP tool call through Garrison permission approvals. Default false.</summary>
        public bool ApprovalsEnabled { get; set; } = false;
        /// <summary>Maximum model requests, range 1 to 1000, default 20.</summary>
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int MaxTurns { get { return _MaxTurns; } set { if (value < 1 || value > 1000) throw new ArgumentOutOfRangeException(nameof(MaxTurns)); _MaxTurns = value; } }
        /// <summary>Maximum output tokens per request, range 1 to 1048576, default 8192.</summary>
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int MaxTokens { get { return _MaxTokens; } set { if (value < 1 || value > 1048576) throw new ArgumentOutOfRangeException(nameof(MaxTokens)); _MaxTokens = value; } }
        /// <summary>Retries before any stream content on 429/5xx, range 0 to 10, default 2.</summary>
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int MaxRetries { get { return _MaxRetries; } set { if (value < 0 || value > 10) throw new ArgumentOutOfRangeException(nameof(MaxRetries)); _MaxRetries = value; } }
        /// <summary>Per-model request timeout, range 1000 to 86400000 ms, default 1800000.</summary>
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int TimeoutMs { get { return _TimeoutMs; } set { if (value < 1000 || value > 86400000) throw new ArgumentOutOfRangeException(nameof(TimeoutMs)); _TimeoutMs = value; } }
        /// <summary>Bound on persisted history bytes, range 1024 to 67108864, default 8388608.</summary>
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int MaxSessionBytes { get { return _MaxSessionBytes; } set { if (value < 1024 || value > 67108864) throw new ArgumentOutOfRangeException(nameof(MaxSessionBytes)); _MaxSessionBytes = value; } }
        /// <summary>Bound on each tool result sent to the provider, range 1024 to 1048576, default 65536 characters.</summary>
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int MaxToolResultChars { get { return _MaxToolResultChars; } set { if (value < 1024 || value > 1048576) throw new ArgumentOutOfRangeException(nameof(MaxToolResultChars)); _MaxToolResultChars = value; } }
        /// <summary>MCP discovery timeout, range 1000 to 300000 ms, default 30000.</summary>
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int McpDiscoveryTimeoutMs { get { return _McpDiscoveryTimeoutMs; } set { if (value < 1000 || value > 300000) throw new ArgumentOutOfRangeException(nameof(McpDiscoveryTimeoutMs)); _McpDiscoveryTimeoutMs = value; } }
        /// <summary>Maximum MCP tools/list pages per server, range 1 to 1000, default 50.</summary>
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int MaxMcpPages { get { return _MaxMcpPages; } set { if (value < 1 || value > 1000) throw new ArgumentOutOfRangeException(nameof(MaxMcpPages)); _MaxMcpPages = value; } }
        /// <summary>Maximum discovered tools, range 1 to 10000, default 1000.</summary>
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int MaxMcpTools { get { return _MaxMcpTools; } set { if (value < 1 || value > 10000) throw new ArgumentOutOfRangeException(nameof(MaxMcpTools)); _MaxMcpTools = value; } }
        /// <summary>Maximum MCP message bytes, range 1024 to 67108864, default 8388608.</summary>
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int MaxMcpMessageBytes { get { return _MaxMcpMessageBytes; } set { if (value < 1024 || value > 67108864) throw new ArgumentOutOfRangeException(nameof(MaxMcpMessageBytes)); _MaxMcpMessageBytes = value; } }
        /// <summary>Resolved MCP servers. HTTP only in the initial adapter.</summary>
        public List<ProviderMcpSpec> Servers { get; set; } = new List<ProviderMcpSpec>();

        private int _MaxTurns = 20;
        private int _MaxTokens = 8192;
        private int _MaxRetries = 2;
        private int _TimeoutMs = 1800000;
        private int _MaxSessionBytes = 8388608;
        private int _MaxToolResultChars = 65536;
        private int _McpDiscoveryTimeoutMs = 30000;
        private int _MaxMcpPages = 50;
        private int _MaxMcpTools = 1000;
        private int _MaxMcpMessageBytes = 8388608;

        /// <summary>Validate fixed configuration before opening any connection.</summary>
        /// <exception cref="ArgumentException">Thrown when a setting is invalid.</exception>
        public void Validate()
        {
            if (Provider != "OpenAiCompatible") throw new ArgumentException("The selected provider adapter is unsupported.");
            if (!Uri.TryCreate(Endpoint, UriKind.Absolute, out Uri? uri) || (uri.Scheme != "http" && uri.Scheme != "https") || uri.UserInfo.Length > 0 || uri.Query.Length > 0 || uri.Fragment.Length > 0)
                throw new ArgumentException("Configure a provider HTTP endpoint without embedded credentials or query parameters.");
            if (String.IsNullOrWhiteSpace(ApiKeyVariable)) throw new ArgumentException("Configure a provider API credential environment variable.");
            if (String.IsNullOrWhiteSpace(Model)) throw new ArgumentException("Configure a provider model.");
            if (MaxTurns < 1 || MaxTurns > 1000 || MaxTokens < 1 || MaxTokens > 1048576 || MaxRetries < 0 || MaxRetries > 10 || TimeoutMs < 1000 || TimeoutMs > 86400000
                || MaxSessionBytes < 1024 || MaxSessionBytes > 67108864 || MaxToolResultChars < 1024 || MaxToolResultChars > 1048576) throw new ArgumentException("A provider execution limit is outside its supported range.");
            if (SessionId != null && (SessionId.Length == 0 || SessionId.Length > 128 || System.Linq.Enumerable.Any(SessionId, c => !Char.IsAsciiLetterOrDigit(c) && c != '_' && c != '-')))
                throw new ArgumentException("Use a bounded alphanumeric session identifier.");
            if (Servers.Select(server => server.Name).Distinct(StringComparer.Ordinal).Count() != Servers.Count) throw new ArgumentException("MCP server names must be unique.");
            if (Resume && SessionId == null) throw new ArgumentException("Resuming requires a session identifier.");
        }
    }
}
