namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A numeric bound a change must stay within for a change rule to cover it (AA8.4, AA8.5). Known names:
    /// <c>count</c> for any class (how many changes of the class one draft may carry); <c>minIntervalSeconds</c>,
    /// <c>maxIntervalSeconds</c>, <c>backoffFactor</c>, and <c>jitterPercent</c> for WakeTuning (the new values); and
    /// <c>weight</c> for DeploymentWeight (the new weight). A change without the named value, such as a weight change on a
    /// rule bounding only count, is not affected by that limit. Not thread-safe.
    /// </summary>
    public class ChangeRuleLimit
    {
        #region Public-Members

        /// <summary>
        /// The class the limit applies to; the rule must also list the class.
        /// </summary>
        public ChangeClassEnum Class { get; set; } = ChangeClassEnum.PromptRetune;

        /// <summary>
        /// Limit name, one of the known names for the class (see the class summary).
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
        /// Smallest allowed value, inclusive, or null for no lower bound.
        /// </summary>
        public double? Minimum { get; set; } = null;

        /// <summary>
        /// Largest allowed value, inclusive, or null for no upper bound. At least one bound is required.
        /// </summary>
        public double? Maximum { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Name = String.Empty;

        #endregion
    }
}
