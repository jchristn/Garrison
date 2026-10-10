namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Diagnostics;
    using System.Globalization;
    using System.IO;
    using System.Runtime.InteropServices;

    /// <summary>
    /// Finds the descendants of a process on Unix, so a stop can signal a harness's children (for example the Node and
    /// Rust processes that Claude Code and Codex start) before the harness exits and they are re-parented. Linux reads
    /// /proc; macOS and other Unix systems run ps. Windows returns no descendants (the runner kills the tree with
    /// Process.Kill(true) there). Thread-safe.
    /// </summary>
    public static class ProcessTree
    {
        #region Public-Methods

        /// <summary>
        /// Descendants of a process (children, grandchildren, and so on), parents before children. The root itself is
        /// not included. A process listed here may exit before it is signalled.
        /// </summary>
        /// <param name="rootProcessId">Root process identifier.</param>
        /// <returns>Descendant process identifiers; empty when there are none or they cannot be listed.</returns>
        public static List<int> Descendants(int rootProcessId)
        {
            List<int> result = new List<int>();
            if (rootProcessId < 2 || RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return result;

            Dictionary<int, List<int>> children = ParentMap();
            Queue<int> pending = new Queue<int>();
            HashSet<int> seen = new HashSet<int> { rootProcessId };
            pending.Enqueue(rootProcessId);
            while (pending.Count > 0)
            {
                int current = pending.Dequeue();
                if (!children.TryGetValue(current, out List<int>? direct)) continue;
                foreach (int child in direct)
                {
                    if (!seen.Add(child)) continue;
                    result.Add(child);
                    pending.Enqueue(child);
                }
            }
            return result;
        }

        #endregion

        #region Private-Methods

        private static Dictionary<int, List<int>> ParentMap()
        {
            Dictionary<int, List<int>> map = new Dictionary<int, List<int>>();
            if (Directory.Exists("/proc") && File.Exists("/proc/self/stat"))
            {
                foreach (string directory in SafeDirectories("/proc"))
                {
                    if (!Int32.TryParse(Path.GetFileName(directory), NumberStyles.Integer, CultureInfo.InvariantCulture, out int pid)) continue;
                    int? parent = ReadProcParent(Path.Combine(directory, "stat"));
                    if (parent.HasValue) Add(map, parent.Value, pid);
                }
                return map;
            }

            foreach (string line in RunPs())
            {
                string[] parts = line.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 2) continue;
                if (!Int32.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out int pid)) continue;
                if (!Int32.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out int parent)) continue;
                Add(map, parent, pid);
            }
            return map;
        }

        private static void Add(Dictionary<int, List<int>> map, int parent, int child)
        {
            if (!map.TryGetValue(parent, out List<int>? list))
            {
                list = new List<int>();
                map[parent] = list;
            }
            list.Add(child);
        }

        private static IEnumerable<string> SafeDirectories(string path)
        {
            try
            {
                return Directory.GetDirectories(path);
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                return Array.Empty<string>();
            }
        }

        private static int? ReadProcParent(string statPath)
        {
            try
            {
                // Format: pid (comm) state ppid ...; comm may contain spaces and parentheses, so parse after the last ')'.
                string stat = File.ReadAllText(statPath);
                int close = stat.LastIndexOf(')');
                if (close < 0 || close + 2 >= stat.Length) return null;
                string[] fields = stat.Substring(close + 2).Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (fields.Length < 2) return null;
                if (Int32.TryParse(fields[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out int parent)) return parent;
                return null;
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                return null;
            }
        }

        private static List<string> RunPs()
        {
            List<string> lines = new List<string>();
            try
            {
                ProcessStartInfo info = new ProcessStartInfo("ps");
                info.ArgumentList.Add("-A");
                info.ArgumentList.Add("-o");
                info.ArgumentList.Add("pid=,ppid=");
                info.UseShellExecute = false;
                info.RedirectStandardOutput = true;
                info.RedirectStandardError = true;
                info.CreateNoWindow = true;
                using (Process? ps = Process.Start(info))
                {
                    if (ps == null) return lines;
                    string output = ps.StandardOutput.ReadToEnd();
                    ps.WaitForExit(5000);
                    foreach (string line in output.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)) lines.Add(line);
                }
            }
            catch (Exception e) when (e is Win32Exception || e is InvalidOperationException || e is IOException)
            {
            }
            return lines;
        }

        #endregion
    }
}
