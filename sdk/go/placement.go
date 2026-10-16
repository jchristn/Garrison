package garrison

import (
	"context"
	"net/http"
	"net/url"
)

// NodePlacementResponse contains advisory eligibility without other tenants' run data.
type NodePlacementResponse struct {
	NodeID   string   `json:"nodeId"`
	Eligible bool     `json:"eligible"`
	Reasons  []string `json:"reasons"`
}

// RunPlacementResponse is a point-in-time diagnostic, never a lease or capacity reservation.
type RunPlacementResponse struct {
	AdmissionRejection *string                 `json:"admissionRejection,omitempty"`
	RunID              string                  `json:"runId"`
	TakenUTC           string                  `json:"takenUtc"`
	Eligible           bool                    `json:"eligible"`
	Reasons            []string                `json:"reasons"`
	Nodes              []NodePlacementResponse `json:"nodes"`
}

// Placement explains current eligibility without leasing or reserving capacity.
func (r *RunsClient) Placement(ctx context.Context, id string) (*RunPlacementResponse, error) {
	var out RunPlacementResponse
	if err := r.c.Do(ctx, http.MethodGet, r.p("/"+url.PathEscape(id)+"/placement"), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
