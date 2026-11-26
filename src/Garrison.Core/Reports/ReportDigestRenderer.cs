namespace Garrison.Core.Reports
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Security.Cryptography;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Renders reports into a keeper's tick input through the report-digest template (AA5.5, AA-025): each report is framed
    /// as data with its provenance, between begin and end lines that carry a marker chosen at random for every render, so
    /// text inside a report cannot close its own block. This is the only way report text enters a prompt. Thread-safe.
    /// </summary>
    public static class ReportDigestRenderer
    {
        /// <summary>
        /// Override name of the template: report-digest (built-in builtin/report-digest, kind Fragment).
        /// </summary>
        public static readonly string TemplateName = "report-digest";

        /// <summary>
        /// Render reports.
        /// </summary>
        /// <param name="template">Template content.</param>
        /// <param name="templateName">Template name, for errors.</param>
        /// <param name="reports">Reports with their children, in the order to show them.</param>
        /// <param name="truncated">Whether more reports matched than are shown.</param>
        /// <returns>Rendered text; empty when there are no reports.</returns>
        /// <exception cref="ArgumentNullException">Thrown when template or reports is null.</exception>
        /// <exception cref="TemplateException">Thrown when the template does not render.</exception>
        public static string Render(string template, string templateName, List<Report> reports, bool truncated)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
            if (reports == null) throw new ArgumentNullException(nameof(reports));
            string boundary = Convert.ToHexString(RandomNumberGenerator.GetBytes(8)).ToLowerInvariant();
            List<object?> items = new List<object?>();
            foreach (Report report in reports)
            {
                if (report == null) continue;
                Dictionary<string, object?> item = TemplateContext.NewMap();
                item["boundary"] = boundary;
                item["id"] = report.Id;
                item["author"] = report.AuthorAgentName ?? report.AuthorAgentId ?? report.FiledByName ?? "unknown";
                item["authorAgentId"] = report.AuthorAgentId;
                item["kind"] = report.Kind.ToString();
                item["health"] = report.Health.ToString();
                item["audience"] = report.Audience.ToString();
                item["title"] = report.Title;
                item["body"] = String.IsNullOrWhiteSpace(report.Body) ? null : report.Body;
                item["createdUtc"] = Iso(report.CreatedUtc);
                item["period"] = Period(report);
                List<object?> metrics = new List<object?>();
                foreach (ReportMetric metric in report.Metrics)
                {
                    Dictionary<string, object?> m = TemplateContext.NewMap();
                    m["name"] = metric.Name;
                    m["value"] = metric.Value.ToString("G", CultureInfo.InvariantCulture);
                    m["unit"] = metric.Unit;
                    metrics.Add(m);
                }
                List<object?> issues = new List<object?>();
                foreach (ReportIssue issue in report.Issues)
                {
                    Dictionary<string, object?> m = TemplateContext.NewMap();
                    m["severity"] = issue.Severity.ToString();
                    m["text"] = issue.Text;
                    issues.Add(m);
                }
                List<object?> decisions = new List<object?>();
                foreach (ReportDecision decision in report.Decisions)
                {
                    Dictionary<string, object?> m = TemplateContext.NewMap();
                    m["text"] = decision.Text;
                    decisions.Add(m);
                }
                item["metrics"] = metrics;
                item["issues"] = issues;
                item["decisions"] = decisions;
                items.Add(item);
            }
            TemplateContext context = new TemplateContext();
            Dictionary<string, object?> map = TemplateContext.NewMap();
            map["boundary"] = boundary;
            map["items"] = items;
            map["hasReports"] = items.Count > 0;
            map["count"] = (long)items.Count;
            map["truncated"] = truncated;
            context.Set("reports", map);
            context.Set("now", DateTime.UtcNow);
            return TemplateRenderer.Render(template, context, new TemplateRenderOptions { TemplateName = templateName, AllowSecrets = false }).Trim();
        }

        private static string Iso(DateTime value)
        {
            return DateTime.SpecifyKind(value, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture);
        }

        private static string? Period(Report report)
        {
            if (!report.PeriodStartUtc.HasValue && !report.PeriodEndUtc.HasValue) return null;
            string start = report.PeriodStartUtc.HasValue ? Iso(report.PeriodStartUtc.Value) : "?";
            string end = report.PeriodEndUtc.HasValue ? Iso(report.PeriodEndUtc.Value) : "?";
            return start + " to " + end;
        }
    }
}
