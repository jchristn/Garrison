namespace Garrison.Core.Enums
{
    /// <summary>
    /// How run success is decided.
    /// </summary>
    public enum SuccessPolicyEnum
    {
        /// <summary>
        /// FinalEvent.
        /// </summary>
        FinalEvent,

        /// <summary>
        /// ExitCode.
        /// </summary>
        ExitCode,

        /// <summary>
        /// FinalEventAndExitCode.
        /// </summary>
        FinalEventAndExitCode
    }
}
