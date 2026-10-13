namespace Garrison.Harnesses.Preflight
{
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>Preserves the JSON-RPC identifier's string or numeric type without a JSON DOM.</summary>
    public class McpProbeIdConverter : JsonConverter<object>
    {
        /// <inheritdoc />
        public override object? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String) return reader.GetString();
            if (reader.TokenType == JsonTokenType.Number)
            {
                if (reader.TryGetInt64(out long integer)) return integer;
                return reader.GetDecimal();
            }
            if (reader.TokenType == JsonTokenType.Null) return null;
            throw new JsonException("A JSON-RPC identifier must be a string or number.");
        }
        /// <inheritdoc />
        public override void Write(Utf8JsonWriter writer, object value, JsonSerializerOptions options)
        {
            if (value is string text) writer.WriteStringValue(text);
            else if (value is long integer) writer.WriteNumberValue(integer);
            else if (value is decimal number) writer.WriteNumberValue(number);
            else if (value == null) writer.WriteNullValue();
            else throw new JsonException("A JSON-RPC identifier must be a string or number.");
        }
    }
}
