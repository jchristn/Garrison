namespace Garrison.Benchmark
{
    using System;

    /// <summary>
    /// Git state of the product working tree.
    /// </summary>
    public class GitState
    {
        /// <summary>
        /// Commit, with -dirty when any path changed (untracked files included); "unknown" without git.
        /// </summary>
        public string Commit { get; set; } = "unknown";

        /// <summary>
        /// Changed or untracked paths.
        /// </summary>
        public int DirtyFiles { get; set; }
    }
}
