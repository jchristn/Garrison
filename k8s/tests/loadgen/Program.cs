namespace Garrison.LoadGen
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Entry point of the Garrison load generator. See LoadGenOptions.Usage for options.
    /// </summary>
    public static class Program
    {
        /// <summary>
        /// Entry point.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <returns>0 pass, 1 criteria not met, 2 usage or setup error.</returns>
        public static async Task<int> Main(string[] args)
        {
            if (args.Length > 0 && (args[0] == "--help" || args[0] == "-h"))
            {
                Console.WriteLine(LoadGenOptions.Usage());
                return 0;
            }

            LoadGenOptions options;
            try
            {
                options = LoadGenOptions.Parse(args);
            }
            catch (Exception e) when (e is ArgumentException || e is FormatException)
            {
                Console.Error.WriteLine(e.Message);
                Console.Error.WriteLine(LoadGenOptions.Usage());
                return 2;
            }

            using (CancellationTokenSource cts = new CancellationTokenSource())
            {
                Console.CancelKeyPress += (sender, e) =>
                {
                    e.Cancel = true;
                    cts.Cancel();
                };

                using (LoadGenerator generator = new LoadGenerator(options))
                {
                    try
                    {
                        LoadGenSummary summary = await generator.RunAsync(cts.Token).ConfigureAwait(false);
                        Console.WriteLine(summary.ToReport(options));
                        Console.WriteLine("runs csv: " + options.CsvPath + "; summary csv: " + options.SummaryPath);
                        return summary.Passed ? 0 : 1;
                    }
                    catch (InvalidOperationException e)
                    {
                        Console.Error.WriteLine("setup failed: " + e.Message);
                        return 2;
                    }
                    catch (OperationCanceledException)
                    {
                        Console.Error.WriteLine("cancelled");
                        return 2;
                    }
                }
            }
        }
    }
}
