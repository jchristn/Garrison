namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.OpenApi;

    /// <summary>
    /// Analytics routes: time-bucketed run analytics for a tenant (plan section 10.6).
    /// </summary>
    public class AnalyticsRoutes
    {
        #region Private-Members

        private readonly RunAnalyticsService _Analytics;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="analytics">Run analytics service.</param>
        /// <exception cref="ArgumentNullException">Thrown when analytics is null.</exception>
        public AnalyticsRoutes(RunAnalyticsService analytics)
        {
            _Analytics = analytics ?? throw new ArgumentNullException(nameof(analytics));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            List<OpenApiParameterMetadata> query = new List<OpenApiParameterMetadata>
            {
                OpenApiParameterMetadata.Query("from", "Inclusive range start, ISO 8601 UTC, compared against run creation time. Default: 24 hours before to.", false, OpenApiSchemaMetadata.String("date-time")),
                OpenApiParameterMetadata.Query("to", "Exclusive range end, ISO 8601 UTC. Default: now.", false, OpenApiSchemaMetadata.String("date-time")),
                OpenApiParameterMetadata.Query("interval", "minute, hour, day, week, or auto (about 24 to 96 buckets). Default auto. More than 400 buckets returns 400.", false, OpenApiSchemaMetadata.String()),
                OpenApiParameterMetadata.Query("agentId", "Only runs of this agent.", false, OpenApiSchemaMetadata.String()),
                OpenApiParameterMetadata.Query("harnessType", "Only runs of this harness type (for example ClaudeCode, Codex, Mux, Generic).", false, OpenApiSchemaMetadata.String()),
                OpenApiParameterMetadata.Query("deploymentId", "Only runs of this deployment.", false, OpenApiSchemaMetadata.String()),
                OpenApiParameterMetadata.Query("groupBy", "none, agent, or harness: one series per group. Default none.", false, OpenApiSchemaMetadata.String())
            };
            routes.Scoped(HttpMethod.GET, "/v1.0/api/tenants/{tenantId}/analytics/runs", ResourceTypeEnum.Run, OperationTypeEnum.Read, RunsAsync, "Time-bucketed run analytics (counts, tokens, cost, timing averages and percentiles)", "Analytics", null, typeof(RunAnalyticsResponse), "id", query);
        }

        #endregion

        #region Private-Methods

        private async Task RunsAsync(HttpContextBase context)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();
            RunAnalyticsQuery query = new RunAnalyticsQuery();
            query.TenantId = RouteHelpers.Tenant(context);
            query.FromUtc = Date(context, "from", errors);
            query.ToUtc = Date(context, "to", errors);
            query.Interval = Enum(context, "interval", RunAnalyticsIntervalEnum.Auto, errors);
            query.GroupBy = Enum(context, "groupBy", RunAnalyticsGroupByEnum.None, errors);
            query.AgentId = RouteHelpers.Query(context, "agentId");
            query.DeploymentId = RouteHelpers.Query(context, "deploymentId");
            string? harness = RouteHelpers.Query(context, "harnessType");
            if (!String.IsNullOrEmpty(harness))
            {
                if (System.Enum.TryParse<HarnessTypeEnum>(harness, true, out HarnessTypeEnum parsed) && System.Enum.IsDefined(parsed)) query.HarnessType = parsed;
                else errors["harnessType"] = "Unknown harness type '" + harness + "'.";
            }
            if (errors.Count > 0) throw new ValidationException("Invalid analytics query: " + String.Join(" ", errors.Values), errors);

            RunAnalyticsResponse response = await _Analytics.QueryAsync(query, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, response).ConfigureAwait(false);
        }

        private static DateTime? Date(HttpContextBase context, string key, Dictionary<string, string> errors)
        {
            string? raw = RouteHelpers.Query(context, key);
            if (String.IsNullOrEmpty(raw)) return null;
            DateTime? parsed = RouteHelpers.QueryDate(context, key);
            if (!parsed.HasValue) errors[key] = key + " must be an ISO 8601 timestamp.";
            return parsed;
        }

        private static T Enum<T>(HttpContextBase context, string key, T fallback, Dictionary<string, string> errors) where T : struct, System.Enum
        {
            string? raw = RouteHelpers.Query(context, key);
            if (String.IsNullOrEmpty(raw)) return fallback;
            if (!Int32.TryParse(raw, out int _) && System.Enum.TryParse<T>(raw, true, out T parsed) && System.Enum.IsDefined(parsed)) return parsed;
            errors[key] = key + " must be one of " + String.Join(", ", System.Enum.GetNames<T>()).ToLowerInvariant() + ".";
            return fallback;
        }

        #endregion
    }
}
