namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Control-plane replica (Command node) status.
    /// </summary>
    public enum ControlNodeStatusEnum
    {
        /// <summary>
        /// Registered and starting: modules are initializing and the REST listener is not serving yet.
        /// </summary>
        Starting,

        /// <summary>
        /// Serving requests and heartbeating.
        /// </summary>
        Ready,

        /// <summary>
        /// Shutting down: readiness answers 503 and streams and long polls are ending.
        /// </summary>
        Draining,

        /// <summary>
        /// Stopped cleanly, or silent for longer than the offline threshold (marked by the leader).
        /// </summary>
        Offline
    }
}
