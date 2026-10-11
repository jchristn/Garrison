namespace Garrison.Benchmark.Datasets
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One item: a single Garrison manifest document.
    /// </summary>
    public class BenchmarkItem
    {
        /// <summary>
        /// Item identifier, unique in the corpus.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Manifest kind, for example Agent or Deployment. Must match the document.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// metadata.name of the document. Must match the document.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// The YAML document (one document, no separator).
        /// </summary>
        public string Manifest { get; set; } = String.Empty;
    }
}
