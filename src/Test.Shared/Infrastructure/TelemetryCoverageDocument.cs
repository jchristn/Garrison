namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Protocols;
    using Garrison.Server.Routes;
    using Radiant;

    /// <summary>
    /// Generates the machine-checked sections of the telemetry coverage matrix in docs/TELEMETRY.md (P13.20): the metric
    /// catalog, every REST route, every MCP tool, and every A2A method. Each section sits between
    /// <c>&lt;!-- telemetry-coverage:NAME --&gt;</c> and <c>&lt;!-- /telemetry-coverage:NAME --&gt;</c> markers; the
    /// coverage suite compares them with the running code and rewrites them when GARRISON_UPDATE_TELEMETRY_DOC=1.
    /// </summary>
    public static class TelemetryCoverageDocument
    {
        #region Public-Methods

        /// <summary>
        /// Repository root: the nearest ancestor of the test binaries that holds GARRISON_PLAN.md.
        /// </summary>
        /// <returns>Path.</returns>
        /// <exception cref="DirectoryNotFoundException">Thrown when no ancestor holds GARRISON_PLAN.md.</exception>
        public static string RepositoryRoot()
        {
            DirectoryInfo? directory = new DirectoryInfo(AppContext.BaseDirectory);
            while (directory != null)
            {
                if (File.Exists(Path.Combine(directory.FullName, "GARRISON_PLAN.md"))) return directory.FullName;
                directory = directory.Parent;
            }
            throw new DirectoryNotFoundException("Could not find the repository root (GARRISON_PLAN.md) above " + AppContext.BaseDirectory + ".");
        }

        /// <summary>
        /// The metric catalog table.
        /// </summary>
        /// <returns>Markdown.</returns>
        public static string Metrics()
        {
            StringBuilder text = new StringBuilder();
            text.Append("| Metric (Prometheus) | Type | Labels | Process | Dashboard | Meaning |\n");
            text.Append("|---|---|---|---|---|---|\n");
            foreach (MetricDescriptor metric in GarrisonMetricCatalog.All().OrderBy(m => m.Category, StringComparer.Ordinal).ThenBy(m => m.Name, StringComparer.Ordinal))
            {
                text.Append("| `").Append(metric.PrometheusName).Append("` | ").Append(Kind(metric)).Append(" | ")
                    .Append(metric.Labels.Count == 0 ? "none" : String.Join(", ", metric.Labels.Select(l => "`" + l + "`"))).Append(" | ")
                    .Append(metric.Process).Append(" | ").Append(metric.Dashboard).Append(" | ")
                    .Append(metric.Description.Replace("|", "/")).Append(" |\n");
            }
            return text.ToString();
        }

        /// <summary>
        /// The REST route table: every route in the operation scope map (MCP tool entries are in the MCP table), with the
        /// series, span, log field, and panels that cover it.
        /// </summary>
        /// <param name="scopes">Operation scope map of a started server.</param>
        /// <returns>Markdown.</returns>
        /// <exception cref="ArgumentNullException">Thrown when scopes is null.</exception>
        public static string Routes(OperationScopeMap scopes)
        {
            if (scopes == null) throw new ArgumentNullException(nameof(scopes));
            StringBuilder text = new StringBuilder();
            text.Append("| Method | Route | Metric series | Span | Log | Panels |\n");
            text.Append("|---|---|---|---|---|---|\n");
            foreach (OperationScope scope in scopes.All().Where(s => !String.Equals(s.Method, "MCP", StringComparison.Ordinal)))
            {
                if (String.Equals(scope.Path, "/metrics", StringComparison.Ordinal))
                {
                    text.Append("| ").Append(scope.Method).Append(" | `/metrics` | not recorded, so scrapes stay out of request metrics | `GET /metrics` | none | none |\n");
                    continue;
                }
                text.Append("| ").Append(scope.Method).Append(" | `").Append(scope.Path).Append("` | `route=\"").Append(scope.Path).Append("\"` | `")
                    .Append(scope.Method).Append(' ').Append(scope.Path).Append("` | `route=").Append(scope.Path).Append("` | ")
                    .Append(Panels(scope.Path)).Append(" |\n");
            }
            return text.ToString();
        }

        /// <summary>
        /// The MCP tool table.
        /// </summary>
        /// <returns>Markdown.</returns>
        public static string McpTools()
        {
            StringBuilder text = new StringBuilder();
            text.Append("| Tool | Metric series | Span | Log | Panels |\n");
            text.Append("|---|---|---|---|---|\n");
            foreach (string name in McpToolCatalog.All().Select(t => t.Name).OrderBy(n => n, StringComparer.Ordinal))
            {
                text.Append("| `").Append(name).Append("` | `tool=\"").Append(name).Append("\"` | `mcp ").Append(name).Append("` | `[Mcp]` lines, `tenant=` | garrison-protocols |\n");
            }
            text.Append("| `{mcpToolName}` (agent tools, one per exposed agent) | `tool=\"agent\"` | `mcp agent` | `[Mcp]` lines, `tenant=`, `agent=` | garrison-protocols, garrison-agents |\n");
            return text.ToString();
        }

        /// <summary>
        /// The A2A method table.
        /// </summary>
        /// <returns>Markdown.</returns>
        public static string A2aMethods()
        {
            StringBuilder text = new StringBuilder();
            text.Append("| Method | Metric series | Span | Log | Panels |\n");
            text.Append("|---|---|---|---|---|\n");
            foreach (string method in A2ARoutes.Methods())
            {
                text.Append("| `").Append(method).Append("` | `method=\"").Append(method).Append("\"` | `a2a ").Append(method).Append("` | request line `route=/v1.0/a2a/{tenantId}/{agentName}` | garrison-protocols |\n");
            }
            return text.ToString();
        }

        /// <summary>
        /// Read a marked section from a document.
        /// </summary>
        /// <param name="document">Document text.</param>
        /// <param name="name">Section name.</param>
        /// <returns>Section content without the markers, or null when the markers are missing.</returns>
        public static string? Section(string document, string name)
        {
            string start = StartMarker(name);
            string end = EndMarker(name);
            int i = document.IndexOf(start, StringComparison.Ordinal);
            int j = document.IndexOf(end, StringComparison.Ordinal);
            if (i < 0 || j < i) return null;
            return document.Substring(i + start.Length, j - i - start.Length).Trim('\n');
        }

        /// <summary>
        /// Replace a marked section in a document.
        /// </summary>
        /// <param name="document">Document text.</param>
        /// <param name="name">Section name.</param>
        /// <param name="content">New content.</param>
        /// <returns>Updated document.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the markers are missing.</exception>
        public static string Replace(string document, string name, string content)
        {
            string start = StartMarker(name);
            string end = EndMarker(name);
            int i = document.IndexOf(start, StringComparison.Ordinal);
            int j = document.IndexOf(end, StringComparison.Ordinal);
            if (i < 0 || j < i) throw new InvalidOperationException("docs/TELEMETRY.md has no " + start + " ... " + end + " section.");
            return document.Substring(0, i + start.Length) + "\n" + content.Trim('\n') + "\n" + document.Substring(j);
        }

        /// <summary>
        /// Start marker of a section.
        /// </summary>
        /// <param name="name">Section name.</param>
        /// <returns>Marker.</returns>
        public static string StartMarker(string name)
        {
            return "<!-- telemetry-coverage:" + name + " -->";
        }

        /// <summary>
        /// End marker of a section.
        /// </summary>
        /// <param name="name">Section name.</param>
        /// <returns>Marker.</returns>
        public static string EndMarker(string name)
        {
            return "<!-- /telemetry-coverage:" + name + " -->";
        }

        #endregion

        #region Private-Methods

        private static string Kind(MetricDescriptor metric)
        {
            switch (metric.Kind)
            {
                case MetricKindEnum.Counter:
                    return "counter";
                case MetricKindEnum.Histogram:
                    return "histogram" + (metric.Unit == "s" ? ", seconds" : metric.Unit == "By" ? ", bytes" : String.Empty);
                case MetricKindEnum.UpDownCounter:
                case MetricKindEnum.ObservableGauge:
                    return "gauge";
                default:
                    return metric.Kind.ToString();
            }
        }

        private static string Panels(string path)
        {
            List<string> panels = new List<string> { "garrison-http" };
            if (path.StartsWith("/v1.0/api/node/", StringComparison.Ordinal)) panels.Add("garrison-workers");
            if (path.StartsWith("/v1.0/api/node/lease", StringComparison.Ordinal)) panels.Add("garrison-scheduler");
            if (path.StartsWith("/v1.0/a2a", StringComparison.Ordinal)) panels.Add("garrison-protocols");
            if (path.Contains("/runs", StringComparison.Ordinal) && !path.StartsWith("/v1.0/api/node/", StringComparison.Ordinal)) panels.Add("garrison-runs");
            if (path.StartsWith("/v1.0/token", StringComparison.Ordinal) || path.Contains("/credentials", StringComparison.Ordinal) || path.Contains("/secrets", StringComparison.Ordinal) || path.Contains("/audit", StringComparison.Ordinal)) panels.Add("garrison-security");
            return String.Join(", ", panels);
        }

        #endregion
    }
}
