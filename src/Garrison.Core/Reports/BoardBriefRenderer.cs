namespace Garrison.Core.Reports
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using Garrison.Core.Templates;

    /// <summary>
    /// Renders the board-brief section of a CEO keeper's tick input (AA10.3): the board's request for a Brief report
    /// through garrison_file_report with audience Board. The text comes only from the template. Thread-safe.
    /// </summary>
    public static class BoardBriefRenderer
    {
        /// <summary>
        /// Override name of the template: board-brief (built-in builtin/board-brief, kind Task).
        /// </summary>
        public static readonly string TemplateName = "board-brief";

        /// <summary>
        /// Whether a brief is due: there is an interval, and the last brief is missing or at least that many hours old.
        /// </summary>
        /// <param name="intervalHours">Brief interval in hours, or null for no briefs.</param>
        /// <param name="lastBriefUtc">When the agent last filed a Brief report (UTC), or null.</param>
        /// <param name="nowUtc">Now (UTC).</param>
        /// <returns>True when a brief is due.</returns>
        public static bool Due(int? intervalHours, DateTime? lastBriefUtc, DateTime nowUtc)
        {
            if (!intervalHours.HasValue || intervalHours.Value < 1) return false;
            if (!lastBriefUtc.HasValue) return true;
            return (nowUtc - lastBriefUtc.Value).TotalHours >= intervalHours.Value;
        }

        /// <summary>
        /// Render the section.
        /// </summary>
        /// <param name="template">Template content.</param>
        /// <param name="templateName">Template name, for errors.</param>
        /// <param name="organizationName">Organization name.</param>
        /// <param name="mandateName">The CEO's mandate name.</param>
        /// <param name="intervalHours">Brief interval in hours.</param>
        /// <param name="lastBriefUtc">When the agent last filed a Brief report (UTC), or null.</param>
        /// <returns>Rendered text.</returns>
        /// <exception cref="ArgumentNullException">Thrown when template or organizationName is null.</exception>
        /// <exception cref="TemplateException">Thrown when the template does not render.</exception>
        public static string Render(string template, string templateName, string organizationName, string mandateName, int intervalHours, DateTime? lastBriefUtc)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
            if (organizationName == null) throw new ArgumentNullException(nameof(organizationName));
            TemplateContext context = new TemplateContext();
            Dictionary<string, object?> map = TemplateContext.NewMap();
            map["organizationName"] = organizationName;
            map["mandateName"] = mandateName;
            map["intervalHours"] = (long)intervalHours;
            map["lastBriefUtc"] = lastBriefUtc.HasValue ? DateTime.SpecifyKind(lastBriefUtc.Value, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture) : null;
            context.Set("brief", map);
            context.Set("now", DateTime.UtcNow);
            return TemplateRenderer.Render(template, context, new TemplateRenderOptions { TemplateName = templateName, AllowSecrets = false }).Trim();
        }
    }
}
