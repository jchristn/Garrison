namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Text.Json;

    /// <summary>
    /// Reads the served model from a Codex session file. `codex exec --json` does not report the model on stdout, but
    /// Codex writes a session file under CODEX_HOME/sessions whose turn_context records carry it. Thread-safe.
    /// </summary>
    public static class CodexSessionReader
    {
        #region Public-Methods

        /// <summary>
        /// Model from the newest session file under a Codex home directory.
        /// </summary>
        /// <param name="codexHome">CODEX_HOME directory of the run.</param>
        /// <returns>The model of the last turn_context record, or null when there is no session file or no model.</returns>
        public static string? ReadModel(string? codexHome)
        {
            if (String.IsNullOrEmpty(codexHome)) return null;
            string sessions = Path.Combine(codexHome, "sessions");
            if (!Directory.Exists(sessions)) return null;

            try
            {
                FileInfo? newest = new DirectoryInfo(sessions)
                    .EnumerateFiles("rollout-*.jsonl", SearchOption.AllDirectories)
                    .OrderByDescending(f => f.LastWriteTimeUtc)
                    .FirstOrDefault();
                if (newest == null) return null;

                string? model = null;
                foreach (string line in File.ReadLines(newest.FullName))
                {
                    if (line.IndexOf("\"turn_context\"", StringComparison.Ordinal) < 0) continue;
                    CodexSessionLine? parsed = JsonSerializer.Deserialize<CodexSessionLine>(line);
                    if (parsed?.Type == "turn_context" && !String.IsNullOrEmpty(parsed.Payload?.Model)) model = parsed.Payload!.Model;
                }
                return model;
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException || e is JsonException)
            {
                return null;
            }
        }

        #endregion
    }
}
