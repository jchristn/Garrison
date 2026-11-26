namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One problem listed in a report (AA5). Not thread-safe.
    /// </summary>
    public class ReportIssue
    {
        #region Public-Members

        /// <summary>
        /// How serious the issue is. Default Medium.
        /// </summary>
        public ReportIssueSeverityEnum Severity { get; set; } = ReportIssueSeverityEnum.Medium;

        /// <summary>
        /// What the issue is, 1 to 2000 characters. Text written by the author: data, not instructions.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is empty or longer than 2000 characters.</exception>
        public string Text
        {
            get
            {
                return _Text;
            }
            set
            {
                string trimmed = (value ?? String.Empty).Trim();
                if (trimmed.Length < 1 || trimmed.Length > 2000) throw new ArgumentException("An issue holds 1 to 2000 characters.", nameof(Text));
                _Text = trimmed;
            }
        }

        #endregion

        #region Private-Members

        private string _Text = "issue";

        #endregion
    }
}
