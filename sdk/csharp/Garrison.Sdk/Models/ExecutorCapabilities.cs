namespace Garrison.Sdk.Models
{
    using Garrison.Sdk.Enums;

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

        private RunExecutorEnum _Executor = RunExecutorEnum.Process;
    }
}
