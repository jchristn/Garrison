namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A tool probe with the harness profile that declares it (AD4.4), as listed across every profile for the worker
    /// protocol and for deriving HarnessBuiltIn capabilities.
    /// </summary>
    public class HarnessToolProbeSource
    {
        /// <summary>
        /// Declaring harness profile identifier.
        /// </summary>
        public string HarnessProfileId { get; set; } = String.Empty;

        /// <summary>
        /// Tenant of the profile, or null for a built-in profile.
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Harness type of the profile.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Whether the profile is active.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// When the profile was created (UTC); earlier profiles win when two define the same tool name differently.
        /// </summary>
        public DateTime ProfileCreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// The probe.
        /// </summary>
        public HarnessToolProbe Probe { get; set; } = new HarnessToolProbe();
    }
}
