namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One architect prompt in the catalog (AD7.12): a built-in architect System template, a tenant clone of one, or another
    /// tenant System template.
    /// </summary>
    public class ArchitectPromptEntry
    {
        /// <summary>
        /// Template identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Template name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Whether the template is a protected built-in (edit by cloning).
        /// </summary>
        public bool IsBuiltIn { get; set; } = false;

        /// <summary>
        /// Built-in key the template is or was cloned from, or null for a custom template.
        /// </summary>
        public string? BuiltInKey { get; set; } = null;

        /// <summary>
        /// Current version.
        /// </summary>
        public int CurrentVersion { get; set; } = 1;

        /// <summary>
        /// Whether this is the default architect prompt.
        /// </summary>
        public bool IsDefault { get; set; } = false;

        /// <summary>
        /// Identifiers of the architect deployments that bind this template as their System prompt.
        /// </summary>
        public List<string> Deployments { get; set; } = new List<string>();
    }
}
