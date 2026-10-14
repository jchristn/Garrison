namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A run parameter override applied to every run of a pipeline stage. Validated against the deployment's allowed overrides when the pipeline is saved.
    /// </summary>
    public class PipelineStageParameter
    {
        #region Public-Members

        /// <summary>
        /// Identifier (psp_). Assigned by the server.
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
        /// Stage identifier.
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
        private string _StageId = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _Value = String.Empty;

        #endregion
    }
}
