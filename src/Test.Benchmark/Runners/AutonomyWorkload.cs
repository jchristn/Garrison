namespace Garrison.Benchmark.Runners
{
    using System;
    using System.IO;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Datasets;

    /// <summary>
    /// The autonomy workload manifest (benchmarks/config/autonomy-workload.yaml by default) with its hash, which the
    /// scheduler, messaging, and memory reports record as their dataset.
    /// </summary>
    public class AutonomyWorkload
    {
        #region Public-Members

        /// <summary>
        /// Dataset name the reports carry.
        /// </summary>
        public static readonly string DatasetName = "autonomy-workload";

        /// <summary>
        /// Absolute path of the manifest.
        /// </summary>
        public string Path { get; }

        /// <summary>
        /// Manifest text.
        /// </summary>
        public string Text { get; }

        /// <summary>
        /// SHA-256 of the manifest file.
        /// </summary>
        public string Sha256 { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="path">Absolute path.</param>
        /// <param name="text">Manifest text.</param>
        /// <param name="sha256">SHA-256 of the file.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public AutonomyWorkload(string path, string text, string sha256)
        {
            Path = path ?? throw new ArgumentNullException(nameof(path));
            Text = text ?? throw new ArgumentNullException(nameof(text));
            Sha256 = sha256 ?? throw new ArgumentNullException(nameof(sha256));
        }

        /// <summary>
        /// Load the workload named by --workload.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The workload, or null after printing why it cannot be read.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<AutonomyWorkload?> LoadAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            string path = context.ResolvePath(context.Args.GetString("workload", "benchmarks/config/autonomy-workload.yaml"));
            if (!File.Exists(path))
            {
                Console.Error.WriteLine("Workload manifest not found: " + path);
                return null;
            }
            byte[] bytes = await File.ReadAllBytesAsync(path, token).ConfigureAwait(false);
            return new AutonomyWorkload(path, Encoding.UTF8.GetString(bytes), DatasetLoader.Sha256Hex(bytes));
        }

        #endregion
    }
}
