namespace Test.Shared.Infrastructure
{
    using System;
    using System.Globalization;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Worker.Execution;

    /// <summary>Posts an actual mutation to an independent HTTP sink, then optionally waits for cancellation.</summary>
    public sealed class ExternalEffectExecutor : IRunExecutor
    {
        private readonly string _Sink;
        private readonly bool _Hold;

        /// <summary>Create an executor.</summary>
        /// <param name="sink">Independent mutation sink URL.</param>
        /// <param name="hold">Hold after commit until the lease is lost.</param>
        public ExternalEffectExecutor(string sink, bool hold)
        {
            _Sink = sink;
            _Hold = hold;
        }

        /// <inheritdoc />
        public async Task<RunCompleteRequest> ExecuteAsync(RunAssignment assignment, IRunReporter reporter, CancellationToken token)
        {
            using (HttpClient client = new HttpClient())
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, _Sink + "/mutate"))
            {
                request.Headers.Add("Idempotency-Key", assignment.RunId);
                int attempt = Int32.Parse(assignment.Spec.Arguments[assignment.Spec.Arguments.Count - 1], CultureInfo.InvariantCulture);
                request.Headers.Add("X-Garrison-Attempt", attempt.ToString(CultureInfo.InvariantCulture));
                using (HttpResponseMessage response = await client.SendAsync(request, token).ConfigureAwait(false)) response.EnsureSuccessStatusCode();
            }
            try
            {
                if (_Hold) await Task.Delay(Timeout.Infinite, token).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return new RunCompleteRequest { Status = RunStatusEnum.Cancelled, Outcome = RunOutcomeEnum.Cancelled };
            }
            return new RunCompleteRequest { Status = RunStatusEnum.Succeeded, Outcome = RunOutcomeEnum.Succeeded, ResultText = "replacement-effect-completed" };
        }

        /// <inheritdoc />
        public void Release(RunAssignment assignment, bool succeeded) { }
    }
}
