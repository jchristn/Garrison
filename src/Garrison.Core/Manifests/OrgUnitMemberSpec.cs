namespace Garrison.Core.Manifests
{
    /// <summary>
    /// A unit member in an Organization manifest (AA7.9).
    /// </summary>
    public class OrgUnitMemberSpec
    {
        /// <summary>
        /// Agent name.
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// Title, or null.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// Mandate name, or null. It must be a mandate of the member agent.
        /// </summary>
        public string? Mandate { get; set; } = null;
    }
}
