namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;

    /// <summary>
    /// Builds and binds a parameterized IN list ("column IN (@p0, @p1, ...)") for a list of values. Values are always bound
    /// as parameters, never written into the SQL text. Thread-safe (stateless).
    /// </summary>
    public static class AdoInList
    {
        #region Public-Methods

        /// <summary>
        /// The clause for a column and a value count.
        /// </summary>
        /// <param name="column">Column name, written as is (callers pass fixed column names only).</param>
        /// <param name="prefix">Parameter name prefix, distinct within the statement.</param>
        /// <param name="count">Number of values. Minimum 1.</param>
        /// <returns>The clause.</returns>
        /// <exception cref="ArgumentNullException">Thrown when column or prefix is null or empty.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when count is below 1.</exception>
        public static string Clause(string column, string prefix, int count)
        {
            if (String.IsNullOrEmpty(column)) throw new ArgumentNullException(nameof(column));
            if (String.IsNullOrEmpty(prefix)) throw new ArgumentNullException(nameof(prefix));
            if (count < 1) throw new ArgumentOutOfRangeException(nameof(count), "An IN list needs at least one value.");
            List<string> names = new List<string>();
            for (int i = 0; i < count; i++) names.Add("@" + prefix + i);
            return column + " IN (" + String.Join(", ", names) + ")";
        }

        /// <summary>
        /// Bind the values of a clause built with the same prefix.
        /// </summary>
        /// <param name="command">Command.</param>
        /// <param name="prefix">Parameter name prefix.</param>
        /// <param name="values">Values.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static void Bind(DbCommand command, string prefix, List<string> values)
        {
            if (command == null) throw new ArgumentNullException(nameof(command));
            if (String.IsNullOrEmpty(prefix)) throw new ArgumentNullException(nameof(prefix));
            if (values == null) throw new ArgumentNullException(nameof(values));
            for (int i = 0; i < values.Count; i++) AdoDatabaseDriver.Add(command, prefix + i, values[i]);
        }

        #endregion
    }
}
