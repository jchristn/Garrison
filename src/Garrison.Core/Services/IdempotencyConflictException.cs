namespace Garrison.Core.Services
{
    using System;

    /// <summary>
    /// Raised when an idempotency key (the REST Idempotency-Key header, or an A2A messageId) is reused with different
    /// content than the run it first created. Mapped to 409 Conflict with code IdempotencyKeyConflict (REST) or
    /// MessageIdConflict (A2A).
    /// </summary>
    public class IdempotencyConflictException : ConflictException
    {
        /// <summary>
        /// Identifier of the run the key already belongs to.
        /// </summary>
        public string ExistingRunId { get; }

        /// <summary>
        /// The reused idempotency key as the caller sent it.
        /// </summary>
        public string Key { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="key">Reused key as the caller sent it.</param>
        /// <param name="existingRunId">Run the key already belongs to.</param>
        /// <param name="message">Message.</param>
        public IdempotencyConflictException(string key, string existingRunId, string message) : base("IdempotencyKeyConflict", message)
        {
            Key = key ?? String.Empty;
            ExistingRunId = existingRunId ?? String.Empty;
        }
    }
}
