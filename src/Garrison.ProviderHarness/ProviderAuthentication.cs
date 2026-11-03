namespace Garrison.ProviderHarness
{
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>Compiled authentication policy. Contains environment-variable references, never credential values.</summary>
    public class ProviderAuthentication
    {
        /// <summary>Explicit HTTP authentication scheme.</summary>
        public InferenceAuthenticationTypeEnum Type { get; set; } = InferenceAuthenticationTypeEnum.None;
        /// <summary>Named credential environment references.</summary>
        public List<ProviderAuthenticationBinding> Bindings { get; set; } = new List<ProviderAuthenticationBinding>();
    }
}
