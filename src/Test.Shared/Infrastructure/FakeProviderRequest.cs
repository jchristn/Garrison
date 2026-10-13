namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;

    /// <summary>Typed fixture provider protocol.</summary>
    public class FakeProviderRequest
    {
        /// <summary>Requested model.</summary>
        public string? Model { get; set; } = null;
        /// <summary>Conversation messages.</summary>
        public List<FakeProviderMessage> Messages { get; set; } = new List<FakeProviderMessage>();
        /// <summary>Model function definitions.</summary>
        public List<FakeProviderTool> Tools { get; set; } = new List<FakeProviderTool>();
    }
}
