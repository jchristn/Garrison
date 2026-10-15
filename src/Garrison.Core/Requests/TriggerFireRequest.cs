namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Optional body of a manual trigger fire (P12.5). The payload is exposed to the input template as webhook.body (and
    /// webhook.json when it is JSON), so a webhook trigger can be tried without signing a request.
    /// </summary>
    public class TriggerFireRequest
    {
        #region Public-Members

        /// <summary>
        /// Payload text, or null. At most Triggers.WebhookMaxBodyBytes bytes once encoded as UTF-8.
        /// </summary>
        public string? Body { get; set; } = null;

        /// <summary>
        /// Payload media type, for example application/json, or null.
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
