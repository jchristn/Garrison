namespace Test.Shared.Infrastructure
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Protocol;
    using Garrison.Worker.Execution;

    /// <summary>Captures remote executor events in single-invocation tests.</summary>
    public class RemoteTestReporter : IRunReporter
    {
        /// <summary>Captured events.</summary>
        public List<RunEventReport> Events { get; } = new List<RunEventReport>();
        /// <inheritdoc />
        public Task StartedAsync(int? processId, CancellationToken token) { token.ThrowIfCancellationRequested(); return Task.CompletedTask; }
        /// <inheritdoc />
        public void Emit(RunEventReport report) { Events.Add(report); }
        /// <inheritdoc />
        public Task FlushAsync(CancellationToken token) { token.ThrowIfCancellationRequested(); return Task.CompletedTask; }
    }
}
