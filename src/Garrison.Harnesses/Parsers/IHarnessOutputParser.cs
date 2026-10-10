namespace Garrison.Harnesses.Parsers
{
    /// <summary>
    /// Converts harness stdout lines into normalized state and events. Implementations are not thread-safe; use one
    /// instance per run.
    /// </summary>
    public interface IHarnessOutputParser
    {
        /// <summary>
        /// Parse one stdout line.
        /// </summary>
        /// <param name="line">Line without the trailing newline.</param>
        /// <param name="state">Run state.</param>
        void ParseLine(string line, HarnessRunState state);

        /// <summary>
        /// Called once after stdout ends.
        /// </summary>
        /// <param name="state">Run state.</param>
        void Complete(HarnessRunState state);
    }
}
