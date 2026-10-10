namespace Garrison.Worker
{
    using System;
    using System.Runtime.InteropServices;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Worker.Hosting;
    using Garrison.Worker.Settings;
    using SyslogLogging;

    /// <summary>
    /// Worker composition root: settings, logging, host, and graceful shutdown with drain.
    /// </summary>
    public static class Bootstrapper
    {
        #region Public-Methods

        /// <summary>
        /// Run the worker until SIGTERM or SIGINT, then drain (Kubernetes sends SIGTERM after the preStop hook).
        /// </summary>
        /// <param name="args">Arguments; the first may be the settings file path.</param>
        /// <returns>Exit code.</returns>
        public static int Run(string[] args)
        {
            using (CancellationTokenSource shutdown = new CancellationTokenSource())
            using (PosixSignalRegistration sigterm = PosixSignalRegistration.Create(PosixSignal.SIGTERM, context =>
            {
                context.Cancel = true;
                shutdown.Cancel();
            }))
            using (PosixSignalRegistration sigint = PosixSignalRegistration.Create(PosixSignal.SIGINT, context =>
            {
                context.Cancel = true;
                shutdown.Cancel();
            }))
            {
                return RunAsync(args, shutdown.Token).GetAwaiter().GetResult();
            }
        }

        /// <summary>
        /// Build logging from settings.
        /// </summary>
        /// <param name="settings">Logging settings.</param>
        /// <returns>Logging.</returns>
        public static LoggingModule BuildLogging(WorkerLoggingSettings settings)
        {
            LoggingModule logging = new LoggingModule();
            // Only call the setter to turn the console off. Setting EnableConsole to true makes SyslogLogging probe for a
            // terminal (UserInteractive and WindowHeight), which fails in containers and silently disables console output,
            // so kubectl logs would show nothing. The LoggingModule default is already true and skips the probe.
            if (!settings.ConsoleLogging) logging.Settings.EnableConsole = false;
            logging.Settings.MinimumSeverity = (Severity)settings.MinimumSeverity;
            return logging;
        }

        /// <summary>
        /// Load settings from the file named by GARRISON_WORKER_SETTINGS_FILE, the first argument, or garrison-worker.json,
        /// then apply environment overrides.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <returns>Settings.</returns>
        public static WorkerSettings LoadSettings(string[] args)
        {
            string? path = Environment.GetEnvironmentVariable("GARRISON_WORKER_SETTINGS_FILE");
            if (String.IsNullOrEmpty(path)) path = args != null && args.Length > 0 && !String.IsNullOrEmpty(args[0]) ? args[0] : "garrison-worker.json";
            WorkerSettings settings = WorkerSettings.FromFile(path);
            settings.ApplyEnvironment();
            return settings;
        }

        #endregion

        #region Private-Methods

        private static async Task<int> RunAsync(string[] args, CancellationToken shutdown)
        {
            WorkerSettings settings;
            try
            {
                settings = LoadSettings(args);
            }
            catch (Exception e) when (e is System.IO.InvalidDataException || e is ArgumentException)
            {
                Console.Error.WriteLine("[Garrison.Worker] invalid settings: " + e.Message);
                return 1;
            }

            LoggingModule logging = BuildLogging(settings.Logging);
            logging.Info("[Worker] Garrison worker " + settings.EffectiveNodeName + " starting against " + settings.ServerUrl + " (work root " + settings.WorkRoot + ")");

            WorkerHost host = new WorkerHost(settings, logging);
            try
            {
                await host.StartAsync().ConfigureAwait(false);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                logging.Alert("[Worker] startup failed: " + e.Message);
                await host.DisposeAsync().ConfigureAwait(false);
                return 1;
            }

            try
            {
                await Task.Delay(Timeout.Infinite, shutdown).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
            }

            logging.Info("[Worker] shutdown requested; draining");
            await host.StopAsync(CancellationToken.None).ConfigureAwait(false);
            await host.DisposeAsync().ConfigureAwait(false);
            logging.Info("[Worker] stopped");
            return 0;
        }

        #endregion
    }
}
