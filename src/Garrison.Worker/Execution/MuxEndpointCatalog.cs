namespace Garrison.Worker.Execution
{
    using System.Collections.Generic;

    /// <summary>Worker-local Mux endpoints.json envelope.</summary>
    public class MuxEndpointCatalog
    {
        /// <summary>Configured endpoints. Only the selected endpoint is copied into a run.</summary>
        public List<MuxEndpointDefinition> Endpoints { get; set; } = new List<MuxEndpointDefinition>();
    }
}
