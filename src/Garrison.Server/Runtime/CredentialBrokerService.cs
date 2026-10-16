namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Settings;

    /// <summary>Operator-configured revocable HTTP credential provider. Thread-safe. Provider values exist only in memory.</summary>
    public class CredentialBrokerService : ILeaseSecretPreparer, IDisposable
    {
        private readonly DatabaseDriverBase _Database;
        private readonly SecretCipher _Cipher;
        private readonly CredentialBrokerSettings _Settings;
        private readonly HttpClient _Http;
        private bool _Disposed;

        /// <summary>Create the provider adapter. Endpoints and authorization are settings-file-only operator configuration.</summary>
        public CredentialBrokerService(DatabaseDriverBase database, SecretCipher cipher, CredentialBrokerSettings settings)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
            _Http = new HttpClient(new TelemetryHttpHandler("credential_provider", OutboundAddressPolicy.CreateHandler(settings.AllowPrivateDestinations)), true);
            _Http.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
            _Http.MaxResponseContentBufferSize = 65536;
        }

        /// <inheritdoc />
        public async Task<Secret> PrepareAsync(Secret secret, Run run, CancellationToken token = default)
        {
            return await RunDatabaseTelemetry.MeasureAsync(_Database, run.TenantId, run.Id, "credential_prepare", ct => PrepareMeasuredCoreAsync(secret, run, token), token).ConfigureAwait(false);
        }

        private async Task<Secret> PrepareMeasuredCoreAsync(Secret secret, Run run, CancellationToken token = default)
        {
            if (secret == null) throw new ArgumentNullException(nameof(secret));
            if (run == null) throw new ArgumentNullException(nameof(run));
            token.ThrowIfCancellationRequested();
            if (secret.Kind != SecretKindEnum.LeaseBroker) return secret;
            if (secret.TenantId != run.TenantId || !secret.Active) throw Failure(secret, "CredentialBrokerUnavailable", "The broker secret is inactive or outside the run tenant.");
            if (!_Settings.Enabled) throw Failure(secret, "CredentialBrokerDisabled", "The operator credential broker is disabled.");
            try { ValidateEndpoint(_Settings.IssuerUrl); ValidateEndpoint(_Settings.RevokerUrl); }
            catch (InvalidOperationException) { throw Failure(secret, "CredentialBrokerUnavailable", "The operator credential provider endpoints are invalid or blocked."); }
            DateTime now = DateTime.UtcNow;
            if (!run.DeadlineUtc.HasValue || run.DeadlineUtc.Value <= now || run.DeadlineUtc.Value > now.AddSeconds(_Settings.MaxTtlSeconds))
                throw Failure(secret, "CredentialLeaseTooShort", "A brokered run needs a remaining deadline within the configured maximum credential TTL.");
            if (secret.ExpiresUtc.HasValue && secret.ExpiresUtc.Value < run.DeadlineUtc.Value) throw Failure(secret, "CredentialLeaseTooShort", "The broker secret expires before the run deadline.");
            if (String.IsNullOrWhiteSpace(secret.BrokerResource)) throw Failure(secret, "CredentialBrokerResourceRequired", "The broker secret needs a provider resource identifier.");
            List<CredentialLease> prior = await _Database.CredentialLeases.ListOutstandingAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
            foreach (CredentialLease old in prior)
            {
                if (old.SecretId != secret.Id || old.LeaseEpoch == run.LeaseEpoch) continue;
                bool revoked = await RevokeLeaseAsync(old, token).ConfigureAwait(false);
                if (!revoked && old.ExpiresUtc > DateTime.UtcNow)
                    throw Failure(secret, "CredentialRevocationPending", "The previous attempt's credential could not be revoked; replacement issuance is refused until confirmed revocation or expiry.");
            }
            CredentialLease desired = new CredentialLease
            {
                TenantId = run.TenantId, RunId = run.Id, SecretId = secret.Id, LeaseEpoch = run.LeaseEpoch,
                Resource = secret.BrokerResource, Audience = secret.BrokerAudience, ExpiresUtc = run.DeadlineUtc.Value
            };
            CredentialLease? lease = await _Database.CredentialLeases.ReserveAsync(desired, token).ConfigureAwait(false);
            if (lease == null || lease.State == "Revoked") throw Failure(secret, "CredentialLeaseFenced", "The attempt no longer holds an active lease or its credential has been revoked.");
            if (!String.Equals(lease.Resource, desired.Resource, StringComparison.Ordinal)
                || !String.Equals(lease.Audience, desired.Audience, StringComparison.Ordinal)
                || lease.ExpiresUtc.Ticks / 10 != desired.ExpiresUtc.Ticks / 10)
                throw Failure(secret, "CredentialLeaseFenced", "Broker metadata or the run deadline changed within this attempt; a reserved credential cannot be rebound.");
            CredentialLeaseIssueResponse issued;
            try
            {
                issued = await IssueAsync(lease, token).ConfigureAwait(false);
                if (issued.LeaseId != lease.Id || String.IsNullOrEmpty(issued.Value) || issued.Value.Length > 32768
                    || issued.ExpiresUtc > lease.ExpiresUtc || issued.ExpiresUtc < run.DeadlineUtc.Value)
                    throw Failure(secret, "CredentialLeaseTooShort", "The provider response does not match the bounded lease identity or cover the run deadline.");
                if (!await _Database.CredentialLeases.MarkIssuedAsync(lease, token).ConfigureAwait(false))
                    throw Failure(secret, "CredentialLeaseFenced", "The run lost its lease during credential issuance.");
            }
            catch (Exception e) when (e is HttpRequestException || e is System.Text.Json.JsonException || e is OperationCanceledException || e is CredentialUnavailableException)
            {
                // Revocation must tombstone unknown IDs: an issuer may have accepted the request before its response was lost.
                using (CancellationTokenSource cleanup = new CancellationTokenSource(TimeSpan.FromSeconds(_Settings.TimeoutSeconds)))
                    await RevokeLeaseAsync(lease, cleanup.Token).ConfigureAwait(false);
                if (e is CredentialUnavailableException || (e is OperationCanceledException && token.IsCancellationRequested)) throw;
                throw Failure(secret, "CredentialIssueFailed", "The credential provider did not return a valid bounded credential; the reservation is retained for revocation retries.");
            }
            return new Secret
            {
                Id = secret.Id, TenantId = secret.TenantId, Name = secret.Name, Kind = secret.Kind, Active = secret.Active,
                BrokerResource = secret.BrokerResource, BrokerAudience = secret.BrokerAudience, ExpiresUtc = issued.ExpiresUtc,
                ValueEncrypted = _Cipher.Encrypt(issued.Value, secret.Id)
            };
        }

        /// <summary>Immediately attempt revocation for a completed, suspended, or requeued attempt. Failures remain durable for retry.</summary>
        public async Task RevokeRunAsync(string tenantId, string runId, long epoch, CancellationToken token = default)
        {
            await RunDatabaseTelemetry.MeasureAsync(_Database, tenantId, runId, "credential_revoke", ct => RevokeRunMeasuredCoreAsync(tenantId, runId, epoch, token), token).ConfigureAwait(false);
        }

        private async Task RevokeRunMeasuredCoreAsync(string tenantId, string runId, long epoch, CancellationToken token = default)
        {
            if (!_Settings.Enabled) return;
            List<CredentialLease> leases = await _Database.CredentialLeases.ListOutstandingAsync(tenantId, runId, token).ConfigureAwait(false);
            await RevokeBatchAsync(leases.Where(lease => lease.LeaseEpoch == epoch).ToList(), token).ConfigureAwait(false);
        }

        /// <summary>Revoke active leases when broker resource metadata is changed or deleted.</summary>
        public async Task RevokeSecretAsync(string tenantId, string secretId, CancellationToken token = default)
        {
            if (!_Settings.Enabled) return;
            List<CredentialLease> leases = await _Database.CredentialLeases.ListOutstandingAsync(tenantId, token: token).ConfigureAwait(false);
            await RevokeBatchAsync(leases.Where(lease => lease.SecretId == secretId).ToList(), token).ConfigureAwait(false);
        }

        /// <summary>Retry revocation after completion, suspension, requeue, lease expiry, or a lost run row. Leader invokes this sweep.</summary>
        public async Task SweepAsync(CancellationToken token = default)
        {
            if (!_Settings.Enabled) return;
            List<CredentialLease> leases = await _Database.CredentialLeases.ListRevocationCandidatesAsync(token).ConfigureAwait(false);
            await _Database.CredentialLeases.PurgeRevokedOrphansAsync(token).ConfigureAwait(false);
            // Bound one maintenance pass. Failed records move behind less-attempted candidates on the next sweep.
            using (CancellationTokenSource budget = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                budget.CancelAfter(TimeSpan.FromSeconds(_Settings.TimeoutSeconds));
                try { await RevokeBatchAsync(leases, budget.Token).ConfigureAwait(false); }
                catch (OperationCanceledException) when (!token.IsCancellationRequested) { }
            }
            await _Database.CredentialLeases.PurgeRevokedOrphansAsync(token).ConfigureAwait(false);
        }

        /// <summary>Release provider HTTP resources.</summary>
        public void Dispose() { Dispose(true); GC.SuppressFinalize(this); }
        /// <summary>Release provider HTTP resources.</summary>
        protected virtual void Dispose(bool disposing) { if (_Disposed) return; if (disposing) _Http.Dispose(); _Disposed = true; }

        private Task RevokeBatchAsync(List<CredentialLease> leases, CancellationToken token)
        {
            return Parallel.ForEachAsync(leases, new ParallelOptions { MaxDegreeOfParallelism = _Settings.MaxConcurrency, CancellationToken = token },
                async (lease, ct) => { await RevokeLeaseAsync(lease, ct).ConfigureAwait(false); });
        }

        private async Task<CredentialLeaseIssueResponse> IssueAsync(CredentialLease lease, CancellationToken token)
        {
            return await ApplicationOperation.MeasureAsync("credential_broker", "issue", ct => IssueMeasuredCoreAsync(lease, token), token).ConfigureAwait(false);
        }

        private async Task<CredentialLeaseIssueResponse> IssueMeasuredCoreAsync(CredentialLease lease, CancellationToken token)
        {
            using (HttpRequestMessage request = Request(_Settings.IssuerUrl!, lease))
            using (HttpResponseMessage response = await _Http.SendAsync(request, token).ConfigureAwait(false))
            {
                if (!response.IsSuccessStatusCode) throw new HttpRequestException("Credential issuance was refused.");
                string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                return Serializer.Deserialize<CredentialLeaseIssueResponse>(body) ?? throw new HttpRequestException("Credential issuance returned no response.");
            }
        }

        private async Task<bool> RevokeLeaseAsync(CredentialLease lease, CancellationToken token)
        {
            return await RunDatabaseTelemetry.MeasureAsync(_Database, lease.TenantId, lease.RunId, "credential_revoke", ct => RevokeLeaseMeasuredCoreAsync(lease, token), token).ConfigureAwait(false);
        }

        private async Task<bool> RevokeLeaseMeasuredCoreAsync(CredentialLease lease, CancellationToken token)
        {
            if (!_Settings.Enabled) return false;
            // Persist the attempt before the network call, so cancelled or timed-out batches cannot starve later records.
            await _Database.CredentialLeases.RecordRevocationAsync(lease, false, token).ConfigureAwait(false);
            bool confirmed = false;
            try
            {
                ValidateEndpoint(_Settings.RevokerUrl);
                using (HttpRequestMessage request = Request(_Settings.RevokerUrl!, lease))
                using (HttpResponseMessage response = await _Http.SendAsync(request, token).ConfigureAwait(false))
                    confirmed = response.IsSuccessStatusCode;
            }
            catch (Exception e) when (e is HttpRequestException || e is TaskCanceledException || e is InvalidOperationException) { confirmed = false; }
            if (confirmed) await _Database.CredentialLeases.RecordRevocationAsync(lease, true, token).ConfigureAwait(false);
            return confirmed;
        }

        private HttpRequestMessage Request(string url, CredentialLease lease)
        {
            CredentialLeaseIssueRequest payload = new CredentialLeaseIssueRequest
            {
                LeaseId = lease.Id, TenantId = lease.TenantId, RunId = lease.RunId, LeaseEpoch = lease.LeaseEpoch,
                Resource = lease.Resource, Audience = lease.Audience, ExpiresUtc = lease.ExpiresUtc
            };
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("Idempotency-Key", lease.Id);
            if (!String.IsNullOrEmpty(_Settings.AuthorizationToken)) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _Settings.AuthorizationToken);
            request.Content = new StringContent(Serializer.Serialize(payload), Encoding.UTF8, "application/json");
            return request;
        }

        private void ValidateEndpoint(string? url)
        {
            if (DestinationGuard.CheckUrl(url, _Settings.AllowPrivateDestinations, out Uri? _) != DestinationBlockReasonEnum.None)
                throw new InvalidOperationException("The operator credential provider destination is invalid or blocked.");
        }

        private static CredentialUnavailableException Failure(Secret secret, string code, string message)
        {
            return new CredentialUnavailableException(code, secret.Id, secret.Name, message);
        }
    }
}
