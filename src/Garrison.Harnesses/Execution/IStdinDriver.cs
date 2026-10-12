namespace Garrison.Harnesses.Execution
{
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Drives an interactive harness over its stdin (for example a JSON-RPC session with <c>codex app-server</c>)
    /// instead of writing a fixed text and closing stdin. The process runner calls <see cref="DriveAsync"/> once,
    /// right after launch, and closes stdin when it returns or throws. Implementations see stdout through the line
    /// callback the caller passes to the runner.
    /// </summary>
    public interface IStdinDriver
    {
        /// <summary>
        /// Drive the session. Return when the harness should be told to finish (stdin is closed after this returns).
        /// </summary>
        /// <param name="stdin">Harness stdin; the driver owns writes until it returns.</param>
        /// <param name="token">Cancelled when the process exits or is stopped (deadline, cancellation, run guard, output limit).</param>
        /// <returns>Task.</returns>
        Task DriveAsync(TextWriter stdin, CancellationToken token);
    }
}
