namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Capabilities declared in <c>initialize</c> (<c>InitializeCapabilities</c>). Garrison opts out of experimental methods and attestation.
    /// </summary>
    public class CodexInitializeCapabilities
    {
        #region Public-Members

        /// <summary>
        /// Whether to receive experimental methods and fields. Default false.
        /// </summary>
        [JsonPropertyName("experimentalApi")]
        public bool ExperimentalApi { get; set; } = false;

        /// <summary>
        /// Whether to receive <c>attestation/generate</c> requests. Default false.
        /// </summary>
        [JsonPropertyName("requestAttestation")]
        public bool RequestAttestation { get; set; } = false;

        #endregion
    }
}
