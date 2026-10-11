namespace Garrison.Benchmark.Runners
{
    using System;

    /// <summary>
    /// A provisioned workspace: the tenant that holds one corpus.
    /// </summary>
    public class Workspace
    {
        /// <summary>
        /// Tenant name: bench-&lt;dataset&gt;-&lt;corpus&gt;-&lt;hash of the corpus items&gt;[-&lt;suffix&gt;].
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// True when the tenant already existed and was reused.
        /// </summary>
        public bool Reused { get; set; }
    }
}
