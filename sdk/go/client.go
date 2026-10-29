// Package garrison is the Go SDK for Garrison, the multi-tenant control plane for headless agent harnesses.
//
// Every call accepts a context.Context. Responses decode into the typed structs in models.go; fields the SDK
// does not model are preserved in each struct's Extra map where noted, and Raw calls return json.RawMessage.
package garrison

import (
	"bufio"
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Version is the SDK version.
const Version = "0.2.0"

// DefaultBaseURL is the default control plane address.
const DefaultBaseURL = "http://127.0.0.1:8700"

// AuthMode selects how requests are authenticated.
type AuthMode int

const (
	// AuthNone sends no credentials.
	AuthNone AuthMode = iota
	// AuthToken sends a bearer token.
	AuthToken
	// AuthKeys sends x-access-key and x-secret-key headers.
	AuthKeys
	// AuthSigned signs each request with HMAC-SHA256.
	AuthSigned
	// AuthAdmin sends the admin API key.
	AuthAdmin
)

// Error is returned for any non-2xx response.
type Error struct {
	StatusCode int    `json:"-"`
	Body       string `json:"-"`
	Code       string `json:"code"`
	Message    string `json:"message"`
	RequestID  string `json:"requestId"`
	// Fields holds field-level validation details, keyed by field path, when the server returns them.
	Fields map[string]string `json:"fields,omitempty"`
	// Errors holds per-setting validation errors keyed by setting path (settings routes, HTTP 400).
	Errors map[string]string `json:"errors,omitempty"`
	// FieldCodes holds machine codes of validation errors keyed by field path (for example url: DestinationBlocked).
	FieldCodes map[string]string `json:"fieldCodes,omitempty"`
}

func (e *Error) Error() string {
	if e.Code != "" {
		return fmt.Sprintf("garrison: HTTP %d %s: %s", e.StatusCode, e.Code, e.Message)
	}
	return fmt.Sprintf("garrison: HTTP %d: %s", e.StatusCode, truncate(e.Body, 300))
}

// IsStatus reports whether err is a Garrison API error with the given HTTP status code.
func IsStatus(err error, status int) bool {
	var apiErr *Error
	return errors.As(err, &apiErr) && apiErr.StatusCode == status
}

// Client is a Garrison API client. Configure authentication, then use the resource fields.
// A Client is safe for concurrent use once configured; do not change authentication concurrently with calls.
type Client struct {
	BaseURL     string
	HTTPClient  *http.Client
	Mode        AuthMode
	Token       string
	AccessKey   string
	SecretKey   string
	AdminAPIKey string
	TenantID    string

	Settings                   *SettingsClient
	Tenants                    *GlobalResource
	Users                      *Resource
	Credentials                *Resource
	Roles                      *Resource
	Permissions                *Resource
	RolePermissions            *Resource
	UserRoleAssignments        *Resource
	CredentialScopeAssignments *Resource
	Agents                     *AgentsClient
	Deployments                *Resource
	HarnessProfiles            *HarnessProfilesClient
	PromptTemplates            *Resource
	McpServers                 *Resource
	Secrets                    *Resource
	WorkspaceTemplates         *Resource
	ArtifactStores             *Resource
	Artifacts                  *ArtifactsClient
	ModelPrices                *Resource
	UsageQuotas                *UsageQuotasClient
	Manifests                  *ManifestsClient
	Runs                       *RunsClient
	Conversations              *ConversationsClient
	Approvals                  *ApprovalsClient
	Pipelines                  *PipelinesClient
	PipelineRuns               *PipelineRunsClient
	PipelineReviews            *PipelineReviewsClient
	Triggers                   *TriggersClient
	NotificationEndpoints      *NotificationEndpointsClient
	Environments               *EnvironmentsClient
	Promotions                 *PromotionsClient
	AgentAssets                *AgentAssetsClient
	FileSpaces                 *FileSpacesClient
	Capabilities               *CapabilitiesClient
	FanOutGroups               *FanOutGroupsClient
	Apps                       *AppsClient
	Analytics                  *AnalyticsClient
	Nodes                      *GlobalResource
	ControlNodes               *ControlNodesClient
	NodePools                  *GlobalResource
}

// NewClient creates a client for baseURL (DefaultBaseURL when empty).
func NewClient(baseURL string) *Client {
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}
	c := &Client{BaseURL: strings.TrimRight(baseURL, "/"), HTTPClient: &http.Client{Timeout: 5 * time.Minute}}
	c.Settings = &SettingsClient{c: c}
	c.Tenants = &GlobalResource{c: c, path: "/v1.0/api/tenants"}
	c.Users = &Resource{c: c, segment: "users"}
	c.Credentials = &Resource{c: c, segment: "credentials"}
	c.Roles = &Resource{c: c, segment: "roles"}
	c.Permissions = &Resource{c: c, segment: "permissions"}
	c.RolePermissions = &Resource{c: c, segment: "role-permissions"}
	c.UserRoleAssignments = &Resource{c: c, segment: "user-role-assignments"}
	c.CredentialScopeAssignments = &Resource{c: c, segment: "credential-scope-assignments"}
	c.Agents = &AgentsClient{Resource{c: c, segment: "agents"}}
	c.Deployments = &Resource{c: c, segment: "deployments"}
	c.HarnessProfiles = &HarnessProfilesClient{Resource{c: c, segment: "harness-profiles"}}
	c.PromptTemplates = &Resource{c: c, segment: "prompt-templates"}
	c.McpServers = &Resource{c: c, segment: "mcp-servers"}
	c.Secrets = &Resource{c: c, segment: "secrets"}
	c.WorkspaceTemplates = &Resource{c: c, segment: "workspace-templates"}
	c.ArtifactStores = &Resource{c: c, segment: "artifact-stores"}
	c.Artifacts = &ArtifactsClient{c: c}
	c.ModelPrices = &Resource{c: c, segment: "model-prices"}
	c.UsageQuotas = &UsageQuotasClient{Resource{c: c, segment: "usage-quotas"}}
	c.Manifests = &ManifestsClient{c: c}
	c.Runs = &RunsClient{c: c, PollInterval: 500 * time.Millisecond}
	c.Conversations = &ConversationsClient{c: c}
	c.Approvals = &ApprovalsClient{c: c}
	c.Pipelines = &PipelinesClient{Resource{c: c, segment: "pipelines"}}
	c.PipelineRuns = &PipelineRunsClient{c: c}
	c.PipelineReviews = &PipelineReviewsClient{c: c}
	c.Triggers = &TriggersClient{Resource{c: c, segment: "triggers"}}
	c.NotificationEndpoints = &NotificationEndpointsClient{Resource{c: c, segment: "notification-endpoints"}}
	c.Environments = &EnvironmentsClient{c: c}
	c.Promotions = &PromotionsClient{c: c}
	c.AgentAssets = &AgentAssetsClient{c: c}
	c.FileSpaces = &FileSpacesClient{c: c}
	c.Capabilities = &CapabilitiesClient{c: c}
	c.FanOutGroups = &FanOutGroupsClient{c: c}
	c.Apps = &AppsClient{c: c}
	c.Analytics = &AnalyticsClient{c: c}
	c.Nodes = &GlobalResource{c: c, path: "/v1.0/api/nodes"}
	c.ControlNodes = &ControlNodesClient{c: c}
	c.NodePools = &GlobalResource{c: c, path: "/v1.0/api/node-pools"}
	return c
}

// UseToken authenticates with a bearer token.
func (c *Client) UseToken(token, tenantID string) {
	c.Mode, c.Token, c.TenantID = AuthToken, token, tenantID
}

// UseAccessKey authenticates every request with an access key and secret key pair.
func (c *Client) UseAccessKey(accessKey, secretKey, tenantID string) {
	c.Mode, c.AccessKey, c.SecretKey, c.TenantID = AuthKeys, accessKey, secretKey, tenantID
}

// UseSignedRequests signs every request with HMAC-SHA256 using the secret key; the secret never leaves the client.
func (c *Client) UseSignedRequests(accessKey, secretKey, tenantID string) {
	c.Mode, c.AccessKey, c.SecretKey, c.TenantID = AuthSigned, accessKey, secretKey, tenantID
}

// UseAdminAPIKey authenticates with the platform admin API key.
func (c *Client) UseAdminAPIKey(apiKey, tenantID string) {
	c.Mode, c.AdminAPIKey, c.TenantID = AuthAdmin, apiKey, tenantID
}

// Login issues a token for a user and switches the client to token authentication.
func (c *Client) Login(ctx context.Context, email, password, tenantID string) (*TokenResponse, error) {
	return c.issue(ctx, map[string]any{"email": email, "password": password, "tenantId": tenantID})
}

// LoginWithKeys issues a token for a credential and switches the client to token authentication.
func (c *Client) LoginWithKeys(ctx context.Context, accessKey, secretKey string) (*TokenResponse, error) {
	return c.issue(ctx, map[string]any{"accessKey": accessKey, "secretKey": secretKey})
}

func (c *Client) issue(ctx context.Context, body any) (*TokenResponse, error) {
	previous := c.Mode
	c.Mode = AuthNone
	var issued TokenResponse
	if err := c.Do(ctx, http.MethodPost, "/v1.0/token", nil, body, &issued); err != nil {
		c.Mode = previous
		return nil, err
	}
	c.UseToken(issued.Token, issued.TenantID)
	return &issued, nil
}

// TokenDetails describes the current principal.
func (c *Client) TokenDetails(ctx context.Context) (map[string]any, error) {
	var out map[string]any
	err := c.Do(ctx, http.MethodGet, "/v1.0/token/details", nil, nil, &out)
	return out, err
}

// Logout revokes the current token.
func (c *Client) Logout(ctx context.Context) error {
	err := c.Do(ctx, http.MethodDelete, "/v1.0/token", nil, nil, nil)
	if err == nil {
		c.Mode, c.Token = AuthNone, ""
	}
	return err
}

// Health returns the server health document.
func (c *Client) Health(ctx context.Context) (map[string]any, error) {
	var out map[string]any
	err := c.Do(ctx, http.MethodGet, "/v1.0/api/health", nil, nil, &out)
	return out, err
}

// ServerInfo returns version and build information.
func (c *Client) ServerInfo(ctx context.Context) (map[string]any, error) {
	var out map[string]any
	err := c.Do(ctx, http.MethodGet, "/v1.0/api/server-info", nil, nil, &out)
	return out, err
}

// TenantPath returns the tenant-scoped path for suffix. It panics when TenantID is empty.
func (c *Client) TenantPath(suffix string) string {
	if c.TenantID == "" {
		panic("garrison: set Client.TenantID (or log in) before calling tenant-scoped APIs")
	}
	return "/v1.0/api/tenants/" + url.PathEscape(c.TenantID) + suffix
}

// Do sends a JSON request and decodes the JSON response into out (which may be nil).
func (c *Client) Do(ctx context.Context, method, path string, query url.Values, body any, out any) error {
	return c.doWithHeaders(ctx, method, path, query, nil, body, out)
}

// doWithHeaders is Do with extra request headers (for example Idempotency-Key); headers may be nil.
func (c *Client) doWithHeaders(ctx context.Context, method, path string, query url.Values, headers map[string]string, body any, out any) error {
	var payload []byte
	contentType := ""
	if body != nil {
		var err error
		payload, err = json.Marshal(body)
		if err != nil {
			return fmt.Errorf("garrison: encode request: %w", err)
		}
		contentType = "application/json"
	}
	resp, err := c.sendWithHeaders(ctx, method, path, query, headers, payload, contentType, "")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if out == nil || len(bytes.TrimSpace(data)) == 0 {
		return nil
	}
	if raw, ok := out.(*json.RawMessage); ok {
		*raw = append((*raw)[:0], data...)
		return nil
	}
	if err := json.Unmarshal(data, out); err != nil {
		return fmt.Errorf("garrison: decode response from %s %s: %w", method, path, err)
	}
	return nil
}

func (c *Client) send(ctx context.Context, method, path string, query url.Values, body []byte, contentType, accept string) (*http.Response, error) {
	return c.sendWithHeaders(ctx, method, path, query, nil, body, contentType, accept)
}

func (c *Client) sendWithHeaders(ctx context.Context, method, path string, query url.Values, headers map[string]string, body []byte, contentType, accept string) (*http.Response, error) {
	rawQuery := ""
	if len(query) > 0 {
		rawQuery = query.Encode()
	}
	full := c.BaseURL + path
	if rawQuery != "" {
		full += "?" + rawQuery
	}
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, full, reader)
	if err != nil {
		return nil, err
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	if accept != "" {
		req.Header.Set("Accept", accept)
	}
	for name, value := range headers {
		if value != "" {
			req.Header.Set(name, value)
		}
	}
	switch c.Mode {
	case AuthToken:
		req.Header.Set("Authorization", "Bearer "+c.Token)
	case AuthKeys:
		req.Header.Set("x-access-key", c.AccessKey)
		req.Header.Set("x-secret-key", c.SecretKey)
	case AuthAdmin:
		req.Header.Set("x-api-key", c.AdminAPIKey)
		if c.TenantID != "" {
			req.Header.Set("x-tenant-id", c.TenantID)
		}
	case AuthSigned:
		date := time.Now().UTC().Format("2006-01-02T15:04:05Z")
		nonceBytes := make([]byte, 16)
		_, _ = rand.Read(nonceBytes)
		nonce := hex.EncodeToString(nonceBytes)
		bodyHash := sha256.Sum256(body)
		canonical := strings.Join([]string{strings.ToUpper(method), path, rawQuery, c.TenantID, date, nonce, hex.EncodeToString(bodyHash[:])}, "\n")
		mac := hmac.New(sha256.New, []byte(c.SecretKey))
		mac.Write([]byte(canonical))
		req.Header.Set("x-access-key", c.AccessKey)
		req.Header.Set("x-date", date)
		req.Header.Set("x-nonce", nonce)
		req.Header.Set("x-signature", hex.EncodeToString(mac.Sum(nil)))
		if c.TenantID != "" {
			req.Header.Set("x-tenant-id", c.TenantID)
		}
	}
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		defer resp.Body.Close()
		data, _ := io.ReadAll(resp.Body)
		apiErr := &Error{StatusCode: resp.StatusCode, Body: string(data)}
		_ = json.Unmarshal(data, apiErr)
		return nil, apiErr
	}
	return resp, nil
}

// SSEMessage is one server-sent event.
type SSEMessage struct {
	Event string
	ID    string
	Data  string
}

// Stream opens a server-sent event stream and calls fn for each message until the stream ends, fn returns
// false, fn returns an error, or ctx is cancelled.
func (c *Client) Stream(ctx context.Context, path string, query url.Values, fn func(SSEMessage) (bool, error)) error {
	resp, err := c.send(ctx, http.MethodGet, path, query, nil, "", "text/event-stream")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 64*1024), 16*1024*1024)
	var msg SSEMessage
	var data []string
	flush := func() (bool, error) {
		if len(data) == 0 && msg.Event == "" {
			return true, nil
		}
		if msg.Event == "" {
			msg.Event = "message"
		}
		msg.Data = strings.Join(data, "\n")
		cont, err := fn(msg)
		msg, data = SSEMessage{}, nil
		return cont, err
	}
	for scanner.Scan() {
		line := strings.TrimSuffix(scanner.Text(), "\r")
		if line == "" {
			if cont, err := flush(); err != nil || !cont {
				return err
			}
			continue
		}
		if strings.HasPrefix(line, ":") {
			continue
		}
		field, value, _ := strings.Cut(line, ":")
		value = strings.TrimPrefix(value, " ")
		switch field {
		case "event":
			msg.Event = value
		case "id":
			msg.ID = value
		case "data":
			data = append(data, value)
		}
	}
	if err := scanner.Err(); err != nil && ctx.Err() == nil {
		return err
	}
	if _, err := flush(); err != nil {
		return err
	}
	return ctx.Err()
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}
