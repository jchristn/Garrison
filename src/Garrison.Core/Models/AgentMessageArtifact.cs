namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// A run artifact attached to a message by reference (AA6). The message carries the artifact's identifier, name, media
    /// type, and size as they were when it was sent; the content stays in the artifact store. Not thread-safe.
    /// </summary>
    public class AgentMessageArtifact
    {
        #region Public-Members

        /// <summary>
        /// Artifact identifier. Must name an artifact in the message's tenant.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is empty or longer than 64 characters.</exception>
        public string ArtifactId
        {
            get
            {
                return _ArtifactId;
            }
            set
            {
                string trimmed = (value ?? String.Empty).Trim();
                if (trimmed.Length < 1 || trimmed.Length > 64) throw new ArgumentException("An artifact identifier holds 1 to 64 characters.", nameof(ArtifactId));
                _ArtifactId = trimmed;
            }
        }

        /// <summary>
        /// Workspace-relative name of the artifact, copied when the message was sent.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Media type of the artifact, copied when the message was sent.
        /// </summary>
        public string MediaType
        {
            get
            {
                return _MediaType;
            }
            set
            {
                _MediaType = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Size of the artifact in bytes, copied when the message was sent. Minimum 0.
        /// </summary>
        public long SizeBytes
        {
            get
            {
                return _SizeBytes;
            }
            set
            {
                _SizeBytes = Math.Max(0, value);
            }
        }

        #endregion

        #region Private-Members

        private string _ArtifactId = "artifact";
        private string _Name = String.Empty;
        private string _MediaType = String.Empty;
        private long _SizeBytes = 0;

        #endregion
    }
}
