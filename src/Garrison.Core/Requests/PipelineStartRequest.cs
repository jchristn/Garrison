namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Start a pipeline (POST /v1.0/api/tenants/{tenantId}/pipelines/{id}/start, P12.9). Send an Idempotency-Key
    /// header to make retries return the same pipeline run.
    /// </summary>
    public class PipelineStartRequest
    {
        #region Public-Members

        /// <summary>
        /// Caller input given to every stage run.
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
        /// Input content type, or null for text/plain.
        /// </summary>
        public string? InputContentType { get; set; } = null;

        /// <summary>
        /// Priority given to every stage run.
        /// </summary>
        public int Priority { get; set; } = 0;

        /// <summary>
        /// Whether to wait until the pipeline run ends or waits for a review (bounded by WaitSeconds).
        /// </summary>
        public bool Wait { get; set; } = false;

        /// <summary>
        /// Most seconds to wait when Wait is true. Minimum 0, maximum 600, default 60.
        /// </summary>
        public int WaitSeconds { get; set; } = 60;

        #endregion

        #region Private-Members

        private string _Input = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineStartRequest()
        {
        }

        #endregion
    }
}
