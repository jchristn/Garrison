namespace Garrison.Core.Manifests
{
    /// <summary>
    /// One signal of a Mandate manifest revision (AA1.12).
    /// </summary>
    public class MandateSignalSpec
    {
        /// <summary>
        /// Signal name. Required, unique within the revision.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// How to observe it.
        /// </summary>
        public string? Description { get; set; } = null;
    }
}
