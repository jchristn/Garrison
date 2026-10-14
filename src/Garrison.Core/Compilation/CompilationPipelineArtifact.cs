namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Artifact reference handed to a later pipeline stage (items of pipeline.previous.artifacts, P12.9). Only
    /// metadata is rendered; the artifact content stays in its store.
    /// </summary>
    public class CompilationPipelineArtifact
    {
        #region Public-Members

        /// <summary>
        /// Artifact identifier (id).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Artifact name (name).
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
        /// Media type (mediaType).
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
        /// Size in bytes (sizeBytes).
        /// </summary>
        public long SizeBytes { get; set; } = 0;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _Name = String.Empty;
        private string _MediaType = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public CompilationPipelineArtifact()
        {
        }

        #endregion
    }
}
