namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>Point-in-time placement eligibility for one node, without reserving or leasing work.</summary>
    public class NodePlacementResponse
    {
        /// <summary>Node identifier.</summary>
        public string NodeId { get; set; } = String.Empty;
        /// <summary>True when this node has no observed rejection reason.</summary>
        public bool Eligible { get; set; }
        /// <summary>Stable rejection codes. No other tenant's runs, credentials, labels or quota values are exposed.</summary>
        public List<string> Reasons { get; set; } = new List<string>();
    }
}
