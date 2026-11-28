namespace Garrison.Sdk.Models
{
    using System.Collections.Generic;

    /// <summary>
    /// The result of validating an organization's working tree without publishing it. Not thread-safe.
    /// </summary>
    public class OrganizationValidationResult
    {
        /// <summary>
        /// True when no problem has severity Error, so a revision of the working tree would publish. Warnings do not
        /// make the tree invalid.
        /// </summary>
        public bool Valid { get; set; } = true;

        /// <summary>
        /// Problems found, errors first. Empty when the tree is complete. Never null.
        /// </summary>
        public List<OrganizationValidationProblem> Problems { get; set; } = new List<OrganizationValidationProblem>();
    }
}
