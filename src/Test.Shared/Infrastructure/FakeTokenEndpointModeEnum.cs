namespace Test.Shared.Infrastructure
{
    /// <summary>
    /// How a <see cref="FakeTokenEndpoint"/> answers refresh requests.
    /// </summary>
    public enum FakeTokenEndpointModeEnum
    {
        /// <summary>
        /// Rotate: issue new tokens, and answer 401 refresh_token_reused when a refresh token is presented twice.
        /// </summary>
        Rotate,

        /// <summary>
        /// Always answer 401 with the nested error code refresh_token_reused.
        /// </summary>
        Reused,

        /// <summary>
        /// Always answer 400 invalid_grant.
        /// </summary>
        InvalidGrant,

        /// <summary>
        /// Always answer 503 (a failure worth retrying).
        /// </summary>
        ServerError
    }
}
