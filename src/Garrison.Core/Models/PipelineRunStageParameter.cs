namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Snapshot of a run parameter override of a pipeline run stage (P12.9).
    /// </summary>
    public class PipelineRunStageParameter
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix prp_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewPipelineRunStageParameterId() : value;
            }
        }

        /// <summary>
        /// Owning pipeline run stage.
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

        private string _Id = IdGenerator.NewPipelineRunStageParameterId();
        private string _RunStageId = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _Value = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineRunStageParameter()
        {
        }

        #endregion
    }
}
