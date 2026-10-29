namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Body of POST .../apps/{id}/promote (AD6.4): promote an app revision's member pins from one environment to the next.
    /// </summary>
    public class AppPromotionRequest
    {
        /// <summary>
        /// Environment the revision comes from. Required.
        /// </summary>
        public string SourceEnvironment { get; set; } = String.Empty;

        /// <summary>
        /// Target environment, or null for the next one.
        /// </summary>
        public string? TargetEnvironment { get; set; } = null;

        /// <summary>
        /// App revision identifier or number, or null for the app's latest published revision.
        /// </summary>
        public string? AppRevision { get; set; } = null;

        /// <summary>
        /// Whether the target may skip environments. Default false.
        /// </summary>
        public bool AllowSkip { get; set; } = false;

        /// <summary>
        /// Note, up to 2000 characters, or null.
        /// </summary>
        public string? Note { get; set; } = null;
    }
}
