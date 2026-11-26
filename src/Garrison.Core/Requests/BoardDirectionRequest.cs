namespace Garrison.Core.Requests
{
    /// <summary>
    /// The board's direction to an organization's top agent (AA10.5): it becomes the direction of a new published revision
    /// of the CEO's mandate.
    /// </summary>
    public class BoardDirectionRequest
    {
        /// <summary>
        /// The direction. Required, 1 to 4000 characters.
        /// </summary>
        public string? Direction { get; set; } = null;

        /// <summary>
        /// Why, or null for "Board direction". At most 2000 characters.
        /// </summary>
        public string? ChangeNote { get; set; } = null;
    }
}
