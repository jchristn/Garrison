namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enumeration;

    /// <summary>
    /// Builds query parameter dictionaries. Thread-safe.
    /// </summary>
    public static class QueryBuilder
    {
        /// <summary>
        /// Query parameters for an enumeration query.
        /// </summary>
        /// <param name="query">Query, or null for defaults.</param>
        /// <returns>Parameters.</returns>
        public static Dictionary<string, string?> From(EnumerationQuery? query)
        {
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (query == null) return parameters;
            parameters["maxResults"] = query.MaxResults.ToString();
            parameters["skip"] = query.Skip.ToString();
            parameters["ordering"] = query.Ordering.ToString();
            parameters["search"] = query.Search;
            if (query.ActiveOnly) parameters["activeOnly"] = "true";
            if (!query.IncludeBuiltIn) parameters["includeBuiltIn"] = "false";
            return parameters;
        }

        /// <summary>
        /// Format a timestamp for a query parameter.
        /// </summary>
        /// <param name="value">Value.</param>
        /// <returns>ISO 8601 UTC text, or null.</returns>
        public static string? Date(DateTime? value)
        {
            if (!value.HasValue) return null;
            return value.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ", System.Globalization.CultureInfo.InvariantCulture);
        }
    }
}
