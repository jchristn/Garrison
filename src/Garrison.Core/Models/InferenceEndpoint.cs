namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>Typed inference configuration; credential values remain in tenant secrets. Mutable and not thread-safe.</summary>
    public class InferenceEndpoint
    {
        /// <summary>HTTP protocol. Default OpenAiCompatible; Ollama uses the native /api/chat protocol.</summary>
        public InferenceProtocolEnum Protocol { get; set; } = InferenceProtocolEnum.OpenAiCompatible;

        /// <summary>Provider base URL without credentials, query, or fragment. Required.</summary>
        public string BaseUrl { get; set; } = String.Empty;

        /// <summary>Explicit authentication scheme. Default None; Ollama Cloud uses BearerToken.</summary>
        public InferenceAuthenticationTypeEnum AuthenticationType { get; set; } = InferenceAuthenticationTypeEnum.None;

        /// <summary>Secret-backed credentials. None takes zero; BearerToken and ApiKey take one; Headers/QueryString take named entries; Basic takes username and password.</summary>
        public List<InferenceCredential> Credentials { get { return _Credentials; } set { _Credentials = value ?? new List<InferenceCredential>(); } }

        private List<InferenceCredential> _Credentials = new List<InferenceCredential>();
    }
}
