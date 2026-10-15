namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Net.Sockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Notifications;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Outbound notifications (P12.14). The control-plane leader calls <see cref="SweepAsync(CancellationToken)"/> from
    /// its maintenance pass: it reads finished runs and pipeline runs and requested approvals and stage reviews after its
    /// per-source cursor (re-reading Notifications.SweepOverlapSeconds of history so a late write is not missed) and queues
    /// one outbox row per matching endpoint and event, deduplicated by a unique key. Every replica runs a dispatcher that
    /// claims due rows with a compare-and-set, POSTs the signed JSON body, and records the result; failures are retried
    /// with exponential backoff up to Notifications.MaxAttempts. A claim that outlives its expiry (a replica died while
    /// sending) is taken over, so delivery is at least once and receivers deduplicate by the X-Garrison-Delivery header.
    /// Every connection resolves the host and connects only to addresses the SSRF rules allow; redirects are never
    /// followed and no proxy is used. Thread-safe.
    /// </summary>
    public class NotificationService : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Options, refreshed from the Notifications.* cluster settings.
        /// </summary>
        public NotificationOptions Options
        {
            get
            {
                return _Options;
            }
        }

        /// <summary>
        /// Event sources the leader sweeps, in order: runs, pipeline_runs, approvals, pipeline_reviews.
        /// </summary>
        public static readonly IReadOnlyList<string> Sources = new List<string> { "runs", "pipeline_runs", "approvals", "pipeline_reviews" };

        /// <summary>
        /// Resolves a destination host name to addresses when a delivery connects. Default: the system resolver
        /// (Dns.GetHostAddressesAsync). Every address it returns is checked against the SSRF rules before connecting.
        /// Null restores the default.
        /// </summary>
        public Func<string, CancellationToken, Task<IPAddress[]>> Resolver
        {
            get
            {
                return _Resolver;
            }
            set
            {
                _Resolver = value ?? DefaultResolver;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly SecretCipher _Cipher;
        private readonly NotificationOptions _Options;
        private readonly Func<string> _BaseUrl;
        private readonly string _NodeId;
        private readonly LoggingModule _Logging;
        private readonly HttpClient _Http;
        private readonly SemaphoreSlim _Concurrency;
        private readonly HashSet<string> _Seen = new HashSet<string>(StringComparer.Ordinal);
        private readonly object _SeenLock = new object();
        private readonly string _Header = "[Notifications] ";
        private Func<string, CancellationToken, Task<IPAddress[]>> _Resolver = DefaultResolver;
        private CancellationTokenSource? _Cts = null;
        private Task? _Loop = null;
        private DateTime _LastPruneUtc = DateTime.MinValue;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="cipher">Secret cipher (endpoint signing secrets).</param>
        /// <param name="options">Options.</param>
        /// <param name="baseUrl">External REST base URL for payload links, without a trailing slash.</param>
        /// <param name="nodeId">This replica's identifier, recorded on claims.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public NotificationService(DatabaseDriverBase database, SecretCipher cipher, NotificationOptions options, Func<string> baseUrl, string nodeId, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _BaseUrl = baseUrl ?? throw new ArgumentNullException(nameof(baseUrl));
            _NodeId = String.IsNullOrEmpty(nodeId) ? "replica" : nodeId;
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            _Concurrency = new SemaphoreSlim(Math.Max(1, _Options.MaxConcurrentDeliveries));
            SocketsHttpHandler handler = new SocketsHttpHandler();
            handler.AllowAutoRedirect = false;
            handler.UseProxy = false;
            handler.UseCookies = false;
            handler.PooledConnectionLifetime = TimeSpan.FromMinutes(2);
            handler.ConnectCallback = ConnectAsync;
            _Http = new HttpClient(handler, true);
            _Http.Timeout = Timeout.InfiniteTimeSpan;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start this replica's dispatcher loop.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        public void Start(CancellationToken token)
        {
            _Cts = CancellationTokenSource.CreateLinkedTokenSource(token);
            _Loop = Task.Run(() => LoopAsync(_Cts.Token));
        }

        /// <summary>
        /// Stop the dispatcher loop.
        /// </summary>
        /// <returns>Task.</returns>
        public async Task StopAsync()
        {
            _Cts?.Cancel();
            if (_Loop == null) return;
            try
            {
                await _Loop.ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
            }
        }

        /// <summary>
        /// Queue notifications for events since the last sweep (the leader's maintenance step) and prune old deliveries
        /// once an hour.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when at least one notification was queued.</returns>
        public async Task<bool> SweepAsync(CancellationToken token)
        {
            DateTime now = DateTime.UtcNow;
            int queued = 0;
            List<NotificationEndpoint> endpoints = await _Database.NotificationEndpoints.ListActiveAsync(token).ConfigureAwait(false);
            foreach (string source in Sources)
            {
                token.ThrowIfCancellationRequested();
                queued += await SweepSourceAsync(source, endpoints, now, token).ConfigureAwait(false);
            }

            if ((now - _LastPruneUtc).TotalHours >= 1)
            {
                _LastPruneUtc = now;
                int pruned = await _Database.NotificationDeliveries.PruneAsync(now.AddDays(-_Options.DeliveryRetentionDays), token).ConfigureAwait(false);
                if (pruned > 0) GarrisonMetrics.Count(GarrisonMetricCatalog.RetentionDeleted, pruned, GarrisonMetrics.Tags("kind", "notification_deliveries"));
            }
            return queued > 0;
        }

        /// <summary>
        /// Claim and send the deliveries due now, at most Notifications.MaxConcurrentDeliveries at a time. The background
        /// loop calls it every Notifications.DispatchIntervalMs; tests call it directly.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Number of attempts made.</returns>
        public async Task<int> DispatchOnceAsync(CancellationToken token)
        {
            List<NotificationDelivery> due = await _Database.NotificationDeliveries.ListDueAsync(DateTime.UtcNow, _Options.DispatchBatchSize, token).ConfigureAwait(false);
            if (due.Count == 0) return 0;
            List<Task<bool>> attempts = new List<Task<bool>>();
            foreach (NotificationDelivery delivery in due)
            {
                attempts.Add(AttemptLimitedAsync(delivery, token));
            }
            bool[] results = await Task.WhenAll(attempts).ConfigureAwait(false);
            return results.Count(r => r);
        }

        /// <summary>
        /// Queue a test notification for an endpoint (active or not) and make its first attempt now. Later attempts, if
        /// the first one fails with a retryable error, follow the normal backoff.
        /// </summary>
        /// <param name="endpoint">Endpoint.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The delivery after its first attempt.</returns>
        /// <exception cref="ArgumentNullException">Thrown when endpoint is null.</exception>
        public async Task<NotificationDelivery> SendTestAsync(NotificationEndpoint endpoint, CancellationToken token = default)
        {
            if (endpoint == null) throw new ArgumentNullException(nameof(endpoint));
            NotificationDelivery delivery = new NotificationDelivery();
            delivery.TenantId = endpoint.TenantId;
            delivery.EndpointId = endpoint.Id;
            delivery.Event = NotificationEventEnum.Test;
            delivery.EventKey = "test:" + delivery.Id;
            delivery.SubjectType = "Test";
            delivery.MaxAttempts = _Options.MaxAttempts;
            delivery.NextAttemptUtc = DateTime.UtcNow;
            NotificationPayload payload = new NotificationPayload();
            payload.Id = delivery.Id;
            payload.Event = NotificationEventEnum.Test;
            payload.TenantId = endpoint.TenantId;
            payload.EndpointId = endpoint.Id;
            payload.OccurredUtc = DateTime.UtcNow;
            delivery.Payload = Serializer.Serialize(payload);
            await _Database.NotificationDeliveries.TryCreateAsync(delivery, token).ConfigureAwait(false);
            GarrisonMetrics.Count(GarrisonMetricCatalog.NotificationsQueued, "event", "test");
            await AttemptAsync(delivery, token).ConfigureAwait(false);
            return await _Database.NotificationDeliveries.ReadAsync(endpoint.TenantId, delivery.Id, token).ConfigureAwait(false) ?? delivery;
        }

        /// <summary>
        /// Delay before the next attempt after a number of failed attempts: InitialBackoffSeconds doubled for each attempt
        /// after the first, capped at MaxBackoffSeconds.
        /// </summary>
        /// <param name="failedAttempts">Attempts made so far. Minimum 1.</param>
        /// <returns>Delay.</returns>
        public TimeSpan Backoff(int failedAttempts)
        {
            int exponent = Math.Clamp(failedAttempts - 1, 0, 30);
            double seconds = Math.Min(_Options.MaxBackoffSeconds, _Options.InitialBackoffSeconds * Math.Pow(2, exponent));
            return TimeSpan.FromSeconds(Math.Max(1, seconds));
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                _Cts?.Cancel();
                _Cts?.Dispose();
                _Http.Dispose();
                _Concurrency.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task LoopAsync(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await DispatchOnceAsync(token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + "dispatch pass failed: " + e.Message);
                }
                await Task.Delay(_Options.DispatchIntervalMs, token).ConfigureAwait(false);
            }
        }

        private static Task<IPAddress[]> DefaultResolver(string host, CancellationToken token)
        {
            return Dns.GetHostAddressesAsync(host, token);
        }

        private async Task<bool> AttemptLimitedAsync(NotificationDelivery delivery, CancellationToken token)
        {
            await _Concurrency.WaitAsync(token).ConfigureAwait(false);
            try
            {
                return await AttemptAsync(delivery, token).ConfigureAwait(false);
            }
            finally
            {
                _Concurrency.Release();
            }
        }

        private async Task<bool> AttemptAsync(NotificationDelivery delivery, CancellationToken token)
        {
            DateTime now = DateTime.UtcNow;
            DateTime claimUntil = now.AddSeconds(_Options.TimeoutSeconds + 30);
            if (!await _Database.NotificationDeliveries.TryClaimAsync(delivery.Id, _NodeId, now, claimUntil, token).ConfigureAwait(false)) return false;

            delivery.Attempts = delivery.Attempts + 1;
            delivery.LastAttemptUtc = now;
            delivery.LastStatusCode = null;
            delivery.LastError = null;
            string result;
            Stopwatch watch = Stopwatch.StartNew();
            NotificationEndpoint? endpoint = await _Database.NotificationEndpoints.ReadAsync(delivery.TenantId, delivery.EndpointId, token).ConfigureAwait(false);
            string? secret = endpoint == null ? null : SigningSecrets.Read(endpoint, _Cipher);
            if (endpoint == null)
            {
                result = GiveUp(delivery, "The notification endpoint no longer exists.");
            }
            else if (!endpoint.Active && delivery.Event != NotificationEventEnum.Test)
            {
                result = GiveUp(delivery, "The notification endpoint is inactive.");
            }
            else if (secret == null)
            {
                result = GiveUp(delivery, "The endpoint signing secret cannot be read (was the master key changed?). Rotate the signing secret.");
            }
            else
            {
                DestinationBlockReasonEnum blocked = DestinationGuard.CheckUrl(endpoint.Url, _Options.AllowPrivateDestinations, out Uri? uri);
                if (blocked != DestinationBlockReasonEnum.None || uri == null)
                {
                    result = "blocked";
                    GiveUp(delivery, "The destination is refused (" + blocked + ").");
                }
                else
                {
                    result = await SendAsync(delivery, endpoint, secret, uri, token).ConfigureAwait(false);
                }
            }
            watch.Stop();
            delivery.LastDurationMs = watch.ElapsedMilliseconds;

            if (!await _Database.NotificationDeliveries.CompleteAttemptAsync(delivery, _NodeId, CancellationToken.None).ConfigureAwait(false))
            {
                _Logging.Warn(_Header + "delivery " + delivery.Id + " finished after its claim expired; another replica owns it now");
            }
            GarrisonMetrics.Count(GarrisonMetricCatalog.NotificationDeliveries, "event", delivery.Event.ToString(), "result", result);
            if (delivery.Status == NotificationDeliveryStatusEnum.Failed)
            {
                _Logging.Warn(_Header + "delivery " + delivery.Id + " (" + delivery.Event + ") to endpoint " + delivery.EndpointId + " gave up after " + delivery.Attempts + " attempt(s): " + delivery.LastError + " " + GarrisonTracing.LogFields("tenant", delivery.TenantId));
            }
            return true;
        }

        private async Task<string> SendAsync(NotificationDelivery delivery, NotificationEndpoint endpoint, string secret, Uri uri, CancellationToken token)
        {
            byte[] body = Encoding.UTF8.GetBytes(delivery.Payload);
            long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                timeout.CancelAfter(TimeSpan.FromSeconds(_Options.TimeoutSeconds));
                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, uri))
                {
                    request.Content = new ByteArrayContent(body);
                    request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json") { CharSet = "utf-8" };
                    request.Headers.TryAddWithoutValidation("User-Agent", Constants.ProductName + "/" + Constants.ProductVersion);
                    request.Headers.TryAddWithoutValidation(Constants.HeaderWebhookEvent, delivery.Event.ToString());
                    request.Headers.TryAddWithoutValidation(Constants.HeaderWebhookDelivery, delivery.Id);
                    request.Headers.TryAddWithoutValidation(Constants.HeaderWebhookSignature, WebhookSigner.Header(secret, timestamp, body));
                    try
                    {
                        using (HttpResponseMessage response = await _Http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token).ConfigureAwait(false))
                        {
                            int status = (int)response.StatusCode;
                            delivery.LastStatusCode = status;
                            if (status >= 200 && status < 300)
                            {
                                delivery.Status = NotificationDeliveryStatusEnum.Succeeded;
                                delivery.DeliveredUtc = DateTime.UtcNow;
                                delivery.NextAttemptUtc = null;
                                return "succeeded";
                            }
                            if (status >= 300 && status < 400)
                            {
                                string location = response.Headers.Location?.ToString() ?? "no Location header";
                                return GiveUp(delivery, "The endpoint answered " + status + " (redirect to " + Truncate(location, 256) + "); redirects are not followed.");
                            }
                            if (status == 408 || status == 429 || status >= 500) return Retry(delivery, "The endpoint answered " + status + ".");
                            return GiveUp(delivery, "The endpoint answered " + status + ", which is not retried.");
                        }
                    }
                    catch (OperationCanceledException) when (!token.IsCancellationRequested)
                    {
                        return Retry(delivery, "The endpoint did not answer within " + _Options.TimeoutSeconds + " seconds.");
                    }
                    catch (HttpRequestException e)
                    {
                        DestinationBlockedException? blocked = FindBlocked(e);
                        if (blocked != null && blocked.Reason != DestinationBlockReasonEnum.Unresolved)
                        {
                            GiveUp(delivery, blocked.Message);
                            return "blocked";
                        }
                        return Retry(delivery, blocked != null ? blocked.Message : "The request failed: " + Truncate(e.Message, 512));
                    }
                }
            }
        }

        private string Retry(NotificationDelivery delivery, string error)
        {
            delivery.LastError = error;
            if (delivery.Attempts >= delivery.MaxAttempts) return GiveUp(delivery, error + " Gave up after " + delivery.Attempts + " attempt(s).");
            delivery.Status = NotificationDeliveryStatusEnum.Pending;
            delivery.NextAttemptUtc = DateTime.UtcNow.Add(Backoff(delivery.Attempts));
            return "retry";
        }

        private static string GiveUp(NotificationDelivery delivery, string error)
        {
            delivery.LastError = error;
            delivery.Status = NotificationDeliveryStatusEnum.Failed;
            delivery.NextAttemptUtc = null;
            return "failed";
        }

        private static DestinationBlockedException? FindBlocked(Exception? e)
        {
            while (e != null)
            {
                if (e is DestinationBlockedException blocked) return blocked;
                e = e.InnerException;
            }
            return null;
        }

        private async ValueTask<Stream> ConnectAsync(SocketsHttpConnectionContext context, CancellationToken token)
        {
            DnsEndPoint target = context.DnsEndPoint;
            bool allowPrivate = _Options.AllowPrivateDestinations;
            string host = target.Host.TrimEnd('.');
            if ((String.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase) || host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase)) && !allowPrivate)
            {
                throw new DestinationBlockedException(DestinationBlockReasonEnum.Loopback, "The destination " + host + " is refused (Loopback).");
            }

            IPAddress[] addresses;
            if (IPAddress.TryParse(host.Trim('[', ']'), out IPAddress? literal))
            {
                addresses = new IPAddress[] { literal };
            }
            else
            {
                try
                {
                    addresses = await _Resolver(host, token).ConfigureAwait(false);
                }
                catch (SocketException e)
                {
                    throw new DestinationBlockedException(DestinationBlockReasonEnum.Unresolved, "The host " + host + " did not resolve: " + e.Message);
                }
            }
            if (addresses.Length == 0) throw new DestinationBlockedException(DestinationBlockReasonEnum.Unresolved, "The host " + host + " did not resolve to any address.");

            // Connect only to addresses the rules allow, checked after resolution so a name that resolves (or rebinds) to
            // a refused address never gets a connection.
            List<IPAddress> allowed = new List<IPAddress>();
            DestinationBlockReasonEnum firstReason = DestinationBlockReasonEnum.None;
            foreach (IPAddress address in addresses)
            {
                DestinationBlockReasonEnum reason = DestinationGuard.CheckAddress(address, allowPrivate);
                if (reason == DestinationBlockReasonEnum.None) allowed.Add(address);
                else if (firstReason == DestinationBlockReasonEnum.None) firstReason = reason;
            }
            if (allowed.Count == 0) throw new DestinationBlockedException(firstReason, "The destination " + host + " resolves only to refused addresses (" + firstReason + ").");

            SocketException? last = null;
            foreach (IPAddress address in allowed)
            {
                Socket socket = new Socket(address.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
                socket.NoDelay = true;
                try
                {
                    await socket.ConnectAsync(new IPEndPoint(address, target.Port), token).ConfigureAwait(false);
                    return new NetworkStream(socket, true);
                }
                catch (SocketException e)
                {
                    socket.Dispose();
                    last = e;
                }
                catch (Exception)
                {
                    socket.Dispose();
                    throw;
                }
            }
            throw last ?? new SocketException((int)SocketError.HostUnreachable);
        }

        private async Task<int> SweepSourceAsync(string source, List<NotificationEndpoint> endpoints, DateTime now, CancellationToken token)
        {
            NotificationCursor? stored = await _Database.NotificationDeliveries.ReadCursorAsync(source, token).ConfigureAwait(false);
            NotificationCursor cursor = stored ?? new NotificationCursor { Source = source, CursorUtc = now, CursorId = String.Empty };
            List<NotificationEndpoint> interested = endpoints.Where(e => e.Events.Any(ev => SourceWants(source, ev))).ToList();
            if (interested.Count == 0)
            {
                // Nothing subscribes to this source: keep the cursor near now (a new endpoint never receives history it
                // predates anyway), writing it at most once a minute while idle.
                if (stored != null && (now - stored.LastUpdateUtc).TotalSeconds < 60) return 0;
                cursor.CursorUtc = now;
                cursor.CursorId = String.Empty;
                await _Database.NotificationDeliveries.WriteCursorAsync(cursor, token).ConfigureAwait(false);
                return 0;
            }

            List<string> tenants = interested.Select(e => e.TenantId).Distinct(StringComparer.Ordinal).ToList();
            DateTime start = cursor.CursorUtc.AddSeconds(-_Options.SweepOverlapSeconds);
            DateTime? incompleteAt = null;
            int queued = 0;
            Stopwatch budget = Stopwatch.StartNew();
            foreach (List<string> chunk in Chunk(tenants, 400))
            {
                DateTime afterUtc = start;
                string afterId = String.Empty;
                bool complete = false;
                while (!complete && budget.ElapsedMilliseconds < 2000)
                {
                    token.ThrowIfCancellationRequested();
                    int read;
                    DateTime lastUtc = afterUtc;
                    string lastId = afterId;
                    switch (source)
                    {
                        case "runs":
                            List<Run> runs = await _Database.NotificationDeliveries.ListFinishedRunsAsync(chunk, afterUtc, afterId, now, _Options.SweepBatchSize, token).ConfigureAwait(false);
                            read = runs.Count;
                            foreach (Run run in runs)
                            {
                                queued += await QueueRunAsync(run, interested, token).ConfigureAwait(false);
                                if (run.CompletedUtc.HasValue) Advance(run.CompletedUtc.Value, run.Id, ref lastUtc, ref lastId);
                            }
                            break;
                        case "pipeline_runs":
                            List<PipelineRun> pipelineRuns = await _Database.NotificationDeliveries.ListFinishedPipelineRunsAsync(chunk, afterUtc, afterId, now, _Options.SweepBatchSize, token).ConfigureAwait(false);
                            read = pipelineRuns.Count;
                            foreach (PipelineRun pipelineRun in pipelineRuns)
                            {
                                queued += await QueuePipelineRunAsync(pipelineRun, interested, token).ConfigureAwait(false);
                                if (pipelineRun.CompletedUtc.HasValue) Advance(pipelineRun.CompletedUtc.Value, pipelineRun.Id, ref lastUtc, ref lastId);
                            }
                            break;
                        case "approvals":
                            List<Approval> approvals = await _Database.NotificationDeliveries.ListRequestedApprovalsAsync(chunk, afterUtc, afterId, now, _Options.SweepBatchSize, token).ConfigureAwait(false);
                            read = approvals.Count;
                            foreach (Approval approval in approvals)
                            {
                                queued += await QueueApprovalAsync(approval, interested, token).ConfigureAwait(false);
                                Advance(approval.CreatedUtc, approval.Id, ref lastUtc, ref lastId);
                            }
                            break;
                        default:
                            List<PipelineReview> reviews = await _Database.NotificationDeliveries.ListRequestedReviewsAsync(chunk, afterUtc, afterId, now, _Options.SweepBatchSize, token).ConfigureAwait(false);
                            read = reviews.Count;
                            foreach (PipelineReview review in reviews)
                            {
                                queued += await QueueReviewAsync(review, interested, token).ConfigureAwait(false);
                                Advance(review.CreatedUtc, review.Id, ref lastUtc, ref lastId);
                            }
                            break;
                    }
                    afterUtc = lastUtc;
                    afterId = lastId;
                    if (read < _Options.SweepBatchSize) complete = true;
                }
                if (!complete && (!incompleteAt.HasValue || afterUtc < incompleteAt.Value)) incompleteAt = afterUtc;
            }

            // A pass that ran out of time resumes where its slowest chunk stopped; the overlap re-reads around it and the
            // unique event keys drop what was already queued.
            DateTime next = incompleteAt ?? now;
            cursor.CursorUtc = next > cursor.CursorUtc ? next : cursor.CursorUtc;
            cursor.CursorId = String.Empty;
            await _Database.NotificationDeliveries.WriteCursorAsync(cursor, token).ConfigureAwait(false);
            return queued;
        }

        private static bool SourceWants(string source, NotificationEventEnum value)
        {
            switch (value)
            {
                case NotificationEventEnum.RunSucceeded:
                case NotificationEventEnum.RunFailed:
                case NotificationEventEnum.RunCancelled:
                case NotificationEventEnum.RunTimedOut:
                    return source == "runs";
                case NotificationEventEnum.PipelineCompleted:
                case NotificationEventEnum.PipelineFailed:
                    return source == "pipeline_runs";
                case NotificationEventEnum.ApprovalRequested:
                    return source == "approvals" || source == "pipeline_reviews";
                default:
                    return false;
            }
        }

        private static void Advance(DateTime utc, string id, ref DateTime lastUtc, ref string lastId)
        {
            if (utc > lastUtc || (utc == lastUtc && String.CompareOrdinal(id, lastId) > 0))
            {
                lastUtc = utc;
                lastId = id;
            }
        }

        private static IEnumerable<List<string>> Chunk(List<string> values, int size)
        {
            for (int i = 0; i < values.Count; i += size) yield return values.Skip(i).Take(size).ToList();
        }

        private static bool Subscribed(NotificationEndpoint endpoint, string tenantId, NotificationEventEnum value, DateTime occurredUtc)
        {
            return endpoint.TenantId == tenantId && endpoint.Events.Contains(value) && occurredUtc >= endpoint.CreatedUtc;
        }

        private static bool Matches(NotificationEndpoint endpoint, string? agentId, string? deploymentId)
        {
            if (!String.IsNullOrEmpty(endpoint.AgentId) && !String.Equals(endpoint.AgentId, agentId, StringComparison.Ordinal)) return false;
            if (!String.IsNullOrEmpty(endpoint.DeploymentId) && !String.Equals(endpoint.DeploymentId, deploymentId, StringComparison.Ordinal)) return false;
            return true;
        }

        private static NotificationEventEnum? RunEvent(RunStatusEnum status)
        {
            switch (status)
            {
                case RunStatusEnum.Succeeded:
                    return NotificationEventEnum.RunSucceeded;
                case RunStatusEnum.Failed:
                case RunStatusEnum.Rejected:
                    return NotificationEventEnum.RunFailed;
                case RunStatusEnum.Cancelled:
                    return NotificationEventEnum.RunCancelled;
                case RunStatusEnum.TimedOut:
                    return NotificationEventEnum.RunTimedOut;
                default:
                    return null;
            }
        }

        private async Task<int> QueueRunAsync(Run run, List<NotificationEndpoint> endpoints, CancellationToken token)
        {
            NotificationEventEnum? value = RunEvent(run.Status);
            if (!value.HasValue || !run.CompletedUtc.HasValue) return 0;
            int queued = 0;
            foreach (NotificationEndpoint endpoint in endpoints)
            {
                if (!Subscribed(endpoint, run.TenantId, value.Value, run.CompletedUtc.Value) || !Matches(endpoint, run.AgentId, run.DeploymentId)) continue;
                NotificationRunSummary summary = new NotificationRunSummary();
                summary.Id = run.Id;
                summary.AgentId = run.AgentId;
                summary.AgentName = run.AgentName;
                summary.DeploymentId = run.DeploymentId;
                summary.Kind = run.Kind;
                summary.Status = run.Status;
                summary.Outcome = run.Outcome;
                summary.Attempt = run.Attempt;
                summary.ParentRunId = run.ParentRunId;
                summary.PipelineRunId = run.PipelineRunId;
                summary.TriggerId = run.TriggerId;
                summary.CreatedUtc = run.CreatedUtc;
                summary.StartedUtc = run.StartedUtc;
                summary.CompletedUtc = run.CompletedUtc;
                if (endpoint.IncludeResultText)
                {
                    string text = run.ResultText ?? String.Empty;
                    summary.ResultTruncated = text.Length > endpoint.ResultTextMaxChars;
                    summary.ResultText = summary.ResultTruncated.Value ? text.Substring(0, endpoint.ResultTextMaxChars) : text;
                }
                NotificationPayload payload = NewPayload(endpoint, value.Value, run.CompletedUtc.Value, "/runs/" + run.Id);
                payload.Run = summary;
                string key = "run:" + run.Id + ":" + run.Status + ":" + run.CompletedUtc.Value.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture);
                if (await QueueAsync(endpoint, value.Value, key, "Run", run.Id, payload, token).ConfigureAwait(false)) queued++;
            }
            return queued;
        }

        private async Task<int> QueuePipelineRunAsync(PipelineRun run, List<NotificationEndpoint> endpoints, CancellationToken token)
        {
            if (!run.CompletedUtc.HasValue) return 0;
            NotificationEventEnum value = run.Status == PipelineRunStatusEnum.Succeeded ? NotificationEventEnum.PipelineCompleted : NotificationEventEnum.PipelineFailed;
            int queued = 0;
            foreach (NotificationEndpoint endpoint in endpoints)
            {
                // Pipeline runs have no single agent or deployment, so a filtered endpoint does not receive them.
                if (!Subscribed(endpoint, run.TenantId, value, run.CompletedUtc.Value) || !String.IsNullOrEmpty(endpoint.AgentId) || !String.IsNullOrEmpty(endpoint.DeploymentId)) continue;
                NotificationPipelineRunSummary summary = new NotificationPipelineRunSummary();
                summary.Id = run.Id;
                summary.PipelineId = run.PipelineId;
                summary.PipelineName = run.PipelineName;
                summary.Status = run.Status;
                summary.Outcome = run.Outcome;
                summary.StageCount = run.StageCount;
                summary.FinalRunId = run.FinalRunId;
                summary.TriggerId = run.TriggerId;
                summary.CreatedUtc = run.CreatedUtc;
                summary.StartedUtc = run.StartedUtc;
                summary.CompletedUtc = run.CompletedUtc;
                NotificationPayload payload = NewPayload(endpoint, value, run.CompletedUtc.Value, "/pipeline-runs/" + run.Id);
                payload.PipelineRun = summary;
                string key = "pipeline-run:" + run.Id + ":" + run.Status + ":" + run.CompletedUtc.Value.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture);
                if (await QueueAsync(endpoint, value, key, "PipelineRun", run.Id, payload, token).ConfigureAwait(false)) queued++;
            }
            return queued;
        }

        private async Task<int> QueueApprovalAsync(Approval approval, List<NotificationEndpoint> endpoints, CancellationToken token)
        {
            // Requests a rule or the deployment default decided at once never waited for anyone.
            if (approval.DecisionSource == ApprovalSourceEnum.Rule || approval.DecisionSource == ApprovalSourceEnum.Default) return 0;
            int queued = 0;
            foreach (NotificationEndpoint endpoint in endpoints)
            {
                if (!Subscribed(endpoint, approval.TenantId, NotificationEventEnum.ApprovalRequested, approval.CreatedUtc) || !Matches(endpoint, approval.AgentId, approval.DeploymentId)) continue;
                NotificationApprovalSummary summary = new NotificationApprovalSummary();
                summary.Kind = "Permission";
                summary.Id = approval.Id;
                summary.RunId = approval.RunId;
                summary.AgentId = approval.AgentId;
                summary.AgentName = approval.AgentName;
                summary.DeploymentId = approval.DeploymentId;
                summary.ToolName = approval.ToolName;
                summary.RequestedUtc = approval.RequestedUtc;
                summary.ExpiresUtc = approval.ExpiresUtc;
                NotificationPayload payload = NewPayload(endpoint, NotificationEventEnum.ApprovalRequested, approval.CreatedUtc, "/approvals/" + approval.Id);
                payload.Approval = summary;
                if (await QueueAsync(endpoint, NotificationEventEnum.ApprovalRequested, "approval:" + approval.Id, "Approval", approval.Id, payload, token).ConfigureAwait(false)) queued++;
            }
            return queued;
        }

        private async Task<int> QueueReviewAsync(PipelineReview review, List<NotificationEndpoint> endpoints, CancellationToken token)
        {
            int queued = 0;
            Run? run = null;
            bool runRead = false;
            foreach (NotificationEndpoint endpoint in endpoints)
            {
                if (!Subscribed(endpoint, review.TenantId, NotificationEventEnum.ApprovalRequested, review.CreatedUtc)) continue;
                if (!String.IsNullOrEmpty(endpoint.AgentId) || !String.IsNullOrEmpty(endpoint.DeploymentId))
                {
                    if (!runRead)
                    {
                        run = await _Database.Runs.ReadAsync(review.TenantId, review.RunId, token).ConfigureAwait(false);
                        runRead = true;
                    }
                    if (run == null || !Matches(endpoint, run.AgentId, run.DeploymentId)) continue;
                }
                NotificationApprovalSummary summary = new NotificationApprovalSummary();
                summary.Kind = "StageReview";
                summary.Id = review.Id;
                summary.RunId = review.RunId;
                summary.PipelineRunId = review.PipelineRunId;
                summary.PipelineName = review.PipelineName;
                summary.StageName = review.StageName;
                summary.RequestedUtc = review.RequestedUtc;
                summary.ExpiresUtc = review.ExpiresUtc;
                NotificationPayload payload = NewPayload(endpoint, NotificationEventEnum.ApprovalRequested, review.CreatedUtc, "/pipeline-reviews/" + review.Id);
                payload.Approval = summary;
                if (await QueueAsync(endpoint, NotificationEventEnum.ApprovalRequested, "review:" + review.Id, "PipelineReview", review.Id, payload, token).ConfigureAwait(false)) queued++;
            }
            return queued;
        }

        private NotificationPayload NewPayload(NotificationEndpoint endpoint, NotificationEventEnum value, DateTime occurredUtc, string relativePath)
        {
            NotificationPayload payload = new NotificationPayload();
            payload.Event = value;
            payload.TenantId = endpoint.TenantId;
            payload.EndpointId = endpoint.Id;
            payload.OccurredUtc = occurredUtc;
            payload.Link = _BaseUrl() + "/v1.0/api/tenants/" + endpoint.TenantId + relativePath;
            return payload;
        }

        private async Task<bool> QueueAsync(NotificationEndpoint endpoint, NotificationEventEnum value, string eventKey, string subjectType, string subjectId, NotificationPayload payload, CancellationToken token)
        {
            string seenKey = endpoint.Id + "|" + eventKey;
            lock (_SeenLock)
            {
                if (_Seen.Contains(seenKey)) return false;
            }
            NotificationDelivery delivery = new NotificationDelivery();
            delivery.TenantId = endpoint.TenantId;
            delivery.EndpointId = endpoint.Id;
            delivery.Event = value;
            delivery.EventKey = eventKey;
            delivery.SubjectType = subjectType;
            delivery.SubjectId = subjectId;
            delivery.MaxAttempts = _Options.MaxAttempts;
            delivery.NextAttemptUtc = DateTime.UtcNow;
            payload.Id = delivery.Id;
            delivery.Payload = Serializer.Serialize(payload);
            bool created = await _Database.NotificationDeliveries.TryCreateAsync(delivery, token).ConfigureAwait(false);
            lock (_SeenLock)
            {
                if (_Seen.Count > 50000) _Seen.Clear();
                _Seen.Add(seenKey);
            }
            if (created) GarrisonMetrics.Count(GarrisonMetricCatalog.NotificationsQueued, "event", value.ToString());
            return created;
        }

        private static string Truncate(string value, int max)
        {
            if (value.Length <= max) return value;
            return value.Substring(0, max);
        }

        #endregion
    }
}
