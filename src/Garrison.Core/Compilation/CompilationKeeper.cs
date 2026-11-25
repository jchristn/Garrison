namespace Garrison.Core.Compilation
{
    using Garrison.Core.Models;

    /// <summary>
    /// Keeper inputs of a keeper tick run (AA1.9): the mandate and the revision the tick runs under. They fill the keeper
    /// template variables (keeper.*) that builtin/keeper-system renders into the system prompt.
    /// </summary>
    public class CompilationKeeper
    {
        #region Public-Members

        /// <summary>
        /// Mandate.
        /// </summary>
        public Mandate Mandate { get; set; } = new Mandate();

        /// <summary>
        /// Revision the tick runs under.
        /// </summary>
        public MandateRevision Revision { get; set; } = new MandateRevision();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public CompilationKeeper()
        {
        }

        #endregion
    }
}
