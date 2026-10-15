namespace Garrison.FakeHarness
{
    /// <summary>
    /// Outcome of one isolation probe (see <see cref="FakeProber"/>).
    /// </summary>
    public enum FakeProbeOutcomeEnum
    {
        /// <summary>
        /// The attempt succeeded: the file was read, the directory listed, the variable found, the connection opened,
        /// or the HTTP request answered 2xx. For an isolation attack this means the isolation failed.
        /// </summary>
        Allowed,

        /// <summary>
        /// The attempt failed: missing, denied, unreachable, timed out, or refused by the server.
        /// </summary>
        Blocked,

        /// <summary>
        /// An action probe (marker, hold) finished.
        /// </summary>
        Done,

        /// <summary>
        /// The probe could not be parsed or the action failed.
        /// </summary>
        Error
    }
}
