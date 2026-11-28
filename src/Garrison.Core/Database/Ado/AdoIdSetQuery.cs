namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Runs a tenant-scoped query over a set of identifiers in chunks (LP1.4), so a batched read never builds an IN list
    /// longer than the providers accept. Each chunk binds the tenant as @tenantid, the identifiers as @i0, @i1, and so on,
    /// and the remaining row budget as @max with @skip 0. Thread-safe.
    /// </summary>
    public static class AdoIdSetQuery
    {
        #region Public-Members

        /// <summary>
        /// Most identifiers bound into one statement. Default 200, minimum 1, maximum 900 (Sqlite allows 999 bound
        /// parameters in older builds, and each statement also binds the tenant, max, and skip).
        /// </summary>
        public static int ChunkSize
        {
            get
            {
                return _ChunkSize;
            }
            set
            {
                _ChunkSize = Math.Clamp(value, 1, 900);
            }
        }

        #endregion

        #region Private-Members

        private static int _ChunkSize = 200;

        #endregion

        #region Public-Methods

        /// <summary>
        /// The distinct non-empty identifiers of a set, in first-seen order.
        /// </summary>
        /// <param name="ids">Identifiers, or null.</param>
        /// <returns>Cleaned identifiers; never null.</returns>
        public static List<string> Clean(IEnumerable<string?>? ids)
        {
            List<string> result = new List<string>();
            if (ids == null) return result;
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            foreach (string? id in ids)
            {
                if (String.IsNullOrEmpty(id)) continue;
                if (seen.Add(id)) result.Add(id);
            }
            return result;
        }

        /// <summary>
        /// Query rows whose column matches any identifier in a set, chunk by chunk, until the row budget is spent.
        /// </summary>
        /// <typeparam name="T">Row type.</typeparam>
        /// <param name="driver">Driver.</param>
        /// <param name="tenantId">Tenant identifier, bound as @tenantid.</param>
        /// <param name="ids">Identifiers; empty and duplicate values are ignored.</param>
        /// <param name="sql">Builds the statement from the IN list text (for example "@i0, @i1"). The statement must bind
        /// @tenantid, and @max and @skip when it pages.</param>
        /// <param name="map">Row mapper.</param>
        /// <param name="limit">Most rows across all chunks. Clamped to 1 through 100000.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows in chunk order; at most limit.</returns>
        /// <exception cref="ArgumentNullException">Thrown when driver, tenantId, sql, or map is null or empty.</exception>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled.</exception>
        public static async Task<List<T>> QueryAsync<T>(AdoDatabaseDriver driver, string tenantId, IEnumerable<string?>? ids, Func<string, string> sql, Func<DbDataReader, T> map, int limit, CancellationToken token = default)
        {
            if (driver == null) throw new ArgumentNullException(nameof(driver));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (sql == null) throw new ArgumentNullException(nameof(sql));
            if (map == null) throw new ArgumentNullException(nameof(map));
            List<string> clean = Clean(ids);
            List<T> rows = new List<T>();
            int budget = Math.Clamp(limit, 1, 100000);
            for (int start = 0; start < clean.Count && rows.Count < budget; start += _ChunkSize)
            {
                token.ThrowIfCancellationRequested();
                List<string> chunk = clean.Skip(start).Take(_ChunkSize).ToList();
                List<string> names = new List<string>();
                for (int i = 0; i < chunk.Count; i++) names.Add("@i" + i);
                int remaining = budget - rows.Count;
                List<T> found = await driver.QueryAsync(
                    sql(String.Join(", ", names)),
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                        for (int i = 0; i < chunk.Count; i++) AdoDatabaseDriver.Add(command, "i" + i, chunk[i]);
                        AdoDatabaseDriver.Add(command, "max", remaining);
                        AdoDatabaseDriver.Add(command, "skip", 0);
                    },
                    map,
                    token).ConfigureAwait(false);
                rows.AddRange(found.Take(remaining));
            }
            return rows;
        }

        #endregion
    }
}
