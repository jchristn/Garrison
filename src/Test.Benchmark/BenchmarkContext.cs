namespace Garrison.Benchmark
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Runtime.InteropServices;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// Shared state for one harness invocation: arguments, repository paths, the pooled client, stack settings, and
    /// environment capture for provenance. Created once by <see cref="Program"/>; runners read it. The client is
    /// created on first use. Not thread-safe for setup; the client itself is thread-safe.
    /// </summary>
    public class BenchmarkContext : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Harness version, recorded separately from the product version and commit.
        /// </summary>
        public static readonly string HarnessVersion = "1.0.0";

        /// <summary>
        /// Default admin API key of the bench stacks. Obviously fake; never use it anywhere else.
        /// </summary>
        public static readonly string DefaultAdminKey = "garrison-benchmark-admin-key-not-for-production";

        /// <summary>
        /// Arguments.
        /// </summary>
        public BenchmarkArguments Args { get; }

        /// <summary>
        /// Repository root.
        /// </summary>
        public string Root { get; }

        /// <summary>
        /// Results directory (default benchmarks/results).
        /// </summary>
        public string ResultsDirectory { get; }

        /// <summary>
        /// Base seed for every random choice (default 42).
        /// </summary>
        public int Seed { get; }

        /// <summary>
        /// Bootstrap resamples (default 2000, 100 to 100000).
        /// </summary>
        public int Resamples { get; }

        /// <summary>
        /// Run label, or null.
        /// </summary>
        public string? Label { get; }

        /// <summary>
        /// Stack kind: k3d, local, or external.
        /// </summary>
        public string Stack { get; }

        /// <summary>
        /// Kubeconfig for k3d stacks (fault injection, scaling, image digests), or null.
        /// </summary>
        public string? Kubeconfig { get; }

        /// <summary>
        /// Kubernetes context, or null.
        /// </summary>
        public string? KubeContext { get; }

        /// <summary>
        /// Kubernetes namespace (default garrison).
        /// </summary>
        public string KubeNamespace { get; }

        /// <summary>
        /// The client, created on first use from --url, --admin-key, and the connection options.
        /// </summary>
        public GarrisonClient Client
        {
            get
            {
                if (_Client == null)
                {
                    string url = Args.GetString("url", "http://127.0.0.1:37870", "GARRISON_BENCH_URL");
                    string key = Args.GetString("admin-key", DefaultAdminKey, "GARRISON_BENCH_ADMIN_KEY");
                    int connections = Args.GetInt("max-connections", 1024, 1, 65535);
                    int timeout = Args.GetInt("request-timeout-seconds", 660, 1, 3600);
                    int lifetime = Args.GetInt("connection-lifetime-seconds", 30, 1, 3600);
                    _Client = new GarrisonClient(url, key, connections, timeout, lifetime);
                }
                return _Client;
            }
        }

        #endregion

        #region Private-Members

        private GarrisonClient? _Client = null;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <exception cref="ArgumentNullException">Thrown when args is null.</exception>
        /// <exception cref="DirectoryNotFoundException">Thrown when the repository root cannot be found and no --results-dir is given.</exception>
        public BenchmarkContext(BenchmarkArguments args)
        {
            Args = args ?? throw new ArgumentNullException(nameof(args));
            string? root = RepositoryInfo.FindRoot();
            string? resultsOption = args.GetOptional("results-dir");
            if (root == null && resultsOption == null)
                throw new DirectoryNotFoundException("Could not find the repository root (a folder with .git and benchmarks/) above the executable or the working directory. Run from the repository, or pass --results-dir.");
            Root = root ?? Directory.GetCurrentDirectory();
            ResultsDirectory = Path.GetFullPath(resultsOption ?? Path.Combine(Root, "benchmarks", "results"));
            Seed = args.GetInt("seed", 42, 0, Int32.MaxValue);
            Resamples = args.GetInt("resamples", 2000, 100, 100000);
            Label = args.GetOptional("label");
            Stack = args.GetString("stack", "k3d");
            Kubeconfig = args.GetOptional("kubeconfig");
            KubeContext = args.GetOptional("context");
            KubeNamespace = args.GetString("namespace", "garrison");
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Resolve a path option relative to the repository root.
        /// </summary>
        /// <param name="path">Path as given.</param>
        /// <returns>Full path.</returns>
        /// <exception cref="ArgumentNullException">Thrown when path is null.</exception>
        public string ResolvePath(string path)
        {
            if (path == null) throw new ArgumentNullException(nameof(path));
            if (Path.IsPathRooted(path)) return path;
            string fromRoot = Path.Combine(Root, path);
            if (File.Exists(fromRoot) || Directory.Exists(fromRoot)) return Path.GetFullPath(fromRoot);
            return Path.GetFullPath(path);
        }

        /// <summary>
        /// Path relative to the repository root, with forward slashes, when it is inside it.
        /// </summary>
        /// <param name="path">Full path.</param>
        /// <returns>Relative or unchanged path.</returns>
        public string Relative(string path)
        {
            string relative = Path.GetRelativePath(Root, path);
            if (relative.StartsWith("..", StringComparison.Ordinal)) return path;
            return relative.Replace('\\', '/');
        }

        /// <summary>
        /// Write a progress line to stdout.
        /// </summary>
        /// <param name="message">Message.</param>
        public static void Log(string message)
        {
            Console.Out.WriteLine("[bench " + DateTime.UtcNow.ToString("HH:mm:ss", CultureInfo.InvariantCulture) + "] " + message);
        }

        /// <summary>
        /// Run kubectl against the bench stack's kubeconfig and context.
        /// </summary>
        /// <param name="arguments">kubectl arguments after the kubeconfig, context, and namespace.</param>
        /// <param name="timeoutMs">Timeout in milliseconds.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result.</returns>
        /// <exception cref="InvalidOperationException">Thrown when no --kubeconfig was given.</exception>
        public Task<ProcessResult> KubectlAsync(IEnumerable<string> arguments, int timeoutMs, CancellationToken token)
        {
            if (String.IsNullOrEmpty(Kubeconfig)) throw new InvalidOperationException("This needs --kubeconfig (and usually --context) for the bench cluster.");
            List<string> all = new List<string> { "--kubeconfig", Kubeconfig };
            if (!String.IsNullOrEmpty(KubeContext))
            {
                all.Add("--context");
                all.Add(KubeContext);
            }
            all.Add("-n");
            all.Add(KubeNamespace);
            all.AddRange(arguments);
            return ExternalProcess.RunAsync("kubectl", all, null, null, timeoutMs, token);
        }

        /// <summary>
        /// Build the provenance block for a report.
        /// </summary>
        /// <param name="datasetName">Dataset or workload name.</param>
        /// <param name="datasetSha256">Dataset SHA-256 (or a hash of the workload definition).</param>
        /// <param name="datasetPath">Dataset path, or null.</param>
        /// <param name="startedUtc">Start time.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Provenance.</returns>
        public async Task<ReportProvenance> ProvenanceAsync(string datasetName, string datasetSha256, string? datasetPath, DateTime startedUtc, CancellationToken token)
        {
            ReportProvenance provenance = new ReportProvenance();
            provenance.StartedUtc = startedUtc;
            provenance.FinishedUtc = DateTime.UtcNow;
            provenance.SutUrl = Client.BaseUrl;
            provenance.Stack = Stack;
            provenance.StackDetails = Args.GetOptional("stack-details", "GARRISON_BENCH_STACK_DETAILS");
            provenance.HarnessVersion = HarnessVersion;
            provenance.MachineName = Environment.MachineName;
            provenance.Os = RuntimeInformation.OSDescription + " (" + RuntimeInformation.OSArchitecture.ToString() + ")";
            provenance.Cores = Environment.ProcessorCount;
            provenance.Runtime = RuntimeInformation.FrameworkDescription;
            provenance.HttpClient = Client.Describe();
            provenance.DatasetName = datasetName;
            provenance.DatasetSha256 = datasetSha256;
            provenance.DatasetPath = datasetPath == null ? null : Relative(datasetPath);
            provenance.CommandLine = Args.CommandLine;
            provenance.Seed = Seed;
            provenance.SharedMachine = Args.GetOptional("shared-note");
            provenance.ExternalServices.Add("none: every run uses the fake harness (garrison-fake-harness), no model or paid service");

            string? sutCommit = Args.GetOptional("sut-commit");
            GitState state = await RepositoryInfo.ProductStateAsync(Root, token).ConfigureAwait(false);
            provenance.ProductCommit = sutCommit ?? state.Commit;
            provenance.ProductDirtyFiles = state.DirtyFiles;
            provenance.HarnessCommit = await RepositoryInfo.PathCommitAsync(Root, "src/Test.Benchmark", token).ConfigureAwait(false);
            provenance.Cpu = await CpuDescriptionAsync(token).ConfigureAwait(false);

            ApiResponse<ServerInfo> info = await Client.ServerInfoAsync(token).ConfigureAwait(false);
            if (info.Body != null) provenance.SutVersion = info.Body.Version;
            if (!String.IsNullOrEmpty(Kubeconfig)) provenance.Images.AddRange(await ImageDigestsAsync(token).ConfigureAwait(false));
            return provenance;
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing && _Client != null) _Client.Dispose();
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task<List<ImageDigest>> ImageDigestsAsync(CancellationToken token)
        {
            List<ImageDigest> digests = new List<ImageDigest>();
            string jsonPath = "{range .items[*]}{range .status.containerStatuses[*]}{.name}{\"\\t\"}{.image}{\"\\t\"}{.imageID}{\"\\t\"}{end}{.metadata.name}{\"\\n\"}{end}";
            ProcessResult result = await KubectlAsync(new string[] { "get", "pods", "-o", "jsonpath=" + jsonPath }, 30000, token).ConfigureAwait(false);
            if (result.ExitCode != 0) return digests;
            foreach (string line in result.Stdout.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            {
                string[] parts = line.Split('\t');
                string pod = parts[parts.Length - 1];
                for (int i = 0; i + 2 < parts.Length - 1; i += 3)
                {
                    ImageDigest digest = new ImageDigest();
                    digest.Pod = pod;
                    digest.Container = parts[i];
                    digest.Image = parts[i + 1];
                    digest.ImageId = parts[i + 2];
                    digests.Add(digest);
                }
            }
            return digests.OrderBy(d => d.Pod, StringComparer.Ordinal).ThenBy(d => d.Container, StringComparer.Ordinal).ToList();
        }

        private static async Task<string> CpuDescriptionAsync(CancellationToken token)
        {
            string arch = RuntimeInformation.ProcessArchitecture.ToString();
            try
            {
                if (OperatingSystem.IsMacOS())
                {
                    ProcessResult brand = await ExternalProcess.RunAsync("sysctl", new string[] { "-n", "machdep.cpu.brand_string" }, null, null, 10000, token).ConfigureAwait(false);
                    if (brand.ExitCode == 0 && brand.Stdout.Trim().Length > 0) return brand.Stdout.Trim() + " (" + arch + ")";
                }
                else if (OperatingSystem.IsLinux() && File.Exists("/proc/cpuinfo"))
                {
                    string? model = File.ReadAllLines("/proc/cpuinfo").FirstOrDefault(l => l.StartsWith("model name", StringComparison.Ordinal));
                    if (model != null && model.Contains(':')) return model.Substring(model.IndexOf(':') + 1).Trim() + " (" + arch + ")";
                }
                else if (OperatingSystem.IsWindows())
                {
                    string? identifier = Environment.GetEnvironmentVariable("PROCESSOR_IDENTIFIER");
                    if (!String.IsNullOrEmpty(identifier)) return identifier + " (" + arch + ")";
                }
            }
            catch (IOException)
            {
            }
            return arch;
        }

        #endregion
    }
}
