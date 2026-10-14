namespace Garrison.LoadGen
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;

    /// <summary>
    /// Command-line options for the load generator. Every option has an environment variable fallback
    /// (LOADGEN_ followed by the option name in upper case with dashes as underscores, for example LOADGEN_RUNS).
    /// Not thread-safe; parse once at startup.
    /// </summary>
    public class LoadGenOptions
    {
        #region Public-Members

        /// <summary>
        /// Garrison REST base URL. Default http://127.0.0.1:18870 (the k3d test cluster's NodePort mapping).
        /// </summary>
        public string Url { get; set; } = "http://127.0.0.1:18870";

        /// <summary>
        /// Administrator API key. Used when set; otherwise AccessKey and SecretKey are used. Default from
        /// GARRISON_ADMIN_API_KEY.
        /// </summary>
        public string? AdminKey { get; set; } = null;

        /// <summary>
        /// Credential access key, used when AdminKey is not set. Default access_garrison_default.
        /// </summary>
        public string AccessKey { get; set; } = "access_garrison_default";

        /// <summary>
        /// Credential secret key, used when AdminKey is not set. Default secret_garrison_default_change_me.
        /// </summary>
        public string SecretKey { get; set; } = "secret_garrison_default_change_me";

        /// <summary>
        /// Tenant identifier. Default default.
        /// </summary>
        public string Tenant { get; set; } = "default";

        /// <summary>
        /// Agent name created by the setup step and invoked by every run. Default loadtest-echo.
        /// </summary>
        public string Agent { get; set; } = "loadtest-echo";

        /// <summary>
        /// Total runs to start. Minimum 1, maximum 100000, default 300.
        /// </summary>
        public int Runs
        {
            get
            {
                return _Runs;
            }
            set
            {
                if (value < 1 || value > 100000) throw new ArgumentOutOfRangeException(nameof(Runs), "runs must be between 1 and 100000");
                _Runs = value;
            }
        }

        /// <summary>
        /// Maximum run creations in flight at once. 0 means all runs at once (the default), so every run is queued
        /// within a few seconds and the cluster has to work through the backlog. Minimum 0, maximum 100000.
        /// </summary>
        public int Concurrency
        {
            get
            {
                return _Concurrency;
            }
            set
            {
                if (value < 0 || value > 100000) throw new ArgumentOutOfRangeException(nameof(Concurrency), "concurrency must be between 0 and 100000");
                _Concurrency = value;
            }
        }

        /// <summary>
        /// Approximate harness run time in milliseconds for the fake harness (passed as its delayMs parameter).
        /// Minimum 0, maximum 600000, default 3000.
        /// </summary>
        public int RunMs
        {
            get
            {
                return _RunMs;
            }
            set
            {
                if (value < 0 || value > 600000) throw new ArgumentOutOfRangeException(nameof(RunMs), "run-ms must be between 0 and 600000");
                _RunMs = value;
            }
        }

        /// <summary>
        /// Seconds to wait, after the last run was submitted, for every run to reach a terminal status. Runs still
        /// active afterwards count as stuck. Minimum 10, maximum 86400, default 900.
        /// </summary>
        public int TimeoutSeconds
        {
            get
            {
                return _TimeoutSeconds;
            }
            set
            {
                if (value < 10 || value > 86400) throw new ArgumentOutOfRangeException(nameof(TimeoutSeconds), "timeout-seconds must be between 10 and 86400");
                _TimeoutSeconds = value;
            }
        }

        /// <summary>
        /// Interval between run list polls in milliseconds. Minimum 250, maximum 60000, default 2000.
        /// </summary>
        public int PollMs
        {
            get
            {
                return _PollMs;
            }
            set
            {
                if (value < 250 || value > 60000) throw new ArgumentOutOfRangeException(nameof(PollMs), "poll-ms must be between 250 and 60000");
                _PollMs = value;
            }
        }

        /// <summary>
        /// Attempts per run creation on transport errors, 5xx, and 429 (with the same idempotency key). Minimum 1,
        /// maximum 50, default 8.
        /// </summary>
        public int SubmitAttempts
        {
            get
            {
                return _SubmitAttempts;
            }
            set
            {
                if (value < 1 || value > 50) throw new ArgumentOutOfRangeException(nameof(SubmitAttempts), "submit-attempts must be between 1 and 50");
                _SubmitAttempts = value;
            }
        }

        /// <summary>
        /// Deployment maxAttempts for the load-test deployment. Minimum 1, maximum 10, default 3.
        /// </summary>
        public int MaxAttempts
        {
            get
            {
                return _MaxAttempts;
            }
            set
            {
                if (value < 1 || value > 10) throw new ArgumentOutOfRangeException(nameof(MaxAttempts), "max-attempts must be between 1 and 10");
                _MaxAttempts = value;
            }
        }

        /// <summary>
        /// Deployment effectPolicy for the load-test deployment: AtLeastOnce (the default here) requeues a run whose
        /// worker was lost while it was running; AtMostOnce and Journaled end it with NodeLost. The deprecated
        /// --retry-on-node-loss option sets AtLeastOnce (true) or AtMostOnce (false).
        /// </summary>
        public string EffectPolicy { get; set; } = "AtLeastOnce";

        /// <summary>
        /// Apply the load-test agent and deployment before starting runs. Default true.
        /// </summary>
        public bool Setup { get; set; } = true;

        /// <summary>
        /// Require every run to end Succeeded (rolling upgrade test). When false, a run that ends Failed with an
        /// outcome in AllowedOutcomes passes (chaos test). Default false.
        /// </summary>
        public bool RequireSuccess { get; set; } = false;

        /// <summary>
        /// Failed outcomes accepted when RequireSuccess is false. Default NodeLost and StaleLease (the outcomes the
        /// retry policy produces when attempts run out after node loss).
        /// </summary>
        public List<string> AllowedOutcomes { get; set; } = new List<string> { "NodeLost", "StaleLease" };

        /// <summary>
        /// Per-run CSV output path. Default loadgen-runs.csv.
        /// </summary>
        public string CsvPath { get; set; } = "loadgen-runs.csv";

        /// <summary>
        /// Summary CSV path; one row is appended per execution. Default loadgen-summary.csv.
        /// </summary>
        public string SummaryPath { get; set; } = "loadgen-summary.csv";

        /// <summary>
        /// Label written to the summary row, for example load-3x4x300. Default loadtest.
        /// </summary>
        public string Label { get; set; } = "loadtest";

        /// <summary>
        /// Seconds between progress lines. Minimum 1, maximum 3600, default 5.
        /// </summary>
        public int ProgressSeconds
        {
            get
            {
                return _ProgressSeconds;
            }
            set
            {
                if (value < 1 || value > 3600) throw new ArgumentOutOfRangeException(nameof(ProgressSeconds), "progress-seconds must be between 1 and 3600");
                _ProgressSeconds = value;
            }
        }

        #endregion

        #region Private-Members

        private int _Runs = 300;
        private int _Concurrency = 0;
        private int _RunMs = 3000;
        private int _TimeoutSeconds = 900;
        private int _PollMs = 2000;
        private int _SubmitAttempts = 8;
        private int _MaxAttempts = 3;
        private int _ProgressSeconds = 5;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Usage text.
        /// </summary>
        /// <returns>Usage.</returns>
        public static string Usage()
        {
            return String.Join(Environment.NewLine, new string[]
            {
                "garrison-loadgen [options]",
                "  --url URL                  REST base URL (default http://127.0.0.1:18870)",
                "  --admin-key KEY            administrator API key (default GARRISON_ADMIN_API_KEY)",
                "  --access-key KEY           credential access key when no admin key is given",
                "  --secret-key KEY           credential secret key when no admin key is given",
                "  --tenant ID                tenant (default default)",
                "  --agent NAME               load-test agent name (default loadtest-echo)",
                "  --runs N                   total runs (default 300)",
                "  --concurrency N            run creations in flight, 0 = all at once (default 0)",
                "  --run-ms N                 approximate fake harness run time (default 3000)",
                "  --timeout-seconds N        wait for terminal status after the last submit (default 900)",
                "  --poll-ms N                run list poll interval (default 2000)",
                "  --submit-attempts N        attempts per run creation on transient errors (default 8)",
                "  --max-attempts N           deployment maxAttempts (default 3)",
                "  --effect-policy P          deployment effectPolicy: AtMostOnce, AtLeastOnce, Journaled (default AtLeastOnce)",
                "  --retry-on-node-loss B     deprecated: true is AtLeastOnce, false is AtMostOnce",
                "  --no-setup                 skip applying the agent and deployment",
                "  --require-success          fail unless every run Succeeded",
                "  --allowed-outcomes A,B     failed outcomes accepted without --require-success (default NodeLost,StaleLease)",
                "  --csv PATH                 per-run CSV (default loadgen-runs.csv)",
                "  --summary PATH             summary CSV, one row appended (default loadgen-summary.csv)",
                "  --label TEXT               summary label (default loadtest)",
                "  --progress-seconds N       progress interval (default 5)",
                "Exit codes: 0 pass, 1 criteria not met (stuck runs, failed runs, submit errors), 2 usage or setup error."
            });
        }

        /// <summary>
        /// Parse options from arguments and LOADGEN_* environment variables. Arguments win.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <returns>Options.</returns>
        /// <exception cref="ArgumentNullException">Thrown when args is null.</exception>
        /// <exception cref="ArgumentException">Thrown for an unknown option or a missing value.</exception>
        /// <exception cref="FormatException">Thrown when a numeric or boolean value does not parse.</exception>
        public static LoadGenOptions Parse(string[] args)
        {
            if (args == null) throw new ArgumentNullException(nameof(args));
            LoadGenOptions options = new LoadGenOptions();
            options.AdminKey = Env("GARRISON_ADMIN_API_KEY");
            foreach (string name in new string[] { "url", "admin-key", "access-key", "secret-key", "tenant", "agent", "runs", "concurrency", "run-ms", "timeout-seconds", "poll-ms", "submit-attempts", "max-attempts", "retry-on-node-loss", "effect-policy", "allowed-outcomes", "csv", "summary", "label", "progress-seconds" })
            {
                string? value = Env("LOADGEN_" + name.ToUpperInvariant().Replace('-', '_'));
                if (value != null) options.Apply(name, value);
            }
            if (Env("LOADGEN_NO_SETUP") == "1") options.Setup = false;
            if (Env("LOADGEN_REQUIRE_SUCCESS") == "1") options.RequireSuccess = true;

            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];
                if (!arg.StartsWith("--", StringComparison.Ordinal)) throw new ArgumentException("Unexpected argument '" + arg + "'.");
                string name = arg.Substring(2);
                if (name == "no-setup")
                {
                    options.Setup = false;
                    continue;
                }
                if (name == "require-success")
                {
                    options.RequireSuccess = true;
                    continue;
                }
                if (i + 1 >= args.Length) throw new ArgumentException("Option '" + arg + "' needs a value.");
                options.Apply(name, args[++i]);
            }
            return options;
        }

        #endregion

        #region Private-Methods

        private void Apply(string name, string value)
        {
            switch (name)
            {
                case "url": Url = value.TrimEnd('/'); break;
                case "admin-key": AdminKey = String.IsNullOrEmpty(value) ? null : value; break;
                case "access-key": AccessKey = value; break;
                case "secret-key": SecretKey = value; break;
                case "tenant": Tenant = value; break;
                case "agent": Agent = value; break;
                case "runs": Runs = Int32.Parse(value, CultureInfo.InvariantCulture); break;
                case "concurrency": Concurrency = Int32.Parse(value, CultureInfo.InvariantCulture); break;
                case "run-ms": RunMs = Int32.Parse(value, CultureInfo.InvariantCulture); break;
                case "timeout-seconds": TimeoutSeconds = Int32.Parse(value, CultureInfo.InvariantCulture); break;
                case "poll-ms": PollMs = Int32.Parse(value, CultureInfo.InvariantCulture); break;
                case "submit-attempts": SubmitAttempts = Int32.Parse(value, CultureInfo.InvariantCulture); break;
                case "max-attempts": MaxAttempts = Int32.Parse(value, CultureInfo.InvariantCulture); break;
                case "effect-policy":
                    if (value != "AtMostOnce" && value != "AtLeastOnce" && value != "Journaled") throw new ArgumentException("effect-policy must be AtMostOnce, AtLeastOnce, or Journaled.");
                    EffectPolicy = value;
                    break;
                case "retry-on-node-loss": EffectPolicy = Boolean.Parse(value) ? "AtLeastOnce" : "AtMostOnce"; break;
                case "allowed-outcomes": AllowedOutcomes = new List<string>(value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)); break;
                case "csv": CsvPath = value; break;
                case "summary": SummaryPath = value; break;
                case "label": Label = value; break;
                case "progress-seconds": ProgressSeconds = Int32.Parse(value, CultureInfo.InvariantCulture); break;
                default: throw new ArgumentException("Unknown option '--" + name + "'.");
            }
        }

        private static string? Env(string name)
        {
            string? value = Environment.GetEnvironmentVariable(name);
            return String.IsNullOrEmpty(value) ? null : value;
        }

        #endregion
    }
}
