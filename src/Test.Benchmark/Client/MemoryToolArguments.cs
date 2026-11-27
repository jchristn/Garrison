namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Arguments of the garrison_memory_* tools as a person calls them. Null members are left out.
    /// </summary>
    public class MemoryToolArguments
    {
        /// <summary>
        /// Agent identifier or name whose Agent scope is used.
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// Key.
        /// </summary>
        public string? Key { get; set; } = null;

        /// <summary>
        /// Text to write.
        /// </summary>
        public string? Value { get; set; } = null;

        /// <summary>
        /// Tags to write.
        /// </summary>
        public List<string>? Tags { get; set; } = null;

        /// <summary>
        /// Compare-and-set version: 0 means the key must not exist yet.
        /// </summary>
        public int? ExpectedVersion { get; set; } = null;

        /// <summary>
        /// Search or list query.
        /// </summary>
        public string? Query { get; set; } = null;

        /// <summary>
        /// List filter on the key prefix.
        /// </summary>
        public string? KeyPrefix { get; set; } = null;

        /// <summary>
        /// Page size for list and search, 1 to 100.
        /// </summary>
        public int? MaxResults { get; set; } = null;

        /// <summary>
        /// Entries to skip for list.
        /// </summary>
        public int? Skip { get; set; } = null;
    }
}
