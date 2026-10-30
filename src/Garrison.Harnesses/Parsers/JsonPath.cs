namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Text.Json;

    /// <summary>
    /// Read helpers over third-party harness events. Harness output is external and schemaless from Garrison's point
    /// of view, so parsers navigate it with JsonDocument rather than typed contracts. Thread-safe.
    /// </summary>
    public static class JsonPath
    {
        /// <summary>
        /// Get a property, or a default element when missing.
        /// </summary>
        /// <param name="element">Element.</param>
        /// <param name="name">Property name.</param>
        /// <param name="value">Value when found.</param>
        /// <returns>True when found and not null.</returns>
        public static bool TryGet(JsonElement element, string name, out JsonElement value)
        {
            value = default;
            if (element.ValueKind != JsonValueKind.Object) return false;
            if (!element.TryGetProperty(name, out value)) return false;
            return value.ValueKind != JsonValueKind.Null && value.ValueKind != JsonValueKind.Undefined;
        }

        /// <summary>
        /// Resolve a dotted path such as usage.input_tokens.
        /// </summary>
        /// <param name="element">Root.</param>
        /// <param name="path">Dotted path.</param>
        /// <param name="value">Value when found.</param>
        /// <returns>True when found.</returns>
        public static bool TryPath(JsonElement element, string? path, out JsonElement value)
        {
            value = element;
            if (String.IsNullOrEmpty(path)) return false;
            foreach (string part in path.Split('.', StringSplitOptions.RemoveEmptyEntries))
            {
                if (value.ValueKind == JsonValueKind.Array && Int32.TryParse(part, NumberStyles.Integer, CultureInfo.InvariantCulture, out int index))
                {
                    if (index < 0 || index >= value.GetArrayLength()) return false;
                    value = value[index];
                    continue;
                }
                if (!TryGet(value, part, out value)) return false;
            }
            return true;
        }

        /// <summary>
        /// String property or null. Non-string scalars are rendered as raw text.
        /// </summary>
        /// <param name="element">Element.</param>
        /// <param name="name">Property name.</param>
        /// <returns>Value or null.</returns>
        public static string? Str(JsonElement element, string name)
        {
            if (!TryGet(element, name, out JsonElement value)) return null;
            return AsText(value);
        }

        /// <summary>
        /// A tool result's own output as text, unwrapping the MCP content blocks harnesses report it in. A string is
        /// returned as it is. An array of content blocks (<c>[{"type":"text","text":"..."}]</c>), or an object holding
        /// one in <c>content</c> (an MCP call result), gives the text of its text blocks joined by new lines, with
        /// <c>[type]</c> for blocks that carry no text (an image, for example). Anything else is returned as raw JSON.
        /// Without this a tool that answers JSON would be recorded as JSON inside a string inside a JSON array.
        /// </summary>
        /// <param name="element">Element holding the property.</param>
        /// <param name="name">Property name.</param>
        /// <returns>Text, or null when the property is missing.</returns>
        public static string? ContentText(JsonElement element, string name)
        {
            if (!TryGet(element, name, out JsonElement value)) return null;
            return ContentText(value);
        }

        /// <summary>
        /// A tool result's own output as text; see <see cref="ContentText(JsonElement, string)"/>.
        /// </summary>
        /// <param name="value">Value.</param>
        /// <returns>Text.</returns>
        public static string ContentText(JsonElement value)
        {
            if (value.ValueKind == JsonValueKind.String) return value.GetString() ?? String.Empty;
            JsonElement blocks = value;
            if (value.ValueKind == JsonValueKind.Object && TryGet(value, "content", out JsonElement content)) blocks = content;
            if (blocks.ValueKind != JsonValueKind.Array) return value.GetRawText();
            List<string> parts = new List<string>();
            foreach (JsonElement block in blocks.EnumerateArray())
            {
                if (block.ValueKind == JsonValueKind.String)
                {
                    parts.Add(block.GetString() ?? String.Empty);
                    continue;
                }
                if (block.ValueKind != JsonValueKind.Object) return value.GetRawText();
                string? text = Str(block, "text");
                if (text != null)
                {
                    parts.Add(text);
                    continue;
                }
                string? type = Str(block, "type");
                if (type == null) return value.GetRawText();
                parts.Add("[" + type + "]");
            }
            return String.Join("\n", parts);
        }

        /// <summary>
        /// Render an element as text: strings unquoted, other values as raw JSON.
        /// </summary>
        /// <param name="value">Value.</param>
        /// <returns>Text.</returns>
        public static string AsText(JsonElement value)
        {
            if (value.ValueKind == JsonValueKind.String) return value.GetString() ?? String.Empty;
            return value.GetRawText();
        }

        /// <summary>
        /// Long property or null.
        /// </summary>
        /// <param name="element">Element.</param>
        /// <param name="name">Property name.</param>
        /// <returns>Value or null.</returns>
        public static long? Long(JsonElement element, string name)
        {
            if (!TryGet(element, name, out JsonElement value)) return null;
            if (value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out long l)) return l;
            if (value.ValueKind == JsonValueKind.Number) return (long)value.GetDouble();
            if (value.ValueKind == JsonValueKind.String && Int64.TryParse(value.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out long parsed)) return parsed;
            return null;
        }

        /// <summary>
        /// Double property or null.
        /// </summary>
        /// <param name="element">Element.</param>
        /// <param name="name">Property name.</param>
        /// <returns>Value or null.</returns>
        public static double? Double(JsonElement element, string name)
        {
            if (!TryGet(element, name, out JsonElement value)) return null;
            if (value.ValueKind == JsonValueKind.Number) return value.GetDouble();
            if (value.ValueKind == JsonValueKind.String && System.Double.TryParse(value.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out double parsed)) return parsed;
            return null;
        }

        /// <summary>
        /// Boolean property or null.
        /// </summary>
        /// <param name="element">Element.</param>
        /// <param name="name">Property name.</param>
        /// <returns>Value or null.</returns>
        public static bool? Bool(JsonElement element, string name)
        {
            if (!TryGet(element, name, out JsonElement value)) return null;
            if (value.ValueKind == JsonValueKind.True) return true;
            if (value.ValueKind == JsonValueKind.False) return false;
            return null;
        }
    }
}
