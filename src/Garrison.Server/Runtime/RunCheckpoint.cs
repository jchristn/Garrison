namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>Structured durable checkpoint metadata. Archive bytes live in the tenant artifact store.</summary>
    public class RunCheckpoint
    {
        /// <summary>Run identifier.</summary>
        public string RunId { get; set; } = String.Empty;
        /// <summary>Artifact identifier.</summary>
        public string ArtifactId { get; set; } = String.Empty;
        /// <summary>Harness session identifier.</summary>
        public string SessionId { get; set; } = String.Empty;
        /// <summary>Pinned session contract.</summary>
        public string SessionFormat { get; set; } = String.Empty;
    }
}
