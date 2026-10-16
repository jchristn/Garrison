namespace Test.Shared.Infrastructure
{
    using System.Collections.Generic;

    /// <summary>Fixed response contract returned by the independent effect sink.</summary>
    public sealed class ExternalEffectState
    {
        /// <summary>Every external mutation, without deduplication.</summary>
        public List<ExternalEffectReceipt> Receipts { get; set; } = new List<ExternalEffectReceipt>();
    }
}
