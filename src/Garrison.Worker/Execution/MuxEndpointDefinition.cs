namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>A named worker-local Mux endpoint. Additional Mux settings round-trip without reinterpretation.</summary>
    public class MuxEndpointDefinition
    {
        /// <summary>Endpoint name selected by Mux's --endpoint argument.</summary>
        public string Name { get; set; } = String.Empty;
        /// <summary>Optional endpoint credential, retained only on the executing worker.</summary>
        public string? ApiKey { get; set; }
        /// <summary>Optional endpoint headers, retained only on the executing worker.</summary>
        public Dictionary<string, string>? Headers { get; set; }
        /// <summary>Other Mux-owned endpoint settings, preserved for the installed Mux version.</summary>
        [JsonExtensionData]
        public Dictionary<string, JsonElement> Settings { get; set; } = new Dictionary<string, JsonElement>();
    }
}
