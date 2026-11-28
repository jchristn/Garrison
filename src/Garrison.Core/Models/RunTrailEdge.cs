namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A link between two steps of an activity trail (LP1.3). Not thread-safe.
    /// </summary>
    public class RunTrailEdge
    {
        #region Public-Members

        /// <summary>
        /// Identifier of the step the edge leaves (a RunTrailNode identifier). Never null or empty.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when set to null or empty.</exception>
        public string FromId
        {
            get
            {
                return _FromId;
            }
            set
            {
                if (String.IsNullOrEmpty(value)) throw new ArgumentNullException(nameof(FromId));
                _FromId = value;
            }
        }

        /// <summary>
        /// Identifier of the step the edge reaches (a RunTrailNode identifier). Never null or empty.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when set to null or empty.</exception>
        public string ToId
        {
            get
            {
                return _ToId;
            }
            set
            {
                if (String.IsNullOrEmpty(value)) throw new ArgumentNullException(nameof(ToId));
                _ToId = value;
            }
        }

        /// <summary>
        /// How the steps are linked. Default Started.
        /// </summary>
        public RunTrailEdgeKindEnum Kind { get; set; } = RunTrailEdgeKindEnum.Started;

        /// <summary>
        /// When the link happened (UTC). Default the time the edge object was created.
        /// </summary>
        public DateTime AtUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _FromId = "unknown";
        private string _ToId = "unknown";

        #endregion
    }
}
