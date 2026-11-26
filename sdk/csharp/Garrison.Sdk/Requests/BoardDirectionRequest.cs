namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Direction from the board to the CEO (AA10): published as a new revision of the CEO's mandate with source Board.
    /// </summary>
    public class BoardDirectionRequest
    {
        /// <summary>
        /// The direction, 1 to 4000 characters. Required.
        /// </summary>
        public string Direction { get; set; } = String.Empty;

        /// <summary>
        /// Change note for the revision, at most 2000 characters, or null for "Board direction".
        /// </summary>
        public string? ChangeNote { get; set; } = null;
    }
}
