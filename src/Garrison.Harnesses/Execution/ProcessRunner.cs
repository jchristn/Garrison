namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Diagnostics;
    using System.IO;
    using System.Runtime.InteropServices;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Runs a harness process: arguments through ArgumentList (never a shell), a fully specified environment, stdin
    /// written then closed, stdout read line by line with a byte limit, a stderr tail, and a deadline. On deadline or
    /// cancellation the process receives SIGTERM (Unix), then the whole tree is killed after the grace period.
    /// Thread-safe; each call is independent.
    /// </summary>
    public class ProcessRunner
    {
        #region Public-Methods

        /// <summary>
        /// Run a process to completion.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="onStdoutLine">Called for each stdout line, in order, on the reader thread.</param>
        /// <param name="onStarted">Called once with the process identifier after launch.</param>
        /// <param name="token">Cancellation token; cancellation stops the process.</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        public async Task<ProcessRunResult> RunAsync(ProcessRunRequest request, Action<string>? onStdoutLine, Func<int, Task>? onStarted, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));

            ProcessRunResult result = new ProcessRunResult();
            StderrTail stderr = new StderrTail(request.StderrTailBytes);

            ProcessStartInfo startInfo = new ProcessStartInfo();
            startInfo.FileName = request.Executable;
            foreach (string argument in request.Arguments) startInfo.ArgumentList.Add(argument);
            startInfo.WorkingDirectory = request.WorkingDirectory;
            startInfo.UseShellExecute = false;
            startInfo.RedirectStandardInput = true;
            startInfo.RedirectStandardOutput = true;
            startInfo.RedirectStandardError = true;
            startInfo.CreateNoWindow = true;
            startInfo.StandardOutputEncoding = new UTF8Encoding(false);
            startInfo.StandardErrorEncoding = new UTF8Encoding(false);
            startInfo.Environment.Clear();
            foreach (KeyValuePair<string, string> variable in request.Environment) startInfo.Environment[variable.Key] = variable.Value;

            using (Process process = new Process())
            {
                process.StartInfo = startInfo;
                try
                {
                    if (!process.Start())
                    {
                        result.LaunchError = "Process did not start.";
                        result.NotInstalled = true;
                        result.CompletedUtc = DateTime.UtcNow;
                        return result;
                    }
                }
                catch (Win32Exception e)
                {
                    result.NotInstalled = true;
                    result.LaunchError = "Could not start '" + request.Executable + "': " + e.Message;
                    result.CompletedUtc = DateTime.UtcNow;
                    return result;
                }

                request.Timing?.Start();
                result.StartedUtc = DateTime.UtcNow;
                result.ProcessId = process.Id;
                if (onStarted != null) await onStarted(process.Id).ConfigureAwait(false);

                using (CancellationTokenSource deadline = new CancellationTokenSource(TimeSpan.FromSeconds(Math.Max(1, request.TimeoutSeconds))))
                using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, deadline.Token))
                using (CancellationTokenSource outputLimit = new CancellationTokenSource())
                using (CancellationTokenSource stopAll = CancellationTokenSource.CreateLinkedTokenSource(linked.Token, outputLimit.Token))
                {
                    Task stdinTask = WriteStdinAsync(process, request.Stdin);
                    Task stderrTask = ReadStderrAsync(process, stderr);
                    Task stdoutTask = ReadStdoutAsync(process, request.MaxOutputBytes, onStdoutLine, result, outputLimit);

                    Task exitTask = process.WaitForExitAsync(CancellationToken.None);
                    Task stopTask = Task.Delay(Timeout.Infinite, stopAll.Token);
                    Task first = await Task.WhenAny(exitTask, stopTask).ConfigureAwait(false);

                    if (first == exitTask)
                    {
                        request.Timing?.MarkExited();
                    }
                    else
                    {
                        if (token.IsCancellationRequested) result.Cancelled = true;
                        else if (outputLimit.IsCancellationRequested) result.OutputLimitExceeded = true;
                        else result.TimedOut = true;
                        await StopAsync(process, request.KillGraceSeconds).ConfigureAwait(false);
                        if (process.HasExited) request.Timing?.MarkExited();
                    }

                    try
                    {
                        await Task.WhenAll(stdoutTask, stderrTask, stdinTask).WaitAsync(TimeSpan.FromSeconds(10)).ConfigureAwait(false);
                    }
                    catch (TimeoutException)
                    {
                    }

                    if (process.HasExited) result.ExitCode = process.ExitCode;
                }
            }

            result.StderrTail = stderr.ToString();
            result.CompletedUtc = DateTime.UtcNow;
            return result;
        }

        #endregion

        #region Private-Methods

        private static async Task WriteStdinAsync(Process process, string? stdin)
        {
            try
            {
                if (!String.IsNullOrEmpty(stdin))
                {
                    await process.StandardInput.WriteAsync(stdin).ConfigureAwait(false);
                    await process.StandardInput.FlushAsync().ConfigureAwait(false);
                }
            }
            catch (IOException)
            {
            }
            finally
            {
                try
                {
                    process.StandardInput.Close();
                }
                catch (IOException)
                {
                }
            }
        }

        private static async Task ReadStderrAsync(Process process, StderrTail tail)
        {
            try
            {
                while (true)
                {
                    string? line = await process.StandardError.ReadLineAsync().ConfigureAwait(false);
                    if (line == null) break;
                    tail.Append(line);
                }
            }
            catch (IOException)
            {
            }
            catch (ObjectDisposedException)
            {
            }
        }

        private static async Task ReadStdoutAsync(Process process, long maxBytes, Action<string>? onLine, ProcessRunResult result, CancellationTokenSource outputLimit)
        {
            try
            {
                while (true)
                {
                    string? line = await process.StandardOutput.ReadLineAsync().ConfigureAwait(false);
                    if (line == null) break;
                    result.StdoutBytes += Encoding.UTF8.GetByteCount(line) + 1;
                    if (result.StdoutBytes > maxBytes)
                    {
                        outputLimit.Cancel();
                        break;
                    }
                    onLine?.Invoke(line);
                }
            }
            catch (IOException)
            {
            }
            catch (ObjectDisposedException)
            {
            }
        }

        private static async Task StopAsync(Process process, int graceSeconds)
        {
            if (process.HasExited) return;

            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows) && graceSeconds > 0)
            {
                try
                {
                    using (Process signal = Process.Start(new ProcessStartInfo("kill", "-TERM " + process.Id) { UseShellExecute = false, CreateNoWindow = true })!)
                    {
                        await signal.WaitForExitAsync().ConfigureAwait(false);
                    }
                    using (CancellationTokenSource grace = new CancellationTokenSource(TimeSpan.FromSeconds(graceSeconds)))
                    {
                        await process.WaitForExitAsync(grace.Token).ConfigureAwait(false);
                    }
                }
                catch (OperationCanceledException)
                {
                }
                catch (Win32Exception)
                {
                }
                catch (InvalidOperationException)
                {
                }
            }

            if (process.HasExited) return;
            try
            {
                process.Kill(true);
                using (CancellationTokenSource wait = new CancellationTokenSource(TimeSpan.FromSeconds(5)))
                {
                    await process.WaitForExitAsync(wait.Token).ConfigureAwait(false);
                }
            }
            catch (OperationCanceledException)
            {
            }
            catch (InvalidOperationException)
            {
            }
            catch (Win32Exception)
            {
            }
        }

        #endregion
    }
}
