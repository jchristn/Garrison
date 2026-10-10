namespace Garrison.Server
{
    using System;
    using System.Runtime.InteropServices;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Routes;
    using Garrison.Server.Services;
    using Garrison.Server.Settings;
    using SyslogLogging;

    /// <summary>
    /// Composition root: settings, logging, database, seeding, services, server, and graceful shutdown.
    /// </summary>
    public static class Bootstrapper
    {
        #region Public-Methods

        /// <summary>
        /// Run the server until shutdown is signaled. Returns the process exit code.
        /// </summary>
        /// <param name="args">Command-line arguments; the first may be the settings file path.</param>
        /// <returns>Exit code.</returns>
        public static int Run(string[] args)
        {
            CancellationTokenSource shutdown = new CancellationTokenSource();
            Action signal = () =>
            {
                try
                {
                    shutdown.Cancel();
                }
                catch (ObjectDisposedException)
                {
                }
            };
            Console.CancelKeyPress += (sender, e) =>
            {
                e.Cancel = true;
                signal();
            };
            AppDomain.CurrentDomain.ProcessExit += (sender, e) => signal();
            using (PosixSignalRegistration sigterm = PosixSignalRegistration.Create(PosixSignal.SIGTERM, context =>
            {
                context.Cancel = true;
                signal();
            }))
            {
                return RunAsync(args, shutdown.Token).GetAwaiter().GetResult();
            }
        }

        /// <summary>
        /// Build and start a server, returning it without blocking. Used by tests and by <see cref="Run"/>.
        /// </summary>
        /// <param name="settings">Settings, already loaded and overridden.</param>
        /// <param name="logging">Logging.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Started server.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static async Task<GarrisonServer> StartAsync(ServerSettings settings, LoggingModule logging, CancellationToken token = default)
        {
            if (settings == null) throw new ArgumentNullException(nameof(settings));
            if (logging == null) throw new ArgumentNullException(nameof(logging));

            settings.Validate();

            DatabaseDriverBase database = await DatabaseDriverFactory.CreateAndInitializeAsync(settings.Database, token).ConfigureAwait(false);
            if (settings.Database.Type == DatabaseTypeEnum.Sqlite)
            {
                logging.Info("[Garrison] database initialized (Sqlite at " + settings.Database.Filename + ", schema version " + database.SchemaVersion + ")");
                logging.Warn("[Garrison] Sqlite is for development and single-node use only. Use Postgresql for clusters.");
            }
            else
            {
                logging.Info("[Garrison] database initialized (Postgresql at " + settings.Database.Host + ":" + settings.Database.Port + "/" + settings.Database.DatabaseName + ", schema version " + database.SchemaVersion + ")");
            }

            SecretCipher cipher = new SecretCipher(settings.Security.MasterKey, settings.Security.MasterKeyVersion);
            if (settings.Security.MasterKey == new SecuritySettings().MasterKey) logging.Warn("[Garrison] Security.MasterKey is the built-in default. Set GARRISON_MASTER_KEY before storing real secrets.");
            if (settings.Auth.SigningKey == new AuthSettings().SigningKey) logging.Warn("[Garrison] Auth.SigningKey is the built-in default. Set GARRISON_AUTH_SIGNING_KEY.");

            SeedOptions seed = new SeedOptions();
            seed.AdminEmail = settings.Security.AdminEmail;
            seed.AdminPassword = settings.Security.AdminPassword;
            seed.DefaultAccessKey = settings.Security.DefaultAccessKey;
            seed.DefaultSecretKey = settings.Security.DefaultSecretKey;
            seed.NodeAccessKey = settings.Security.NodeAccessKey;
            seed.NodeSecretKey = settings.Security.NodeSecretKey;
            Tenant defaultTenant = await new DefaultSeeder(database, cipher, message => logging.Info("[Garrison] " + message)).SeedAsync(seed, token).ConfigureAwait(false);

            AuditService audit = new AuditService(database, message => logging.Warn("[Garrison] " + message));
            TokenService tokens = new TokenService(settings.Auth.SigningKey, settings.Auth.Issuer, settings.Auth.TokenLifetimeMinutes);
            AuthenticationService authentication = new AuthenticationService(database, tokens, cipher, settings, audit);
            AuthorizationService authorization = new AuthorizationService(database, audit);
            GarrisonTelemetry telemetry = new GarrisonTelemetry(settings.Telemetry, settings.EffectiveNodeId, message =>
            {
                if (message.StartsWith("telemetry", StringComparison.Ordinal)) logging.Warn("[Garrison.Telemetry] " + message);
                else logging.Debug("[Garrison.Telemetry] " + message);
            });
            if (telemetry.PrometheusHostname != null)
            {
                logging.Info("[Garrison] metrics listening on " + telemetry.PrometheusHostname + ":" + settings.Telemetry.PrometheusPort + settings.Telemetry.PrometheusPath + (settings.Telemetry.ServeMetricsOnServicePort ? " (also served at /metrics on the REST port)" : String.Empty));
            }

            ServerContext context = new ServerContext(settings, logging, database, cipher, tokens, audit, authentication, authorization, telemetry, new OperationScopeMap());
            context.DefaultTenantId = defaultTenant.Id;

            GarrisonServer server = new GarrisonServer(context);
            await server.StartAsync(token).ConfigureAwait(false);
            return server;
        }

        /// <summary>
        /// Build logging from settings.
        /// </summary>
        /// <param name="settings">Logging settings.</param>
        /// <returns>Logging module.</returns>
        public static LoggingModule BuildLogging(Garrison.Server.Settings.LoggingSettings settings)
        {
            LoggingModule logging = new LoggingModule();
            // Only call the setter to turn the console off. Setting EnableConsole to true makes SyslogLogging probe for a
            // terminal (UserInteractive and WindowHeight), which fails in containers and silently disables console output,
            // so kubectl logs would show nothing. The LoggingModule default is already true and skips the probe.
            if (!settings.ConsoleLogging) logging.Settings.EnableConsole = false;
            logging.Settings.MinimumSeverity = (Severity)settings.MinimumSeverity;
            if (settings.FileLogging)
            {
                logging.Settings.FileLogging = FileLoggingMode.FileWithDate;
                logging.Settings.LogFilename = settings.LogDirectory + settings.LogFilename;
            }
            return logging;
        }

        #endregion

        #region Private-Methods

        private static async Task<int> RunAsync(string[] args, CancellationToken shutdown)
        {
            string settingsFile = ResolveSettingsFile(args);
            ServerSettings settings = ServerSettings.FromFile(settingsFile);
            if (!settings.Cluster.SettingsFileReadOnly && Environment.GetEnvironmentVariable("GARRISON_SETTINGS_READONLY") != "true")
            {
                try
                {
                    settings.ToFile(settingsFile);
                }
                catch (Exception e) when (e is UnauthorizedAccessException || e is System.IO.IOException)
                {
                    settings.Cluster.SettingsFileReadOnly = true;
                }
            }
            settings.ApplyEnvironment();

            LoggingModule logging = BuildLogging(settings.Logging);
            logging.Info("[Garrison] " + Constants.ProductName + " " + Constants.ProductVersion + " starting node " + settings.EffectiveNodeId + " with settings " + settingsFile);

            GarrisonServer server;
            try
            {
                server = await StartAsync(settings, logging, shutdown).ConfigureAwait(false);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                logging.Alert("[Garrison] startup failed: " + e.Message);
                return 1;
            }

            try
            {
                await Task.Delay(Timeout.Infinite, shutdown).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
            }

            logging.Info("[Garrison] stopping");
            using (CancellationTokenSource stopTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(20)))
            {
                await server.StopAsync(stopTimeout.Token).ConfigureAwait(false);
            }
            server.Dispose();
            server.Context.Telemetry.Dispose();
            server.Context.Database.Dispose();
            return RestartCoordinator.ExitCode;
        }

        private static string ResolveSettingsFile(string[] args)
        {
            string? fromEnv = Environment.GetEnvironmentVariable("GARRISON_SETTINGS_FILE");
            if (!String.IsNullOrEmpty(fromEnv)) return fromEnv;
            if (args != null && args.Length > 0 && !String.IsNullOrEmpty(args[0])) return args[0];
            return "garrison.json";
        }

        #endregion
    }
}
