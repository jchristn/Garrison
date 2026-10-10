namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// An agent seen in a run analytics range.
    /// </summary>
    public class RunAnalyticsAgentDimension
    {
        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Agent name as recorded on its most recent run in the range.
        /// </summary>
        public string Name { get; set; } = String.Empty;
    }
}
