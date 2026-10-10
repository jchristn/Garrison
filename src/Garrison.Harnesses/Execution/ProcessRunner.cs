namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Runtime.InteropServices;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Runs a harness process: arguments through ArgumentList (never a shell), a fully specified environment, stdin
    /// written then closed, stdout read line by line with a byte limit, a stderr tail, and a deadline. On deadline,
    /// cancellation, output limit, or a run guard stop, the process and its descendants receive SIGTERM (Unix), and
    /// whatever is still alive after the grace period receives SIGKILL; the descendants are listed before the signal so
    /// children of a harness that exits first (Node and Rust processes under Claude Code or Codex) are not left behind.
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
                using (CancellationTokenSource stopAll = CancellationTokenSource.CreateLinkedTokenSource(linked.Token, outputLimit.Token, request.StopToken))
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
                        else if (request.StopToken.IsCancellationRequested) result.Stopped = true;
                        else if (outputLimit.IsCancellationRequested) result.OutputLimitExceeded = true;
                        else result.TimedOut = true;
                        Stopwatch stopping = Stopwatch.StartNew();
                        result.Killed = await StopAsync(process, request.KillGraceSeconds).ConfigureAwait(false);
                        if (process.HasExited)
                        {
                            request.Timing?.MarkExited();
                            result.StopLatencyMs = stopping.ElapsedMilliseconds;
                        }
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

        private static async Task<bool> StopAsync(Process process, int graceSeconds)
        {
            if (process.HasExited) return false;
            bool killed = false;

            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                // List the tree before the root can exit: once it does, its children are re-parented and cannot be found.
                int rootId = process.Id;
                HashSet<int> tree = new HashSet<int>(ProcessTree.Descendants(rootId));
                if (graceSeconds > 0)
                {
                    PosixSignals.Send(rootId, PosixSignals.SigTerm);
                    foreach (int child in tree) PosixSignals.Send(child, PosixSignals.SigTerm);
                    try
                    {
                        using (CancellationTokenSource grace = new CancellationTokenSource(TimeSpan.FromSeconds(graceSeconds)))
                        {
                            await process.WaitForExitAsync(grace.Token).ConfigureAwait(false);
                            while (tree.Any(PosixSignals.Exists)) await Task.Delay(50, grace.Token).ConfigureAwait(false);
                        }
                    }
                    catch (OperationCanceledException)
                    {
                    }
                    catch (InvalidOperationException)
                    {
                    }
                }

                if (!process.HasExited)
                {
                    foreach (int child in ProcessTree.Descendants(rootId)) tree.Add(child);
                    if (PosixSignals.Send(rootId, PosixSignals.SigKill)) killed = true;
                }
                foreach (int child in tree)
                {
                    if (PosixSignals.Exists(child) && PosixSignals.Send(child, PosixSignals.SigKill)) killed = true;
                }
            }

            if (!process.HasExited)
            {
                try
                {
                    process.Kill(true);
                    killed = true;
                }
                catch (InvalidOperationException)
                {
                }
                catch (Win32Exception)
                {
                }
            }

            try
            {
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
            return killed;
        }

        #endregion
    }
}
