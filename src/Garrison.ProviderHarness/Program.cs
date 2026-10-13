namespace Garrison.ProviderHarness
{
    using System;
    using System.IO;
    using System.Runtime.InteropServices;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;
    using Garrison.Harnesses.Provider;

    /// <summary>Bundled provider API process. Prompts arrive on stdin; resolved configuration is private on disk.</summary>
    public static class Program
    {
        /// <summary>Run the optional provider harness, or report its version without opening network connections.</summary>
        /// <param name="args">--version, or --config followed by a private compiled configuration path.</param>
        /// <returns>Zero for success, one for failure.</returns>
        public static async Task<int> Main(string[] args)
        {
            if (args.Length == 1 && args[0] == "--version") { Console.WriteLine("garrison-provider-api " + Constants.ProductVersion); return 0; }
            using (CancellationTokenSource stop = new CancellationTokenSource())
            {
                Console.CancelKeyPress += (sender, signal) => { signal.Cancel = true; stop.Cancel(); };
                using (PosixSignalRegistration? termination = OperatingSystem.IsWindows() ? null : PosixSignalRegistration.Create(PosixSignal.SIGTERM, signal => { signal.Cancel = true; stop.Cancel(); }))
                {
                    try
                    {
                        if (args.Length != 2 || args[0] != "--config") throw new ArgumentException("Use --config with a private compiled provider configuration.");
                        if (new FileInfo(args[1]).Length > 16777216) throw new ArgumentException("Provider configuration exceeds its size limit.");
                        ProviderApiConfig config = Serializer.Deserialize<ProviderApiConfig>(await File.ReadAllTextAsync(args[1], stop.Token).ConfigureAwait(false)) ?? throw new ArgumentException("Provider configuration is invalid.");
                        string prompt = await Console.In.ReadToEndAsync(stop.Token).ConfigureAwait(false);
                        return await new ProviderApiRunner(config, Console.Out).RunAsync(prompt, stop.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException) when (stop.IsCancellationRequested) { return 1; }
                    catch (Exception)
                    {
                        // Never print library exception payloads: they can contain provider credentials or MCP headers.
                        Console.WriteLine(Serializer.Serialize(new ProviderApiEvent { EventType = RunEventTypeEnum.Error, Code = "ProviderExecutionFailed", Text = "Provider execution failed. Check its configuration, required MCP servers, and provider availability." }));
                        return 1;
                    }
                }
            }
        }
    }
}
