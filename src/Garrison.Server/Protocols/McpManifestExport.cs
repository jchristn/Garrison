namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;

    /// <summary>Manifest bundle export (P12.21): YAML text and the secrets the target tenant needs.</summary>
    public class McpManifestExport
    {
        /// <summary>Exported YAML bundle text.</summary>
        public string Manifest { get; set; } = String.Empty;

        /// <summary>Media type. Default application/yaml.</summary>
        public string MediaType { get; set; } = "application/yaml";

        /// <summary>Suggested file name.</summary>
        public string FileName { get; set; } = String.Empty;

        /// <summary>Names of the secrets the bundle needs; their values are never exported.</summary>
        public List<string> RequiredSecrets { get; set; } = new List<string>();
    }
}
