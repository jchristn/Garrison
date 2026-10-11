namespace Garrison.Benchmark.Datasets
{
    using System;

    /// <summary>
    /// A dataset read from disk together with the file it came from and that file's SHA-256, which every report
    /// records so two reports that claim the same dataset can be checked.
    /// </summary>
    public class LoadedDataset
    {
        /// <summary>
        /// The dataset.
        /// </summary>
        public BenchmarkDataset Dataset { get; set; } = new BenchmarkDataset();

        /// <summary>
        /// Full path of the file.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Lowercase hex SHA-256 of the file bytes.
        /// </summary>
        public string Sha256 { get; set; } = String.Empty;
    }
}
