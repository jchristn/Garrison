namespace Garrison.Core.Requests
{
    /// <summary>
    /// The draft version a caller read, for actions on a whole draft (AD7.3).
    /// </summary>
    public class StudioDraftVersionRequest
    {
        /// <summary>
        /// Draft version the caller read. A different version answers 409 DraftVersionConflict.
        /// </summary>
        public int Version { get; set; } = 0;
    }
}
