namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>Result of runtime or Studio design capability discovery.</summary>
    public class McpCapabilityList
    {
        /// <summary>Descriptors the caller may discover, ordered by kind and name. Studio discovery does not grant execution rights.</summary>
        public List<CapabilityDescriptor> Capabilities { get; set; } = new List<CapabilityDescriptor>();

        /// <summary>Number of descriptors returned.</summary>
        public int TotalRecords { get; set; } = 0;
    }
}
