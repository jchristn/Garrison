namespace Garrison.Core.Memory
{
    /// <summary>Memory operation result. Text is returned only for reads and is never a metric label.</summary>
    public class AgentMemoryResult
    {
        /// <summary>Requested memory key.</summary>
        public string Key { get; set; } = System.String.Empty;
        /// <summary>Stored text, or null when absent or after mutation.</summary>
        public string? Value { get; set; } = null;
        /// <summary>Whether the read found a value or the mutation completed.</summary>
        public bool Found { get; set; } = false;
    }
}
