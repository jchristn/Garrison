namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Net.Http;
    using System.Security.Cryptography;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Codex;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Settings;
    using SyslogLogging;

    /// <summary>
    /// Owns the refresh of ChatGPT logins stored in CodexAuthJson secrets (G-22). OpenAI rotates the refresh token on
    /// every refresh, so only the control plane may refresh: before a run is compiled it refreshes a login whose access
    /// token is close to expiry and writes the rotated tokens back to the secret (encrypted), and runs receive a copy
    /// without the refresh token. One refresh per secret runs at a time across every replica, under a database
    /// coordination lease named <c>codex-refresh:&lt;secretId&gt;</c>; a caller that loses the race waits and reads the
    /// refreshed secret back. The write-back is a compare-and-swap on the stored value, so it never overwrites a value
    /// an operator replaced meanwhile. A refresh the provider rejects for good marks the secret NeedsReauthentication.
    /// Optionally, the leader also refreshes idle logins on <see cref="CodexSettings.RefreshCheckIntervalSeconds"/>.
    /// Thread-safe.
    /// </summary>
    public class CodexCredentialService : ISecretPreparer, IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Raised after every check that got past the quick "is it a refreshable, expiring login" test, with the
        /// outcome (Refreshed, RefreshedByPeer, NeedsReauthentication, or Failed; NotNeeded only when the secret was
        /// re-read under the lease and turned out fresh). This is the one place refresh outcomes are decided, for
        /// telemetry and tests. Handlers run synchronously on the refreshing thread and must not throw.
        /// </summary>
        public event EventHandler<CodexRefreshResult>? RefreshCompleted;

        /// <summary>
        /// For an access token without an exp claim: refresh when the login's last_refresh is older than this, as the
        /// Codex CLI does. Minimum 1 hour, maximum 90 days, default 8 days.
        /// </summary>
        public TimeSpan MaxAgeWithoutExpiry
        {
            get
            {
                return _MaxAgeWithoutExpiry;
            }
            set
            {
                if (value < TimeSpan.FromHours(1) || value > TimeSpan.FromDays(90)) throw new ArgumentOutOfRangeException(nameof(MaxAgeWithoutExpiry), "MaxAgeWithoutExpiry must be between 1 hour and 90 days.");
                _MaxAgeWithoutExpiry = value;
            }
        }

        /// <summary>
        /// How long a caller that lost the refresh race waits between reads of the secret, in milliseconds. Minimum 50,
        /// maximum 5000, default 250.
        /// </summary>
        public int LockPollMs
        {
            get
            {
                return _LockPollMs;
            }
            set
            {
                if (value < 50 || value > 5000) throw new ArgumentOutOfRangeException(nameof(LockPollMs), "LockPollMs must be between 50 and 5000.");
                _LockPollMs = value;
            }
        }

        /// <summary>
        /// A run may still start with a login whose refresh failed for a transient reason when its access token is
        /// valid for at least this many more seconds. Minimum 0, maximum 86400, default 300.
        /// </summary>
        public int MinimumRemainingSeconds
        {
            get
            {
                return _MinimumRemainingSeconds;
            }
            set
            {
                if (value < 0 || value > 86400) throw new ArgumentOutOfRangeException(nameof(MinimumRemainingSeconds), "MinimumRemainingSeconds must be between 0 and 86400.");
                _MinimumRemainingSeconds = value;
            }
        }

        #endregion

        #region Private-Members

        private static readonly string _LeasePrefix = "codex-refresh:";
        private static readonly JsonSerializerOptions _Json = new JsonSerializerOptions();

        private readonly ILeaseProvider _Leases;
        private readonly DatabaseDriverBase _Database;
        private readonly SecretCipher _Cipher;
        private readonly Func<CodexSettings> _Settings;
        private readonly string _NodeId;
        private readonly LoggingModule _Logging;
        private readonly HttpClient _Http;
        private readonly string _Header = "[CodexCredentials] ";
        private TimeSpan _MaxAgeWithoutExpiry = TimeSpan.FromDays(8);
        private int _LockPollMs = 250;
        private int _MinimumRemainingSeconds = 300;
        private CancellationTokenSource? _LoopCts = null;
        private Task? _Loop = null;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="cipher">Secret cipher.</param>
        /// <param name="settings">Returns the current Codex settings (read on every check, so changes apply live).</param>
        /// <param name="nodeId">This replica's identifier, used in lease holder names.</param>
        /// <param name="logging">Logging.</param>
        /// <param name="leaseProvider">Optional coordination provider; null retains database leases.</param>
        /// <param name="handler">HTTP handler for the token endpoint, or null for the default. The service owns and disposes it.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public CodexCredentialService(DatabaseDriverBase database, SecretCipher cipher, Func<CodexSettings> settings, string nodeId, LoggingModule logging, HttpMessageHandler? handler = null, ILeaseProvider? leaseProvider = null)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Leases = leaseProvider ?? new DatabaseLeaseProvider(database.CoordinationLeases);
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
            if (String.IsNullOrEmpty(nodeId)) throw new ArgumentNullException(nameof(nodeId));
            _NodeId = nodeId;
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            _Http = handler == null ? new HttpClient() : new HttpClient(handler, true);
            _Http.Timeout = Timeout.InfiniteTimeSpan;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Name of the coordination lease that serializes refreshes of one secret.
        /// </summary>
        /// <param name="secretId">Secret identifier.</param>
        /// <returns>Lease name.</returns>
        public static string LeaseName(string secretId)
        {
            return _LeasePrefix + secretId;
        }

        /// <summary>
        /// Delete the refresh lease row of a deleted secret. Missing rows are ignored.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="secretId">Secret identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when database or secretId is null.</exception>
        public static async Task DeleteLeaseAsync(DatabaseDriverBase database, string secretId, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (String.IsNullOrEmpty(secretId)) throw new ArgumentNullException(nameof(secretId));
            CoordinationLease? lease = await database.CoordinationLeases.ReadByNameAsync(LeaseName(secretId), token).ConfigureAwait(false);
            if (lease != null) await database.CoordinationLeases.DeleteAsync(lease.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Prepare a bound secret for a run: refresh a CodexAuthJson login that is close to expiry and return the
        /// secret to compile with. Other secrets are returned as they are.
        /// </summary>
        /// <param name="secret">Secret as loaded for the run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The secret to compile with.</returns>
        /// <exception cref="ArgumentNullException">Thrown when secret is null.</exception>
        /// <exception cref="CredentialUnavailableException">Thrown when the login needs reauthentication, or is expired and could not be refreshed.</exception>
        public async Task<Secret> PrepareAsync(Secret secret, CancellationToken token = default)
        {
            if (secret == null) throw new ArgumentNullException(nameof(secret));
            if (secret.Kind != SecretKindEnum.CodexAuthJson) return secret;

            CodexRefreshResult result = await RefreshIfDueAsync(secret, true, token).ConfigureAwait(false);
            switch (result.Outcome)
            {
                case CodexRefreshOutcomeEnum.NeedsReauthentication:
                    throw new CredentialUnavailableException("SecretNeedsReauthentication", secret.Id, secret.Name, ReauthenticationMessage(result.Secret, result.Message));
                case CodexRefreshOutcomeEnum.Failed:
                    DateTime? expires = AccessTokenExpiry(result.Secret);
                    if (expires.HasValue && expires.Value > DateTime.UtcNow.AddSeconds(_MinimumRemainingSeconds))
                    {
                        _Logging.Warn(_Header + "secret " + secret.Id + " could not be refreshed (" + result.Message + "); its access token is still valid until " + expires.Value.ToString("o") + ", so the run uses it");
                        return result.Secret;
                    }
                    throw new CredentialUnavailableException("SecretRefreshFailed", secret.Id, secret.Name,
                        "Secret " + secret.Name + " holds a ChatGPT login for Codex whose access token is expired or about to expire, and the control plane could not refresh it right now: " + result.Message + ". The run was not started. Retry it; if this keeps happening, check that the control plane can reach " + _Settings().TokenEndpoint + ".");
                default:
                    return result.Secret;
            }
        }

        /// <summary>
        /// Check a CodexAuthJson secret and refresh its login when the access token is close to expiry. At most one
        /// refresh of a secret runs at a time across every replica; a caller that loses the race waits for the other
        /// refresh and reads its result back. Never throws for provider or network failures: the outcome says what
        /// happened.
        /// </summary>
        /// <param name="secret">Secret.</param>
        /// <param name="forRun">Whether the check is made for a run (true) or by the background refresh (false).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when secret is null.</exception>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled.</exception>
        public async Task<CodexRefreshResult> RefreshIfDueAsync(Secret secret, bool forRun, CancellationToken token = default)
        {
            if (secret == null) throw new ArgumentNullException(nameof(secret));

            if (secret.Kind != SecretKindEnum.CodexAuthJson) return new CodexRefreshResult(CodexRefreshOutcomeEnum.NotNeeded, secret);
            if (secret.Status == SecretStatusEnum.NeedsReauthentication) return new CodexRefreshResult(CodexRefreshOutcomeEnum.NeedsReauthentication, secret, secret.StatusMessage);

            CodexAuthFile? file = CodexAuthDocument.TryParse(DecryptOrNull(secret));
            if (file == null || !file.IsRefreshable() || !IsDue(file, DateTime.UtcNow)) return new CodexRefreshResult(CodexRefreshOutcomeEnum.NotNeeded, secret);

            Stopwatch timer = Stopwatch.StartNew();
            CodexRefreshResult result = await RefreshUnderLeaseAsync(secret, token).ConfigureAwait(false);
            result.ForRun = forRun;
            result.DurationMs = timer.Elapsed.TotalMilliseconds;
            OnRefreshCompleted(result);
            return result;
        }

        /// <summary>
        /// Check every active CodexAuthJson secret in every tenant once and refresh the logins close to expiry. Also
        /// records the access token expiry of logins that do not have it yet. Errors on one secret are logged and do not
        /// stop the others.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Number of secrets refreshed by this call.</returns>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled.</exception>
        public async Task<int> RefreshDueSecretsAsync(CancellationToken token = default)
        {
            int refreshed = 0;
            List<Secret> secrets = await _Database.Secrets.ReadActiveByKindAsync(SecretKindEnum.CodexAuthJson, token).ConfigureAwait(false);
            foreach (Secret secret in secrets)
            {
                token.ThrowIfCancellationRequested();
                if (secret.Status == SecretStatusEnum.NeedsReauthentication) continue;
                try
                {
                    CodexRefreshResult result = await RefreshIfDueAsync(secret, false, token).ConfigureAwait(false);
                    if (result.Outcome == CodexRefreshOutcomeEnum.Refreshed) refreshed++;
                    if (result.Outcome == CodexRefreshOutcomeEnum.NotNeeded) await RecordExpiryAsync(result.Secret, token).ConfigureAwait(false);
                }
                catch (Exception e) when (!(e is OperationCanceledException))
                {
                    _Logging.Warn(_Header + "background check of secret " + secret.Id + " failed: " + e.GetType().Name + " " + e.Message);
                }
            }
            return refreshed;
        }

        /// <summary>
        /// Start the background refresh loop. It runs on every replica but only works while <paramref name="isLeader"/>
        /// returns true, every <see cref="CodexSettings.RefreshCheckIntervalSeconds"/> (re-read each time; 0 pauses it).
        /// </summary>
        /// <param name="isLeader">Returns whether this replica is the leader.</param>
        /// <param name="token">Cancellation token that stops the loop.</param>
        /// <exception cref="ArgumentNullException">Thrown when isLeader is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the loop is already running.</exception>
        public void Start(Func<bool> isLeader, CancellationToken token)
        {
            if (isLeader == null) throw new ArgumentNullException(nameof(isLeader));
            if (_Loop != null) throw new InvalidOperationException("The Codex credential refresh loop is already running.");
            _LoopCts = CancellationTokenSource.CreateLinkedTokenSource(token);
            CancellationToken loopToken = _LoopCts.Token;
            _Loop = Task.Run(() => LoopAsync(isLeader, loopToken));
        }

        /// <summary>
        /// Stop the background refresh loop and wait for it to finish.
        /// </summary>
        /// <returns>Task.</returns>
        public async Task StopAsync()
        {
            _LoopCts?.Cancel();
            if (_Loop != null)
            {
                try
                {
                    await _Loop.ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                }
                _Loop = null;
            }
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
                _LoopCts?.Cancel();
                _LoopCts?.Dispose();
                _Http.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task LoopAsync(Func<bool> isLeader, CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                int interval = _Settings().RefreshCheckIntervalSeconds;
                await Task.Delay(TimeSpan.FromSeconds(interval > 0 ? interval : 60), token).ConfigureAwait(false);
                if (interval <= 0 || _Settings().RefreshCheckIntervalSeconds <= 0 || !isLeader()) continue;
                try
                {
                    int refreshed = await RefreshDueSecretsAsync(token).ConfigureAwait(false);
                    if (refreshed > 0) _Logging.Info(_Header + "background check refreshed " + refreshed + " Codex login(s)");
                }
                catch (Exception e) when (!(e is OperationCanceledException))
                {
                    _Logging.Warn(_Header + "background check failed: " + e.GetType().Name + " " + e.Message);
                }
            }
        }

        private async Task<CodexRefreshResult> RefreshUnderLeaseAsync(Secret secret, CancellationToken token)
        {
            CodexSettings settings = _Settings();
            string lease = LeaseName(secret.Id);
            string holder = _NodeId + "/" + Guid.NewGuid().ToString("N");
            int leaseMs = (settings.RefreshTimeoutSeconds + 15) * 1000;
            DateTime deadline = DateTime.UtcNow.AddSeconds(settings.RefreshTimeoutSeconds + 5);
            string? observed = secret.ValueEncrypted;
            Secret current = secret;

            while (true)
            {
                token.ThrowIfCancellationRequested();
                long? epoch = await _Leases.TryAcquireAsync(lease, holder, leaseMs, token).ConfigureAwait(false);
                if (epoch.HasValue)
                {
                    try
                    {
                        return await RefreshLockedAsync(secret, observed, settings, token).ConfigureAwait(false);
                    }
                    finally
                    {
                        await _Leases.ReleaseAsync(lease, holder, CancellationToken.None).ConfigureAwait(false);
                    }
                }

                // Another caller holds the lease: wait, then read the secret back. Its refresh shows up as a new value.
                await Task.Delay(_LockPollMs, token).ConfigureAwait(false);
                Secret? reread = await _Database.Secrets.ReadAsync(secret.Id, token).ConfigureAwait(false);
                if (reread == null) return new CodexRefreshResult(CodexRefreshOutcomeEnum.Failed, current, "the secret was deleted during the refresh");
                current = reread;
                if (current.Status == SecretStatusEnum.NeedsReauthentication) return new CodexRefreshResult(CodexRefreshOutcomeEnum.NeedsReauthentication, current, current.StatusMessage);
                if (!String.Equals(current.ValueEncrypted, observed, StringComparison.Ordinal))
                {
                    CodexAuthFile? file = CodexAuthDocument.TryParse(DecryptOrNull(current));
                    if (file == null || !file.IsRefreshable() || !IsDue(file, DateTime.UtcNow)) return new CodexRefreshResult(CodexRefreshOutcomeEnum.RefreshedByPeer, current);
                    observed = current.ValueEncrypted;
                }
                if (DateTime.UtcNow > deadline) return new CodexRefreshResult(CodexRefreshOutcomeEnum.Failed, current, "timed out waiting for another refresh of this login to finish");
            }
        }

        private async Task<CodexRefreshResult> RefreshLockedAsync(Secret original, string? observed, CodexSettings settings, CancellationToken token)
        {
            // Read the row again under the lease: a refresh that finished just before this caller took the lease must
            // not be repeated with the refresh token it already used.
            Secret? current = await _Database.Secrets.ReadAsync(original.Id, token).ConfigureAwait(false);
            if (current == null) return new CodexRefreshResult(CodexRefreshOutcomeEnum.Failed, original, "the secret was deleted during the refresh");
            if (current.Status == SecretStatusEnum.NeedsReauthentication) return new CodexRefreshResult(CodexRefreshOutcomeEnum.NeedsReauthentication, current, current.StatusMessage);

            CodexAuthFile? file = CodexAuthDocument.TryParse(DecryptOrNull(current));
            bool changed = !String.Equals(current.ValueEncrypted, observed, StringComparison.Ordinal);
            if (file == null || !file.IsRefreshable() || !IsDue(file, DateTime.UtcNow))
            {
                return new CodexRefreshResult(changed ? CodexRefreshOutcomeEnum.RefreshedByPeer : CodexRefreshOutcomeEnum.NotNeeded, current);
            }

            CodexTokenEndpointReply reply = await SendRefreshAsync(file.Tokens!.RefreshToken!, settings, token).ConfigureAwait(false);
            if (reply.Response != null) return await WriteRefreshedAsync(current, file, reply.Response, token).ConfigureAwait(false);
            if (reply.Permanent) return await MarkNeedsReauthenticationAsync(current, reply, token).ConfigureAwait(false);

            CodexRefreshResult failed = new CodexRefreshResult(CodexRefreshOutcomeEnum.Failed, current, reply.Message);
            failed.ErrorCode = reply.ErrorCode;
            failed.HttpStatus = reply.HttpStatus;
            _Logging.Warn(_Header + "refresh of secret " + current.Id + " failed and will be retried: " + reply.Message);
            return failed;
        }

        private async Task<CodexRefreshResult> WriteRefreshedAsync(Secret current, CodexAuthFile file, CodexTokenRefreshResponse response, CancellationToken token)
        {
            DateTime now = DateTime.UtcNow;
            CodexAuthTokens tokens = file.Tokens!;
            if (!String.IsNullOrEmpty(response.IdToken)) tokens.IdToken = response.IdToken;
            tokens.AccessToken = response.AccessToken;
            if (!String.IsNullOrEmpty(response.RefreshToken)) tokens.RefreshToken = response.RefreshToken;
            file.LastRefresh = CodexAuthDocument.FormatTimestamp(now);
            string value = CodexAuthDocument.Serialize(file);

            Secret updated = Copy(current);
            updated.ValueEncrypted = _Cipher.Encrypt(value, updated.Id);
            updated.ValueLast4 = SecretGenerator.Last4(value);
            updated.Fingerprint = SecretGenerator.Fingerprint(value);
            updated.KeyVersion = _Cipher.KeyVersion;
            updated.Status = SecretStatusEnum.Ok;
            updated.StatusMessage = null;
            updated.StatusUtc = null;
            updated.RefreshedUtc = now;
            updated.AccessTokenExpiresUtc = CodexAuthDocument.ReadClaims(tokens.AccessToken)?.ExpiresUtc;

            if (await _Database.Secrets.TryUpdateCredentialAsync(updated, current.ValueEncrypted, token).ConfigureAwait(false))
            {
                _Logging.Info(_Header + "refreshed the Codex login in secret " + updated.Id + "; access token valid until " + (updated.AccessTokenExpiresUtc.HasValue ? updated.AccessTokenExpiresUtc.Value.ToString("o") : "unknown"));
                return new CodexRefreshResult(CodexRefreshOutcomeEnum.Refreshed, updated);
            }

            // The value changed under the lease: an operator replaced the secret. Their value wins; the tokens just
            // rotated are dropped, which cannot hurt the replacement login.
            Secret? replaced = await _Database.Secrets.ReadAsync(current.Id, token).ConfigureAwait(false);
            _Logging.Warn(_Header + "secret " + current.Id + " was replaced while its login was being refreshed; keeping the replacement");
            if (replaced == null) return new CodexRefreshResult(CodexRefreshOutcomeEnum.Failed, current, "the secret was deleted during the refresh");
            return new CodexRefreshResult(CodexRefreshOutcomeEnum.RefreshedByPeer, replaced);
        }

        private async Task<CodexRefreshResult> MarkNeedsReauthenticationAsync(Secret current, CodexTokenEndpointReply reply, CancellationToken token)
        {
            Secret updated = Copy(current);
            updated.Status = SecretStatusEnum.NeedsReauthentication;
            updated.StatusMessage = reply.Message;
            updated.StatusUtc = DateTime.UtcNow;

            CodexRefreshResult result;
            if (await _Database.Secrets.TryUpdateCredentialAsync(updated, current.ValueEncrypted, token).ConfigureAwait(false))
            {
                _Logging.Warn(_Header + "secret " + current.Id + " (" + current.Name + ") needs reauthentication: " + reply.Message);
                result = new CodexRefreshResult(CodexRefreshOutcomeEnum.NeedsReauthentication, updated, reply.Message);
            }
            else
            {
                // Replaced while the refresh was in flight; the rejection was about the old login.
                Secret? replaced = await _Database.Secrets.ReadAsync(current.Id, token).ConfigureAwait(false);
                result = replaced == null
                    ? new CodexRefreshResult(CodexRefreshOutcomeEnum.Failed, current, "the secret was deleted during the refresh")
                    : new CodexRefreshResult(CodexRefreshOutcomeEnum.RefreshedByPeer, replaced);
            }
            result.ErrorCode = reply.ErrorCode;
            result.HttpStatus = reply.HttpStatus;
            return result;
        }

        private async Task<CodexTokenEndpointReply> SendRefreshAsync(string refreshToken, CodexSettings settings, CancellationToken token)
        {
            CodexTokenRefreshRequest body = new CodexTokenRefreshRequest();
            body.ClientId = settings.ClientId;
            body.RefreshToken = refreshToken;
            string json = JsonSerializer.Serialize(body, _Json);

            using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                timeout.CancelAfter(TimeSpan.FromSeconds(settings.RefreshTimeoutSeconds));
                try
                {
                    using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, settings.TokenEndpoint))
                    {
                        request.Content = new StringContent(json, Encoding.UTF8, "application/json");
                        request.Headers.Accept.ParseAdd("application/json");
                        using (HttpResponseMessage response = await _Http.SendAsync(request, timeout.Token).ConfigureAwait(false))
                        {
                            string text = await response.Content.ReadAsStringAsync(timeout.Token).ConfigureAwait(false);
                            return Classify((int)response.StatusCode, text);
                        }
                    }
                }
                catch (OperationCanceledException) when (!token.IsCancellationRequested)
                {
                    return CodexTokenEndpointReply.Transient(null, null, "the token endpoint did not answer within " + settings.RefreshTimeoutSeconds + " seconds");
                }
                catch (HttpRequestException e)
                {
                    return CodexTokenEndpointReply.Transient(null, null, "the token endpoint could not be reached: " + e.Message);
                }
                catch (InvalidOperationException e)
                {
                    return CodexTokenEndpointReply.Transient(null, null, "the token endpoint URL is not usable: " + e.Message);
                }
            }
        }

        private static CodexTokenEndpointReply Classify(int status, string body)
        {
            // Mirrors the Codex CLI (codex-rs login crate, request_chatgpt_token_refresh): 401, a known refresh token
            // failure code, or 400 invalid_grant is permanent; everything else is worth retrying.
            if (status >= 200 && status < 300)
            {
                CodexTokenRefreshResponse? parsed = null;
                try
                {
                    parsed = JsonSerializer.Deserialize<CodexTokenRefreshResponse>(body, _Json);
                }
                catch (JsonException)
                {
                    parsed = null;
                }
                if (parsed == null || String.IsNullOrEmpty(parsed.AccessToken)) return CodexTokenEndpointReply.Transient(status, null, "the token endpoint answered " + status + " without an access token");
                CodexTokenEndpointReply ok = new CodexTokenEndpointReply();
                ok.HttpStatus = status;
                ok.Response = parsed;
                return ok;
            }

            ReadError(body, out string? code, out string? description);
            string normalized = (code ?? String.Empty).ToLowerInvariant();
            bool knownFailure = normalized == "refresh_token_expired" || normalized == "refresh_token_reused" || normalized == "refresh_token_invalidated";
            bool invalidGrant = status == 400 && normalized == "invalid_grant";
            string detail = "HTTP " + status + (code != null ? " " + code : String.Empty) + (description != null ? ": " + Truncate(description, 300) : String.Empty);

            if (status == 401 || knownFailure || invalidGrant)
            {
                CodexTokenEndpointReply permanent = new CodexTokenEndpointReply();
                permanent.Permanent = true;
                permanent.HttpStatus = status;
                permanent.ErrorCode = code;
                permanent.Message = "OpenAI rejected the stored refresh token (" + detail + ")" + KnownFailureHint(normalized);
                return permanent;
            }
            return CodexTokenEndpointReply.Transient(status, code, "the token endpoint answered " + detail);
        }

        private static string KnownFailureHint(string code)
        {
            switch (code)
            {
                case "refresh_token_reused":
                    return ". The refresh token was already used, usually because the same login also refreshed somewhere else (another machine, or a copy of this auth.json)";
                case "refresh_token_expired":
                    return ". The refresh token expired";
                case "refresh_token_invalidated":
                    return ". The refresh token was revoked, for example by signing out or signing in again elsewhere";
                default:
                    return String.Empty;
            }
        }

        private static void ReadError(string body, out string? code, out string? description)
        {
            code = null;
            description = null;
            if (String.IsNullOrWhiteSpace(body)) return;
            try
            {
                CodexTokenErrorResponse? flat = JsonSerializer.Deserialize<CodexTokenErrorResponse>(body, _Json);
                if (flat != null)
                {
                    code = NonEmpty(flat.Error) ?? NonEmpty(flat.Code);
                    description = NonEmpty(flat.ErrorDescription);
                    return;
                }
            }
            catch (JsonException)
            {
            }
            try
            {
                CodexTokenNestedErrorResponse? nested = JsonSerializer.Deserialize<CodexTokenNestedErrorResponse>(body, _Json);
                if (nested != null)
                {
                    code = NonEmpty(nested.Error?.Code) ?? NonEmpty(nested.Code);
                    description = NonEmpty(nested.Error?.Message);
                }
            }
            catch (JsonException)
            {
            }
        }

        private bool IsDue(CodexAuthFile file, DateTime now)
        {
            CodexJwtClaims? claims = CodexAuthDocument.ReadClaims(file.Tokens?.AccessToken);
            if (claims?.ExpiresUtc != null)
            {
                double window = _Settings().RefreshBeforeExpirySeconds;
                if (claims.IssuedUtc.HasValue)
                {
                    double lifetime = (claims.ExpiresUtc.Value - claims.IssuedUtc.Value).TotalSeconds;
                    if (lifetime > 0) window = Math.Min(window, lifetime / 2);
                }
                return (claims.ExpiresUtc.Value - now).TotalSeconds <= window;
            }

            DateTime? last = file.LastRefreshUtc();
            return last.HasValue && now - last.Value >= _MaxAgeWithoutExpiry;
        }

        private async Task RecordExpiryAsync(Secret secret, CancellationToken token)
        {
            DateTime? expires = AccessTokenExpiry(secret);
            if (expires == secret.AccessTokenExpiresUtc) return;
            Secret updated = Copy(secret);
            updated.AccessTokenExpiresUtc = expires;
            await _Database.Secrets.TryUpdateCredentialAsync(updated, secret.ValueEncrypted, token).ConfigureAwait(false);
        }

        private DateTime? AccessTokenExpiry(Secret secret)
        {
            return CodexAuthDocument.AccessTokenExpiresUtc(DecryptOrNull(secret));
        }

        private string? DecryptOrNull(Secret secret)
        {
            if (String.IsNullOrEmpty(secret.ValueEncrypted)) return null;
            try
            {
                return _Cipher.Decrypt(secret.ValueEncrypted, secret.Id);
            }
            catch (Exception e) when (e is CryptographicException || e is FormatException)
            {
                return null;
            }
        }

        private void OnRefreshCompleted(CodexRefreshResult result)
        {
            GarrisonMetrics.Count(GarrisonMetricCatalog.CodexTokenRefresh, "result", MetricResult(result.Outcome));
            EventHandler<CodexRefreshResult>? handler = RefreshCompleted;
            if (handler == null) return;
            try
            {
                handler(this, result);
            }
            catch (Exception e)
            {
                _Logging.Warn(_Header + "a RefreshCompleted handler threw " + e.GetType().Name + ": " + e.Message);
            }
        }

        private static string MetricResult(CodexRefreshOutcomeEnum outcome)
        {
            switch (outcome)
            {
                case CodexRefreshOutcomeEnum.Refreshed:
                case CodexRefreshOutcomeEnum.RefreshedByPeer:
                    return "ok";
                case CodexRefreshOutcomeEnum.NeedsReauthentication:
                    return "reauth_required";
                case CodexRefreshOutcomeEnum.Failed:
                    return "failed";
                default:
                    return "skipped";
            }
        }

        private static string ReauthenticationMessage(Secret secret, string? reason)
        {
            return "Secret " + secret.Name + " needs reauthentication: " + (String.IsNullOrEmpty(reason) ? "its ChatGPT login can no longer be refreshed" : reason)
                + ". Runs that use it fail until it is replaced. Sign in again with codex login using a CODEX_HOME that nothing else uses, then set the new auth.json as this secret's value (or switch the deployment to an OpenAiApiKey secret). Do not keep using that login on another machine: both copies share one refresh token.";
        }

        private static Secret Copy(Secret source)
        {
            Secret copy = new Secret();
            copy.Id = source.Id;
            copy.TenantId = source.TenantId;
            copy.Name = source.Name;
            copy.Description = source.Description;
            copy.Kind = source.Kind;
            copy.ValueEncrypted = source.ValueEncrypted;
            copy.ValueLast4 = source.ValueLast4;
            copy.Fingerprint = source.Fingerprint;
            copy.KeyVersion = source.KeyVersion;
            copy.ExpiresUtc = source.ExpiresUtc;
            copy.RotatedUtc = source.RotatedUtc;
            copy.Status = source.Status;
            copy.StatusMessage = source.StatusMessage;
            copy.StatusUtc = source.StatusUtc;
            copy.RefreshedUtc = source.RefreshedUtc;
            copy.AccessTokenExpiresUtc = source.AccessTokenExpiresUtc;
            copy.Active = source.Active;
            copy.IsProtected = source.IsProtected;
            copy.CreatedUtc = source.CreatedUtc;
            copy.LastUpdateUtc = source.LastUpdateUtc;
            return copy;
        }

        private static string? NonEmpty(string? value)
        {
            return String.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static string Truncate(string value, int length)
        {
            return value.Length <= length ? value : value.Substring(0, length);
        }

        #endregion
    }
}
