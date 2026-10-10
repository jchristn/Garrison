namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Runtime.InteropServices;

    /// <summary>
    /// Sends POSIX signals with libc kill(2) so stopping a harness does not depend on a kill binary being installed in
    /// the worker image. Unix only; every method returns false on Windows. Thread-safe.
    /// </summary>
    public static class PosixSignals
    {
        #region Public-Members

        /// <summary>
        /// SIGTERM (15 on Linux and macOS): ask a process to exit.
        /// </summary>
        public static readonly int SigTerm = 15;

        /// <summary>
        /// SIGKILL (9 on Linux and macOS): end a process immediately.
        /// </summary>
        public static readonly int SigKill = 9;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Send a signal to one process.
        /// </summary>
        /// <param name="processId">Process identifier; values below 2 are refused so a bad value never signals a
        /// process group or every process.</param>
        /// <param name="signal">Signal number.</param>
        /// <returns>True when the signal was delivered.</returns>
        public static bool Send(int processId, int signal)
        {
            if (processId < 2) return false;
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return false;
            try
            {
                return kill(processId, signal) == 0;
            }
            catch (Exception e) when (e is DllNotFoundException || e is EntryPointNotFoundException)
            {
                return false;
            }
        }

        /// <summary>
        /// Whether a process exists (signal 0 probe). A zombie that has exited but was not reaped still counts.
        /// </summary>
        /// <param name="processId">Process identifier.</param>
        /// <returns>True when the process exists.</returns>
        public static bool Exists(int processId)
        {
            if (processId < 2) return false;
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return false;
            try
            {
                if (kill(processId, 0) == 0) return true;
                // EPERM (1) means the process exists but belongs to someone else.
                return Marshal.GetLastPInvokeError() == 1;
            }
            catch (Exception e) when (e is DllNotFoundException || e is EntryPointNotFoundException)
            {
                return false;
            }
        }

        #endregion

        #region Private-Methods

        [DllImport("libc", SetLastError = true)]
        private static extern int kill(int pid, int sig);

        #endregion
    }
}
