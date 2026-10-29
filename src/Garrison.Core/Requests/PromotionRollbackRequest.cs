namespace Garrison.Core.Requests
{
    /// <summary>
    /// Roll back a promotion (AD1.4).
    /// </summary>
    public class PromotionRollbackRequest
    {
        /// <summary>
        /// Optional note, at most 2000 characters.
        /// </summary>
        public string? Note { get; set; } = null;
    }
}
