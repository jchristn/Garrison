package garrison

import (
	"context"
	"net/http"
	"net/url"
)

// EffectOperation contains gateway intent metadata, excluding raw arguments, results, and secrets.
type EffectOperation struct {
	ID              string  `json:"id"`
	TenantID        string  `json:"tenantId"`
	RunID           string  `json:"runId"`
	LeaseEpoch      int64   `json:"leaseEpoch"`
	Tool            string  `json:"tool"`
	ArgumentDigest  string  `json:"argumentDigest"`
	State           string  `json:"state"`
	ResultReference *string `json:"resultReference,omitempty"`
	CreatedUTC      string  `json:"createdUtc"`
}

// Effect operation states. Dispatched and Unknown both prohibit automatic replay.
const (
	EffectOperationAuthorized = "Authorized"
	EffectOperationDispatched = "Dispatched"
	EffectOperationCompleted  = "Completed"
	EffectOperationUnknown    = "Unknown"
	RunStatusSuspended        = "Suspended"
	// ErrorQueueFull is a REST 429 admission error, not a run outcome.
	ErrorQueueFull = "QueueFull"
)

// Operations lists tenant-scoped intent metadata in creation order.
func (r *RunsClient) Operations(ctx context.Context, id string) ([]EffectOperation, error) {
	var out []EffectOperation
	if err := r.c.Do(ctx, http.MethodGet, r.p("/"+url.PathEscape(id)+"/operations"), nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// MasterKeyRotationResponse reports pass counts without key material.
type MasterKeyRotationResponse struct {
	KeyVersion int `json:"keyVersion"`
	Scanned    int `json:"scanned"`
	Rotated    int `json:"rotated"`
	Conflicts  int `json:"conflicts"`
	Failed     int `json:"failed"`
}

// SettingsClient manages server settings; these operations require system administration.
type SettingsClient struct{ c *Client }

// Get reads server settings and metadata.
func (s *SettingsClient) Get(ctx context.Context) (map[string]any, error) {
	var out map[string]any
	err := s.c.Do(ctx, http.MethodGet, "/v1.0/api/settings", nil, nil, &out)
	return out, err
}

// Update changes settings using values with path and value keys.
func (s *SettingsClient) Update(ctx context.Context, values []map[string]any) (map[string]any, error) {
	var out map[string]any
	err := s.c.Do(ctx, http.MethodPut, "/v1.0/api/settings", nil, map[string]any{"values": values}, &out)
	return out, err
}

// RotateMasterKey re-encrypts stored credentials and secrets with the configured active key.
func (s *SettingsClient) RotateMasterKey(ctx context.Context) (*MasterKeyRotationResponse, error) {
	var out MasterKeyRotationResponse
	if err := s.c.Do(ctx, http.MethodPost, "/v1.0/api/settings/keys/rotate", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Tenant is a tenant isolation boundary with weighted fair-share scheduling.
type Tenant struct {
	ID                          string `json:"id"`
	Name                        string `json:"name"`
	SchedulingWeight            int    `json:"schedulingWeight"`
	RequireUntrustedDeployments bool   `json:"requireUntrustedDeployments"`
}

// TenantRequest supports partial tenant updates. Nil weight preserves the existing value.
type TenantRequest struct {
	Name                        *string `json:"name,omitempty"`
	SchedulingWeight            *int    `json:"schedulingWeight,omitempty"`
	RequireUntrustedDeployments *bool   `json:"requireUntrustedDeployments,omitempty"`
}
