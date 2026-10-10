namespace Garrison.Server.Services
{
    using System;
    using System.Threading;

    /// <summary>
    /// Coordinates operator-requested restarts: records a non-zero exit code so the container runtime restarts the
    /// process, then signals shutdown. Thread-safe.
    /// </summary>
    public static class RestartCoordinator
    {
        #region Public-Members

        /// <summary>
        /// Process exit code: 0 normally, 3 after a requested restart.
        /// </summary>
        public static int ExitCode
        {
            get
            {
                return Volatile.Read(ref _ExitCode);
            }
        }

        #endregion

        #region Private-Members

        private static int _ExitCode = 0;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Request a restart after a delay so the HTTP response can be sent.
        /// </summary>
        /// <param name="delayMs">Delay in milliseconds. Minimum 0, maximum 60000.</param>
        public static void RequestRestart(int delayMs)
        {
            Interlocked.Exchange(ref _ExitCode, 3);
            int delay = Math.Clamp(delayMs, 0, 60000);
            Thread thread = new Thread(() =>
            {
                Thread.Sleep(delay);
                Environment.Exit(3);
            });
            thread.IsBackground = true;
            thread.Start();
        }

        #endregion
    }
}
