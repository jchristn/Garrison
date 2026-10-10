namespace Garrison.Sdk
{
    using System;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Raised when the Garrison API returns a non-success status.
    /// </summary>
    public class GarrisonException : Exception
    {
        #region Public-Members

        /// <summary>
        /// HTTP status code.
        /// </summary>
        public int StatusCode { get; }

        /// <summary>
        /// Parsed error body, when the server returned one.
        /// </summary>
        public ErrorResponse? Error { get; }

        /// <summary>
        /// Raw response body.
        /// </summary>
        public string? ResponseBody { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="statusCode">HTTP status code.</param>
        /// <param name="error">Parsed error, or null.</param>
        /// <param name="responseBody">Raw body.</param>
        public GarrisonException(int statusCode, ErrorResponse? error, string? responseBody)
            : base("Garrison API returned " + statusCode + (error != null ? " " + error.Code + ": " + error.Message : (String.IsNullOrEmpty(responseBody) ? String.Empty : ": " + responseBody)))
        {
            StatusCode = statusCode;
            Error = error;
            ResponseBody = responseBody;
        }

        #endregion
    }
}
