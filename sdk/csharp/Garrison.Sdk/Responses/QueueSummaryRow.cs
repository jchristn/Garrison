namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Active run counts for one agent and harness.
    /// </summary>
    public class QueueSummaryRow
    {
        /// <summary>
        /// Agent name.
        /// </summary>
        public string AgentName { get; set; } = String.Empty;

        /// <summary>
        /// Harness type.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Queued runs.
        /// </summary>
        public long Queued { get; set; } = 0;

        /// <summary>
        /// Leased runs.
        /// </summary>
        public long Leased { get; set; } = 0;

        /// <summary>
        /// Running runs.
        /// </summary>
        public long Running { get; set; } = 0;
    }
}
