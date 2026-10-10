namespace Garrison.Worker.Execution
{
    using System;
    using System.Globalization;
    using System.IO;
    using System.Runtime.InteropServices;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;

    /// <summary>
    /// Writes execution files into the run's config, workspace, or home directory with path traversal protection and
    /// optional Unix modes. Secret files default to mode 600. Thread-safe.
    /// </summary>
    public static class FileMaterializer
    {
        /// <summary>
        /// Write a file.
        /// </summary>
        /// <param name="file">File.</param>
        /// <param name="directories">Run directories.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Absolute path written.</returns>
        /// <exception cref="UnauthorizedAccessException">Thrown when the path escapes its base directory.</exception>
        /// <exception cref="FormatException">Thrown when the mode is not octal.</exception>
        public static async Task<string> WriteAsync(ExecutionFile file, RunDirectories directories, CancellationToken token)
        {
            if (file == null) throw new ArgumentNullException(nameof(file));
            if (directories == null) throw new ArgumentNullException(nameof(directories));

            string baseDirectory = file.BaseDirectory == FileBaseDirectoryEnum.Workspace ? directories.Workspace
                : file.BaseDirectory == FileBaseDirectoryEnum.Home ? directories.Home
                : directories.Config;
            string path = SafePaths.Combine(baseDirectory, file.Path);
            string? parent = Path.GetDirectoryName(path);
            if (!String.IsNullOrEmpty(parent)) Directory.CreateDirectory(parent);
            await File.WriteAllTextAsync(path, file.Content ?? String.Empty, new UTF8Encoding(false), token).ConfigureAwait(false);

            string? mode = file.Mode ?? (file.IsSecret ? "600" : null);
            if (!String.IsNullOrEmpty(mode) && !RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                File.SetUnixFileMode(path, (UnixFileMode)Convert.ToInt32(mode, 8));
            }
            return path;
        }

        /// <summary>
        /// Parse an octal mode string, for tests and validation.
        /// </summary>
        /// <param name="mode">Mode, for example 600.</param>
        /// <returns>Numeric mode.</returns>
        public static int ParseMode(string mode)
        {
            return Convert.ToInt32(mode, 8);
        }
    }
}
