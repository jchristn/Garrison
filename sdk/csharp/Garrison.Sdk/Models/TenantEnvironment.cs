namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A named environment in a tenant's promotion ladder.
    /// </summary>
    public class TenantEnvironment
    {
        #region Public-Members

        /// <summary>
        /// Environment name, for example dev.
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
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Position in the ladder, lowest first.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Name of the eval set a revision must pass before it is promoted into this environment (AA9.6), or null for no
        /// gate. The latest approved version of the set counts; at most 128 characters. A promotion that fails the gate
        /// is refused with code EvalGateFailed.
        /// </summary>
        public string? EvalGateSet { get; set; } = null;

        /// <summary>
        /// Score from 0 to 1 the gate's eval run must reach, or null. With a gate set and no threshold, 1 is required.
        /// Values outside the range are clamped to 0 and 1.
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
