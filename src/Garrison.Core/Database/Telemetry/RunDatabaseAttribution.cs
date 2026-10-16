namespace Garrison.Core.Database.Telemetry
{
    using System;
    using System.Threading;
    using Garrison.Core.Models;

    /// <summary>
    /// Async-flow-local exact run attribution. Parallel children share atomic counters; nested scopes for the same run
    /// reuse the outer scope, avoiding double counts. Other runs replace attribution until disposed. No global run cache.
    /// </summary>
    public class RunDatabaseAttribution : IDisposable
    {
        private static readonly AsyncLocal<RunDatabaseAttribution?> _Current = new AsyncLocal<RunDatabaseAttribution?>();
        private readonly RunDatabaseAttribution? _Previous;
        private readonly RunDatabaseUsage _Identity;
        private long _Statements;
        private long _Reads;
        private long _Writes;
        private long _Errors;
        private long _Transactions;
        private long _DurationMicroseconds;
        private bool _Disposed;

        /// <summary>Whether the current scope already attributes work to this tenant and run.</summary>
        public static bool Contains(string tenantId, string runId)
        {
            return _Current.Value?._Identity.RunId == runId && (string.IsNullOrEmpty(tenantId) || string.IsNullOrEmpty(_Current.Value?._Identity.TenantId) || _Current.Value?._Identity.TenantId == tenantId);
        }

        /// <summary>Start a scope in the calling execution context. Dispose in the same logical context.</summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="operation">Fixed lifecycle operation name.</param>
        public RunDatabaseAttribution(string tenantId, string runId, string operation)
        {
            _Identity = new RunDatabaseUsage { TenantId = tenantId, RunId = runId, Operation = operation };
            _Previous = _Current.Value;
            _Current.Value = this;
        }

        /// <summary>Record a centrally executed statement attempt. Telemetry's own writes are excluded.</summary>
        /// <param name="statement">Parsed statement metadata, never values.</param>
        /// <param name="elapsedSeconds">Wall time.</param>
        /// <param name="failed">Whether the attempt failed.</param>
        public static void Record(DatabaseStatement statement, double elapsedSeconds, bool failed)
        {
            RunDatabaseAttribution? scope = _Current.Value;
            if (scope == null || scope._Disposed || statement.Table.EndsWith("run_database_usage", StringComparison.Ordinal)) return;
            if (statement.Operation == "transaction")
            {
                Interlocked.Increment(ref scope._Transactions);
                return;
            }
            Interlocked.Increment(ref scope._Statements);
            if (statement.Operation == "select") Interlocked.Increment(ref scope._Reads);
            if (statement.Operation == "insert" || statement.Operation == "update" || statement.Operation == "delete" || statement.Operation == "upsert") Interlocked.Increment(ref scope._Writes);
            if (failed) Interlocked.Increment(ref scope._Errors);
            Interlocked.Add(ref scope._DurationMicroseconds, (long)Math.Max(0, elapsedSeconds * 1000000));
        }

        /// <summary>Read an atomic snapshot after all attributed child work has completed.</summary>
        /// <returns>Usage snapshot.</returns>
        public RunDatabaseUsage Snapshot()
        {
            return new RunDatabaseUsage
            {
                TenantId = _Identity.TenantId, RunId = _Identity.RunId, Operation = _Identity.Operation,
                Statements = Interlocked.Read(ref _Statements), Reads = Interlocked.Read(ref _Reads),
                Writes = Interlocked.Read(ref _Writes), Errors = Interlocked.Read(ref _Errors),
                Transactions = Interlocked.Read(ref _Transactions), DurationMicroseconds = Interlocked.Read(ref _DurationMicroseconds)
            };
        }

        /// <summary>Restore the previous attribution scope.</summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>Restore the previous attribution scope once.</summary>
        /// <param name="disposing">Whether called explicitly.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) _Current.Value = _Previous;
            _Disposed = true;
        }
    }
}
