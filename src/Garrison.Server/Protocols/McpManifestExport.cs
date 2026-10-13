namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>Declarative configuration export, with secret metadata only.</summary>
    public class McpManifestExport
    {
        /// <summary>Exported YAML manifest text.</summary>
        public string Manifest { get; set; } = String.Empty;
        /// <summary>Media type. Default application/yaml.</summary>
        public string MediaType { get; set; } = "application/yaml";
    }
}
