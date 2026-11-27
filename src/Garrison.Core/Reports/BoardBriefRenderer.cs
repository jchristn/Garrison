namespace Garrison.Core.Reports
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Security.Cryptography;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Renders the board-brief section of a CEO keeper's tick input (AA10.3): the board's request for a Brief report
    /// through garrison_file_report with audience Board, with Garrison's own facts for the period when they are given
    /// (AA12.7): unit health, spend, open escalations, pending and decided proposals, published revisions, and unhealthy
    /// reports. Text that agents or people wrote (titles, questions, change notes) is framed as data between begin and end
    /// lines that carry a marker chosen at random for every render (AA-025). The text comes only from the template.
    /// Thread-safe.
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
            return Render(template, templateName, organizationName, mandateName, intervalHours, lastBriefUtc, null);
        }

        /// <summary>
        /// Render the section with Garrison's facts for the period. The template sees brief.hasFacts, brief.sinceUtc,
        /// brief.boundary, brief.units, brief.notHealthy, brief.spend, brief.escalations, brief.pending, brief.revisions,
        /// brief.decided, brief.unhealthyReports, brief.frozen (the number of active freezes), and brief.killSwitch.
        /// </summary>
        /// <param name="template">Template content.</param>
        /// <param name="templateName">Template name, for errors.</param>
        /// <param name="organizationName">Organization name.</param>
        /// <param name="mandateName">The CEO's mandate name.</param>
        /// <param name="intervalHours">Brief interval in hours.</param>
        /// <param name="lastBriefUtc">When the agent last filed a Brief report (UTC), or null.</param>
        /// <param name="facts">The board's facts for the period, or null to render the request alone.</param>
        /// <returns>Rendered text.</returns>
        /// <exception cref="ArgumentNullException">Thrown when template or organizationName is null.</exception>
        /// <exception cref="TemplateException">Thrown when the template does not render.</exception>
        public static string Render(string template, string templateName, string organizationName, string mandateName, int intervalHours, DateTime? lastBriefUtc, BoardBriefFacts? facts)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
            if (organizationName == null) throw new ArgumentNullException(nameof(organizationName));
            TemplateContext context = new TemplateContext();
            Dictionary<string, object?> map = TemplateContext.NewMap();
            map["organizationName"] = organizationName;
            map["mandateName"] = mandateName;
            map["intervalHours"] = (long)intervalHours;
            map["lastBriefUtc"] = lastBriefUtc.HasValue ? Iso(lastBriefUtc.Value) : null;
            map["hasFacts"] = facts != null;
            if (facts != null) AddFacts(map, facts);
            context.Set("brief", map);
            context.Set("now", DateTime.UtcNow);
            return TemplateRenderer.Render(template, context, new TemplateRenderOptions { TemplateName = templateName, AllowSecrets = false }).Trim();
        }

        private static void AddFacts(Dictionary<string, object?> map, BoardBriefFacts facts)
        {
            string boundary = Convert.ToHexString(RandomNumberGenerator.GetBytes(8)).ToLowerInvariant();
            Board board = facts.Board;
            map["boundary"] = boundary;
            map["sinceUtc"] = Iso(facts.SinceUtc);

            List<object?> units = new List<object?>();
            List<object?> notHealthy = new List<object?>();
            foreach (BoardUnitHealth unit in board.UnitHealth)
            {
                Dictionary<string, object?> item = TemplateContext.NewMap();
                item["name"] = unit.UnitName;
                item["health"] = unit.Health.ToString();
                item["lastReportUtc"] = unit.LastReportUtc.HasValue ? Iso(unit.LastReportUtc.Value) : null;
                item["openEscalations"] = (long)unit.OpenEscalations;
                item["frozen"] = unit.Frozen;
                item["overBudget"] = unit.OverBudget;
                units.Add(item);
                if (unit.Health == ReportHealthEnum.Degraded || unit.Health == ReportHealthEnum.Unhealthy) notHealthy.Add(item);
            }
            map["units"] = units;
            map["notHealthy"] = notHealthy;

            List<object?> spend = new List<object?>();
            foreach (OrgUnitSpend row in board.Spend)
            {
                Dictionary<string, object?> item = TemplateContext.NewMap();
                item["unit"] = row.UnitName;
                item["period"] = row.Period.ToString();
                item["spentUsd"] = Money(row.SpentUsd);
                item["amountUsd"] = row.AmountUsd.HasValue ? Money(row.AmountUsd.Value) : null;
                item["percent"] = row.Fraction.HasValue ? Math.Round(row.Fraction.Value * 100, 0).ToString("0", CultureInfo.InvariantCulture) : null;
                spend.Add(item);
            }
            map["spend"] = spend;

            List<object?> escalations = new List<object?>();
            foreach (Escalation escalation in board.Escalations)
            {
                Dictionary<string, object?> item = TemplateContext.NewMap();
                item["boundary"] = boundary;
                item["id"] = escalation.Id;
                item["agent"] = escalation.AgentName ?? escalation.AgentId ?? "unknown";
                item["severity"] = escalation.Severity.ToString();
                item["createdUtc"] = Iso(escalation.CreatedUtc);
                item["question"] = escalation.Question;
                escalations.Add(item);
            }
            map["escalations"] = escalations;

            map["pending"] = board.Proposals.Select(p => (object?)Proposal(p, boundary)).ToList();
            map["decided"] = facts.Decided.Select(p => (object?)Proposal(p, boundary)).ToList();

            List<object?> revisions = new List<object?>();
            foreach (OrgRevision revision in facts.Revisions)
            {
                Dictionary<string, object?> item = TemplateContext.NewMap();
                item["boundary"] = boundary;
                item["number"] = (long)revision.Number;
                item["publishedUtc"] = revision.PublishedUtc.HasValue ? Iso(revision.PublishedUtc.Value) : null;
                item["author"] = revision.AuthorName ?? revision.AuthorId ?? "unknown";
                item["authorType"] = revision.AuthorType.ToString();
                item["draftId"] = revision.DraftId;
                item["rollback"] = !String.IsNullOrEmpty(revision.RollbackOfRevisionId);
                item["note"] = String.IsNullOrWhiteSpace(revision.Note) ? null : revision.Note;
                revisions.Add(item);
            }
            map["revisions"] = revisions;

            List<object?> unhealthy = new List<object?>();
            foreach (Report report in board.UnhealthyReports)
            {
                Dictionary<string, object?> item = TemplateContext.NewMap();
                item["boundary"] = boundary;
                item["id"] = report.Id;
                item["author"] = report.AuthorAgentName ?? report.AuthorAgentId ?? "unknown";
                item["health"] = report.Health.ToString();
                item["kind"] = report.Kind.ToString();
                item["createdUtc"] = Iso(report.CreatedUtc);
                item["title"] = report.Title;
                unhealthy.Add(item);
            }
            map["unhealthyReports"] = unhealthy;
            map["frozen"] = (long)board.Freezes.Count;
            map["killSwitch"] = board.KillSwitch.Enabled;
        }

        private static Dictionary<string, object?> Proposal(OrgProposal proposal, string boundary)
        {
            Dictionary<string, object?> item = TemplateContext.NewMap();
            item["boundary"] = boundary;
            item["draftId"] = proposal.DraftId;
            item["title"] = proposal.Title;
            item["status"] = proposal.Status.ToString();
            item["approvalStatus"] = proposal.ApprovalStatus?.ToString();
            item["decisionSource"] = proposal.DecisionSource?.ToString();
            item["decidedBy"] = proposal.DecidedBy;
            item["unit"] = proposal.UnitName;
            item["agent"] = proposal.AgentName ?? proposal.AgentId;
            item["updatedUtc"] = Iso(proposal.LastUpdateUtc);
            return item;
        }

        private static string Iso(DateTime value)
        {
            return DateTime.SpecifyKind(value, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture);
        }

        private static string Money(double value)
        {
            return value.ToString("0.00", CultureInfo.InvariantCulture);
        }
    }
}
