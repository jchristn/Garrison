namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.OpenApi;

    /// <summary>
    /// Performance routes (AA11.2): an organization's performance by unit and agent over a window, with its scheduled
    /// checks. Every route filters by the request's tenant; another tenant's organization answers 404. Run tokens never
    /// hold Organization permissions; a unit lead's run reads its own subtree through garrison_subordinate_performance.
    /// </summary>
    public class PerformanceRoutes
    {
        #region Private-Members

        private readonly OrganizationService _Organizations;
        private readonly PerformanceService _Performance;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/organizations/{id}";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="organizations">Organization service.</param>
        /// <param name="performance">Performance service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public PerformanceRoutes(OrganizationService organizations, PerformanceService performance)
        {
            _Organizations = organizations ?? throw new ArgumentNullException(nameof(organizations));
            _Performance = performance ?? throw new ArgumentNullException(nameof(performance));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Route registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            List<OpenApiParameterMetadata> query = new List<OpenApiParameterMetadata>
            {
                OpenApiParameterMetadata.Query("fromUtc", "Inclusive window start, ISO 8601 UTC, compared against creation times. Default: 7 days before toUtc.", false, OpenApiSchemaMetadata.String("date-time")),
                OpenApiParameterMetadata.Query("toUtc", "Exclusive window end, ISO 8601 UTC. Default: now. The window is at most 90 days.", false, OpenApiSchemaMetadata.String("date-time")),
                OpenApiParameterMetadata.Query("unitId", "Restrict the rollup to this unit's subtree (identifier or name). A unit outside the organization answers 404.", false, OpenApiSchemaMetadata.String())
            };
            routes.Scoped(HttpMethod.GET, _Base + "/performance", ResourceTypeEnum.Organization, OperationTypeEnum.Read, GetAsync, "Performance of an organization by unit subtree and agent over a window: run outcomes, success rate, cost, latency percentiles, escalation rate, loop-guard refusals, eval scores, sample runs, and its scheduled checks", "Performance", null, typeof(OrgPerformance), "id", query);
        }

        #endregion

        #region Private-Methods

        private async Task GetAsync(HttpContextBase http)
        {
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            Organization? organization = await _Organizations.FindAsync(RouteHelpers.Tenant(http), id, http.Token).ConfigureAwait(false);
            if (organization == null) throw new NotFoundException("Organization " + id + " not found.");
            Dictionary<string, string> errors = new Dictionary<string, string>();
            PerformanceQuery query = new PerformanceQuery();
            query.FromUtc = Date(http, "fromUtc", errors);
            query.ToUtc = Date(http, "toUtc", errors);
            query.UnitId = RouteHelpers.Query(http, "unitId");
            if (errors.Count > 0)
            {
                Dictionary<string, string> codes = new Dictionary<string, string>();
                foreach (string key in errors.Keys) codes[key] = "InvalidValue";
                throw new ValidationException("The performance request is invalid: " + String.Join(" ", errors.Values), errors, codes);
            }
            OrgPerformance performance = await _Performance.GetAsync(organization, query, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, performance).ConfigureAwait(false);
        }

        private static DateTime? Date(HttpContextBase http, string key, Dictionary<string, string> errors)
        {
            string? raw = RouteHelpers.Query(http, key);
            if (String.IsNullOrEmpty(raw)) return null;
            DateTime? parsed = RouteHelpers.QueryDate(http, key);
            if (!parsed.HasValue) errors[key] = key + " must be an ISO 8601 timestamp.";
            return parsed;
        }

        #endregion
    }
}
