namespace Garrison.Core.Manifests
{
    /// <summary>
    /// A unit budget in an Organization manifest (AA7.9).
    /// </summary>
    public class OrgUnitBudgetSpec
    {
        /// <summary>
        /// Day or Month. Default Day.
        /// </summary>
        public string? Period { get; set; } = null;

        /// <summary>
        /// Amount in US dollars, more than 0.
        /// </summary>
        public double AmountUsd { get; set; } = 0;
    }
}
