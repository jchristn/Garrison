namespace Garrison.Server
{
    using System;
    using System.Collections.Generic;
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

            // The liveness port answers from its own thread for the whole life of the process, before migrations and
            // under overload, without the database or the REST request queue (G-24).
            LivenessListener? liveness = null;
            if (settings.Rest.LivenessPort > 0)
            {
                liveness = new LivenessListener(settings.Rest.Hostname, settings.Rest.LivenessPort, settings.EffectiveNodeId);
                if (liveness.Start()) logging.Info("[Garrison] liveness listening on " + settings.Rest.Hostname + ":" + settings.Rest.LivenessPort + "/v1.0/api/health/live");
                else logging.Warn("[Garrison] liveness port " + settings.Rest.LivenessPort + " could not be bound; /v1.0/api/health/live is still served on the REST port");
            }

            // Until the real listener starts, liveness answers 200 and readiness 503, so a replica waiting for another
            // replica's migrations (or running them) is neither killed nor sent traffic (P10.9).
            StartupHealthListener startupHealth = new StartupHealthListener(settings.Rest.Hostname, settings.Rest.Port, settings.EffectiveNodeId);
            startupHealth.Start();
            try
            {
                GarrisonServer server = await StartCoreAsync(settings, logging, startupHealth, token).ConfigureAwait(false);
                if (liveness != null)
                {
                    liveness.Status = () => server.Context.IsDraining ? "draining" : "alive";
                    server.Liveness = liveness;
                }
                return server;
            }
            catch
            {
                liveness?.Dispose();
                throw;
            }
            finally
            {
                startupHealth.Dispose();
            }
        }

        /// <summary>
        /// Build logging from settings.
        /// </summary>
        /// <param name="settings">Logging settings.</param>
        /// <returns>Logging module.</returns>
        public static LoggingModule BuildLogging(Garrison.Server.Settings.LoggingSettings settings)
        {
            LoggingModule logging = new LoggingModule();
            // Skip SyslogLogging's terminal probe: containers have no terminal, but their stdout is still collected
            // (kubectl logs, docker logs), so the probe would silently turn console output off.
            logging.Settings.DetectConsole = false;
            logging.Settings.EnableConsole = settings.ConsoleLogging;
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

        private static async Task<GarrisonServer> StartCoreAsync(ServerSettings settings, LoggingModule logging, StartupHealthListener startupHealth, CancellationToken token)
        {
            logging.Info("[Garrison] waiting for the database startup lock (migrations run under it, one replica at a time)");
            DatabaseDriverBase database = await DatabaseDriverFactory.CreateAndInitializeAsync(settings.Database, token).ConfigureAwait(false);
            if (database.MigrationsApplied > 0) logging.Info("[Garrison] applied " + database.MigrationsApplied + " schema migrations");
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
            List<string> insecure = settings.InsecureDefaults();
            if (insecure.Count > 0) logging.Warn("[Garrison] development mode (GARRISON_ALLOW_INSECURE_DEFAULTS): " + String.Join(", ", insecure) + (insecure.Count == 1 ? " is" : " are") + " empty or the public built-in default. Anyone who knows the defaults has administrator access. Never expose this server.");
            if (!SecretCipher.IsStrongKey(settings.Security.MasterKey)) logging.Warn("[Garrison] Security.MasterKey is not base64 of 32 bytes, so it is hashed with SHA-256 without stretching. Use a random key such as the output of openssl rand -base64 32.");
            if (!TokenService.IsStrongKey(settings.Auth.SigningKey)) logging.Warn("[Garrison] Auth.SigningKey is shorter than 32 characters. Use at least 32 random bytes.");

            SeedOptions seed = new SeedOptions();
            seed.AdminEmail = settings.Security.AdminEmail;
            seed.AdminPassword = settings.Security.AdminPassword;
            seed.PasswordHashIterations = settings.Auth.PasswordHashIterations;
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
            server.BeforeListen = startupHealth.Stop;
            await server.StartAsync(token).ConfigureAwait(false);
            return server;
        }

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
