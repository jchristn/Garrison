namespace Garrison.ProviderHarness
{
    using System;
    using System.Collections.Generic;
    using PolyPrompt.Models;

    /// <summary>Private local conversation history, scoped by the worker's isolated HOME.</summary>
    public class ProviderSession
    {
        /// <summary>Adapter used to create this session.</summary>
        public string Provider { get; set; } = String.Empty;
        /// <summary>Endpoint used to create this session, without credentials.</summary>
        public string Endpoint { get; set; } = String.Empty;
        /// <summary>Model used to create this session.</summary>
        public string Model { get; set; } = String.Empty;
        /// <summary>Ordered messages. No API key or MCP authorization headers are stored.</summary>
        public List<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
