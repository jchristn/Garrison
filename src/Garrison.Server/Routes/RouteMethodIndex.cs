namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Text.RegularExpressions;

    /// <summary>
    /// Answers which HTTP methods the registered routes accept on a concrete path, from the operation scope map, so a
    /// request with an unsupported method on a known path can answer 405 with an Allow header (UT-20). Path parameters
    /// match one segment. The index is rebuilt when the number of registered routes changes. Thread-safe.
    /// </summary>
    public class RouteMethodIndex
    {
        #region Private-Members

        private static readonly HashSet<string> _HttpMethods = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        };

        private readonly OperationScopeMap _Scopes;
        private readonly object _Lock = new object();
        private List<RouteMethodTemplate> _Templates = new List<RouteMethodTemplate>();
        private int _Count = -1;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="scopes">Operation scope map holding every registered route.</param>
        /// <exception cref="ArgumentNullException">Thrown when scopes is null.</exception>
        public RouteMethodIndex(OperationScopeMap scopes)
        {
            _Scopes = scopes ?? throw new ArgumentNullException(nameof(scopes));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The methods registered for a path, upper case and sorted, or an empty list when no route has that path.
        /// </summary>
        /// <param name="path">Request path without the query string.</param>
        /// <returns>Methods.</returns>
        public List<string> MethodsFor(string? path)
        {
            if (String.IsNullOrEmpty(path)) return new List<string>();
            string normalized = path.Length > 1 && path.EndsWith("/", StringComparison.Ordinal) ? path.TrimEnd('/') : path;
            List<RouteMethodTemplate> templates = Templates();
            SortedSet<string> methods = new SortedSet<string>(StringComparer.Ordinal);
            foreach (RouteMethodTemplate template in templates)
            {
                if (template.Pattern.IsMatch(normalized)) methods.Add(template.Method);
            }
            return methods.ToList();
        }

        #endregion

        #region Private-Methods

        private List<RouteMethodTemplate> Templates()
        {
            List<OperationScope> scopes = _Scopes.All();
            lock (_Lock)
            {
                if (scopes.Count == _Count) return _Templates;
                List<RouteMethodTemplate> templates = new List<RouteMethodTemplate>();
                foreach (OperationScope scope in scopes)
                {
                    if (!_HttpMethods.Contains(scope.Method) || String.IsNullOrEmpty(scope.Path) || !scope.Path.StartsWith("/", StringComparison.Ordinal)) continue;
                    RouteMethodTemplate template = new RouteMethodTemplate();
                    template.Method = scope.Method.ToUpperInvariant();
                    template.Pattern = new Regex(Pattern(scope.Path), RegexOptions.Compiled | RegexOptions.CultureInvariant);
                    templates.Add(template);
                }
                _Templates = templates;
                _Count = scopes.Count;
                return _Templates;
            }
        }

        private static string Pattern(string template)
        {
            StringBuilder builder = new StringBuilder("^");
            int index = 0;
            foreach (Match match in Regex.Matches(template, @"\{[A-Za-z0-9_]+\}"))
            {
                builder.Append(Regex.Escape(template.Substring(index, match.Index - index)));
                builder.Append("[^/]+");
                index = match.Index + match.Length;
            }
            builder.Append(Regex.Escape(template.Substring(index)));
            builder.Append('$');
            return builder.ToString();
        }

        #endregion
    }
}
