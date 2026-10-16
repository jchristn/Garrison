namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>Read-only placement diagnostics. A snapshot is advisory, never a capacity reservation.</summary>
    public class RunPlacementResponse
    {
        /// <summary>Tenant-scoped run identifier.</summary>
        public string RunId { get; set; } = String.Empty;
        /// <summary>UTC start of the diagnostic reads. Concurrent changes can alter the next claim.</summary>
        public DateTime TakenUtc { get; set; } = DateTime.UtcNow;
        /// <summary>Start-time admission rejection using the scheduler predicate, or null when accepted.</summary>
        public string? AdmissionRejection { get; set; }
        /// <summary>Global reasons that prevent the run being claimed, using stable machine-readable codes.</summary>
        public List<string> Reasons { get; set; } = new List<string>();
        /// <summary>Nodes visible to this tenant. Other tenants' dedicated pools are omitted.</summary>
        public List<NodePlacementResponse> Nodes { get; set; } = new List<NodePlacementResponse>();
        /// <summary>True when some visible node has no observed rejection reason.</summary>
        public bool Eligible { get; set; }
    }
}
