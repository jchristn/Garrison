namespace Garrison.Core.Serialization
{
    using System;
    using System.Text.Json;

    /// <summary>
    /// Conversions between JSON kept as text (a database column, a raw harness line) and the JSON value an API response
    /// carries in its place, so responses hold real JSON objects instead of JSON serialized into strings. The values are
    /// documents Garrison does not define (a JSON Schema, a caller's structured output, a harness event, tool arguments),
    /// so they are passed through, never navigated. Thread-safe.
    /// </summary>
    public static class JsonText
    {
        #region Public-Methods

        /// <summary>
        /// The JSON value stored as text, or null when the text is empty or is not valid JSON (for example a truncated
        /// line).
        /// </summary>
        /// <param name="text">JSON text, or null.</param>
        /// <returns>A detached JSON value, or null.</returns>
        public static JsonElement? Value(string? text)
        {
            if (String.IsNullOrWhiteSpace(text)) return null;
            try
            {
                using (JsonDocument document = JsonDocument.Parse(text))
                {
                    return document.RootElement.Clone();
                }
            }
            catch (JsonException)
            {
                return null;
            }
        }

        /// <summary>
        /// The JSON object or array stored as text, or null for anything else: empty text, invalid JSON, or a lone
        /// string, number, or boolean (which reads better as the text itself).
        /// </summary>
        /// <param name="text">Text that may hold a JSON object or array.</param>
        /// <returns>A detached JSON object or array, or null.</returns>
        public static JsonElement? Structured(string? text)
        {
            if (String.IsNullOrWhiteSpace(text)) return null;
            string trimmed = text.TrimStart();
            if (trimmed.Length == 0 || (trimmed[0] != '{' && trimmed[0] != '[')) return null;
            JsonElement? value = Value(text);
            if (!value.HasValue) return null;
            return value.Value.ValueKind == JsonValueKind.Object || value.Value.ValueKind == JsonValueKind.Array ? value : null;
        }

        /// <summary>
        /// A field value for a response: the JSON object or array the text holds (a JSON Schema, for example), or else
        /// the text itself as a JSON string. Null for null text.
        /// </summary>
        /// <param name="text">Field value as text, or null.</param>
        /// <returns>A JSON object, array, or string, or null.</returns>
        public static JsonElement? ValueOrString(string? text)
        {
            if (text == null) return null;
            JsonElement? structured = Structured(text);
            if (structured.HasValue) return structured;
            return JsonSerializer.SerializeToElement(text);
        }

        /// <summary>
        /// The text to store for a JSON value received in a request: null for a missing or JSON null value, the string
        /// itself for a JSON string (a client that sends a schema as a string still works), and the raw JSON otherwise.
        /// </summary>
        /// <param name="value">JSON value, or null.</param>
        /// <returns>Text to store, or null.</returns>
        public static string? Text(JsonElement? value)
        {
            if (!value.HasValue) return null;
            JsonElement element = value.Value;
            if (element.ValueKind == JsonValueKind.Undefined || element.ValueKind == JsonValueKind.Null) return null;
            if (element.ValueKind == JsonValueKind.String) return element.GetString();
            return element.GetRawText();
        }

        #endregion
    }
}
