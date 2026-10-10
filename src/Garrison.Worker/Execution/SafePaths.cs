namespace Garrison.Worker.Execution
{
    using System;
    using System.IO;

    /// <summary>
    /// Path helpers that reject paths escaping a base directory. Thread-safe.
    /// </summary>
    public static class SafePaths
    {
        /// <summary>
        /// Combine a base directory and a relative (or already absolute) path, rejecting results outside the base.
        /// </summary>
        /// <param name="baseDirectory">Base directory.</param>
        /// <param name="path">Path relative to the base, or an absolute path inside it.</param>
        /// <returns>Absolute path inside the base directory.</returns>
        /// <exception cref="UnauthorizedAccessException">Thrown when the path escapes the base directory.</exception>
        public static string Combine(string baseDirectory, string path)
        {
            if (String.IsNullOrWhiteSpace(path)) throw new UnauthorizedAccessException("Empty file path.");
            string root = Path.GetFullPath(baseDirectory).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            string full = Path.GetFullPath(Path.IsPathRooted(path) ? path : Path.Combine(root, path));
            if (!full.StartsWith(root, StringComparison.Ordinal)) throw new UnauthorizedAccessException("Path '" + path + "' escapes its base directory.");
            return full;
        }
    }
}
