namespace Garrison.Core.Enums
{
    /// <summary>
    /// Authentication scheme used for a request or session.
    /// </summary>
    public enum AuthSchemeEnum
    {
        /// <summary>
        /// BearerToken.
        /// </summary>
        BearerToken,

        /// <summary>
        /// XToken.
        /// </summary>
        XToken,

        /// <summary>
        /// PasswordHeaders.
        /// </summary>
        PasswordHeaders,

        /// <summary>
        /// AccessKeySecret.
        /// </summary>
        AccessKeySecret,

        /// <summary>
        /// AccessKeySignature.
        /// </summary>
        AccessKeySignature,

        /// <summary>
        /// AdminApiKey.
        /// </summary>
        AdminApiKey,

        /// <summary>
        /// RunToken.
        /// </summary>
        RunToken
    }
}
