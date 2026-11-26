namespace Garrison.Core.Database.Ado
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// A canary release step with the release it belongs to, used while loading releases (AA9.2).
    /// </summary>
    public class CanaryReleaseStepRow
    {
        /// <summary>
        /// Release identifier.
        /// </summary>
        public string ReleaseId { get; set; } = String.Empty;

        /// <summary>
        /// The step.
        /// </summary>
        public CanaryReleaseStep Step { get; set; } = new CanaryReleaseStep();
    }
}
