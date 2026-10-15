package garrison

import (
	"context"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

// Transcript formats.
const (
	TranscriptFormatMarkdown = "markdown"
	TranscriptFormatJSON     = "json"
)

// Input schema field codes (Error.FieldCodes values). InputNotJson is reported on "input" when an agent with an
// InputSchemaJSON is invoked with an input that is not JSON; InputSchemaViolation on "input" or "input.<path>" (for
// example "input.topic" or "input.tags[1]") when the document does not match; InvalidJsonSchema when an agent is saved
// with an input or output schema that is not a valid JSON Schema.
const (
	FieldCodeInputNotJSON         = "InputNotJson"
	FieldCodeInputSchemaViolation = "InputSchemaViolation"
	FieldCodeInvalidJSONSchema    = "InvalidJsonSchema"
)

// TranscriptUsage holds token, tool, cost, and duration totals of a transcript or one turn.
type TranscriptUsage struct {
	InputTokens     int64    `json:"inputTokens"`
	OutputTokens    int64    `json:"outputTokens"`
	CachedTokens    int64    `json:"cachedTokens"`
	ReasoningTokens int64    `json:"reasoningTokens"`
	ToolCallCount   int      `json:"toolCallCount"`
	CostUSD         *float64 `json:"costUsd,omitempty"`
	CostEstimated   bool     `json:"costEstimated"`
	DurationMs      *int64   `json:"durationMs,omitempty"`
}

// TranscriptEntry is one transcript event. Type is AssistantText, Thinking (only with includeThinking), ToolCall,
// ToolResult, Warning, Error, or Lifecycle. Secrets read [REDACTED].
type TranscriptEntry struct {
	Sequence      int64  `json:"sequence"`
	TimestampUTC  string `json:"timestampUtc"`
	Type          string `json:"type"`
	Text          string `json:"text,omitempty"`
	ToolName      string `json:"toolName,omitempty"`
	ToolCallID    string `json:"toolCallId,omitempty"`
	Success       *bool  `json:"success,omitempty"`
	Code          string `json:"code,omitempty"`
	TextTruncated bool   `json:"textTruncated"`
}

// TranscriptApproval is an approval requested during a turn.
type TranscriptApproval struct {
	ID             string `json:"id"`
	Kind           string `json:"kind"`
	ToolName       string `json:"toolName"`
	Summary        string `json:"summary,omitempty"`
	InputPreview   string `json:"inputPreview,omitempty"`
	Status         string `json:"status"`
	Decision       string `json:"decision,omitempty"`
	DecisionSource string `json:"decisionSource,omitempty"`
	DecidedBy      string `json:"decidedBy,omitempty"`
	Reason         string `json:"reason,omitempty"`
	RequestedUTC   string `json:"requestedUtc"`
	DecidedUTC     string `json:"decidedUtc,omitempty"`
}

// TranscriptTurn is one run of a transcript (a conversation has one per turn).
type TranscriptTurn struct {
	Turn             int                  `json:"turn"`
	RunID            string               `json:"runId"`
	AgentName        string               `json:"agentName"`
	DeploymentID     string               `json:"deploymentId"`
	Kind             string               `json:"kind"`
	Status           string               `json:"status"`
	Outcome          string               `json:"outcome"`
	CallerName       string               `json:"callerName,omitempty"`
	Model            string               `json:"model,omitempty"`
	Input            string               `json:"input,omitempty"`
	InputContentType string               `json:"inputContentType,omitempty"`
	CreatedUTC       string               `json:"createdUtc"`
	StartedUTC       string               `json:"startedUtc,omitempty"`
	CompletedUTC     string               `json:"completedUtc,omitempty"`
	Entries          []TranscriptEntry    `json:"entries"`
	Approvals        []TranscriptApproval `json:"approvals"`
	Result           string               `json:"result,omitempty"`
	ErrorMessage     string               `json:"errorMessage,omitempty"`
	Usage            TranscriptUsage      `json:"usage"`
	// OmittedEvents counts events the run recorded that are no longer stored (retention).
	OmittedEvents int64 `json:"omittedEvents"`
	Truncated     bool  `json:"truncated"`
}

// Transcript is a run or conversation transcript (schema "garrison.transcript/v1"); Kind is "Run" or "Conversation".
type Transcript struct {
	Schema           string           `json:"schema"`
	Kind             string           `json:"kind"`
	TenantID         string           `json:"tenantId"`
	RunID            string           `json:"runId,omitempty"`
	ConversationID   string           `json:"conversationId,omitempty"`
	AgentName        string           `json:"agentName"`
	Title            string           `json:"title,omitempty"`
	GeneratedUTC     string           `json:"generatedUtc"`
	IncludesThinking bool             `json:"includesThinking"`
	Truncated        bool             `json:"truncated"`
	TruncationNote   string           `json:"truncationNote,omitempty"`
	TurnCount        int              `json:"turnCount"`
	Usage            TranscriptUsage  `json:"usage"`
	Turns            []TranscriptTurn `json:"turns"`
}

// ManifestExportOptions selects what a bundle export contains. With no kinds and no resources every tenant-owned
// resource is exported.
type ManifestExportOptions struct {
	// Kinds names whole kinds, for example []string{"Agent", "Pipeline"}.
	Kinds []string
	// Resources names single records as "Kind/name", for example []string{"Agent/triage"}.
	Resources []string
	// FollowReferences also exports what the selection depends on.
	FollowReferences bool
	// IncludeBuiltIn includes referenced built-in prompt templates and harness profiles.
	IncludeBuiltIn bool
}

func transcriptQuery(format string, includeThinking bool) url.Values {
	return url.Values{"format": {format}, "includeThinking": {strconv.FormatBool(includeThinking)}}
}

func (c *Client) getText(ctx context.Context, path string, query url.Values) (string, error) {
	resp, err := c.send(ctx, http.MethodGet, path, query, nil, "", "")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// Export returns a multi-document YAML bundle that Apply accepts unchanged. Secret values are never exported; the
// leading Bundle document lists requiredSecrets, requiredArtifactStores, and requiredBuiltIns. The server answers 400
// (field codes UnknownKind, InvalidSelector) or 404 when a selected resource does not exist.
func (m *ManifestsClient) Export(ctx context.Context, options ManifestExportOptions) (string, error) {
	q := url.Values{}
	if len(options.Kinds) > 0 {
		q.Set("kinds", strings.Join(options.Kinds, ","))
	}
	if len(options.Resources) > 0 {
		q.Set("resources", strings.Join(options.Resources, ","))
	}
	if options.FollowReferences {
		q.Set("followReferences", "true")
	}
	if options.IncludeBuiltIn {
		q.Set("includeBuiltIn", "true")
	}
	return m.c.getText(ctx, m.c.TenantPath("/manifests/export"), q)
}

// TranscriptMarkdown returns a run's transcript as Markdown (secrets redacted). Unknown runs answer 404.
func (r *RunsClient) TranscriptMarkdown(ctx context.Context, id string, includeThinking bool) (string, error) {
	return r.c.getText(ctx, r.p("/"+url.PathEscape(id)+"/transcript"), transcriptQuery(TranscriptFormatMarkdown, includeThinking))
}

// Transcript returns a run's transcript as the typed JSON document.
func (r *RunsClient) Transcript(ctx context.Context, id string, includeThinking bool) (*Transcript, error) {
	var out Transcript
	if err := r.c.Do(ctx, http.MethodGet, r.p("/"+url.PathEscape(id)+"/transcript"), transcriptQuery(TranscriptFormatJSON, includeThinking), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// TranscriptMarkdown returns a conversation's transcript (every turn, oldest first) as Markdown.
func (r *ConversationsClient) TranscriptMarkdown(ctx context.Context, id string, includeThinking bool) (string, error) {
	return r.c.getText(ctx, r.p("/"+url.PathEscape(id)+"/transcript"), transcriptQuery(TranscriptFormatMarkdown, includeThinking))
}

// Transcript returns a conversation's transcript (every turn, oldest first) as the typed JSON document.
func (r *ConversationsClient) Transcript(ctx context.Context, id string, includeThinking bool) (*Transcript, error) {
	var out Transcript
	if err := r.c.Do(ctx, http.MethodGet, r.p("/"+url.PathEscape(id)+"/transcript"), transcriptQuery(TranscriptFormatJSON, includeThinking), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
