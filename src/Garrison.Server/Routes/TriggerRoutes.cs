namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Concurrent;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Trigger routes (P12.5) under /v1.0/api/tenants/{tenantId}/triggers: CRUD through the shared tenant configuration
    /// service, signing secret rotation, manual fire, fire history, and the unauthenticated webhook endpoint
    /// POST .../triggers/{id}/webhook, which is authorized only by the X-Garrison-Signature header. Every webhook delivery
    /// that fails verification answers the same 401, whether the tenant or trigger exists, is not a webhook trigger, or the
    /// signature is missing, malformed, stale, or wrong; only a correctly signed delivery learns more (409 TriggerInactive,
    /// 400 for a bad delivery identifier, 202 or 200).
    /// </summary>
    public class TriggerRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly TenantConfigurationService _Mutations;
        private readonly TriggerService _Triggers;
        private readonly AuthRateLimiter _SignatureFailures;
        private readonly ConcurrentDictionary<string, DateTime> _Throttled = new ConcurrentDictionary<string, DateTime>(StringComparer.Ordinal);
        private RouteRegistrar? _Routes = null;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/triggers";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="triggers">Trigger service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public TriggerRoutes(ServerContext server, TriggerService triggers)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Triggers = triggers ?? throw new ArgumentNullException(nameof(triggers));
            // Failed webhook signatures count against the same per-address limit as failed sign-ins and keys
            // (Auth.RateLimitPerMinute), shared across replicas.
            _SignatureFailures = new AuthRateLimiter(_Server.Database, () => _Server.Settings.Auth.RateLimitPerMinute);
            _SignatureFailures.Scope = "webhook-signature";
            _Mutations = new TenantConfigurationService(_Server);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            _Routes = routes ?? throw new ArgumentNullException(nameof(routes));
            const string tag = "Triggers";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Trigger, OperationTypeEnum.Read, ListAsync, "List triggers (query: type Cron or Webhook, search, activeOnly)", tag, null, typeof(EnumerationResult<Trigger>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Trigger, OperationTypeEnum.Create, CreateAsync, "Create a cron or webhook trigger (needs Agent Execute, or Pipeline Execute and Agent Execute on its stage agents; a webhook trigger's signingSecret is returned only in this response)", tag, typeof(Trigger), typeof(Trigger));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Trigger, OperationTypeEnum.Read, ReadAsync, "Read a trigger by identifier or name", tag, null, typeof(Trigger));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.Trigger, OperationTypeEnum.Update, UpdateAsync, "Update a trigger by identifier or name (the caller becomes its run-as principal; the type cannot change)", tag, typeof(Trigger), typeof(Trigger));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.Trigger, OperationTypeEnum.Delete, DeleteAsync, "Delete a trigger and its fire history by identifier or name", tag);
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/rotate-secret", ResourceTypeEnum.Trigger, OperationTypeEnum.Update, RotateAsync, "Replace a webhook trigger's signing secret; the new secret is returned only in this response", tag, null, typeof(Trigger));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/fire", ResourceTypeEnum.Trigger, OperationTypeEnum.Execute, FireAsync, "Fire a trigger now (optional JSON body {\"body\": \"payload text\", \"contentType\": \"...\"}); answers with the fire record", tag, typeof(TriggerFireRequest), typeof(TriggerFire));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/fires", ResourceTypeEnum.Trigger, OperationTypeEnum.Read, FiresAsync, "List a trigger's fires, newest first (query: outcome Started, Failed, or Skipped)", tag, null, typeof(EnumerationResult<TriggerFire>));
            routes.Anonymous(HttpMethod.POST, _Base + "/{id}/webhook", WebhookAsync, "Webhook delivery for a Webhook trigger, authorized by X-Garrison-Signature (t=<unix>,v1=<hex HMAC-SHA256 of \"<t>.<raw body>\">); optional X-Garrison-Delivery makes repeats idempotent. 202 with the fire, 200 for a repeated delivery, 401 for any failed verification, 409 TriggerInactive, 413 when the body is too large", tag, null, typeof(TriggerFire));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            TriggerTypeEnum? type = RouteHelpers.QueryEnum<TriggerTypeEnum>(http, "type");
            EnumerationResult<Trigger> page = await _Server.Database.Triggers.EnumerateAsync(RouteHelpers.Tenant(http), type, RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Trigger? created = await _Mutations.CreateTriggerAsync(RouteHelpers.Context(http), tenantId, RouteHelpers.RequiredBody<Trigger>(http), TargetCheck(http, tenantId), http.Token).ConfigureAwait(false);
            if (created == null) return;
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            Trigger? trigger = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (trigger == null) return;
            await RouteHelpers.JsonAsync(http, 200, trigger).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            Trigger? existing = await LoadAsync(http, OperationTypeEnum.Update).ConfigureAwait(false);
            if (existing == null) return;
            string tenantId = RouteHelpers.Tenant(http);
            Trigger? updated = await _Mutations.UpdateTriggerAsync(RouteHelpers.Context(http), tenantId, existing, RouteHelpers.RequiredBody<Trigger>(http), TargetCheck(http, tenantId), http.Token).ConfigureAwait(false);
            if (updated == null) return;
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            Trigger? existing = await LoadAsync(http, OperationTypeEnum.Delete).ConfigureAwait(false);
            if (existing == null) return;
            await _Mutations.DeleteTriggerAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task RotateAsync(HttpContextBase http)
        {
            Trigger? existing = await LoadAsync(http, OperationTypeEnum.Update).ConfigureAwait(false);
            if (existing == null) return;
            Trigger rotated = await _Mutations.RotateTriggerSecretAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, rotated).ConfigureAwait(false);
        }

        private async Task FireAsync(HttpContextBase http)
        {
            Trigger? trigger = await LoadAsync(http, OperationTypeEnum.Execute).ConfigureAwait(false);
            if (trigger == null) return;
            TriggerFireRequest request = RouteHelpers.Body<TriggerFireRequest>(http) ?? new TriggerFireRequest();
            byte[]? body = String.IsNullOrEmpty(request.Body) ? null : System.Text.Encoding.UTF8.GetBytes(request.Body);
            if (body != null && body.Length > _Triggers.Options.WebhookMaxBodyBytes)
            {
                throw new ValidationException("The payload is larger than " + _Triggers.Options.WebhookMaxBodyBytes + " bytes (Triggers.WebhookMaxBodyBytes).", new System.Collections.Generic.Dictionary<string, string> { { "body", "The payload is too large." } }, new System.Collections.Generic.Dictionary<string, string> { { "body", "PayloadTooLarge" } });
            }
            TriggerFire fire = await _Triggers.FireAsync(trigger, TriggerFireSourceEnum.Manual, DateTime.UtcNow, null, body, request.ContentType, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Trigger", trigger.Id, "Fired trigger " + trigger.Name + " by hand: " + fire.Outcome + (fire.ErrorCode != null ? " (" + fire.ErrorCode + ")" : String.Empty) + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, fire).ConfigureAwait(false);
        }

        private async Task FiresAsync(HttpContextBase http)
        {
            Trigger? trigger = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (trigger == null) return;
            TriggerFireOutcomeEnum? outcome = RouteHelpers.QueryEnum<TriggerFireOutcomeEnum>(http, "outcome");
            EnumerationResult<TriggerFire> page = await _Server.Database.TriggerFires.EnumerateAsync(trigger.TenantId, trigger.Id, outcome, RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task WebhookAsync(HttpContextBase http)
        {
            string source = String.IsNullOrEmpty(http.Request.Source.IpAddress) ? "unknown" : http.Request.Source.IpAddress;
            if (IsThrottled(source))
            {
                Reject("rate_limited");
                await RouteHelpers.ErrorAsync(http, 429, "RateLimited", "Too many webhook deliveries with an invalid signature from this address. Try again in a minute.").ConfigureAwait(false);
                return;
            }
            TriggerOptions options = _Triggers.Options;
            if (http.Request.ContentLength > options.WebhookMaxBodyBytes)
            {
                Reject("too_large");
                await RouteHelpers.ErrorAsync(http, 413, "PayloadTooLarge", "The webhook body is larger than " + options.WebhookMaxBodyBytes + " bytes (Triggers.WebhookMaxBodyBytes).").ConfigureAwait(false);
                return;
            }
            byte[] body = http.Request.DataAsBytes ?? Array.Empty<byte>();
            if (body.Length > options.WebhookMaxBodyBytes)
            {
                Reject("too_large");
                await RouteHelpers.ErrorAsync(http, 413, "PayloadTooLarge", "The webhook body is larger than " + options.WebhookMaxBodyBytes + " bytes (Triggers.WebhookMaxBodyBytes).").ConfigureAwait(false);
                return;
            }

            string tenantId = RouteHelpers.Param(http, "tenantId") ?? String.Empty;
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            Trigger? trigger = String.IsNullOrEmpty(tenantId) || String.IsNullOrEmpty(id) ? null : await _Server.Database.Triggers.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false);
            if (trigger != null && trigger.Type != TriggerTypeEnum.Webhook) trigger = null;
            string? secret = trigger == null ? null : SigningSecrets.Read(trigger, _Server.Cipher);

            // Verify even when there is no trigger (against a decoy key), so the answer and its timing do not reveal
            // whether the trigger exists.
            string? header = http.Request.Headers[Constants.HeaderWebhookSignature];
            WebhookSignatureResultEnum result = WebhookSigner.Verify(header, secret, body, DateTime.UtcNow, options.WebhookToleranceSeconds);
            if (result != WebhookSignatureResultEnum.Valid || trigger == null)
            {
                Reject(result == WebhookSignatureResultEnum.Valid ? "mismatch" : result.ToString().ToLowerInvariant());
                await CountSignatureFailureAsync(source, http.Token).ConfigureAwait(false);
                await RouteHelpers.ErrorAsync(http, 401, "InvalidSignature", "The webhook signature is missing, malformed, outside the accepted time window, or does not match.").ConfigureAwait(false);
                return;
            }
            if (!trigger.Active)
            {
                Reject("inactive");
                await RouteHelpers.ErrorAsync(http, 409, "TriggerInactive", "Trigger " + trigger.Name + " is inactive.").ConfigureAwait(false);
                return;
            }

            string? deliveryId = http.Request.Headers[Constants.HeaderWebhookDelivery];
            if (deliveryId != null)
            {
                deliveryId = deliveryId.Trim();
                if (deliveryId.Length == 0 || deliveryId.Length > 128 || !IsPrintable(deliveryId))
                {
                    Reject("bad_delivery_id");
                    await RouteHelpers.ErrorAsync(http, 400, "InvalidDeliveryId", Constants.HeaderWebhookDelivery + " is 1 to 128 printable ASCII characters.").ConfigureAwait(false);
                    return;
                }
            }

            string? contentType = http.Request.ContentType;
            TriggerFire fire = await _Triggers.FireAsync(trigger, TriggerFireSourceEnum.Webhook, DateTime.UtcNow, deliveryId, body, contentType, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, fire.Duplicate ? 200 : 202, fire).ConfigureAwait(false);
        }

        private Func<ResourceTypeEnum, string, Task<bool>> TargetCheck(HttpContextBase http, string tenantId)
        {
            return (resourceType, resourceId) => _Routes != null ? _Routes.RequireAsync(http, tenantId, resourceType, OperationTypeEnum.Execute, resourceId) : Task.FromResult(true);
        }

        private async Task<Trigger?> LoadAsync(HttpContextBase http, OperationTypeEnum operation)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string idOrName = RouteHelpers.Param(http, "id") ?? String.Empty;
            Trigger? trigger = String.IsNullOrEmpty(idOrName) ? null : await _Server.Database.Triggers.ReadAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (trigger == null && !String.IsNullOrEmpty(idOrName)) trigger = await _Server.Database.Triggers.ReadByNameAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (trigger == null) throw new NotFoundException("Trigger " + idOrName + " not found.");

            // Resolved by name: the route was authorized against the name, so check resource-scoped grants against the ID.
            if (trigger.Id != idOrName && _Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.Trigger, operation, trigger.Id).ConfigureAwait(false)) return null;
            return trigger;
        }

        private static void Reject(string reason)
        {
            GarrisonMetrics.Count(GarrisonMetricCatalog.TriggerWebhookRejections, "reason", reason);
        }

        private static bool IsPrintable(string value)
        {
            foreach (char c in value)
            {
                if (c < 0x21 || c > 0x7e) return false;
            }
            return true;
        }

        private bool IsThrottled(string source)
        {
            if (!_Throttled.TryGetValue(source, out DateTime until)) return false;
            if (until > DateTime.UtcNow) return true;
            _Throttled.TryRemove(source, out DateTime _);
            return false;
        }

        private async Task CountSignatureFailureAsync(string source, CancellationToken token)
        {
            if (await _SignatureFailures.TryAcquireAsync(source, token).ConfigureAwait(false)) return;
            long minute = DateTime.UtcNow.Ticks / TimeSpan.TicksPerMinute;
            _Throttled[source] = new DateTime((minute + 1) * TimeSpan.TicksPerMinute, DateTimeKind.Utc);
            if (_Throttled.Count > 100000) _Throttled.Clear();
        }

        #endregion
    }
}
