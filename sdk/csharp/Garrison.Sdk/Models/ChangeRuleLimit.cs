namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A numeric bound a change must stay within for a change rule to cover it (AA8.4, AA8.5). Known names: <c>count</c>
    /// for any class (how many workers, or other records such as templates, one draft may change in the class; an agent
    /// with its deployment, mandate, and unit place counts once); <c>minIntervalSeconds</c>,
    /// <c>maxIntervalSeconds</c>, <c>backoffFactor</c>, and <c>jitterPercent</c> for WakeTuning; and <c>weight</c> for
    /// DeploymentWeight. Any other name is refused with field code UnknownLimit. Not thread-safe.
    /// </summary>
    public class ChangeRuleLimit
    {
        #region Public-Members

        /// <summary>
        /// The class the limit applies to; the rule must also list the class (otherwise field code ClassNotInRule).
        /// </summary>
        public ChangeClassEnum Class { get; set; } = ChangeClassEnum.PromptRetune;

        /// <summary>
        /// Limit name, one of the known names for the class. Never null.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Smallest allowed value, inclusive, zero or more, or null for no lower bound.
        /// </summary>
        public double? Minimum { get; set; } = null;

        /// <summary>
        /// Largest allowed value, inclusive, zero or more, or null for no upper bound. At least one bound is required
        /// (field code BoundRequired), and the minimum must not exceed the maximum (MinimumAboveMaximum).
        /// </summary>
        public double? Maximum { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Name = String.Empty;

        #endregion
    }
}
