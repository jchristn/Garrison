namespace Garrison.Benchmark.Datasets
{
    using System;

    /// <summary>
    /// One problem the validator found in a dataset.
    /// </summary>
    public class ValidationIssue
    {
        /// <summary>
        /// Where: dataset, corpus/&lt;id&gt;, corpus/&lt;id&gt;/item/&lt;id&gt;, or corpus/&lt;id&gt;/probe/&lt;id&gt;.
        /// </summary>
        public string Location { get; set; } = String.Empty;

        /// <summary>
        /// What is wrong.
        /// </summary>
        public string Message { get; set; } = String.Empty;

        /// <summary>
        /// Instantiate.
        /// </summary>
        public ValidationIssue()
        {
        }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="location">Location.</param>
        /// <param name="message">Message.</param>
        public ValidationIssue(string location, string message)
        {
            Location = location ?? String.Empty;
            Message = message ?? String.Empty;
        }

        /// <summary>
        /// Location and message.
        /// </summary>
        /// <returns>Text.</returns>
        public override string ToString()
        {
            return Location + ": " + Message;
        }
    }
}
