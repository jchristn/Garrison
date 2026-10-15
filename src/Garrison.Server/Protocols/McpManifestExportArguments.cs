namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;

    /// <summary>Typed arguments of garrison_export_manifest (P12.21). Every argument is optional.</summary>
    public class McpManifestExportArguments
    {
        /// <summary>Kinds whose every record is exported. Null or empty with no resources exports everything.</summary>
        public List<string>? Kinds { get; set; } = null;

        /// <summary>Individual resources as Kind/name (for example Agent/triage).</summary>
        public List<string>? Resources { get; set; } = null;

        /// <summary>Also export what the selection depends on. Default false.</summary>
        public bool FollowReferences { get; set; } = false;

        /// <summary>Export referenced built-in prompt templates and harness profiles as documents. Default false.</summary>
        public bool IncludeBuiltIn { get; set; } = false;
    }
}
