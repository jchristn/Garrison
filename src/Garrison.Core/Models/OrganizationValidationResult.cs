namespace Garrison.Core.Models
{
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;

    /// <summary>
    /// The result of validating an organization's working tree without publishing it (LP3.7a). Not thread-safe.
    /// </summary>
    public class OrganizationValidationResult
    {
        #region Public-Members

        /// <summary>
        /// True when no problem has severity Error, so a revision of this working tree would publish. Warnings do not
        /// make the tree invalid.
        /// </summary>
        public bool Valid
        {
            get
            {
                return !_Problems.Any(p => p.Severity == OrganizationValidationSeverityEnum.Error);
            }
        }

        /// <summary>
        /// Every problem found, errors first in tree order, then warnings. Never null.
        /// </summary>
        public List<OrganizationValidationProblem> Problems
        {
            get
            {
                return _Problems;
            }
            set
            {
                _Problems = value ?? new List<OrganizationValidationProblem>();
            }
        }

        #endregion

        #region Private-Members

        private List<OrganizationValidationProblem> _Problems = new List<OrganizationValidationProblem>();

        #endregion
    }
}
