namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// Error body returned by every API. Code is a stable identifier the dashboard localizes.
    /// </summary>
    public class ErrorResponse
    {
        /// <summary>
        /// HTTP-level error name, for example Forbidden.
        /// </summary>
        public string Error { get; set; } = String.Empty;

        /// <summary>
        /// Stable error code, for example AuthorizationDenied.
        /// </summary>
        public string Code { get; set; } = String.Empty;

        /// <summary>
        /// Human-readable message.
        /// </summary>
        public string Message { get; set; } = String.Empty;

        /// <summary>
        /// Request identifier.
        /// </summary>
        public string? RequestId { get; set; } = null;

        /// <summary>
        /// Required permission, for authorization failures.
        /// </summary>
        public string? RequiredPermission { get; set; } = null;

        /// <summary>
        /// Resource type, for authorization failures.
        /// </summary>
        public string? ResourceType { get; set; } = null;

        /// <summary>
        /// Tenant identifier, when known.
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Field-level details for validation failures.
        /// </summary>
        public System.Collections.Generic.Dictionary<string, string>? Fields { get; set; } = null;

        /// <summary>
        /// Instantiate.
        /// </summary>
        public ErrorResponse()
        {
        }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="error">Error name.</param>
        /// <param name="code">Stable code.</param>
        /// <param name="message">Message.</param>
        public ErrorResponse(string error, string code, string message)
        {
            Error = error ?? String.Empty;
            Code = code ?? String.Empty;
            Message = message ?? String.Empty;
        }
    }
}
