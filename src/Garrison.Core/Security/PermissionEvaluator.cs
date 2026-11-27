namespace Garrison.Core.Security
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;

    /// <summary>
    /// Evaluates expanded grants: explicit deny wins, then any permit, otherwise implicit deny. Thread-safe.
    /// </summary>
    public static class PermissionEvaluator
    {
        /// <summary>
        /// Evaluate.
        /// </summary>
        /// <param name="grants">Expanded grants.</param>
        /// <param name="resourceType">Requested resource type.</param>
        /// <param name="operation">Requested operation.</param>
        /// <param name="resourceId">Target resource identifier, or null for tenant-level operations.</param>
        /// <returns>Decision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when grants is null.</exception>
        public static AuthorizationDecision Evaluate(IEnumerable<PermissionGrant> grants, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId)
        {
            return Evaluate(grants, resourceType, operation, resourceId, null);
        }

        /// <summary>
        /// Evaluate with the target's lineage: a resource-scoped grant on one of its aliases always matches, and one on an
        /// ancestor organization matches when it inherits to children (UT-01, UT-02).
        /// </summary>
        /// <param name="grants">Expanded grants.</param>
        /// <param name="resourceType">Requested resource type.</param>
        /// <param name="operation">Requested operation.</param>
        /// <param name="resourceId">Target resource identifier, or null for tenant-level operations.</param>
        /// <param name="lineage">Aliases and ancestor organizations of the target, or null for none.</param>
        /// <returns>Decision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when grants is null.</exception>
        public static AuthorizationDecision Evaluate(IEnumerable<PermissionGrant> grants, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId, ResourceLineage? lineage)
        {
            if (grants == null) throw new ArgumentNullException(nameof(grants));

            List<PermissionGrant> matched = grants.Where(g => Matches(g, resourceType, operation, resourceId, lineage)).ToList();
            List<PermissionGrant> denies = matched.Where(g => g.PermissionType == PermissionTypeEnum.Deny).ToList();
            if (denies.Any())
            {
                AuthorizationDecision denied = AuthorizationDecision.Deny(AuthorizationResultEnum.DeniedExplicit, "Explicitly denied by role " + denies[0].Source + ".");
                denied.MatchedGrants = denies;
                return denied;
            }

            List<PermissionGrant> permits = matched.Where(g => g.PermissionType == PermissionTypeEnum.Permit).ToList();
            if (permits.Any())
            {
                AuthorizationDecision permitted = AuthorizationDecision.Permit("Permitted by role " + permits[0].Source + ".");
                permitted.MatchedGrants = permits;
                return permitted;
            }

            return AuthorizationDecision.Deny(AuthorizationResultEnum.DeniedImplicit, "No grant covers " + operation + " on " + resourceType + ".");
        }

        /// <summary>
        /// Whether one grant matches the request.
        /// </summary>
        /// <param name="grant">Grant.</param>
        /// <param name="resourceType">Resource type.</param>
        /// <param name="operation">Operation.</param>
        /// <param name="resourceId">Resource identifier.</param>
        /// <returns>True when it matches.</returns>
        public static bool Matches(PermissionGrant grant, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId)
        {
            return Matches(grant, resourceType, operation, resourceId, null);
        }

        /// <summary>
        /// Whether one grant matches the request, given the target's lineage.
        /// </summary>
        /// <param name="grant">Grant.</param>
        /// <param name="resourceType">Resource type.</param>
        /// <param name="operation">Operation.</param>
        /// <param name="resourceId">Resource identifier.</param>
        /// <param name="lineage">Aliases and ancestor organizations of the target, or null for none.</param>
        /// <returns>True when it matches.</returns>
        public static bool Matches(PermissionGrant grant, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId, ResourceLineage? lineage)
        {
            if (grant == null) return false;
            if (!TypeAndOperationMatch(grant, resourceType, operation)) return false;

            if (grant.Scope == ResourceScopeEnum.Resource)
            {
                if (String.IsNullOrEmpty(resourceId) || String.IsNullOrEmpty(grant.ResourceId)) return false;
                if (String.Equals(grant.ResourceId, resourceId, StringComparison.Ordinal)) return true;
                if (lineage == null) return false;
                if (lineage.Aliases.Contains(grant.ResourceId)) return true;
                return grant.InheritsToChildren && lineage.Ancestors.Contains(grant.ResourceId);
            }

            if (!String.IsNullOrEmpty(resourceId) && !grant.InheritsToChildren) return false;
            return true;
        }

        /// <summary>
        /// Whether a grant covers a resource type and operation, ignoring its scope.
        /// </summary>
        /// <param name="grant">Grant.</param>
        /// <param name="resourceType">Resource type.</param>
        /// <param name="operation">Operation.</param>
        /// <returns>True when the grant names the type and operation (directly, through All, or through Write).</returns>
        public static bool TypeAndOperationMatch(PermissionGrant grant, ResourceTypeEnum resourceType, OperationTypeEnum operation)
        {
            if (grant == null) return false;
            return ResourceMatches(grant.ResourceTypes, resourceType) && OperationMatches(grant.Operations, operation);
        }

        /// <summary>
        /// Whether the grants let the principal perform the operation on at least one resource of the type: a permit at
        /// any scope counts, and only a deny that is not resource-scoped takes it away (UT-19, used to list the MCP tools a
        /// principal could call).
        /// </summary>
        /// <param name="grants">Expanded grants.</param>
        /// <param name="resourceType">Resource type.</param>
        /// <param name="operation">Operation.</param>
        /// <returns>True when some resource of the type could be permitted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when grants is null.</exception>
        public static bool PermitsSomewhere(IEnumerable<PermissionGrant> grants, ResourceTypeEnum resourceType, OperationTypeEnum operation)
        {
            if (grants == null) throw new ArgumentNullException(nameof(grants));
            List<PermissionGrant> matched = grants.Where(g => TypeAndOperationMatch(g, resourceType, operation)).ToList();
            if (matched.Any(g => g.PermissionType == PermissionTypeEnum.Deny && g.Scope != ResourceScopeEnum.Resource)) return false;
            return matched.Any(g => g.PermissionType == PermissionTypeEnum.Permit);
        }

        private static bool ResourceMatches(List<string> types, ResourceTypeEnum requested)
        {
            foreach (string type in types)
            {
                if (String.Equals(type, "All", StringComparison.OrdinalIgnoreCase)) return true;
                if (String.Equals(type, requested.ToString(), StringComparison.OrdinalIgnoreCase)) return true;
            }
            return false;
        }

        private static bool OperationMatches(List<string> operations, OperationTypeEnum requested)
        {
            foreach (string op in operations)
            {
                if (String.Equals(op, "All", StringComparison.OrdinalIgnoreCase)) return true;
                if (String.Equals(op, requested.ToString(), StringComparison.OrdinalIgnoreCase)) return true;
                if (String.Equals(op, "Write", StringComparison.OrdinalIgnoreCase) &&
                    (requested == OperationTypeEnum.Create || requested == OperationTypeEnum.Update || requested == OperationTypeEnum.Delete || requested == OperationTypeEnum.Write)) return true;
            }
            return false;
        }
    }
}
