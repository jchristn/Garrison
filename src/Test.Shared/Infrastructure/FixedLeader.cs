namespace Test.Shared.Infrastructure
{
    using Garrison.Server.Runtime;

    /// <summary>
    /// Leader state that always reports leadership, for maintenance tests.
    /// </summary>
    public class FixedLeader : ILeaderState
    {
        /// <inheritdoc />
        public bool IsLeader
        {
            get
            {
                return true;
            }
        }

        /// <inheritdoc />
        public long Epoch
        {
            get
            {
                return 1;
            }
        }
    }
}
