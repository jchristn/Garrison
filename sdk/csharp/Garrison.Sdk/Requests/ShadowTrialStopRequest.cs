namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Stop a running shadow trial (AA9.7). Shadow runs already started finish and are still compared.
    /// </summary>
    public class ShadowTrialStopRequest
    {
        /// <summary>
        /// Why, at most 2000 characters, or null.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
