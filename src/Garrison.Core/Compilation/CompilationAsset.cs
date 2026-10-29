namespace Garrison.Core.Compilation
{
    using Garrison.Core.Models;

    /// <summary>
    /// An asset version a compilation places into the run's workspace (AD2.4).
    /// </summary>
    public class CompilationAsset
    {
        /// <summary>
        /// Asset.
        /// </summary>
        public AgentAsset Asset { get; set; } = new AgentAsset();

        /// <summary>
        /// Version with its files.
        /// </summary>
        public AgentAssetVersion Version { get; set; } = new AgentAssetVersion();
    }
}
