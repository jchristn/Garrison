namespace Garrison.Worker.Execution
{
    using System;
    using System.IO;
    using System.Runtime.InteropServices;
    using Microsoft.Win32.SafeHandles;

    /// <summary>Open regular files without blocking on a harness-created FIFO or following a final filesystem link.</summary>
    public static class RegularFileReader
    {
        /// <summary>Open a regular file for reading. The returned stream owns its descriptor.</summary>
        /// <param name="path">File path.</param><returns>Read stream.</returns>
        /// <exception cref="IOException">The path is not a regular file or cannot be opened safely.</exception>
        public static FileStream Open(string path)
        {
            if (OperatingSystem.IsWindows())
            {
                FileStream windows = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 16384, FileOptions.Asynchronous);
                if (!windows.CanSeek) { windows.Dispose(); throw new IOException("Artifact is not a regular file."); }
                return windows;
            }
            // Native open flags differ by OS. NONBLOCK prevents FIFO opens from waiting for a writer;
            // NOFOLLOW refuses a swapped final link, and CLOEXEC keeps the descriptor out of child harnesses.
            int flags = OperatingSystem.IsMacOS() ? 0x1000000 | 0x100 | 0x4
                : OperatingSystem.IsLinux() ? 0x80000 | 0x20000 | 0x800
                : throw new IOException("Safe regular-file capture is unavailable on this platform.");
            int descriptor = OpenUnix(path, flags, 0);
            if (descriptor < 0) throw new IOException("Artifact cannot be opened as a regular file.");
            SafeFileHandle handle = new SafeFileHandle(new IntPtr(descriptor), true);
            IntPtr status = Marshal.AllocHGlobal(256);
            try
            {
                if (StatUnix(new IntPtr(descriptor), status) != 0 || (Marshal.ReadInt32(status, 4) & 0xf000) != 0x8000) throw new IOException("Artifact is not a regular file.");
                return new FileStream(handle, FileAccess.Read, 16384, false);
            }
            catch { handle.Dispose(); throw; }
            finally { Marshal.FreeHGlobal(status); }
        }

        [DllImport("libc", EntryPoint = "open", SetLastError = true)]
        private static extern int OpenUnix([MarshalAs(UnmanagedType.LPUTF8Str)] string path, int flags, int mode);

        [DllImport("System.Native", EntryPoint = "SystemNative_FStat", SetLastError = true)]
        private static extern int StatUnix(IntPtr descriptor, IntPtr status);
    }
}
