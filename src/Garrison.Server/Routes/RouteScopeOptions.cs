namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// How a scoped route with no resource in its path (a list) serves a principal that is not permitted tenant-wide
    /// (UT-01). A query parameter that names a target is authorized against that target, so a grant scoped to an
    /// organization covers a list filtered to one of its units, agents, or keepers. Without such a parameter, a route
    /// that filters by organization serves the organizations the principal's scoped grants cover, through
    /// <see cref="Garrison.Core.Security.RequestContext.ScopedOrganizationIds"/>. Not thread-safe; build it at
    /// registration.
    /// </summary>
    public class RouteScopeOptions
    {
        #region Public-Members

        /// <summary>
        /// Query parameters that name a target, in the order they are tried, with the resource type used to resolve a
        /// target given by name. The first one present is the target. Never null.
        /// </summary>
        public List<RouteScopeQueryTarget> QueryTargets
        {
            get
            {
                return _QueryTargets;
            }
            set
            {
                _QueryTargets = value ?? new List<RouteScopeQueryTarget>();
            }
        }

        /// <summary>
        /// True when the handler filters its list by <see cref="Garrison.Core.Security.RequestContext.ScopedOrganizationIds"/>.
        /// Default false: without a query target such a principal is refused.
        /// </summary>
        public bool OrganizationFiltered { get; set; } = false;

        #endregion

        #region Private-Members

        private List<RouteScopeQueryTarget> _QueryTargets = new List<RouteScopeQueryTarget>();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Add a query target.
        /// </summary>
        /// <param name="parameter">Query parameter name.</param>
        /// <param name="targetType">Resource type used to resolve a target given by name.</param>
        /// <returns>This instance.</returns>
        /// <exception cref="ArgumentNullException">Thrown when parameter is null or empty.</exception>
        public RouteScopeOptions Query(string parameter, ResourceTypeEnum targetType)
        {
            if (String.IsNullOrEmpty(parameter)) throw new ArgumentNullException(nameof(parameter));
            RouteScopeQueryTarget target = new RouteScopeQueryTarget();
            target.Parameter = parameter;
            target.TargetType = targetType;
            _QueryTargets.Add(target);
            return this;
        }

        /// <summary>
        /// Mark the route as filtering by organization.
        /// </summary>
        /// <returns>This instance.</returns>
        public RouteScopeOptions FilteredByOrganization()
        {
            OrganizationFiltered = true;
            return this;
        }

        #endregion
    }
}
