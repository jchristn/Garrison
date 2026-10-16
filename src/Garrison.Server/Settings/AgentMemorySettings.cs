namespace Garrison.Server.Settings
{
    using System;

    /// <summary>Optional replaceable agent memory. Disabled by default; local files require a persistent shared volume for multiple replicas.</summary>
    public class AgentMemorySettings
    {
        /// <summary>Enable built-in memory tools and supply them to hosted Process harnesses. Default false.</summary>
        public bool Enabled { get; set; } = false;
        /// <summary>Operator-owned filesystem root. Default data/agent-memory, relative to the server working directory.</summary>
        public string RootDirectory { get; set; } = "data/agent-memory";
        /// <summary>Maximum UTF-8 bytes per value. Default 65536, minimum 1, maximum 1048576.</summary>
        public int MaxValueBytes { get { return _MaxValueBytes; } set { _MaxValueBytes = Math.Clamp(value, 1, 1048576); } }
        private int _MaxValueBytes = 65536;
    }
}
