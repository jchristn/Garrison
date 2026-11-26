namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Evaluation options (AA9), refreshed from the Evaluation.* cluster settings. Thread-safe for reads.
    /// </summary>
    public class EvaluationOptions
    {
        #region Public-Members

        /// <summary>
        /// Most cases of one eval run that run at the same time. Minimum 1, maximum 64, default 4. Cluster setting
        /// Evaluation.MaxConcurrentCases.
        /// </summary>
        public int MaxConcurrentCases
        {
            get
            {
                return _MaxConcurrentCases;
            }
            set
            {
                _MaxConcurrentCases = Math.Clamp(value, 1, 64);
            }
        }

        /// <summary>
        /// Most cases one eval set version may hold. Minimum 1, maximum 10000, default 500. Cluster setting
        /// Evaluation.MaxCasesPerSet.
        /// </summary>
        public int MaxCasesPerSet
        {
            get
            {
                return _MaxCasesPerSet;
            }
            set
            {
                _MaxCasesPerSet = Math.Clamp(value, 1, 10000);
            }
        }

        #endregion

        #region Private-Members

        private int _MaxConcurrentCases = 4;
        private int _MaxCasesPerSet = 500;

        #endregion
    }
}
