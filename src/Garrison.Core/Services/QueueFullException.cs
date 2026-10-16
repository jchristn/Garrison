namespace Garrison.Core.Services
{
    using System;

    /// <summary>A queued-run depth limit refused admission. Protocols retain QueueFull; REST answers 429 with Retry-After.</summary>
    public class QueueFullException : ConflictException
    {
        /// <summary>Cluster, Tenant, or Agent.</summary>
        public string Scope { get; }
        /// <summary>Configured maximum queued runs.</summary>
        public int Maximum { get; }
        /// <summary>Suggested retry delay in seconds.</summary>
        public int RetryAfterSeconds { get; }
        /// <summary>Instantiate a queue admission refusal.</summary>
        /// <param name="scope">Limit scope.</param>
        /// <param name="maximum">Queue depth.</param>
        /// <param name="retryAfterSeconds">Retry hint.</param>
        public QueueFullException(string scope, int maximum, int retryAfterSeconds)
            : base("QueueFull", scope + " queued-run limit of " + maximum + " has been reached.")
        {
            Scope = scope;
            Maximum = maximum;
            RetryAfterSeconds = Math.Max(1, retryAfterSeconds);
        }
    }
}
