namespace Garrison.Server.Services
{
    using System;

    /// <summary>
    /// Definition of a cluster runtime setting stored in the database.
    /// </summary>
    public class ClusterSettingDefinition
    {
        /// <summary>
        /// Dotted key, for example Scheduling.LeaseDurationMs.
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Value type: int or bool.
        /// </summary>
        public string Type { get; set; } = "int";

        /// <summary>
        /// Default value as text.
        /// </summary>
        public string DefaultValue { get; set; } = String.Empty;

        /// <summary>
        /// Minimum for integers.
        /// </summary>
        public long Minimum { get; set; } = 0;

        /// <summary>
        /// Maximum for integers.
        /// </summary>
        public long Maximum { get; set; } = Int32.MaxValue;

        /// <summary>
        /// Description.
        /// </summary>
        public string Description { get; set; } = String.Empty;
    }
}
