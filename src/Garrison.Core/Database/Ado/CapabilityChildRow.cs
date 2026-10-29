namespace Garrison.Core.Database.Ado
{
    using System;

    /// <summary>
    /// One tag or requirement row of a capability descriptor, read in bulk before it is attached to its descriptor.
    /// </summary>
    internal class CapabilityChildRow
    {
        /// <summary>
        /// Owning descriptor identifier.
        /// </summary>
        public string CapabilityId { get; set; } = String.Empty;

        /// <summary>
        /// Tag, or requirement label key.
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Requirement label value; empty for tags.
        /// </summary>
        public string Value { get; set; } = String.Empty;
    }
}
