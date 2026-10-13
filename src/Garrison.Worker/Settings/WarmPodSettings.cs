namespace Garrison.Worker.Settings
{
    using System;

    /// <summary>Shared per-pool/image warm run pod bounds. Enabled by default for Kubernetes execution (D-045).</summary>
    public class WarmPodSettings
    {
        /// <summary>Enable warm pods. Default true; ignored when Kubernetes execution is disabled.</summary>
        public bool Enabled { get; set; } = true;

        /// <summary>Minimum idle pods per pool/image. Default 1; range 0 to 64.</summary>
        public int MinCount
        {
            get { return _MinCount; }
            set { _MinCount = Math.Clamp(value, 0, 64); }
        }

        /// <summary>Maximum idle pods per pool/image. Default 4; range 0 to 64.</summary>
        public int MaxCount
        {
            get { return _MaxCount; }
            set { _MaxCount = Math.Clamp(value, 0, 64); }
        }

        /// <summary>Seconds an idle pod waits for input before exiting. Default 900; range 30 to 86400.</summary>
        public int IdleTimeoutSeconds
        {
            get { return _IdleTimeoutSeconds; }
            set { _IdleTimeoutSeconds = Math.Clamp(value, 30, 86400); }
        }

        /// <summary>Pool reconciliation interval. Default 2 seconds; range 1 to 60.</summary>
        public int ReconcileIntervalSeconds
        {
            get { return _ReconcileIntervalSeconds; }
            set { _ReconcileIntervalSeconds = Math.Clamp(value, 1, 60); }
        }

        /// <summary>Maximum UTF-8 stdin spec bytes. Default 16 MiB; range 1024 to 64 MiB.</summary>
        public int MaxSpecBytes
        {
            get { return _MaxSpecBytes; }
            set { _MaxSpecBytes = Math.Clamp(value, 1024, 64 * 1024 * 1024); }
        }

        /// <summary>Validate mutually consistent pool bounds.</summary>
        /// <exception cref="ArgumentException">Thrown when the minimum exceeds the maximum.</exception>
        public void Validate()
        {
            if (MinCount > MaxCount) throw new ArgumentException("WarmPods.MinCount must not exceed WarmPods.MaxCount.");
        }

        /// <summary>Apply environment overrides for the warm pool.</summary>
        public void ApplyEnvironment()
        {
            string? value = Environment.GetEnvironmentVariable("GARRISON_WORKER_WARM_PODS_ENABLED");
            if (Boolean.TryParse(value, out bool enabled)) Enabled = enabled;
            if (Int32.TryParse(Environment.GetEnvironmentVariable("GARRISON_WORKER_WARM_PODS_MIN"), out int min)) MinCount = min;
            if (Int32.TryParse(Environment.GetEnvironmentVariable("GARRISON_WORKER_WARM_PODS_MAX"), out int max)) MaxCount = max;
            if (Int32.TryParse(Environment.GetEnvironmentVariable("GARRISON_WORKER_WARM_PODS_IDLE_SECONDS"), out int idle)) IdleTimeoutSeconds = idle;
            if (Int32.TryParse(Environment.GetEnvironmentVariable("GARRISON_WORKER_WARM_PODS_INTERVAL_SECONDS"), out int interval)) ReconcileIntervalSeconds = interval;
            if (Int32.TryParse(Environment.GetEnvironmentVariable("GARRISON_WORKER_WARM_PODS_MAX_SPEC_BYTES"), out int bytes)) MaxSpecBytes = bytes;
            Validate();
        }

        private int _MinCount = 1;
        private int _MaxCount = 4;
        private int _IdleTimeoutSeconds = 900;
        private int _ReconcileIntervalSeconds = 2;
        private int _MaxSpecBytes = 16 * 1024 * 1024;
    }
}
