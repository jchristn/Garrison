namespace Garrison.Benchmark
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Diagnostics;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Starts external processes (git, kubectl, the fake harness) without a shell: arguments go through
    /// <see cref="ProcessStartInfo.ArgumentList"/> and payloads through stdin, so nothing is parsed by a shell.
    /// Stateless and thread-safe.
    /// </summary>
    public static class ExternalProcess
    {
        /// <summary>
        /// Run a process to completion.
        /// </summary>
        /// <param name="fileName">Executable.</param>
        /// <param name="arguments">Arguments.</param>
        /// <param name="stdin">Text written to stdin (then closed), or null for none.</param>
        /// <param name="workingDirectory">Working directory, or null for the current one.</param>
        /// <param name="timeoutMs">Kill the process tree after this many milliseconds, 1 to 86400000.</param>
        /// <param name="token">Cancellation token; cancelling kills the process tree.</param>
        /// <param name="environment">Environment variables to set or override, or null.</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when fileName or arguments is null.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when timeoutMs is out of range.</exception>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled.</exception>
        public static async Task<ProcessResult> RunAsync(string fileName, IEnumerable<string> arguments, string? stdin, string? workingDirectory, int timeoutMs, CancellationToken token, IDictionary<string, string>? environment = null)
        {
            if (String.IsNullOrEmpty(fileName)) throw new ArgumentNullException(nameof(fileName));
            if (arguments == null) throw new ArgumentNullException(nameof(arguments));
            if (timeoutMs < 1 || timeoutMs > 86400000) throw new ArgumentOutOfRangeException(nameof(timeoutMs));

            ProcessResult result = new ProcessResult();
            ProcessStartInfo info = new ProcessStartInfo(fileName);
            foreach (string argument in arguments) info.ArgumentList.Add(argument);
            info.UseShellExecute = false;
            info.RedirectStandardInput = true;
            info.RedirectStandardOutput = true;
            info.RedirectStandardError = true;
            info.StandardOutputEncoding = Encoding.UTF8;
            info.StandardErrorEncoding = Encoding.UTF8;
            info.CreateNoWindow = true;
            if (!String.IsNullOrEmpty(workingDirectory)) info.WorkingDirectory = workingDirectory;
            if (environment != null)
            {
                foreach (KeyValuePair<string, string> pair in environment) info.Environment[pair.Key] = pair.Value;
            }

            Stopwatch watch = Stopwatch.StartNew();
            using (Process process = new Process())
            {
                process.StartInfo = info;
                try
                {
                    process.Start();
                }
                catch (Win32Exception e)
                {
                    result.StartError = "Could not start " + fileName + ": " + e.Message;
                    return result;
                }

                Task<string> stdout = process.StandardOutput.ReadToEndAsync(token);
                Task<string> stderr = process.StandardError.ReadToEndAsync(token);
                try
                {
                    if (stdin != null) await process.StandardInput.WriteAsync(stdin.AsMemory(), token).ConfigureAwait(false);
                    process.StandardInput.Close();
                }
                catch (System.IO.IOException)
                {
                }

                using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    timeout.CancelAfter(timeoutMs);
                    try
                    {
                        await process.WaitForExitAsync(timeout.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                        Kill(process);
                        if (token.IsCancellationRequested) throw;
                        result.TimedOut = true;
                    }
                }
                watch.Stop();
                result.ElapsedMs = watch.Elapsed.TotalMilliseconds;
                try
                {
                    result.Stdout = await stdout.ConfigureAwait(false);
                    result.Stderr = await stderr.ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (!token.IsCancellationRequested)
                {
                }
                if (!result.TimedOut) result.ExitCode = process.ExitCode;
            }
            return result;
        }

        private static void Kill(Process process)
        {
            try
            {
                if (!process.HasExited) process.Kill(true);
            }
            catch (InvalidOperationException)
            {
            }
            catch (Win32Exception)
            {
            }
        }
    }
}
