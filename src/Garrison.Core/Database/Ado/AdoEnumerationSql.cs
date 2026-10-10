namespace Garrison.Core.Database.Ado
{
    using Garrison.Core.Enums;

    /// <summary>
    /// ORDER BY rendering for enumeration queries. Thread-safe.
    /// </summary>
    public static class AdoEnumerationSql
    {
        /// <summary>
        /// Render an ORDER BY clause. Name ordering falls back to creation time for entities without a name.
        /// </summary>
        /// <param name="ordering">Requested ordering.</param>
        /// <param name="hasName">Whether the table has a name column.</param>
        /// <returns>Clause with a leading space.</returns>
        public static string OrderBy(EnumerationOrderEnum ordering, bool hasName)
        {
            switch (ordering)
            {
                case EnumerationOrderEnum.CreatedAscending:
                    return " ORDER BY createdutc ASC, id ASC";
                case EnumerationOrderEnum.NameAscending:
                    return hasName ? " ORDER BY name ASC, id ASC" : " ORDER BY createdutc ASC, id ASC";
                case EnumerationOrderEnum.NameDescending:
                    return hasName ? " ORDER BY name DESC, id DESC" : " ORDER BY createdutc DESC, id DESC";
                default:
                    return " ORDER BY createdutc DESC, id DESC";
            }
        }
    }
}
