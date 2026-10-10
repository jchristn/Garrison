namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Resolves test database providers and builds isolated database settings for each test.
    /// Providers come from GARRISON_TEST_PROVIDERS (comma-separated, default sqlite).
    /// Postgresql connection: GARRISON_TEST_PG_HOST (127.0.0.1), GARRISON_TEST_PG_PORT (55432),
    /// GARRISON_TEST_PG_DATABASE (garrison), GARRISON_TEST_PG_USERNAME (postgres), GARRISON_TEST_PG_PASSWORD (garrison).
    /// </summary>
    public static class TestEnvironment
    {
        /// <summary>
        /// Providers selected for this run.
        /// </summary>
        /// <returns>Providers.</returns>
        public static List<DatabaseTypeEnum> Providers()
        {
            string raw = Environment.GetEnvironmentVariable("GARRISON_TEST_PROVIDERS") ?? "sqlite";
            List<DatabaseTypeEnum> providers = new List<DatabaseTypeEnum>();
            foreach (string part in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (Enum.TryParse<DatabaseTypeEnum>(part, true, out DatabaseTypeEnum parsed) && !providers.Contains(parsed)) providers.Add(parsed);
            }
            if (providers.Count == 0) providers.Add(DatabaseTypeEnum.Sqlite);
            return providers;
        }

        /// <summary>
        /// Build isolated settings: a fresh Sqlite file, or a fresh Postgresql schema.
        /// </summary>
        /// <param name="provider">Provider.</param>
        /// <returns>Settings.</returns>
        public static DatabaseSettings IsolatedSettings(DatabaseTypeEnum provider)
        {
            DatabaseSettings settings = new DatabaseSettings();
            settings.Type = provider;
            if (provider == DatabaseTypeEnum.Sqlite)
            {
                settings.Filename = Path.Combine(Path.GetTempPath(), "garrison-test", Guid.NewGuid().ToString("N") + ".db");
            }
            else
            {
                settings.Host = Env("GARRISON_TEST_PG_HOST", "127.0.0.1");
                settings.Port = Int32.Parse(Env("GARRISON_TEST_PG_PORT", "55432"));
                settings.DatabaseName = Env("GARRISON_TEST_PG_DATABASE", "garrison");
                settings.Username = Env("GARRISON_TEST_PG_USERNAME", "postgres");
                settings.Password = Env("GARRISON_TEST_PG_PASSWORD", "garrison");
                settings.Schema = "t_" + Guid.NewGuid().ToString("N").Substring(0, 16);
                settings.MaxPoolSize = 20;
            }
            return settings;
        }

        /// <summary>
        /// Create and initialize an isolated driver.
        /// </summary>
        /// <param name="provider">Provider.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Driver.</returns>
        public static async Task<DatabaseDriverBase> CreateDriverAsync(DatabaseTypeEnum provider, CancellationToken token = default)
        {
            return await DatabaseDriverFactory.CreateAndInitializeAsync(IsolatedSettings(provider), token).ConfigureAwait(false);
        }

        private static string Env(string name, string fallback)
        {
            string? value = Environment.GetEnvironmentVariable(name);
            return String.IsNullOrEmpty(value) ? fallback : value;
        }
    }
}
