namespace Test.Automated
{
    using System;
    using System.Threading.Tasks;
    using Test.Shared;
    using Touchstone.Cli;

    /// <summary>
    /// Console runner for the Garrison shared suites.
    /// </summary>
    public static class Program
    {
        /// <summary>
        /// Entry point. Supports --results &lt;path&gt; to export JSON results and --providers sqlite,postgresql.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <returns>Exit code: 0 when every test passed.</returns>
        public static async Task<int> Main(string[] args)
        {
            string? resultsPath = null;
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "--results" && i + 1 < args.Length) resultsPath = args[i + 1];
                if (args[i] == "--providers" && i + 1 < args.Length) Environment.SetEnvironmentVariable("GARRISON_TEST_PROVIDERS", args[i + 1]);
            }

            return await ConsoleRunner.RunAsync(GarrisonSuites.All, resultsPath: resultsPath).ConfigureAwait(false);
        }
    }
}
