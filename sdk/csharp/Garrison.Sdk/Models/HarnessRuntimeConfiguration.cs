namespace Garrison.Sdk.Models
{
    /// <summary>Reusable runtime settings owned by a tenant harness profile. Mutable; not thread-safe. Null fields use the harness defaults.</summary>
    public class HarnessRuntimeConfiguration
    {
        /// <summary>Model selected for this connection; required for ProviderApi.</summary>
        public string? Model { get; set; } = null;
        /// <summary>Worker-configured Mux endpoint name, without a URL.</summary>
        public string? EndpointName { get; set; } = null;
        /// <summary>Optional CLI credential secret, scoped to the profile tenant.</summary>
        public string? CredentialSecretId { get; set; } = null;
        /// <summary>HTTP inference protocol, URL, authentication and encrypted secret references.</summary>
        public InferenceEndpoint? InferenceEndpoint { get; set; } = null;
    }
}
