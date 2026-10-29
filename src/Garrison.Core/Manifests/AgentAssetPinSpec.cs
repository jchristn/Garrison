namespace Garrison.Core.Manifests
{
    using System;

    /// <summary>
    /// An asset pin in an Agent manifest document (AD2.6).
    /// </summary>
    public class AgentAssetPinSpec
    {
        /// <summary>
        /// Asset name.
        /// </summary>
        public string Asset { get; set; } = String.Empty;

        /// <summary>
        /// Pinned version, or null for the asset's current version.
        /// </summary>
        public int? Version { get; set; } = null;
    }
}
