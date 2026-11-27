namespace Test.Shared.Suites
{
    using Garrison.Core.Models;

    /// <summary>
    /// A run suspended at an approval checkpoint, with the approval it waits on. Used by the durable approval scale case.
    /// </summary>
    internal sealed class ApprovalCheckpoint
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="run">The suspended run.</param>
        /// <param name="approval">The pending approval.</param>
        public ApprovalCheckpoint(Run run, Approval approval)
        {
            Run = run;
            Approval = approval;
        }

        /// <summary>
        /// The suspended run.
        /// </summary>
        public Run Run { get; }

        /// <summary>
        /// The pending approval.
        /// </summary>
        public Approval Approval { get; }
    }
}
