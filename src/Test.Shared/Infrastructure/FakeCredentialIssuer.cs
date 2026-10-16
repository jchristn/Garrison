namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Concurrent;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using WatsonWebserver;
    using WatsonWebserver.Core;

    /// <summary>HTTP provider contract fixture: idempotent issue, bounded expiry, and revocation tombstones.</summary>
    public class FakeCredentialIssuer : IDisposable
    {
        private readonly Webserver _Server;
        private readonly ConcurrentDictionary<string, CredentialLeaseIssueResponse> _Issued = new ConcurrentDictionary<string, CredentialLeaseIssueResponse>();
        private readonly ConcurrentDictionary<string, bool> _Revoked = new ConcurrentDictionary<string, bool>();
        private bool _Disposed;
        private int _IssueCalls;
        private int _RevokeCalls;
        /// <summary>Provider base URL.</summary>
        public string BaseUrl { get; }
        /// <summary>Refuse revoke requests to exercise durable retries.</summary>
        public bool FailRevocation { get; set; }
        /// <summary>Return an expiry shorter than requested to exercise fail-closed compilation.</summary>
        public bool ShortExpiry { get; set; }
        /// <summary>Return a provider expiry longer than requested.</summary>
        public bool LongExpiry { get; set; }
        /// <summary>Return an issue redirect, which clients must refuse.</summary>
        public bool RedirectIssue { get; set; }
        /// <summary>Pause issuance before creating or returning a token.</summary>
        public bool PauseIssue { get; set; }
        /// <summary>Signal that an issuance request arrived.</summary>
        public TaskCompletionSource<bool> IssueArrived { get; } = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        /// <summary>Release paused issuance after a revocation race.</summary>
        public TaskCompletionSource<bool> ReleaseIssue { get; } = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        /// <summary>Issue requests observed.</summary>
        public int IssueCalls { get { return Volatile.Read(ref _IssueCalls); } }
        /// <summary>Revoke requests observed.</summary>
        public int RevokeCalls { get { return Volatile.Read(ref _RevokeCalls); } }
        /// <summary>Start the provider fixture.</summary>
        public FakeCredentialIssuer()
        {
            int port = TestServerHost.FreePort();
            BaseUrl = "http://127.0.0.1:" + port;
            _Server = new Webserver(new WebserverSettings { Hostname = "127.0.0.1", Port = port }, HandleAsync);
            _Server.Start();
        }
        /// <summary>Whether the destination would still accept a bearer value.</summary>
        public bool Accepts(string value)
        {
            foreach (CredentialLeaseIssueResponse issued in _Issued.Values)
                if (issued.Value == value) return issued.ExpiresUtc > DateTime.UtcNow && !_Revoked.ContainsKey(issued.LeaseId);
            return false;
        }
        /// <summary>Stop the fixture.</summary>
        public void Dispose() { Dispose(true); GC.SuppressFinalize(this); }
        /// <summary>Release HTTP resources.</summary>
        protected virtual void Dispose(bool disposing) { if (_Disposed) return; if (disposing) { ReleaseIssue.TrySetResult(true); _Server.Stop(); if (_Server is IDisposable disposable) disposable.Dispose(); } _Disposed = true; }
        private async Task HandleAsync(HttpContextBase context)
        {
            if (context.Request.Headers["Authorization"] != "Bearer fixture-operator-provider-auth")
            {
                context.Response.StatusCode = 401;
                await context.Response.Send(String.Empty).ConfigureAwait(false);
                return;
            }
            CredentialLeaseIssueRequest? request = Serializer.Deserialize<CredentialLeaseIssueRequest>(context.Request.DataAsString);
            if (request == null || String.IsNullOrEmpty(request.LeaseId) || context.Request.Headers["Idempotency-Key"] != request.LeaseId)
            {
                context.Response.StatusCode = 400;
                await context.Response.Send(String.Empty).ConfigureAwait(false);
                return;
            }
            if (context.Request.Url.RawWithoutQuery == "/revoke")
            {
                Interlocked.Increment(ref _RevokeCalls);
                if (!FailRevocation) _Revoked[request.LeaseId] = true;
                context.Response.StatusCode = FailRevocation ? 503 : 204;
                await context.Response.Send(String.Empty).ConfigureAwait(false);
                return;
            }
            Interlocked.Increment(ref _IssueCalls);
            IssueArrived.TrySetResult(true);
            if (PauseIssue) await ReleaseIssue.Task.ConfigureAwait(false);
            if (_Revoked.ContainsKey(request.LeaseId))
            {
                context.Response.StatusCode = 409;
                await context.Response.Send(String.Empty).ConfigureAwait(false);
                return;
            }
            if (RedirectIssue)
            {
                context.Response.StatusCode = 302;
                context.Response.Headers.Add("Location", BaseUrl + "/issue-target");
                await context.Response.Send(String.Empty).ConfigureAwait(false);
                return;
            }
            CredentialLeaseIssueResponse issued = _Issued.GetOrAdd(request.LeaseId, id => new CredentialLeaseIssueResponse
            {
                LeaseId = id, Value = "ephemeral-" + Guid.NewGuid().ToString("N"),
                ExpiresUtc = ShortExpiry ? request.ExpiresUtc.AddSeconds(-10) : LongExpiry ? request.ExpiresUtc.AddSeconds(10) : request.ExpiresUtc
            });
            context.Response.StatusCode = 200;
            context.Response.ContentType = "application/json";
            await context.Response.Send(Serializer.Serialize(issued)).ConfigureAwait(false);
        }
    }
}
