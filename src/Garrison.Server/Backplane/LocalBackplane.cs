namespace Garrison.Server.Backplane
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;
    using SyslogLogging;

    /// <summary>
    /// A backplane that sends nothing: for a single replica (Sqlite), where every waiter is in this process and is
    /// signaled directly. Thread-safe.
    /// </summary>
    public class LocalBackplane : BackplaneBase
    {
        #region Public-Members

        /// <inheritdoc />
        public override string Name
        {
            get
            {
                return "Local";
            }
        }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="instanceId">Identifier of this replica instance.</param>
        /// <param name="logging">Logging, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when instanceId is null or empty.</exception>
        public LocalBackplane(string instanceId, LoggingModule? logging)
            : base(instanceId, logging)
        {
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override bool SendsMessages
        {
            get
            {
                return false;
            }
        }

        /// <inheritdoc />
        protected override Task SendAsync(List<BackplaneMessage> messages, CancellationToken token)
        {
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        protected override Task ReceiveLoopAsync(CancellationToken token)
        {
            return Task.CompletedTask;
        }

        #endregion
    }
}
