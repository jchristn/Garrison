namespace Garrison.Worker.Settings
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;

    /// <summary>
    /// How to probe one harness type at startup (no tokens spent).
    /// </summary>
    public class HarnessProbeSettings
    {
        /// <summary>
        /// Harness type reported when the probe succeeds.
        /// </summary>
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Executable, for example claude.
        /// </summary>
        public string Executable { get; set; } = String.Empty;

        /// <summary>
        /// Arguments, for example --version.
        /// </summary>
        public List<string> Arguments { get; set; } = new List<string> { "--version" };

        /// <summary>
        /// Short label added to node labels as garrison.io/harness-&lt;label&gt;=true when available.
        /// </summary>
        public string Label { get; set; } = String.Empty;
    }
}
