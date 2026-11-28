namespace Garrison.Server.Runtime
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Maps the protocol surface a run creation names (the metric label on <see cref="RunCreateContext.Surface"/>) to the
    /// entry surface recorded on the run (LP-013). Stateless and thread-safe.
    /// </summary>
    public static class EntrySurfaces
    {
        #region Public-Methods

        /// <summary>
        /// The entry surface of a creation surface label. rest and playground are Rest (the dashboard uses the REST API
        /// too), pipeline is Internal (the pipeline run is the origin), and an unknown or empty label is Internal.
        /// </summary>
        /// <param name="surface">Surface label, such as rest, mcp, a2a, app, trigger, keeper, message, escalation, eval, shadow, or pipeline. Case does not matter.</param>
        /// <returns>The entry surface.</returns>
        public static EntrySurfaceEnum FromSurface(string? surface)
        {
            switch ((surface ?? String.Empty).Trim().ToLowerInvariant())
            {
                case "rest":
                case "playground":
                    return EntrySurfaceEnum.Rest;
                case "mcp":
                    return EntrySurfaceEnum.Mcp;
                case "a2a":
                    return EntrySurfaceEnum.A2a;
                case "app":
                    return EntrySurfaceEnum.App;
                case "trigger":
                    return EntrySurfaceEnum.Trigger;
                case "keeper":
                    return EntrySurfaceEnum.Keeper;
                case "message":
                    return EntrySurfaceEnum.Message;
                case "escalation":
                    return EntrySurfaceEnum.Escalation;
                case "eval":
                    return EntrySurfaceEnum.Eval;
                case "shadow":
                    return EntrySurfaceEnum.Shadow;
                default:
                    return EntrySurfaceEnum.Internal;
            }
        }

        #endregion
    }
}
