namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// One environment label in a tenant's ordered environment list (AD1.3, AD-013). Environments are labels on
    /// deployments, not a tenancy concept; promotion moves a revision from one environment to the next in this order.
    /// A tenant with no stored list uses dev, staging, prod.
    /// </summary>
    public class TenantEnvironment
    {
        #region Public-Members

        /// <summary>
        /// Environment name: 1 to 32 lowercase letters, digits, and hyphens, starting with a letter. The name draft is
        /// reserved for playground runs (AD9.1).
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
        /// Optional description, at most 1000 characters.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Zero-based position in the promotion order. Set by the server from the list order.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Name of the eval set a revision must pass before it is promoted, or pinned on a deployment, into this environment
        /// (AA9.6, AD11.4), or null for no gate. Only the latest version of the set a person approved counts (a draft
        /// version never gates a promotion), and only a completed eval run over its cases (not RecentInputs); at most 128
        /// characters.
        /// </summary>
        public string? EvalGateSet { get; set; } = null;

        /// <summary>
        /// Score from 0 to 1 the gate's eval run must reach, or null. With a gate set and no threshold, 1 is required.
        /// Values outside the range are clamped.
        /// </summary>
        public double? EvalGateThreshold
        {
            get
            {
                return _EvalGateThreshold;
            }
            set
            {
                _EvalGateThreshold = value.HasValue && !Double.IsNaN(value.Value) ? Math.Clamp(value.Value, 0, 1) : null;
            }
        }

        #endregion

        #region Private-Members

        private string _Name = String.Empty;
        private double? _EvalGateThreshold = null;

        #endregion
    }
}
