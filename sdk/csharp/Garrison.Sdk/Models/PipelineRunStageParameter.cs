namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// Snapshot of a stage run parameter override taken when the pipeline run started.
    /// </summary>
    public class PipelineRunStageParameter
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prp_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pipeline run stage identifier.
        /// </summary>
        public string RunStageId
        {
            get
            {
                return _RunStageId;
            }
            set
            {
                _RunStageId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Parameter name.
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
        /// Parameter value.
        /// </summary>
        public string Value
        {
            get
            {
                return _Value;
            }
            set
            {
                _Value = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _RunStageId = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _Value = String.Empty;

        #endregion
    }
}
