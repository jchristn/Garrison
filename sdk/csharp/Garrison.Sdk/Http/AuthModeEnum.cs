namespace Garrison.Sdk.Http
{
    /// <summary>
    /// How the SDK authenticates requests.
    /// </summary>
    public enum AuthModeEnum
    {
        /// <summary>
        /// No authentication (health only).
        /// </summary>
        None,

        /// <summary>
        /// Bearer session token.
        /// </summary>
        Token,

        /// <summary>
        /// Access key and secret key headers on every request.
        /// </summary>
        AccessKeySecret,

        /// <summary>
        /// AWS-style HMAC signed requests; the secret never crosses the wire.
        /// </summary>
        SignedRequest,

        /// <summary>
        /// System administrator API key (x-api-key).
        /// </summary>
        AdminApiKey
    }
}
