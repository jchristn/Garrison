namespace Garrison.Core.Keepers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Validates mandates and mandate revisions (AA1.4, AA1.12) for every path that writes them: REST, MCP, manifests, and
    /// studio drafts. Agent and deployment references are resolved by identifier or name and replaced with identifiers.
    /// Thread-safe.
    /// </summary>
    public static class MandateValidator
    {
        #region Public-Members

        /// <summary>
        /// Longest objective, definition of healthy, autonomy, escalation policy, and direction text, in characters: 8000.
        /// </summary>
        public static readonly int MaxTextLength = 8000;

        /// <summary>
        /// Most signals in one revision: 50.
        /// </summary>
        public static readonly int MaxSignals = 50;

        #endregion

        #region Private-Members

        private static readonly Regex _Name = new Regex("^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$", RegexOptions.Compiled);

        #endregion

        #region Public-Methods

        /// <summary>
        /// Validate a mandate's name, description, agent, and deployment. The agent must be a hosted agent of the tenant;
        /// the deployment must belong to it and be active.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="mandate">Mandate; agentId and deploymentId are replaced with identifiers when they resolve.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when database, tenantId, or mandate is null.</exception>
        /// <exception cref="ValidationException">Thrown with field errors and codes when the mandate is invalid.</exception>
        public static async Task ValidateAsync(DatabaseDriverBase database, string tenantId, Mandate mandate, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            if (!_Name.IsMatch(mandate.Name ?? String.Empty)) errors["name"] = "Mandate names are 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.";
            if (mandate.Description != null && mandate.Description.Length > 4000) errors["description"] = "Descriptions are limited to 4000 characters.";

            Agent? agent = null;
            if (String.IsNullOrWhiteSpace(mandate.AgentId))
            {
                errors["agentId"] = "An agentId is required.";
            }
            else
            {
                string reference = mandate.AgentId.Trim();
                agent = await database.Agents.ReadAsync(tenantId, reference, token).ConfigureAwait(false)
                    ?? await database.Agents.ReadByNameAsync(tenantId, reference, token).ConfigureAwait(false);
                if (agent == null)
                {
                    errors["agentId"] = "The agent does not exist in this tenant.";
                    codes["agentId"] = "ReferenceNotFound";
                }
                else
                {
                    mandate.AgentId = agent.Id;
                    if (agent.Kind == AgentKindEnum.Remote)
                    {
                        errors["agentId"] = "Keepers run on hosted deployments; remote agents cannot hold a mandate.";
                        codes["agentId"] = "RemoteAgentUnsupported";
                    }
                }
            }

            if (String.IsNullOrWhiteSpace(mandate.DeploymentId))
            {
                errors["deploymentId"] = "A deploymentId is required.";
            }
            else if (agent != null)
            {
                string reference = mandate.DeploymentId.Trim();
                Deployment? deployment = await database.Deployments.ReadAsync(tenantId, reference, token).ConfigureAwait(false);
                if (deployment == null)
                {
                    List<Deployment> owned = await database.Deployments.ListByAgentAsync(tenantId, agent.Id, token).ConfigureAwait(false);
                    deployment = owned.FirstOrDefault(d => String.Equals(d.Name, reference, StringComparison.Ordinal))
                        ?? await database.Deployments.ReadByNameAsync(tenantId, reference, token).ConfigureAwait(false);
                }
                if (deployment == null)
                {
                    errors["deploymentId"] = "The deployment does not exist in this tenant.";
                    codes["deploymentId"] = "ReferenceNotFound";
                }
                else if (deployment.AgentId != agent.Id)
                {
                    errors["deploymentId"] = "The deployment belongs to another agent.";
                    codes["deploymentId"] = "DeploymentAgentMismatch";
                }
                else if (!deployment.Active)
                {
                    errors["deploymentId"] = "The deployment is inactive.";
                    codes["deploymentId"] = "DeploymentInactive";
                }
                else
                {
                    mandate.DeploymentId = deployment.Id;
                }
            }
            if (errors.Count > 0) throw new ValidationException("The mandate is invalid.", errors, codes);
        }

        /// <summary>
        /// Validate a revision's text, wake mode, and signals. Trims the objective and signal names and renumbers signals
        /// from list order.
        /// </summary>
        /// <param name="revision">Revision.</param>
        /// <exception cref="ArgumentNullException">Thrown when revision is null.</exception>
        /// <exception cref="ValidationException">Thrown with field errors when the revision is invalid.</exception>
        public static void ValidateRevision(MandateRevision revision)
        {
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            Dictionary<string, string> errors = new Dictionary<string, string>();
            revision.Objective = (revision.Objective ?? String.Empty).Trim();
            if (revision.Objective.Length == 0) errors["objective"] = "An objective is required.";
            if (revision.Objective.Length > MaxTextLength) errors["objective"] = "The objective is limited to " + MaxTextLength + " characters.";
            Text(revision.HealthyDefinition, "healthyDefinition", errors);
            Text(revision.Autonomy, "autonomy", errors);
            Text(revision.EscalationPolicy, "escalationPolicy", errors);
            Text(revision.Direction, "direction", errors);
            if (revision.ChangeNote != null && revision.ChangeNote.Length > 1024) errors["changeNote"] = "The change note is limited to 1024 characters.";
            if (!Enum.IsDefined(revision.WakeMode)) errors["wakeMode"] = "wakeMode is Fixed or Backoff.";
            if (revision.Signals.Count > MaxSignals) errors["signals"] = "A revision has at most " + MaxSignals + " signals.";
            HashSet<string> names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < revision.Signals.Count; i++)
            {
                MandateRevisionSignal signal = revision.Signals[i];
                signal.Name = (signal.Name ?? String.Empty).Trim();
                if (signal.Name.Length == 0 || signal.Name.Length > 128) errors["signals[" + i + "].name"] = "Signal names are 1 to 128 characters.";
                else if (!names.Add(signal.Name)) errors["signals[" + i + "].name"] = "Signal names are unique within a revision.";
                if (signal.Description != null && signal.Description.Length > 2000) errors["signals[" + i + "].description"] = "Signal descriptions are limited to 2000 characters.";
                signal.Order = i;
            }
            if (errors.Count > 0) throw new ValidationException("The mandate revision is invalid.", errors);
        }

        /// <summary>
        /// Apply interval bounds to a revision: a minimum below <paramref name="minIntervalSeconds"/> is raised, any interval
        /// above <paramref name="maxIntervalSeconds"/> is lowered, and a maximum below the minimum is raised to it. Each
        /// change adds a ValueClamped warning to the revision.
        /// </summary>
        /// <param name="revision">Revision.</param>
        /// <param name="minIntervalSeconds">Floor (Autonomy.MinIntervalSeconds).</param>
        /// <param name="maxIntervalSeconds">Ceiling (Autonomy.MaxIntervalSeconds).</param>
        /// <exception cref="ArgumentNullException">Thrown when revision is null.</exception>
        public static void ApplyBounds(MandateRevision revision, int minIntervalSeconds, int maxIntervalSeconds)
        {
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            if (revision.MinIntervalSeconds < minIntervalSeconds)
            {
                string given = Text(revision.MinIntervalSeconds);
                revision.MinIntervalSeconds = minIntervalSeconds;
                revision.AddWarning("minIntervalSeconds", given, Text(revision.MinIntervalSeconds), "minIntervalSeconds " + given + " is below Autonomy.MinIntervalSeconds; " + revision.MinIntervalSeconds + " was stored.");
            }
            if (revision.MinIntervalSeconds > maxIntervalSeconds)
            {
                string given = Text(revision.MinIntervalSeconds);
                revision.MinIntervalSeconds = maxIntervalSeconds;
                revision.AddWarning("minIntervalSeconds", given, Text(revision.MinIntervalSeconds), "minIntervalSeconds " + given + " is above Autonomy.MaxIntervalSeconds; " + revision.MinIntervalSeconds + " was stored.");
            }
            if (revision.MaxIntervalSeconds > maxIntervalSeconds)
            {
                string given = Text(revision.MaxIntervalSeconds);
                revision.MaxIntervalSeconds = maxIntervalSeconds;
                revision.AddWarning("maxIntervalSeconds", given, Text(revision.MaxIntervalSeconds), "maxIntervalSeconds " + given + " is above Autonomy.MaxIntervalSeconds; " + revision.MaxIntervalSeconds + " was stored.");
            }
            if (revision.MaxIntervalSeconds < revision.MinIntervalSeconds)
            {
                string given = Text(revision.MaxIntervalSeconds);
                revision.MaxIntervalSeconds = revision.MinIntervalSeconds;
                revision.AddWarning("maxIntervalSeconds", given, Text(revision.MaxIntervalSeconds), "maxIntervalSeconds " + given + " is below minIntervalSeconds; " + revision.MaxIntervalSeconds + " was stored.");
            }
        }

        #endregion

        #region Private-Methods

        private static void Text(string? value, string field, Dictionary<string, string> errors)
        {
            if (value != null && value.Length > MaxTextLength) errors[field] = field + " is limited to " + MaxTextLength + " characters.";
        }

        private static string Text(int value)
        {
            return value.ToString(System.Globalization.CultureInfo.InvariantCulture);
        }

        #endregion
    }
}
