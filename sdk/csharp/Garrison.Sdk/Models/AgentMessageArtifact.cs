namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A run artifact attached to a message by reference (AA6). Not thread-safe.
    /// </summary>
    public class AgentMessageArtifact
    {
        /// <summary>
        /// Artifact identifier.
        /// </summary>
        public string ArtifactId { get; set; } = String.Empty;

        /// <summary>
        /// Artifact name when the message was sent.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Media type when the message was sent.
        /// </summary>
        public string MediaType { get; set; } = String.Empty;

        /// <summary>
        /// Size in bytes when the message was sent.
        /// </summary>
        public long SizeBytes { get; set; } = 0;
    }
}
