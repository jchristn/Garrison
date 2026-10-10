namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Runs that make up one analytics series. Not thread-safe.
    /// </summary>
    public class RunAnalyticsGroup
    {
        #region Public-Members

        /// <summary>
        /// Series key.
        /// </summary>
        public string Key { get; }

        /// <summary>
        /// Series label.
        /// </summary>
        public string Label { get; }

        /// <summary>
        /// Runs in the series.
        /// </summary>
        public List<Run> Runs { get; } = new List<Run>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="key">Series key.</param>
        /// <param name="label">Series label.</param>
        /// <exception cref="ArgumentNullException">Thrown when key or label is null.</exception>
        public RunAnalyticsGroup(string key, string label)
        {
            Key = key ?? throw new ArgumentNullException(nameof(key));
            Label = label ?? throw new ArgumentNullException(nameof(label));
        }

        #endregion
    }
}
