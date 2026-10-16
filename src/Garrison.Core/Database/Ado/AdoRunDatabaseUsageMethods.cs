namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Models;

    /// <summary>Atomic provider-neutral cumulative per-run database statement attribution.</summary>
    public class AdoRunDatabaseUsageMethods : IRunDatabaseUsageMethods
    {
        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        /// <summary>Create persistence.</summary>
        /// <param name="driver">Database driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoRunDatabaseUsageMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("run_database_usage");
        }
        /// <inheritdoc />
        public async Task AddAsync(RunDatabaseUsage usage, CancellationToken token = default)
        {
            if (usage == null) throw new ArgumentNullException(nameof(usage));
            if (usage.Statements == 0 && usage.Transactions == 0) return;
            await _Driver.NonQueryAsync("INSERT INTO " + _Table + " AS current_usage (tenantid,runid,operation,statements,reads,writes,errors,transactions,durationmicroseconds) SELECT tenantid,id,@operation,@statements,@reads,@writes,@errors,@transactions,@duration FROM " + _Driver.Table("runs") + " WHERE id=@run AND (tenantid=@tenant OR @tenant='') ON CONFLICT (tenantid,runid,operation) DO UPDATE SET statements=current_usage.statements+@statements, reads=current_usage.reads+@reads, writes=current_usage.writes+@writes, errors=current_usage.errors+@errors, transactions=current_usage.transactions+@transactions, durationmicroseconds=current_usage.durationmicroseconds+@duration;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenant", usage.TenantId); AdoDatabaseDriver.Add(command, "run", usage.RunId);
                AdoDatabaseDriver.Add(command, "operation", usage.Operation); AdoDatabaseDriver.Add(command, "statements", usage.Statements);
                AdoDatabaseDriver.Add(command, "reads", usage.Reads); AdoDatabaseDriver.Add(command, "writes", usage.Writes);
                AdoDatabaseDriver.Add(command, "errors", usage.Errors); AdoDatabaseDriver.Add(command, "transactions", usage.Transactions);
                AdoDatabaseDriver.Add(command, "duration", usage.DurationMicroseconds);
            }, token).ConfigureAwait(false);
        }
        /// <inheritdoc />
        public Task<List<RunDatabaseUsage>> ListAsync(string tenantId, string runId, CancellationToken token = default)
        {
            return _Driver.QueryAsync("SELECT tenantid,runid,operation,statements,reads,writes,errors,transactions,durationmicroseconds FROM " + _Table + " WHERE tenantid=@tenant AND runid=@run ORDER BY operation;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "run", runId);
            }, Map, token);
        }
        private static RunDatabaseUsage Map(DbDataReader reader)
        {
            return new RunDatabaseUsage { TenantId = reader.GetString(0), RunId = reader.GetString(1), Operation = reader.GetString(2), Statements = Convert.ToInt64(reader.GetValue(3)), Reads = Convert.ToInt64(reader.GetValue(4)), Writes = Convert.ToInt64(reader.GetValue(5)), Errors = Convert.ToInt64(reader.GetValue(6)), Transactions = Convert.ToInt64(reader.GetValue(7)), DurationMicroseconds = Convert.ToInt64(reader.GetValue(8)) };
        }
    }
}
