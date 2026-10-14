namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Preview the prompt of every stage of a pipeline (P12.9) from sample input and sample stage outputs.
    /// </summary>
    public class PipelinePreviewRequest
    {
        #region Public-Members

        /// <summary>
        /// Sample caller input.
        /// </summary>
        public string Input
        {
            get
            {
                return _Input;
            }
            set
            {
                _Input = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Sample result text of each stage in order: entry i is the output stage i+1 sees as pipeline.previous.output.
        /// Missing entries render as empty output.
        /// </summary>
        public List<string> SampleOutputs
        {
            get
            {
                return _SampleOutputs;
            }
            set
            {
                _SampleOutputs = value ?? new List<string>();
            }
        }

        #endregion

        #region Private-Members

        private string _Input = String.Empty;
        private List<string> _SampleOutputs = new List<string>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelinePreviewRequest()
        {
        }

        #endregion
    }
}
