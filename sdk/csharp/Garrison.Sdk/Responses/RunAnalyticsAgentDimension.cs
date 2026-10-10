namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// An agent that has runs in an analytics range.
    /// </summary>
    public class RunAnalyticsAgentDimension
    {
        /// <summary>
        /// Agent identifier.
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
        /// Agent name; the identifier when the run did not record a name.
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

        private string _Id = String.Empty;
        private string _Name = String.Empty;
    }
}
