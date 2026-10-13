namespace Test.Shared.Infrastructure
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Services;
    using Garrison.Server.Leases;
    using Garrison.Server.Settings;

    /// <summary>Real Clutch checks with isolated Garrison persistence and no production credentials.</summary>
    public static class ClutchLeaseConformance
    {
        /// <summary>Check contention, renewal, explicit expiry, database fencing, and unavailable-provider behavior.</summary>
        /// <param name="endpoint">Temporary Clutch endpoint.</param>
        /// <param name="accessKey">Test fixture access key.</param>
        /// <param name="token">Test timeout.</param>
        /// <returns>Task.</returns>
        public static async Task RunAsync(string endpoint, string accessKey, CancellationToken token)
        {
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                using (DatabaseDriverBase database = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
                {
                    LeaseSettings settings = new LeaseSettings
                    {
                        ClutchEndpoint = endpoint, ClutchAccessKey = accessKey,
                        KeyPrefix = "conformance-" + Guid.NewGuid().ToString("N"),
                        RequestTimeoutMs = 2000, SweepIntervalMs = 50, MaxLeaseMs = 10000, MaxHoldMs = 10000
                    };
                    using (ClutchLeaseProvider first = new ClutchLeaseProvider(database.CoordinationLeases, settings))
                    using (ClutchLeaseProvider second = new ClutchLeaseProvider(database.CoordinationLeases, settings))
                    {
                        long? epoch = await first.TryAcquireAsync("leader", "a", 2000, token).ConfigureAwait(false);
                        Assert.True(epoch.HasValue, "First external holder acquires.");
                        Assert.True(!(await second.TryAcquireAsync("leader", "b", 2000, token).ConfigureAwait(false)).HasValue, "Second holder is denied.");
                        Assert.True(!await second.ReleaseAsync("leader", "b", token).ConfigureAwait(false), "A non-owner cannot release.");
                        Assert.Equal(epoch, await first.TryAcquireAsync("leader", "a", 2000, token).ConfigureAwait(false), "Explicit renewal retains database epoch.");
                        await Task.Delay(2300, token).ConfigureAwait(false);
                        long? successor = await second.TryAcquireAsync("leader", "b", 2000, token).ConfigureAwait(false);
                        Assert.True(successor.HasValue && successor > epoch, "SDK auto heartbeat cannot retain an explicitly expired Garrison hold.");
                        await second.ReleaseAsync("leader", "b", token).ConfigureAwait(false);

                        long? guarded = await first.TryAcquireAsync("disconnect", "a", 2000, token).ConfigureAwait(false);
                        Assert.True(guarded.HasValue, "Acquire before abrupt connection disposal.");
                        first.Dispose();
                        await Task.Delay(200, token).ConfigureAwait(false);
                        Assert.True(!(await second.TryAcquireAsync("disconnect", "b", 2000, token).ConfigureAwait(false)).HasValue, "Database guard prevents early remote regrant overlap.");
                        await Task.Delay(2100, token).ConfigureAwait(false);
                        Assert.True((await second.TryAcquireAsync("disconnect", "b", 2000, token).ConfigureAwait(false)).HasValue, "Successor acquires after durable validity window expires.");
                        await second.StopAsync(token).ConfigureAwait(false);
                    }
                    LeaseSettings unavailable = new LeaseSettings { ClutchEndpoint = "http://127.0.0.1:1", ClutchAccessKey = accessKey, RequestTimeoutMs = 250 };
                    using (ClutchLeaseProvider missing = new ClutchLeaseProvider(database.CoordinationLeases, unavailable))
                    {
                        Assert.True(!(await missing.TryAcquireAsync("unavailable", "a", 2000, token).ConfigureAwait(false)).HasValue, "Clutch outage does not fall back to database acquisition.");
                        Assert.True(await database.CoordinationLeases.ReadByNameAsync("unavailable", token).ConfigureAwait(false) == null, "Outage creates no database hold.");
                    }
                    ILeaseProvider defaultProvider = new DatabaseLeaseProvider(database.CoordinationLeases);
                    Assert.True((await defaultProvider.TryAcquireAsync("default", "a", 2000, token).ConfigureAwait(false)).HasValue, "Default provider needs no Clutch service.");
                    Assert.True(await defaultProvider.ReleaseAsync("default", "a", token).ConfigureAwait(false), "Default release works.");
                }
            }
        }
    }
}
