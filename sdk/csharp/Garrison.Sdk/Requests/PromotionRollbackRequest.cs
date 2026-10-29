namespace Garrison.Sdk.Requests
{
    /// <summary>
    /// Roll back a promotion.
    /// </summary>
    public class PromotionRollbackRequest
    {
        #region Public-Members

        /// <summary>
        /// Optional note.
        /// </summary>
        public string? Note { get; set; } = null;

        #endregion
    }
}
