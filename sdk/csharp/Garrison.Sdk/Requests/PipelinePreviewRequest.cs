namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Sample data for previewing every stage prompt of a pipeline. Nothing runs and nothing is recorded.
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
        /// Sample outputs of the stages, in order; stage N sees entry N-1 as the previous output.
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
    }
}
