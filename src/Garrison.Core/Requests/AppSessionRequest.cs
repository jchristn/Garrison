namespace Garrison.Core.Requests
{
    /// <summary>
    /// Body of POST /v1.0/apps/{slug}/session (AD6.5): a tenant user's email and password, or nothing for an anonymous
    /// session (only when the app allows it), or nothing with a management bearer token in the Authorization header.
    /// </summary>
    public class AppSessionRequest
    {
        /// <summary>
        /// Email of a user of the app's tenant, or null.
        /// </summary>
        public string? Email { get; set; } = null;

        /// <summary>
        /// Password, or null.
        /// </summary>
        public string? Password { get; set; } = null;
    }
}
