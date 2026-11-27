namespace Garrison.Server.Routes
{
    using System;
    using System.Text.RegularExpressions;

    /// <summary>
    /// One registered route in a <see cref="RouteMethodIndex"/>: its method and the pattern its path template matches.
    /// </summary>
    public class RouteMethodTemplate
    {
        /// <summary>
        /// HTTP method, upper case.
        /// </summary>
        public string Method { get; set; } = String.Empty;

        /// <summary>
        /// Pattern that matches concrete paths of the template, anchored at both ends.
        /// </summary>
        public Regex Pattern { get; set; } = new Regex("^$");
    }
}
