namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One analytics series.
    /// </summary>
    public class RunAnalyticsSeries
    {
        /// <summary>
        /// Series key: "all" when not grouped, an agent identifier when grouped by agent, or a harness type when grouped by harness.
        /// </summary>
        public string Key
        {
            get
            {
                return _Key;
            }
            set
            {
                _Key = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Display label: "All runs", the agent name, or the harness type.
        /// </summary>
        public string Label
        {
            get
            {
                return _Label;
            }
            set
            {
                _Label = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Buckets in chronological order. Never null.
        /// </summary>
        public List<RunAnalyticsBucket> Buckets
        {
            get
            {
                return _Buckets;
            }
            set
            {
                _Buckets = value ?? new List<RunAnalyticsBucket>();
            }
        }

        private string _Key = String.Empty;
        private string _Label = String.Empty;
        private List<RunAnalyticsBucket> _Buckets = new List<RunAnalyticsBucket>();
    }
}
