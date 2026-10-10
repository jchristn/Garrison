namespace Garrison.Core.Enums
{
    /// <summary>
    /// Worker node status.
    /// </summary>
    public enum NodeStatusEnum
    {
        /// <summary>
        /// Ready.
        /// </summary>
        Ready,

        /// <summary>
        /// Draining.
        /// </summary>
        Draining,

        /// <summary>
        /// Cordoned.
        /// </summary>
        Cordoned,

        /// <summary>
        /// Lost.
        /// </summary>
        Lost,

        /// <summary>
        /// Offline.
        /// </summary>
        Offline
    }
}
