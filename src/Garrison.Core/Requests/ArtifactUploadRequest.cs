namespace Garrison.Core.Requests
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>Bounded MCP artifact upload. The authenticated principal supplies the tenant scope.</summary>
    public class ArtifactUploadRequest
    {
        /// <summary>Producing run identifier.</summary>
        [JsonPropertyName("runId")]
        public string RunId { get; set; } = String.Empty;
        /// <summary>Compiled artifact store binding.</summary>
        [JsonPropertyName("storeId")]
        public string StoreId { get; set; } = String.Empty;
        /// <summary>Workspace-relative name selected by deployment globs.</summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = String.Empty;
        /// <summary>File media type.</summary>
        [JsonPropertyName("mediaType")]
        public string MediaType { get; set; } = "application/octet-stream";
        /// <summary>Current lease epoch.</summary>
        [JsonPropertyName("epoch")]
        public long Epoch { get; set; } = 0;
        /// <summary>Current repair phase.</summary>
        [JsonPropertyName("repairAttempt")]
        public int RepairAttempt { get; set; } = 0;
        /// <summary>Base64 file bytes, limited before decoding.</summary>
        [JsonPropertyName("contentBase64")]
        public string ContentBase64 { get; set; } = String.Empty;
    }
}
