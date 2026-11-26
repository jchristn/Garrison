namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>Result of garrison_read_inbox for people (AA6.6): an agent's messages without changing them.</summary>
    public class McpMessageList
    {
        /// <summary>Messages, newest first, with their artifacts.</summary>
        public List<AgentMessage> Messages { get; set; } = new List<AgentMessage>();

        /// <summary>Total matching messages.</summary>
        public long TotalCount { get; set; } = 0;
    }
}
