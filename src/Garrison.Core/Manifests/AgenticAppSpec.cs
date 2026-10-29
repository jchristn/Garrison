namespace Garrison.Core.Manifests
{
    using System.Collections.Generic;

    /// <summary>
    /// Spec of an AgenticApp manifest document (AD6.11): members and the entry agent by name, edges as from and to
    /// agent names, entry deployments per environment, branding, and how end users sign in.
    /// </summary>
    public class AgenticAppSpec
    {
        /// <summary>
        /// Description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// URL slug, or null for the app name.
        /// </summary>
        public string? Slug { get; set; } = null;

        /// <summary>
        /// Entry agent name. Required.
        /// </summary>
        public string? Entry { get; set; } = null;

        /// <summary>
        /// Members. The entry agent is added when missing.
        /// </summary>
        public List<AppMemberSpec> Members { get; set; } = new List<AppMemberSpec>();

        /// <summary>
        /// Calls members may make to each other.
        /// </summary>
        public List<AppEdgeSpec> Edges { get; set; } = new List<AppEdgeSpec>();

        /// <summary>
        /// Entry deployments per environment.
        /// </summary>
        public List<AppEnvironmentSpec> Environments { get; set; } = new List<AppEnvironmentSpec>();

        /// <summary>
        /// Environment the app UI uses, or null for dev.
        /// </summary>
        public string? LiveEnvironment { get; set; } = null;

        /// <summary>
        /// TenantUsers, AppUsers, or Anonymous, or null for AppUsers.
        /// </summary>
        public string? AuthMode { get; set; } = null;

        /// <summary>
        /// Whether anonymous sessions are allowed (with authMode Anonymous). Default false.
        /// </summary>
        public bool? AnonymousEnabled { get; set; } = null;

        /// <summary>
        /// Whether the UI shows operator detail. Default false.
        /// </summary>
        public bool? ShowOperatorDetail { get; set; } = null;

        /// <summary>
        /// Branding, or null.
        /// </summary>
        public AppBrandingSpec? Branding { get; set; } = null;

        /// <summary>
        /// Whether the app accepts sessions. Default true.
        /// </summary>
        public bool? Active { get; set; } = null;
    }
}
