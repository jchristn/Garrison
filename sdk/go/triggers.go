package garrison

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// Trigger types (Trigger.Type).
const (
	TriggerTypeCron    = "Cron"
	TriggerTypeWebhook = "Webhook"
)

// Trigger target types (Trigger.TargetType).
const (
	TriggerTargetAgent    = "Agent"
	TriggerTargetPipeline = "Pipeline"
)

// Trigger fire sources (TriggerFire.Source) and outcomes (TriggerFire.Outcome).
const (
	TriggerFireSourceCron    = "Cron"
	TriggerFireSourceWebhook = "Webhook"
	TriggerFireSourceManual  = "Manual"

	TriggerFireOutcomeStarted = "Started"
	TriggerFireOutcomeFailed  = "Failed"
	TriggerFireOutcomeSkipped = "Skipped"
)

// Notification events (NotificationEndpoint.Events, NotificationDelivery.Event). Test is only sent by the test action.
const (
	NotificationEventRunSucceeded      = "RunSucceeded"
	NotificationEventRunFailed         = "RunFailed"
	NotificationEventRunCancelled      = "RunCancelled"
	NotificationEventRunTimedOut       = "RunTimedOut"
	NotificationEventPipelineCompleted = "PipelineCompleted"
	NotificationEventPipelineFailed    = "PipelineFailed"
	NotificationEventApprovalRequested = "ApprovalRequested"
	NotificationEventTest              = "Test"
)

// Notification delivery statuses (NotificationDelivery.Status).
const (
	NotificationDeliveryPending    = "Pending"
	NotificationDeliveryDelivering = "Delivering"
	NotificationDeliverySucceeded  = "Succeeded"
	NotificationDeliveryFailed     = "Failed"
)

// Webhook header names: the signature on trigger webhooks and notifications, the delivery identifier, and the
// notification event.
const (
	WebhookSignatureHeader = "X-Garrison-Signature"
	WebhookDeliveryHeader  = "X-Garrison-Delivery"
	WebhookEventHeader     = "X-Garrison-Event"
)

// Trigger is a cron schedule or signed webhook that starts an agent run or a pipeline run. Fires run as the principal
// that last created or changed it. SigningSecret is returned only by Create and RotateSecret.
type Trigger struct {
	ID          string  `json:"id,omitempty"`
	TenantID    string  `json:"tenantId,omitempty"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	// Type is TriggerTypeCron or TriggerTypeWebhook; it cannot change after creation.
	Type string `json:"type"`
	// TargetType is TriggerTargetAgent (default when empty) or TriggerTargetPipeline.
	TargetType   string  `json:"targetType,omitempty"`
	AgentID      *string `json:"agentId,omitempty"`
	DeploymentID *string `json:"deploymentId,omitempty"`
	PipelineID   *string `json:"pipelineId,omitempty"`
	// InputTemplateID is a Task prompt template that renders the run input; nil uses builtin/trigger-input.
	InputTemplateID *string `json:"inputTemplateId,omitempty"`
	Priority        int     `json:"priority,omitempty"`
	// CronExpression has five fields (Cron triggers only); TimeZone is an IANA name (default UTC).
	CronExpression *string `json:"cronExpression,omitempty"`
	TimeZone       string  `json:"timeZone,omitempty"`
	// Active defaults to true when nil.
	Active                  *bool   `json:"active,omitempty"`
	SigningSecret           *string `json:"signingSecret,omitempty"`
	SigningSecretLast4      *string `json:"signingSecretLast4,omitempty"`
	SigningSecretRotatedUTC *string `json:"signingSecretRotatedUtc,omitempty"`
	RunAsType               string  `json:"runAsType,omitempty"`
	RunAsID                 *string `json:"runAsId,omitempty"`
	RunAsName               *string `json:"runAsName,omitempty"`
	LastFireUTC             *string `json:"lastFireUtc,omitempty"`
	LastFireOutcome         *string `json:"lastFireOutcome,omitempty"`
	NextFireUTC             *string `json:"nextFireUtc,omitempty"`
	FireCount               int64   `json:"fireCount,omitempty"`
	CreatedUTC              string  `json:"createdUtc,omitempty"`
	LastUpdateUTC           string  `json:"lastUpdateUtc,omitempty"`
}

// TriggerFire is one fire of a trigger and the run or pipeline run it started.
type TriggerFire struct {
	ID            string  `json:"id"`
	TenantID      string  `json:"tenantId"`
	TriggerID     string  `json:"triggerId"`
	TriggerName   string  `json:"triggerName"`
	Source        string  `json:"source"`
	DeliveryID    *string `json:"deliveryId"`
	ScheduledUTC  string  `json:"scheduledUtc"`
	FiredUTC      string  `json:"firedUtc"`
	Outcome       string  `json:"outcome"`
	RunID         *string `json:"runId"`
	PipelineRunID *string `json:"pipelineRunId"`
	ErrorCode     *string `json:"errorCode"`
	ErrorMessage  *string `json:"errorMessage"`
	// Duplicate is true when this answer repeats an earlier fire for the same webhook delivery identifier.
	Duplicate  bool   `json:"duplicate"`
	CreatedUTC string `json:"createdUtc"`
}

// TriggerFireRequest is the optional body of a manual fire; Body reaches the input template as webhook.body.
type TriggerFireRequest struct {
	Body        string `json:"body,omitempty"`
	ContentType string `json:"contentType,omitempty"`
}

// NotificationEndpoint is a URL that receives signed JSON notifications for subscribed events. Loopback and private
// destinations need the cluster setting Notifications.AllowPrivateDestinations; link-local addresses are always refused.
// SigningSecret is returned only by Create and RotateSecret.
type NotificationEndpoint struct {
	ID                      string   `json:"id,omitempty"`
	TenantID                string   `json:"tenantId,omitempty"`
	Name                    string   `json:"name"`
	Description             *string  `json:"description,omitempty"`
	URL                     string   `json:"url"`
	Events                  []string `json:"events"`
	AgentID                 *string  `json:"agentId,omitempty"`
	DeploymentID            *string  `json:"deploymentId,omitempty"`
	IncludeResultText       bool     `json:"includeResultText,omitempty"`
	ResultTextMaxChars      int      `json:"resultTextMaxChars,omitempty"`
	Active                  *bool    `json:"active,omitempty"`
	SigningSecret           *string  `json:"signingSecret,omitempty"`
	SigningSecretLast4      *string  `json:"signingSecretLast4,omitempty"`
	SigningSecretRotatedUTC *string  `json:"signingSecretRotatedUtc,omitempty"`
	CreatedUTC              string   `json:"createdUtc,omitempty"`
	LastUpdateUTC           string   `json:"lastUpdateUtc,omitempty"`
}

// NotificationDelivery is one notification to one endpoint: the outbox entry and its delivery log record.
type NotificationDelivery struct {
	ID             string  `json:"id"`
	TenantID       string  `json:"tenantId"`
	EndpointID     string  `json:"endpointId"`
	Event          string  `json:"event"`
	SubjectType    string  `json:"subjectType"`
	SubjectID      *string `json:"subjectId"`
	Status         string  `json:"status"`
	Attempts       int     `json:"attempts"`
	MaxAttempts    int     `json:"maxAttempts"`
	NextAttemptUTC *string `json:"nextAttemptUtc"`
	LastStatusCode *int    `json:"lastStatusCode"`
	LastError      *string `json:"lastError"`
	LastAttemptUTC *string `json:"lastAttemptUtc"`
	LastDurationMs int64   `json:"lastDurationMs"`
	DeliveredUTC   *string `json:"deliveredUtc"`
	// Payload is the notification body as a JSON object.
	Payload       json.RawMessage `json:"payload"`
	CreatedUTC    string          `json:"createdUtc"`
	LastUpdateUTC string          `json:"lastUpdateUtc"`
}

// SignWebhook builds the X-Garrison-Signature header value: t=<unix>,v1=<lowercase hex HMAC-SHA256 of "<t>." + raw
// body>, keyed with the signing secret. Senders of trigger webhooks use it.
func SignWebhook(secret string, unixSeconds int64, body []byte) string {
	t := strconv.FormatInt(unixSeconds, 10)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(t + "."))
	mac.Write(body)
	return "t=" + t + ",v1=" + hex.EncodeToString(mac.Sum(nil))
}

// VerifyWebhook checks an X-Garrison-Signature header against the raw body: any v1 value may match (constant-time
// comparison) and the timestamp must be within tolerance of now (a tolerance of 0 means 300 seconds). Receivers of
// notifications use it.
func VerifyWebhook(header, secret string, body []byte, tolerance time.Duration) bool {
	if header == "" || secret == "" {
		return false
	}
	if tolerance <= 0 {
		tolerance = 300 * time.Second
	}
	var timestamp int64
	haveTimestamp := false
	var candidates []string
	for _, part := range strings.Split(header, ",") {
		name, value, ok := strings.Cut(strings.TrimSpace(part), "=")
		if !ok || name == "" {
			return false
		}
		name, value = strings.TrimSpace(name), strings.TrimSpace(value)
		switch name {
		case "t":
			parsed, err := strconv.ParseInt(value, 10, 64)
			if haveTimestamp || err != nil || parsed < 0 {
				return false
			}
			timestamp, haveTimestamp = parsed, true
		case "v1":
			if len(value) != 64 {
				return false
			}
			candidates = append(candidates, strings.ToLower(value))
		}
	}
	if !haveTimestamp || len(candidates) == 0 {
		return false
	}
	age := time.Now().Unix() - timestamp
	if age < 0 {
		age = -age
	}
	if age > int64(tolerance/time.Second) {
		return false
	}
	expected := strings.SplitN(SignWebhook(secret, timestamp, body), ",v1=", 2)[1]
	matched := false
	for _, candidate := range candidates {
		if subtle.ConstantTimeCompare([]byte(candidate), []byte(expected)) == 1 {
			matched = true
		}
	}
	return matched
}

// TriggersClient manages triggers. Create and Update need Execute on the target; the trigger runs as the caller.
type TriggersClient struct{ Resource }

// List lists triggers; triggerType (TriggerTypeCron or TriggerTypeWebhook) narrows the list when not empty.
func (t *TriggersClient) List(ctx context.Context, opts *ListOptions, triggerType string) (*EnumerationResult[Trigger], error) {
	query := opts.values()
	if triggerType != "" {
		query.Set("type", triggerType)
	}
	var out EnumerationResult[Trigger]
	if err := t.c.Do(ctx, http.MethodGet, t.base(), query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// RotateSecret replaces a webhook trigger's signing secret; the new one is in SigningSecret of the result only.
func (t *TriggersClient) RotateSecret(ctx context.Context, trigger string) (*Trigger, error) {
	var out Trigger
	if err := t.Action(ctx, trigger, "rotate-secret", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Fire fires a trigger now. req may be nil; its Body reaches the input template as webhook.body.
func (t *TriggersClient) Fire(ctx context.Context, trigger string, req *TriggerFireRequest) (*TriggerFire, error) {
	if req == nil {
		req = &TriggerFireRequest{}
	}
	var out TriggerFire
	if err := t.Action(ctx, trigger, "fire", req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListFires lists a trigger's fires, newest first; outcome (TriggerFireOutcome constants) narrows it when not empty.
func (t *TriggersClient) ListFires(ctx context.Context, trigger, outcome string, opts *ListOptions) (*EnumerationResult[TriggerFire], error) {
	query := opts.values()
	if outcome != "" {
		query.Set("outcome", outcome)
	}
	var out EnumerationResult[TriggerFire]
	if err := t.c.Do(ctx, http.MethodGet, t.item(trigger)+"/fires", query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeliverWebhook posts a signed webhook to a Webhook trigger (identifier) as an external sender would, signed with
// SignWebhook at the current time. A non-empty deliveryID makes repeats return the earlier fire with Duplicate set.
// An empty contentType sends application/json. Errors carry 401 InvalidSignature, 409 TriggerInactive, or 413.
func (t *TriggersClient) DeliverWebhook(ctx context.Context, triggerID, signingSecret string, body []byte, contentType, deliveryID string) (*TriggerFire, error) {
	if contentType == "" {
		contentType = "application/json"
	}
	headers := map[string]string{WebhookSignatureHeader: SignWebhook(signingSecret, time.Now().Unix(), body), WebhookDeliveryHeader: deliveryID}
	resp, err := t.c.sendWithHeaders(ctx, http.MethodPost, t.item(triggerID)+"/webhook", url.Values{}, headers, body, contentType, "")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var out TriggerFire
	if err := json.Unmarshal(data, &out); err != nil {
		return nil, fmt.Errorf("garrison: decode webhook response: %w", err)
	}
	return &out, nil
}

// NotificationEndpointsClient manages notification endpoints and reads their delivery log. Receivers check each request
// with VerifyWebhook and ignore repeated X-Garrison-Delivery values (delivery is at least once).
type NotificationEndpointsClient struct{ Resource }

// RotateSecret replaces the signing secret; the new one is in SigningSecret of the result only.
func (n *NotificationEndpointsClient) RotateSecret(ctx context.Context, endpoint string) (*NotificationEndpoint, error) {
	var out NotificationEndpoint
	if err := n.Action(ctx, endpoint, "rotate-secret", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Test sends a test notification now and returns the delivery after its first attempt.
func (n *NotificationEndpointsClient) Test(ctx context.Context, endpoint string) (*NotificationDelivery, error) {
	var out NotificationDelivery
	if err := n.Action(ctx, endpoint, "test", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListDeliveries lists an endpoint's deliveries, newest first; status narrows it when not empty.
func (n *NotificationEndpointsClient) ListDeliveries(ctx context.Context, endpoint, status string, opts *ListOptions) (*EnumerationResult[NotificationDelivery], error) {
	query := opts.values()
	if status != "" {
		query.Set("status", status)
	}
	var out EnumerationResult[NotificationDelivery]
	if err := n.c.Do(ctx, http.MethodGet, n.item(endpoint)+"/deliveries", query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetDelivery reads one delivery with its payload and last attempt.
func (n *NotificationEndpointsClient) GetDelivery(ctx context.Context, endpoint, deliveryID string) (*NotificationDelivery, error) {
	var out NotificationDelivery
	if err := n.c.Do(ctx, http.MethodGet, n.item(endpoint)+"/deliveries/"+url.PathEscape(deliveryID), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
