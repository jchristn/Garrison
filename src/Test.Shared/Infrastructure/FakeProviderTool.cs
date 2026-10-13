namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;

    /// <summary>Typed fixture provider protocol.</summary>
    public class FakeProviderTool
    {
        /// <summary>Function specification.</summary>
        public FakeProviderFunction Function { get; set; } = new FakeProviderFunction();
    }
}
