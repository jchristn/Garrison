namespace Garrison.Core.Requests
{
    /// <summary>
    /// Body of POST .../apps/{id}/revisions (AD6.4).
    /// </summary>
    public class AppRevisionRequest
    {
        /// <summary>
        /// Change note, up to 2000 characters, or null.
        /// </summary>
        public string? ChangeNote { get; set; } = null;
    }
}
