namespace Garrison.Server.Settings
{
    using System;

    /// <summary>
    /// Capability catalog settings (AD4): how often derived descriptors are refreshed and how cost and latency hints are
    /// computed.
    /// </summary>
    public class CapabilitySettings
    {
        #region Public-Members

        /// <summary>
        /// How often the leader's maintenance loop refreshes the catalog (agents, harness built-ins, hints), in seconds.
        /// Default 300; minimum 30; maximum 86400. Environment: GARRISON_CAPABILITIES_SWEEP_SECONDS.
        /// </summary>
        public int SweepSeconds
        {
            get
            {
                return _SweepSeconds;
            }
            set
            {
                _SweepSeconds = Math.Clamp(value, 30, 86400);
            }
        }

        /// <summary>
        /// How long an HTTP MCP server's tool list is cached before the sweep lists it again, in seconds. Stdio servers are
        /// listed only when someone asks (POST .../capabilities/refresh), because listing runs their command on a worker
        /// host. Default 3600; minimum 60; maximum 604800. Environment: GARRISON_CAPABILITIES_MCP_REFRESH_SECONDS.
        /// </summary>
        public int McpRefreshSeconds
        {
            get
            {
                return _McpRefreshSeconds;
            }
            set
            {
                _McpRefreshSeconds = Math.Clamp(value, 60, 604800);
            }
        }

        /// <summary>
        /// Timeout for listing one MCP server's tools, in milliseconds. Default 15000; minimum 1000; maximum 120000.
        /// Environment: GARRISON_CAPABILITIES_MCP_TIMEOUT_MS.
        /// </summary>
        public int McpTimeoutMs
        {
            get
            {
                return _McpTimeoutMs;
            }
            set
            {
                _McpTimeoutMs = Math.Clamp(value, 1000, 120000);
            }
        }

        /// <summary>
        /// Days of finished runs the cost and latency hints summarize. Default 14; minimum 1; maximum 365. Environment:
        /// GARRISON_CAPABILITIES_HINT_WINDOW_DAYS.
        /// </summary>
        public int HintWindowDays
        {
            get
            {
                return _HintWindowDays;
            }
            set
            {
                _HintWindowDays = Math.Clamp(value, 1, 365);
            }
        }

        /// <summary>
        /// Fewest finished runs in the window for hints to be reported; below it the hints are Unknown. Default 5;
        /// minimum 1; maximum 1000. Environment: GARRISON_CAPABILITIES_HINT_MINIMUM_SAMPLES.
        /// </summary>
        public int HintMinimumSamples
        {
            get
            {
                return _HintMinimumSamples;
            }
            set
            {
                _HintMinimumSamples = Math.Clamp(value, 1, 1000);
            }
        }

        /// <summary>
        /// Most recent finished runs read per agent when computing hints. Default 1000; minimum 10; maximum 100000.
        /// Environment: GARRISON_CAPABILITIES_HINT_MAX_SAMPLES.
        /// </summary>
        public int HintMaxSamples
        {
            get
            {
                return _HintMaxSamples;
            }
            set
            {
                _HintMaxSamples = Math.Clamp(value, 10, 100000);
            }
        }

        #endregion

        #region Private-Members

        private int _SweepSeconds = 300;
        private int _McpRefreshSeconds = 3600;
        private int _McpTimeoutMs = 15000;
        private int _HintWindowDays = 14;
        private int _HintMinimumSamples = 5;
        private int _HintMaxSamples = 1000;

        #endregion
    }
}
