namespace Garrison.ProviderHarness
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>One compiled header/query/basic credential reference. No plaintext values.</summary>
    public class ProviderAuthenticationBinding
    {
        /// <summary>Header/query name, or username/password for Basic.</summary>
        public string Name { get; set; } = String.Empty;
        /// <summary>API-key placement; ignored when the scheme fixes its placement.</summary>
        public InferenceCredentialLocationEnum Location { get; set; } = InferenceCredentialLocationEnum.Header;
        /// <summary>Worker environment variable holding the resolved credential value.</summary>
        public string ValueVariable { get; set; } = String.Empty;
    }
}
