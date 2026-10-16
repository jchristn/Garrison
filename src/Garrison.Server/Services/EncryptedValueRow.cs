namespace Garrison.Server.Services
{
    using System;

    /// <summary>Internal projection for bounded key-rotation pages.</summary>
    internal sealed class EncryptedValueRow
    {
        /// <summary>Record identifier.</summary>
        public string Id { get; set; } = String.Empty;
        /// <summary>Encoded ciphertext.</summary>
        public string Value { get; set; } = String.Empty;
    }
}
