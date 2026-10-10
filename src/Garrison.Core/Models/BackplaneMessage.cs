namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A message between control-plane replicas (P10.4). Small by design: a kind and an optional subject.
    /// </summary>
    public class BackplaneMessage
    {
        #region Public-Members

        /// <summary>
        /// Sequence assigned by the database (polling backplane only); 0 otherwise.
        /// </summary>
        public long Sequence { get; set; } = 0;

        /// <summary>
        /// Kind.
        /// </summary>
        public BackplaneMessageKindEnum Kind { get; set; } = BackplaneMessageKindEnum.RunChanged;

        /// <summary>
        /// Subject (a run or session identifier), or null.
        /// </summary>
        public string? Subject { get; set; } = null;

        /// <summary>
        /// Instance identifier of the replica that sent the message. Replicas ignore their own messages.
        /// </summary>
        public string Origin
        {
            get
            {
                return _Origin;
            }
            set
            {
                _Origin = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Origin = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public BackplaneMessage()
        {
        }

        /// <summary>
        /// Instantiate with a kind and subject.
        /// </summary>
        /// <param name="kind">Kind.</param>
        /// <param name="subject">Subject, or null.</param>
        public BackplaneMessage(BackplaneMessageKindEnum kind, string? subject)
        {
            Kind = kind;
            Subject = subject;
        }

        #endregion
    }
}
