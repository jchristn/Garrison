namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Rendered prompts of every stage of a pipeline.
    /// </summary>
    public class PipelinePreviewResponse
    {
        #region Public-Members

        /// <summary>
        /// Pipeline identifier.
        /// </summary>
        public string PipelineId
        {
            get
            {
                return _PipelineId;
            }
            set
            {
                _PipelineId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pipeline name.
        /// </summary>
        public string PipelineName
        {
            get
            {
                return _PipelineName;
            }
            set
            {
                _PipelineName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Stages in order.
        /// </summary>
        public List<PipelinePreviewStage> Stages
        {
            get
            {
                return _Stages;
            }
            set
            {
                _Stages = value ?? new List<PipelinePreviewStage>();
            }
        }

        #endregion

        #region Private-Members

        private string _PipelineId = String.Empty;
        private string _PipelineName = String.Empty;
        private List<PipelinePreviewStage> _Stages = new List<PipelinePreviewStage>();

        #endregion
    }
}
