namespace Garrison.Core.Messaging
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Security.Cryptography;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Renders earlier messages an agent sent or received for garrison_read_thread through the message-history template
    /// (AA12.7, AA-025): each message is framed as data with its provenance, between begin and end lines that carry a
    /// marker chosen at random for every render, so text inside a message cannot close its own block. Thread-safe.
    /// </summary>
    public static class MessageHistoryRenderer
    {
        /// <summary>
        /// Override name of the template: message-history (built-in builtin/message-history, kind Fragment).
        /// </summary>
        public static readonly string TemplateName = "message-history";

        /// <summary>
        /// Render messages.
        /// </summary>
        /// <param name="template">Template content.</param>
        /// <param name="templateName">Template name, for errors.</param>
        /// <param name="agentId">The reading run's agent, to mark each message sent or received.</param>
        /// <param name="threadId">The thread asked for, or null for the agent's recent messages in every thread.</param>
        /// <param name="messages">Messages with their artifacts, oldest first.</param>
        /// <param name="more">Whether more messages matched than are shown.</param>
        /// <returns>Rendered text.</returns>
        /// <exception cref="ArgumentNullException">Thrown when template, agentId, or messages is null.</exception>
        /// <exception cref="TemplateException">Thrown when the template does not render.</exception>
        public static string Render(string template, string templateName, string agentId, string? threadId, List<AgentMessage> messages, bool more)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
            if (agentId == null) throw new ArgumentNullException(nameof(agentId));
            if (messages == null) throw new ArgumentNullException(nameof(messages));
            string boundary = Convert.ToHexString(RandomNumberGenerator.GetBytes(8)).ToLowerInvariant();
            List<object?> items = new List<object?>();
            foreach (AgentMessage message in messages)
            {
                if (message == null) continue;
                Dictionary<string, object?> item = TemplateContext.NewMap();
                item["boundary"] = boundary;
                item["id"] = message.Id;
                item["threadId"] = message.ThreadId;
                item["inReplyTo"] = message.ParentMessageId;
                item["sent"] = String.Equals(message.SenderAgentId, agentId, StringComparison.Ordinal);
                item["from"] = message.SenderAgentName ?? message.SenderName ?? message.SenderAgentId ?? message.SenderPrincipalId ?? "unknown";
                item["to"] = message.RecipientAgentName ?? message.RecipientAgentId;
                item["status"] = message.Status.ToString();
                item["urgency"] = message.Urgency.ToString();
                item["subject"] = message.Subject;
                item["body"] = String.IsNullOrWhiteSpace(message.Body) ? null : message.Body;
                item["sentUtc"] = Iso(message.CreatedUtc);
                List<object?> artifacts = new List<object?>();
                foreach (AgentMessageArtifact artifact in message.Artifacts)
                {
                    Dictionary<string, object?> a = TemplateContext.NewMap();
                    a["id"] = artifact.ArtifactId;
                    a["name"] = artifact.Name;
                    a["mediaType"] = artifact.MediaType;
                    a["sizeBytes"] = artifact.SizeBytes;
                    artifacts.Add(a);
                }
                item["artifacts"] = artifacts;
                items.Add(item);
            }
            TemplateContext context = new TemplateContext();
            Dictionary<string, object?> map = TemplateContext.NewMap();
            map["boundary"] = boundary;
            map["threadId"] = threadId;
            map["items"] = items;
            map["hasMessages"] = items.Count > 0;
            map["count"] = (long)items.Count;
            map["more"] = more;
            context.Set("history", map);
            context.Set("now", DateTime.UtcNow);
            return TemplateRenderer.Render(template, context, new TemplateRenderOptions { TemplateName = templateName, AllowSecrets = false }).Trim();
        }

        private static string Iso(DateTime value)
        {
            return DateTime.SpecifyKind(value, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture);
        }
    }
}
