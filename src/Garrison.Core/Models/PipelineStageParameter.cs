namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A run parameter override of a pipeline stage (P12.9).
    /// </summary>
    public class PipelineStageParameter
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix psp_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewPipelineStageParameterId() : value;
            }
        }

        /// <summary>
        /// Owning stage.
        /// </summary>
        public string StageId
        {
            get
            {
                return _StageId;
            }
            set
            {
                _StageId = value ?? String.Empty;
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
        /// Parameter name (an allowed run override of the stage's deployment).
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

        private string _Id = IdGenerator.NewPipelineStageParameterId();
        private string _StageId = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _Value = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineStageParameter()
        {
        }

        #endregion
    }
}
