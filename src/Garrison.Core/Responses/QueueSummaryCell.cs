namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Grouped active run count (internal aggregation row).
    /// </summary>
    public class QueueSummaryCell
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
        /// Status.
        /// </summary>
        public string Status { get; set; } = String.Empty;

        /// <summary>
        /// Count.
        /// </summary>
        public long Count { get; set; } = 0;
    }
}
