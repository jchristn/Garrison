namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Optional body of a manual trigger fire (P12.5); the payload reaches the input template as webhook.body.
    /// </summary>
    public class TriggerFireRequest
    {
        #region Public-Members

        /// <summary>
        /// Payload text, or null.
        /// </summary>
        public string? Body { get; set; } = null;

        /// <summary>
        /// Payload media type, or null.
        /// </summary>
        public string? ContentType { get; set; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public TriggerFireRequest()
        {
        }

        #endregion
    }
}
