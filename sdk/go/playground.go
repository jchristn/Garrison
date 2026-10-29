package garrison

import (
	"context"
	"encoding/json"
	"net/http"
)

// Run kinds (Run.Kind): why a run was created. RunKindPlayground runs try an agent's draft revision in the studio
// playground, on an ephemeral deployment in the reserved PlaygroundEnvironment.
const (
	RunKindInvoke     = "Invoke"
	RunKindDelegated  = "Delegated"
	RunKindTest       = "Test"
	RunKindRetry      = "Retry"
	RunKindPipeline   = "Pipeline"
	RunKindTrigger    = "Trigger"
	RunKindPlayground = "Playground"
)

// PlaygroundEnvironment is the reserved environment playground deployments live in. Users cannot create deployments
// in it (400 ReservedEnvironment) and no app can select it.
const PlaygroundEnvironment = "draft"

// PlaygroundInvokeRequest runs an agent's revision in the studio playground. Agent names the agent to run for a
// studio draft (empty means the target app's entry agent) and is ignored by the agent route. AgentRevisionID (agent
// route only) defaults to the agent's open draft revision, else its latest published one. SourceDeploymentID (agent
// route only) names the deployment whose settings the playground copies; empty means the agent's dev deployment, else
// its first one. Wait nil means true; WaitSeconds 0 means the server default of 120, and the server clamps it to 1
// through 3600.
type PlaygroundInvokeRequest struct {
	Input              string `json:"input"`
	Agent              string `json:"agent,omitempty"`
	AgentRevisionID    string `json:"agentRevisionId,omitempty"`
	SourceDeploymentID string `json:"sourceDeploymentId,omitempty"`
	ConversationID     string `json:"conversationId,omitempty"`
	Wait               *bool  `json:"wait,omitempty"`
	WaitSeconds        int    `json:"waitSeconds,omitempty"`
}

// PlaygroundInvoke runs an agent (identifier or name) in the studio playground on an ephemeral copy of one of its
// deployments in PlaygroundEnvironment, pinned to the revision. The run has Kind RunKindPlayground. Needs Execute on
// Agent.
func (a *AgentsClient) PlaygroundInvoke(ctx context.Context, agent string, req PlaygroundInvokeRequest) (*Run, error) {
	var run Run
	if err := a.c.Do(ctx, http.MethodPost, a.item(agent)+"/playground/invoke", nil, req, &run); err != nil {
		return nil, err
	}
	return &run, nil
}

// PlaygroundInvoke tries the draft in the playground: its document for req.Agent (default the target app's entry
// agent) is written as that agent's draft revision, then run on an ephemeral deployment in PlaygroundEnvironment.
// Live configuration does not change. Needs Update on StudioDraft and on AgentRevision. It fails with 400 AgentNotLive
// for an agent the draft creates; apply the draft first.
func (s *StudioDraftsClient) PlaygroundInvoke(ctx context.Context, id string, req PlaygroundInvokeRequest) (*Run, error) {
	var run Run
	if err := s.c.Do(ctx, http.MethodPost, s.item(id)+"/playground/invoke", nil, req, &run); err != nil {
		return nil, err
	}
	return &run, nil
}

// CompilePreviewRequest is the sample input for a compile preview. Input empty means the server default.
// AgentRevisionID compiles with another revision of the agent, such as a draft (also needs Read on AgentRevision).
// Environment compiles the same agent's deployment in that environment instead (400 NoDeploymentInEnvironment when
// there is none).
type CompilePreviewRequest struct {
	Input           string            `json:"input,omitempty"`
	Parameters      map[string]string `json:"parameters,omitempty"`
	AgentRevisionID string            `json:"agentRevisionId,omitempty"`
	Environment     string            `json:"environment,omitempty"`
}

// CompilePreviewResponse is a compiled execution spec with secret values redacted. DeploymentID is the deployment
// that was compiled (another one when an environment was requested); AgentRevisionID is the revision used, nil when
// the agent has none. Spec and TemplateVersions are kept as raw JSON.
type CompilePreviewResponse struct {
	Spec             json.RawMessage `json:"spec"`
	TemplateVersions json.RawMessage `json:"templateVersions"`
	CommandLine      string          `json:"commandLine"`
	DeploymentID     string          `json:"deploymentId"`
	AgentRevisionID  *string         `json:"agentRevisionId,omitempty"`
}

// DeploymentsClient manages deployments and previews their compilation.
type DeploymentsClient struct{ Resource }

// CompilePreview compiles the deployment (identifier) with sample input. Needs Read on Deployment.
func (d *DeploymentsClient) CompilePreview(ctx context.Context, id string, req CompilePreviewRequest) (*CompilePreviewResponse, error) {
	var out CompilePreviewResponse
	if err := d.c.Do(ctx, http.MethodPost, d.item(id)+"/compile-preview", nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
