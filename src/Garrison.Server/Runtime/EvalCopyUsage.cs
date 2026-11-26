namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Deployments an eval copy sweep must keep because something still uses them: the targets of pending or running
    /// eval runs and the deployments of running shadow trials (AA9.10). Not thread-safe.
    /// </summary>
    public class EvalCopyUsage
    {
        #region Public-Members

        /// <summary>
        /// Deployment identifiers in use.
        /// </summary>
        public HashSet<string> DeploymentIds { get; } = new HashSet<string>(StringComparer.Ordinal);

        #endregion
    }
}
