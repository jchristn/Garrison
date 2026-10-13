namespace Garrison.ProviderHarness
{
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>Read a typed boolean from a JSON boolean or an escaped deployment parameter string.</summary>
    public class ProviderBooleanConverter : JsonConverter<bool>
    {
        /// <inheritdoc />
        public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.True) return true;
            if (reader.TokenType == JsonTokenType.False) return false;
            if (reader.TokenType == JsonTokenType.String && Boolean.TryParse(reader.GetString(), out bool value)) return value;
            throw new JsonException("Use true or false for a provider boolean setting.");
        }
        /// <inheritdoc />
        public override void Write(Utf8JsonWriter writer, bool value, JsonSerializerOptions options) { writer.WriteBooleanValue(value); }
    }
}
