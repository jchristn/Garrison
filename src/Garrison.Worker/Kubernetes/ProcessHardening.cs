namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Runtime.InteropServices;

    /// <summary>
    /// Process-level hardening for run-one inside a run pod. Stateless and thread-safe.
    /// </summary>
    public static class ProcessHardening
    {
        #region Private-Members

        private const int _PrSetDumpable = 4;

        #endregion

        #region Public-Methods

        /// <summary>
        /// On Linux, mark the current process non-dumpable (prctl PR_SET_DUMPABLE 0). The kernel then makes its /proc
        /// entries (including /proc/&lt;pid&gt;/fd, environ, and mem) inaccessible to other processes of the same user
        /// without CAP_SYS_PTRACE, so the harness, which runs as the same user with every capability dropped, cannot
        /// open run-one's stdout through /proc and write protocol lines of its own. The flag resets on exec, so the
        /// harness itself stays dumpable. No effect on other platforms.
        /// </summary>
        /// <returns>True when the flag was set.</returns>
        public static bool DisableDumping()
        {
            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Linux)) return false;
            try
            {
                return Prctl(_PrSetDumpable, UIntPtr.Zero, UIntPtr.Zero, UIntPtr.Zero, UIntPtr.Zero) == 0;
            }
            catch (Exception e) when (e is DllNotFoundException || e is EntryPointNotFoundException)
            {
                return false;
            }
        }

        #endregion

        #region Private-Methods

        [DllImport("libc", EntryPoint = "prctl", SetLastError = true)]
        private static extern int Prctl(int option, UIntPtr arg2, UIntPtr arg3, UIntPtr arg4, UIntPtr arg5);

        #endregion
    }
}
