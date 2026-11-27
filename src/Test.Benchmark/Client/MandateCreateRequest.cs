namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// Body of POST .../mandates.
    /// </summary>
    public class MandateCreateRequest
    {
        /// <summary>
        /// Mandate name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Agent identifier or name.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Deployment identifier or name.
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Revision to publish as number 1, which makes the mandate Active with its first wake due now.
        /// </summary>
        public MandateRevisionRequest? CurrentRevision { get; set; } = null;
    }
}
