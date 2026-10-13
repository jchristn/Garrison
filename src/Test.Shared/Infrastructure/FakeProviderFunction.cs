namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;

    /// <summary>Typed fixture provider protocol.</summary>
    public class FakeProviderFunction
    {
        /// <summary>Function alias.</summary>
        public string Name { get; set; } = String.Empty;
        /// <summary>Function description.</summary>
        public string Description { get; set; } = String.Empty;
    }
}
