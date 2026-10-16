namespace Garrison.Core.Helpers
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text.Json;

    /// <summary>Canonical, nonreversible identity of complete unmanaged permission input; previews are never grant keys.</summary>
    public static class ApprovalInputDigest
    {
        /// <summary>Hash complete JSON with sorted object keys and preserved array/string values.</summary>
        /// <param name="json">Full permission input.</param><returns>Lowercase SHA-256.</returns>
        public static string Compute(string json)
        {
            using (JsonDocument document = JsonDocument.Parse(json))
            using (MemoryStream bytes = new MemoryStream())
            {
                using (Utf8JsonWriter writer = new Utf8JsonWriter(bytes)) Write(writer, document.RootElement);
                return Convert.ToHexString(SHA256.HashData(bytes.ToArray())).ToLowerInvariant();
            }
        }

        private static void Write(Utf8JsonWriter writer, JsonElement value)
        {
            switch (value.ValueKind)
            {
                case JsonValueKind.Object:
                    writer.WriteStartObject();
                    foreach (JsonProperty property in value.EnumerateObject().OrderBy(property => property.Name, StringComparer.Ordinal))
                    {
                        writer.WritePropertyName(property.Name);
                        Write(writer, property.Value);
                    }
                    writer.WriteEndObject();
                    break;
                case JsonValueKind.Array:
                    writer.WriteStartArray();
                    foreach (JsonElement item in value.EnumerateArray()) Write(writer, item);
                    writer.WriteEndArray();
                    break;
                default:
                    value.WriteTo(writer);
                    break;
            }
        }
    }
}
