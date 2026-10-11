namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Error body Garrison returns for every failed request (REST_API.md, Errors).
    /// </summary>
    public class ApiError
    {
        /// <summary>
        /// Broad category, for example NotFound or Conflict.
        /// </summary>
        public string? Error { get; set; }

        /// <summary>
        /// Stable machine code, for example NoActiveDeployment.
        /// </summary>
        public string? Code { get; set; }

        /// <summary>
        /// Message for people.
        /// </summary>
        public string? Message { get; set; }

        /// <summary>
        /// Stable machine code per field for validation failures, keyed by field path.
        /// </summary>
        public Dictionary<string, string>? FieldCodes { get; set; }

        /// <summary>
        /// Request identifier recorded in the server log.
        /// </summary>
        public string? RequestId { get; set; }
    }
}
