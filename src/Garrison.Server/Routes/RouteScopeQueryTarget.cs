namespace Garrison.Server.Routes
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A query parameter that names the target a list is filtered to, for <see cref="RouteScopeOptions"/>.
    /// </summary>
    public class RouteScopeQueryTarget
    {
        /// <summary>
        /// Query parameter name.
        /// </summary>
        public string Parameter { get; set; } = String.Empty;

        /// <summary>
        /// Resource type used to resolve a target given by name rather than identifier.
        /// </summary>
        public ResourceTypeEnum TargetType { get; set; } = ResourceTypeEnum.Agent;
    }
}
