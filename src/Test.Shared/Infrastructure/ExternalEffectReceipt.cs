namespace Test.Shared.Infrastructure
{
    using System;

    /// <summary>One externally committed mutation recorded by the independent effect sink.</summary>
    public sealed class ExternalEffectReceipt
    {
        /// <summary>Stable operation/run identity supplied with the mutation.</summary>
        public string OperationId { get; set; } = String.Empty;

        /// <summary>Actual rendered run attempt supplied with the mutation.</summary>
        public int Attempt { get; set; }

        /// <summary>Time at which the independent sink recorded the commit.</summary>
        public DateTime TimestampUtc { get; set; }
    }
}
