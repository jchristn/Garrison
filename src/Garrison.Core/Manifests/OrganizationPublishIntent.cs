namespace Garrison.Core.Manifests
{
    using Garrison.Core.Enums;

    /// <summary>
    /// Who publishes an organization's tree when a manifest applies it (AA7.9). Not thread-safe.
    /// </summary>
    public class OrganizationPublishIntent
    {
        /// <summary>
        /// Principal type of the person or credential applying the manifest.
        /// </summary>
        public PrincipalTypeEnum ActorType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Identifier of that principal, or null.
        /// </summary>
        public string? ActorId { get; set; } = null;

        /// <summary>
        /// Name of that principal, or null.
        /// </summary>
        public string? ActorName { get; set; } = null;
    }
}
