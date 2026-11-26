namespace Garrison.Core.Memory
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Security.Cryptography;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Renders recalled memory entries through the memory-recall template (AA4.8, AA-025): each entry is framed as data
    /// with its provenance, between begin and end lines that carry a marker chosen at random for every render, so text
    /// inside an entry cannot close its own block. This is the only way memory text enters a prompt. Thread-safe.
    /// </summary>
    public static class MemoryRecallRenderer
    {
        /// <summary>
        /// Override name of the template: memory-recall (built-in builtin/memory-recall, kind Fragment).
        /// </summary>
        public static readonly string TemplateName = "memory-recall";

        /// <summary>
        /// Render entries.
        /// </summary>
        /// <param name="template">Template content.</param>
        /// <param name="templateName">Template name, for errors.</param>
        /// <param name="entries">Entries with their text, in the order to show them.</param>
        /// <param name="scopeNames">Display names by scope identifier; a missing name shows the identifier.</param>
        /// <param name="tag">Tag the entries were recalled by, shown when some did not fit.</param>
        /// <param name="truncated">Whether more entries matched than are shown.</param>
        /// <returns>Rendered text; empty when there are no entries.</returns>
        /// <exception cref="ArgumentNullException">Thrown when template or entries is null.</exception>
        /// <exception cref="TemplateException">Thrown when the template does not render.</exception>
        public static string Render(string template, string templateName, List<MemoryReadResult> entries, IReadOnlyDictionary<string, string>? scopeNames, string tag, bool truncated)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
            if (entries == null) throw new ArgumentNullException(nameof(entries));
            string boundary = Convert.ToHexString(RandomNumberGenerator.GetBytes(8)).ToLowerInvariant();
            List<object?> items = new List<object?>();
            foreach (MemoryReadResult result in entries)
            {
                if (result.Entry == null || result.Value == null) continue;
                MemoryEntry entry = result.Entry;
                Dictionary<string, object?> item = TemplateContext.NewMap();
                item["boundary"] = boundary;
                item["scope"] = entry.ScopeKind.ToString();
                item["scopeId"] = entry.ScopeId;
                item["scopeName"] = scopeNames != null && scopeNames.TryGetValue(entry.ScopeId, out string? name) ? name : entry.ScopeId;
                item["key"] = entry.Key;
                item["version"] = entry.Version;
                item["category"] = entry.Category;
                item["writer"] = entry.WriterName ?? entry.WriterPrincipalId ?? "unknown";
                item["updatedUtc"] = entry.LastUpdateUtc.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture);
                item["value"] = result.Value;
                items.Add(item);
            }
            TemplateContext context = new TemplateContext();
            Dictionary<string, object?> memory = TemplateContext.NewMap();
            memory["boundary"] = boundary;
            memory["entries"] = items;
            memory["hasEntries"] = items.Count > 0;
            memory["count"] = (long)items.Count;
            memory["tag"] = tag;
            memory["truncated"] = truncated;
            context.Set("memory", memory);
            context.Set("now", DateTime.UtcNow);
            return TemplateRenderer.Render(template, context, new TemplateRenderOptions { TemplateName = templateName, AllowSecrets = false }).Trim();
        }
    }
}
