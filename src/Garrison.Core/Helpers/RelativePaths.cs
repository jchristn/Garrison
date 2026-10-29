namespace Garrison.Core.Helpers
{
    using System;
    using System.Linq;

    /// <summary>
    /// Validation of client-supplied relative paths for asset files and file space files (AD2, AD3). Stateless and
    /// thread-safe.
    /// </summary>
    public static class RelativePaths
    {
        #region Public-Methods

        /// <summary>
        /// Whether a path is relative, uses forward slashes, has no empty, "." or ".." segments, no control characters, no
        /// backslash or colon, and is at most the given length.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <param name="maxLength">Longest accepted path. Default 512.</param>
        /// <returns>True when valid.</returns>
        public static bool IsValid(string? path, int maxLength = 512)
        {
            if (String.IsNullOrEmpty(path) || path.Length > maxLength) return false;
            if (path.StartsWith("/", StringComparison.Ordinal) || path.Contains('\\') || path.Contains(':')) return false;
            if (path.Any(c => Char.IsControl(c))) return false;
            return path.Split('/').All(segment => segment.Length > 0 && segment != "." && segment != "..");
        }

        #endregion
    }
}
