namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;

    /// <summary>Worker collection instructions. Empty globs disable collection; store credentials remain server-side.</summary>
    public class ExecutionArtifacts
    {
        /// <summary>Garrison REST base URL reachable by the worker or run pod.</summary>
        public string ApiBaseUrl { get; set; } = String.Empty;
        /// <summary>Preferred MCP upload endpoint, reachable under run-pod network policy. Null uses REST.</summary>
        public string? McpUrl { get; set; } = null;
        /// <summary>Current run/epoch bearer token; redacted in previews.</summary>
        public string BearerToken { get; set; } = String.Empty;
        /// <summary>Configured tenant artifact store.</summary>
        public string StoreId { get; set; } = String.Empty;
        /// <summary>Explicit workspace-relative globs.</summary>
        public List<string> Globs { get; set; } = new List<string>();
        /// <summary>Maximum bytes per collected file. Default 16 MiB; range 1024 to 256 MiB.</summary>
        public int MaxFileBytes { get { return _MaxFileBytes; } set { _MaxFileBytes = Math.Clamp(value, 1024, 256 * 1024 * 1024); } }
        /// <summary>Maximum aggregate bytes collected per execution. Default 64 MiB; range 1024 to 1 GiB.</summary>
        public long MaxTotalBytes { get { return _MaxTotalBytes; } set { _MaxTotalBytes = Math.Clamp(value, 1024, 1024L * 1024 * 1024); } }
        /// <summary>Maximum selected files. Default 100; range 1 to 10000.</summary>
        public int MaxFiles { get { return _MaxFiles; } set { _MaxFiles = Math.Clamp(value, 1, 10000); } }
        /// <summary>Maximum filesystem entries inspected. Default 100000; range 1 to 1000000.</summary>
        public int MaxScanEntries { get { return _MaxScanEntries; } set { _MaxScanEntries = Math.Clamp(value, 1, 1000000); } }
        /// <summary>Aggregate collection/upload timeout. Default 30 seconds; range 1 to 300.</summary>
        public int TimeoutSeconds { get { return _TimeoutSeconds; } set { _TimeoutSeconds = Math.Clamp(value, 1, 300); } }

        private int _MaxFileBytes = 16 * 1024 * 1024;
        private long _MaxTotalBytes = 64L * 1024 * 1024;
        private int _MaxFiles = 100;
        private int _MaxScanEntries = 100000;
        private int _TimeoutSeconds = 30;
    }
}
