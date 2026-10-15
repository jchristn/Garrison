namespace Garrison.Server.Protocols
{
    using System;
    using System.Globalization;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Reads a JSON-RPC identifier as a whole number (long), a string, or null, and writes it back unchanged. A number
    /// that is not a whole 64-bit value, or any other JSON value, is kept as its text. Thread-safe.
    /// </summary>
    public class JsonRpcIdConverter : JsonConverter<object?>
    {
        #region Public-Methods

        /// <summary>
        /// Read an identifier.
        /// </summary>
        /// <param name="reader">Reader.</param>
        /// <param name="typeToConvert">Type requested.</param>
        /// <param name="options">Serializer options.</param>
        /// <returns>A long, a string, or null.</returns>
        public override object? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.Null:
                    return null;
                case JsonTokenType.Number:
                    if (reader.TryGetInt64(out long whole)) return whole;
                    return reader.GetDouble().ToString(CultureInfo.InvariantCulture);
                case JsonTokenType.String:
                    return reader.GetString();
                default:
                    using (JsonDocument other = JsonDocument.ParseValue(ref reader))
                    {
                        return other.RootElement.GetRawText();
                    }
            }
        }

        /// <summary>
        /// Write an identifier.
        /// </summary>
        /// <param name="writer">Writer.</param>
        /// <param name="value">Identifier.</param>
        /// <param name="options">Serializer options.</param>
        public override void Write(Utf8JsonWriter writer, object? value, JsonSerializerOptions options)
        {
            if (value == null) writer.WriteNullValue();
            else if (value is long number) writer.WriteNumberValue(number);
            else writer.WriteStringValue(value.ToString());
        }

        #endregion
    }
}
