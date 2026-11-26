namespace Garrison.Core.Messaging
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Security.Cryptography;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Renders delivered messages into a run's input through the inbox-delivery template (AA6.5, AA-025): each message is
    /// framed as data with its provenance, between begin and end lines that carry a marker chosen at random for every
    /// render, so text inside a message cannot close its own block. This is the only way message text enters a prompt.
    /// Thread-safe.
    /// </summary>
    public static class InboxDeliveryRenderer
    {
        /// <summary>
        /// Override name of the delivery template: inbox-delivery (built-in builtin/inbox-delivery, kind Fragment).
        /// </summary>
        public static readonly string TemplateName = "inbox-delivery";

        /// <summary>
        /// Override name of the Message run template: message-wake (built-in builtin/message-wake, kind Task).
        /// </summary>
        public static readonly string WakeTemplateName = "message-wake";

        /// <summary>
        /// Render messages.
        /// </summary>
        /// <param name="template">Template content.</param>
        /// <param name="templateName">Template name, for errors.</param>
        /// <param name="messages">Messages with their artifacts, in the order to show them.</param>
        /// <param name="more">Whether more messages are queued than are shown.</param>
        /// <returns>Rendered text; empty when there are no messages.</returns>
        /// <exception cref="ArgumentNullException">Thrown when template or messages is null.</exception>
        /// <exception cref="TemplateException">Thrown when the template does not render.</exception>
        public static string Render(string template, string templateName, List<AgentMessage> messages, bool more)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
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
                item["from"] = message.SenderAgentName ?? message.SenderName ?? message.SenderAgentId ?? message.SenderPrincipalId ?? "unknown";
                item["senderAgentId"] = message.SenderAgentId;
                item["urgency"] = message.Urgency.ToString();
                item["hopCount"] = (long)message.HopCount;
                item["subject"] = message.Subject;
                item["body"] = String.IsNullOrWhiteSpace(message.Body) ? null : message.Body;
                item["sentUtc"] = Iso(message.CreatedUtc);
                item["escalationId"] = message.EscalationId;
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
            map["items"] = items;
            map["hasMessages"] = items.Count > 0;
            map["count"] = (long)items.Count;
            map["more"] = more;
            context.Set("inbox", map);
            context.Set("now", DateTime.UtcNow);
            return TemplateRenderer.Render(template, context, new TemplateRenderOptions { TemplateName = templateName, AllowSecrets = false }).Trim();
        }

        private static string Iso(DateTime value)
        {
            return DateTime.SpecifyKind(value, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture);
        }
    }
}
