namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A cap on the spend of an org unit's whole subtree over one period (AA7.6). Not thread-safe.
    /// </summary>
    public class OrgUnitBudget
    {
        #region Public-Members

        /// <summary>
        /// Period the cap applies to. Default Day.
        /// </summary>
        public BudgetPeriodEnum Period { get; set; } = BudgetPeriodEnum.Day;

        /// <summary>
        /// Cap in US dollars, greater than 0 and at most 10,000,000. The server refuses 0 and larger values.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the value is negative or not a finite number.</exception>
        public double AmountUsd
        {
            get
            {
                return _AmountUsd;
            }
            set
            {
                if (Double.IsNaN(value) || Double.IsInfinity(value) || value < 0) throw new ArgumentOutOfRangeException(nameof(AmountUsd), "A budget must be a finite, non-negative amount.");
                _AmountUsd = value;
            }
        }

        #endregion

        #region Private-Members

        private double _AmountUsd = 0;

        #endregion
    }
}
