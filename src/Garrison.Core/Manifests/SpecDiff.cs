namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Field-level differences between two manifest specs (AA8.5), flattened to dotted paths with list indexes, the same
    /// shape the manifest dry run reports. Stateless and thread-safe.
    /// </summary>
    public static class SpecDiff
    {
        #region Public-Methods

        /// <summary>
        /// Compare two specs.
        /// </summary>
        /// <param name="before">Spec before, or null for a new record.</param>
        /// <param name="after">Spec after, or null.</param>
        /// <returns>Changed fields in path order.</returns>
        public static List<ManifestFieldChange> Compare(Dictionary<string, object?>? before, Dictionary<string, object?>? after)
        {
            Dictionary<string, string?> left = new Dictionary<string, string?>(StringComparer.Ordinal);
            Dictionary<string, string?> right = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (before != null) Flatten(before, String.Empty, left);
            if (after != null) Flatten(after, String.Empty, right);
            List<ManifestFieldChange> changes = new List<ManifestFieldChange>();
            foreach (string field in left.Keys.Union(right.Keys).OrderBy(k => k, StringComparer.Ordinal))
            {
                left.TryGetValue(field, out string? was);
                right.TryGetValue(field, out string? now);
                if (!String.Equals(was, now, StringComparison.Ordinal)) changes.Add(new ManifestFieldChange(field, was, now));
            }
            return changes;
        }

        /// <summary>
        /// The top-level key of a flattened path, such as <c>revision</c> for <c>revision.minIntervalSeconds</c> or
        /// <c>prompts</c> for <c>prompts.System</c>.
        /// </summary>
        /// <param name="path">Flattened path.</param>
        /// <returns>Top-level key.</returns>
        public static string Head(string path)
        {
            if (String.IsNullOrEmpty(path)) return String.Empty;
            int dot = path.IndexOf('.');
            int bracket = path.IndexOf('[');
            int end = dot < 0 ? bracket : bracket < 0 ? dot : Math.Min(dot, bracket);
            return end < 0 ? path : path.Substring(0, end);
        }

        #endregion

        #region Private-Methods

        private static void Flatten(object? value, string path, Dictionary<string, string?> output)
        {
            if (value is Dictionary<string, object?> map)
            {
                foreach (KeyValuePair<string, object?> entry in map) Flatten(entry.Value, path.Length == 0 ? entry.Key : path + "." + entry.Key, output);
                return;
            }
            if (value is List<object?> list)
            {
                if (list.Count == 0 && path.Length > 0) output[path] = "[]";
                for (int i = 0; i < list.Count; i++) Flatten(list[i], path + "[" + i.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", output);
                return;
            }
            if (path.Length == 0) return;
            output[path] = value == null ? null : TemplateValues.ToText(value);
        }

        #endregion
    }
}
