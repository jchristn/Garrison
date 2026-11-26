namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;

    /// <summary>
    /// Which agents may write to which (AA6.3, AA-020). An agent may message another when an app edge connects them in
    /// either direction, or when it replies within a thread to the agent that wrote to it. Reporting and peer lines join
    /// when organizations arrive (AA7). People with Create on AgentMessage may write to any agent and are not checked here.
    /// Thread-safe.
    /// </summary>
    public class MessageLinePolicy
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public MessageLinePolicy(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Describe the line that lets one agent write to another, or return null when there is none.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="senderAgentId">Sending agent.</param>
        /// <param name="recipientAgentId">Recipient agent.</param>
        /// <param name="parent">The message being replied to, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>"reply" for a reply to the parent's sender, "app:" and the app identifier for an app edge, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId, senderAgentId, or recipientAgentId is null or empty.</exception>
        public async Task<string?> LineAsync(string tenantId, string senderAgentId, string recipientAgentId, AgentMessage? parent, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(senderAgentId)) throw new ArgumentNullException(nameof(senderAgentId));
            if (String.IsNullOrEmpty(recipientAgentId)) throw new ArgumentNullException(nameof(recipientAgentId));
            if (String.Equals(senderAgentId, recipientAgentId, StringComparison.Ordinal)) return null;
            if (parent != null && parent.TenantId == tenantId
                && String.Equals(parent.RecipientAgentId, senderAgentId, StringComparison.Ordinal)
                && String.Equals(parent.SenderAgentId, recipientAgentId, StringComparison.Ordinal))
                return "reply";
            List<string> apps = await _Database.Apps.AppIdsWithEdgeBetweenAsync(tenantId, senderAgentId, recipientAgentId, token).ConfigureAwait(false);
            if (apps.Count > 0) return "app:" + apps[0];
            return null;
        }

        #endregion
    }
}
