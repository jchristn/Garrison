namespace Garrison.Sdk.Enums
{
    /// <summary>Authentication scheme for an inference endpoint.</summary>
    public enum InferenceAuthenticationTypeEnum
    {
        /// <summary>None.</summary>
        None,

        /// <summary>BearerToken.</summary>
        BearerToken,

        /// <summary>ApiKey.</summary>
        ApiKey,

        /// <summary>Headers.</summary>
        Headers,

        /// <summary>QueryString.</summary>
        QueryString,

        /// <summary>Basic.</summary>
        Basic
    }
}
