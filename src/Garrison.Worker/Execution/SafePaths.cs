namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Runtime.InteropServices;
    using Microsoft.Win32.SafeHandles;

    /// <summary>
    /// Path helpers that reject paths escaping a base directory, and that keep the worker from following filesystem links
    /// a previous harness turn planted in a reused conversation directory (SR-24). Thread-safe.
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

        /// <summary>
        /// Resolve a path inside a base directory for writing without following links: the base directory and every
        /// existing directory between it and the file must be real directories (a link there is refused), missing
        /// directories are created, and an existing link at the file's own path (to a file or a directory, dangling or
        /// not) is deleted so the write creates a regular file in its place.
        /// </summary>
        /// <param name="baseDirectory">Base directory.</param>
        /// <param name="path">Path relative to the base, or an absolute path inside it.</param>
        /// <returns>Absolute path inside the base directory, safe to write.</returns>
        /// <exception cref="UnauthorizedAccessException">Thrown when the path escapes the base directory or a directory on the way is a link.</exception>
        public static string PrepareWrite(string baseDirectory, string path)
        {
            string full = Combine(baseDirectory, path);
            string root = Path.GetFullPath(baseDirectory).TrimEnd(Path.DirectorySeparatorChar);
            if (IsLink(root)) throw new UnauthorizedAccessException("The base directory is a filesystem link; refusing to write through it.");
            if (!Directory.Exists(root)) Directory.CreateDirectory(root);

            string relative = Path.GetRelativePath(root, full);
            string[] parts = relative.Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries);
            string current = root;
            for (int i = 0; i < parts.Length - 1; i++)
            {
                current = Path.Combine(current, parts[i]);
                if (IsLink(current)) throw new UnauthorizedAccessException("Directory '" + Path.GetRelativePath(root, current) + "' is a filesystem link; refusing to write through it.");
                if (File.Exists(current)) throw new UnauthorizedAccessException("'" + Path.GetRelativePath(root, current) + "' is a file, not a directory.");
                if (!Directory.Exists(current)) Directory.CreateDirectory(current);
            }
            if (IsLink(full))
            {
                // Removing a link never touches its target. A directory link on Windows is removed as a directory.
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) && Directory.Exists(full)) Directory.Delete(full, false);
                else File.Delete(full);
            }
            return full;
        }

        /// <summary>
        /// Whether a path is itself a filesystem link (symbolic link or junction), without following it. A dangling link
        /// counts. A missing path is not a link.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <returns>True when the path is a link.</returns>
        public static bool IsLink(string path)
        {
            if (String.IsNullOrEmpty(path)) return false;
            try
            {
                FileInfo info = new FileInfo(path);
                if (info.LinkTarget != null) return true;
                return info.Exists && (info.Attributes & FileAttributes.ReparsePoint) != 0;
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                return true;
            }
        }

        /// <summary>
        /// A path with every link along it resolved, for comparing with the path an open file handle reports. Components
        /// that do not exist are kept as written.
        /// </summary>
        /// <param name="path">Absolute or relative path.</param>
        /// <returns>Canonical absolute path.</returns>
        public static string CanonicalPath(string path)
        {
            string full = Path.GetFullPath(path);
            string? rootPart = Path.GetPathRoot(full);
            string current = String.IsNullOrEmpty(rootPart) ? String.Empty : rootPart;
            string[] parts = full.Substring(current.Length).Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries);
            int hops = 0;
            Queue<string> pending = new Queue<string>(parts);
            while (pending.Count > 0)
            {
                string next = Path.Combine(current, pending.Dequeue());
                FileSystemInfo? target = null;
                try
                {
                    FileInfo info = new FileInfo(next);
                    if (info.LinkTarget != null) target = info.ResolveLinkTarget(true);
                }
                catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
                {
                    target = null;
                }
                if (target != null && hops++ < 40)
                {
                    string resolved = Path.GetFullPath(target.FullName);
                    List<string> rest = new List<string>(pending);
                    pending.Clear();
                    string? resolvedRoot = Path.GetPathRoot(resolved);
                    current = String.IsNullOrEmpty(resolvedRoot) ? String.Empty : resolvedRoot;
                    foreach (string part in resolved.Substring(current.Length).Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries)) pending.Enqueue(part);
                    foreach (string part in rest) pending.Enqueue(part);
                    continue;
                }
                current = next;
            }
            return current;
        }

        /// <summary>
        /// Whether an opened file is the regular file at an expected location inside a root, with no link anywhere between
        /// the root and the file. On Linux the kernel's view of the open descriptor (/proc/self/fd) is compared with the
        /// canonical expected path, so a link swapped in before the open is detected. Elsewhere the path is checked for
        /// links after the open.
        /// </summary>
        /// <param name="handle">Open file handle.</param>
        /// <param name="root">Root directory the file must be inside.</param>
        /// <param name="path">Absolute path that was opened.</param>
        /// <returns>True when the opened file is the expected one.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static bool OpenedInside(SafeFileHandle handle, string root, string path)
        {
            if (handle == null) throw new ArgumentNullException(nameof(handle));
            if (root == null) throw new ArgumentNullException(nameof(root));
            if (path == null) throw new ArgumentNullException(nameof(path));
            string fullRoot = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar);
            string full = Path.GetFullPath(path);
            if (!full.StartsWith(fullRoot + Path.DirectorySeparatorChar, StringComparison.Ordinal)) return false;

            string current = fullRoot;
            foreach (string part in Path.GetRelativePath(fullRoot, full).Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries))
            {
                current = Path.Combine(current, part);
                if (IsLink(current)) return false;
            }

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                string? opened = new FileInfo("/proc/self/fd/" + handle.DangerousGetHandle().ToInt64().ToString(System.Globalization.CultureInfo.InvariantCulture)).LinkTarget;
                if (String.IsNullOrEmpty(opened)) return false;
                string expected = Path.Combine(CanonicalPath(fullRoot), Path.GetRelativePath(fullRoot, full));
                return String.Equals(opened, expected, StringComparison.Ordinal);
            }
            return true;
        }
    }
}
