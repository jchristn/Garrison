namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Reads the warnings array of a create or update response (I-08) without the model that produced it, whose
    /// Warnings property is read-only and so not deserialized.
    /// </summary>
    public class WarningsEnvelope
    {
        /// <summary>
        /// Identifier of the record in the response.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Warnings, or null when the response had none.
        /// </summary>
        public List<FieldWarning>? Warnings { get; set; } = null;
    }
}
