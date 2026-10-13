namespace Garrison.Harnesses.Provider
{
    using Garrison.Core.Protocol;

    /// <summary>Typed JSON-lines protocol for the bundled provider API harness.</summary>
    public class ProviderApiEvent : RunEventReport
    {
        /// <summary>Provider session identifier, or null outside initialization.</summary>
        public string? SessionId { get; set; } = null;
        /// <summary>Served model, when reported by the provider.</summary>
        public string? Model { get; set; } = null;
        /// <summary>Cached input tokens for this request, or null when unavailable.</summary>
        public long? CachedTokens { get; set; } = null;
        /// <summary>Reasoning tokens for this request, or null when unavailable.</summary>
        public long? ReasoningTokens { get; set; } = null;
    }
}
