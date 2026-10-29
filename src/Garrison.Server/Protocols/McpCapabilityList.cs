namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>Result of garrison_list_capabilities (AD4.6).</summary>
    public class McpCapabilityList
    {
        /// <summary>Descriptors the caller may use, ordered by kind and name.</summary>
        public List<CapabilityDescriptor> Capabilities { get; set; } = new List<CapabilityDescriptor>();

        /// <summary>Number of descriptors returned.</summary>
        public int TotalRecords { get; set; } = 0;
    }
}
