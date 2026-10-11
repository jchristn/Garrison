namespace Garrison.Benchmark.Datasets
{
    using System;
    using System.IO;
    using System.Security.Cryptography;
    using System.Text.Json;
    using Garrison.Benchmark.Client;

    /// <summary>
    /// Reads datasets in the neutral JSON format and hashes the file. Stateless and thread-safe.
    /// </summary>
    public static class DatasetLoader
    {
        /// <summary>
        /// Read a dataset file.
        /// </summary>
        /// <param name="path">Path of the JSON file.</param>
        /// <returns>The dataset with its path and SHA-256.</returns>
        /// <exception cref="ArgumentNullException">Thrown when path is null or empty.</exception>
        /// <exception cref="FileNotFoundException">Thrown when the file does not exist.</exception>
        /// <exception cref="InvalidDataException">Thrown when the file is not a valid dataset document.</exception>
        public static LoadedDataset Load(string path)
        {
            if (String.IsNullOrEmpty(path)) throw new ArgumentNullException(nameof(path));
            string full = System.IO.Path.GetFullPath(path);
            if (!File.Exists(full)) throw new FileNotFoundException("Dataset file not found: " + full, full);

            byte[] bytes = File.ReadAllBytes(full);
            BenchmarkDataset? dataset;
            try
            {
                dataset = JsonSerializer.Deserialize<BenchmarkDataset>(bytes, JsonDefaults.Compact);
            }
            catch (JsonException e)
            {
                throw new InvalidDataException("Dataset " + full + " is not valid JSON for the dataset schema: " + e.Message, e);
            }
            if (dataset == null) throw new InvalidDataException("Dataset " + full + " is empty.");

            LoadedDataset loaded = new LoadedDataset();
            loaded.Dataset = dataset;
            loaded.Path = full;
            loaded.Sha256 = Sha256Hex(bytes);
            return loaded;
        }

        /// <summary>
        /// Lowercase hex SHA-256 of bytes.
        /// </summary>
        /// <param name="bytes">Bytes.</param>
        /// <returns>Hex digest.</returns>
        /// <exception cref="ArgumentNullException">Thrown when bytes is null.</exception>
        public static string Sha256Hex(byte[] bytes)
        {
            if (bytes == null) throw new ArgumentNullException(nameof(bytes));
            byte[] hash = SHA256.HashData(bytes);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
