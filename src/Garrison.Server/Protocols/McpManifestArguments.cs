namespace Garrison.Server.Protocols
{
    /// <summary>Typed declarative configuration apply arguments.</summary>
    public class McpManifestArguments
    {
        /// <summary>YAML or JSON manifest text.</summary>
        public string? Manifest { get; set; } = null;
        /// <summary>Validate and report without mutation. Default false.</summary>
        public bool DryRun { get; set; } = false;
        /// <summary>Permit inline secret values only with additional Secret.Create authorization. Default false.</summary>
        public bool AllowSecretValues { get; set; } = false;
    }
}
