namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;

    /// <summary>Typed fixture provider protocol.</summary>
    public class FakeProviderMessage
    {
        /// <summary>Message role.</summary>
        public string? Role { get; set; } = null;
        /// <summary>Text content.</summary>
        public string? Content { get; set; } = null;
    }
}
