namespace Garrison.Core.Models
{
    using Garrison.Core.Enums;

    /// <summary>
    /// Observed capabilities of one executor. False flags and a null startup class make no capability promise.
    /// </summary>
    public class ExecutorCapabilities : ExecutorRequirements
    {
        /// <summary>Executor these capabilities describe.</summary>
        public RunExecutorEnum Executor
        {
            get { return _Executor; }
            set { _Executor = value; }
        }

        /// <summary>Whether this executor also supports prestarted Warm runs while retaining its primary startup class.</summary>
        public bool WarmStart
        {
            get { return _WarmStart; }
            set { _WarmStart = value; }
        }

        private bool _WarmStart = false;
        private RunExecutorEnum _Executor = RunExecutorEnum.Process;
    }
}
