namespace Garrison.Worker.Kubernetes
{
    using System;
    using Garrison.Worker.Settings;

    /// <summary>Bounded adaptive idle stock from eligible queue pressure and observed arrival rate.</summary>
    public static class WarmPodSizing
    {
        /// <summary>Calculate idle stock without exceeding configured pool bounds.</summary>
        /// <param name="settings">Pool bounds.</param>
        /// <param name="queued">Eligible queued Kubernetes runs (bounded estimate).</param>
        /// <param name="arrivalsPerSecond">Recently observed Kubernetes assignments per second.</param>
        /// <returns>Desired idle stock.</returns>
        public static int Desired(WarmPodSettings settings, int queued, double arrivalsPerSecond)
        {
            if (settings == null) throw new ArgumentNullException(nameof(settings));
            settings.Validate();
            if (!settings.Enabled) return 0;
            double pressure = Math.Max(0, queued) + Math.Ceiling(Math.Max(0, arrivalsPerSecond) * settings.ReconcileIntervalSeconds);
            if (!Double.IsFinite(pressure)) pressure = settings.MaxCount;
            return Math.Clamp(settings.MinCount + (int)Math.Min(settings.MaxCount, pressure), settings.MinCount, settings.MaxCount);
        }
    }
}
