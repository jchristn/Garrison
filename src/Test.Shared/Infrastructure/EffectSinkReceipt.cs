namespace Test.Shared.Infrastructure
{
    using System;

    /// <summary>External mutation recorded by the effect-safety sink.</summary>
    public class EffectSinkReceipt
    {
        /// <summary>Stable operation identity sent as destination idempotency key.</summary>
        public string OperationId { get; set; } = String.Empty;
        /// <summary>Execution attempt responsible for the mutation.</summary>
        public string Attempt { get; set; } = String.Empty;
    }
}
