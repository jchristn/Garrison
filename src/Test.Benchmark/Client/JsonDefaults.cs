namespace Garrison.Benchmark.Client
{
    using System;
    using System.Text.Encodings.Web;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Shared JSON settings: camelCase names as in the Garrison API, case-insensitive reads, nulls omitted on write,
    /// enumerations as strings. Thread-safe: the options are created once and never changed.
    /// </summary>
    public static class JsonDefaults
    {
        /// <summary>
        /// Compact options for requests and responses.
        /// </summary>
        public static readonly JsonSerializerOptions Compact = Create(false);

        /// <summary>
        /// Indented options for reports and datasets.
        /// </summary>
        public static readonly JsonSerializerOptions Indented = Create(true);

        private static JsonSerializerOptions Create(bool indented)
        {
            JsonSerializerOptions options = new JsonSerializerOptions();
            options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.PropertyNameCaseInsensitive = true;
            options.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.WriteIndented = indented;
            options.Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
            options.Converters.Add(new JsonStringEnumConverter());
            return options;
        }
    }
}
