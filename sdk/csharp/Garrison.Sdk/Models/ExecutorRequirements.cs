namespace Garrison.Sdk.Models
{
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Capabilities required by a deployment, copied to each run at admission. No requirement defaults beyond Process.
    /// </summary>
    public class ExecutorRequirements
    {
        /// <summary>
        /// Minimum isolation level. Default Process.
        /// </summary>
        public ExecutorIsolationEnum Isolation
        {
            get { return _Isolation; }
            set { _Isolation = value; }
        }

        /// <summary>
        /// Require enforced egress control. Default false.
        /// </summary>
        public bool EgressControl
        {
            get { return _EgressControl; }
            set { _EgressControl = value; }
        }

        /// <summary>
        /// Require filesystem snapshot support. Default false.
        /// </summary>
        public bool FilesystemSnapshot
        {
            get { return _FilesystemSnapshot; }
            set { _FilesystemSnapshot = value; }
        }

        /// <summary>
        /// Require harness session continuation support. Default false; the harness must also support sessions.
        /// </summary>
        public bool SessionContinuation
        {
            get { return _SessionContinuation; }
            set { _SessionContinuation = value; }
        }

        /// <summary>
        /// Require cross-node workspace restore. Default false.
        /// </summary>
        public bool CrossNodeRestore
        {
            get { return _CrossNodeRestore; }
            set { _CrossNodeRestore = value; }
        }

        /// <summary>
        /// Required startup class, or null for any class.
        /// </summary>
        public ExecutorColdStartEnum? ColdStartClass
        {
            get { return _ColdStartClass; }
            set { _ColdStartClass = value; }
        }

        /// <summary>Return an independent copy for an admitted run.</summary>
        /// <returns>Copied requirements.</returns>
        public ExecutorRequirements Clone()
        {
            return new ExecutorRequirements
            {
                Isolation = Isolation,
                EgressControl = EgressControl,
                FilesystemSnapshot = FilesystemSnapshot,
                SessionContinuation = SessionContinuation,
                CrossNodeRestore = CrossNodeRestore,
                ColdStartClass = ColdStartClass
            };
        }

        private ExecutorIsolationEnum _Isolation = ExecutorIsolationEnum.Process;
        private bool _EgressControl = false;
        private bool _FilesystemSnapshot = false;
        private bool _SessionContinuation = false;
        private bool _CrossNodeRestore = false;
        private ExecutorColdStartEnum? _ColdStartClass = null;
    }
}
