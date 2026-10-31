package garrison

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// AppInfo is an app's branding and sign-in mode, from GET /v1.0/apps/{slug}. Reading it needs no credentials.
// AuthMode is one of AppAuthModeTenantUsers, AppAuthModeAppUsers, or AppAuthModeAnonymous. FontFamily is one of the
// AppFont constants and is always present (default System). FaviconURL is /v1.0/apps/{slug}/favicon when the app has a
// favicon or a logo, else nil.
type AppInfo struct {
	Slug                  string  `json:"slug"`
	DisplayName           string  `json:"displayName"`
	Description           *string `json:"description"`
	WelcomeText           *string `json:"welcomeText"`
	PrimaryColor          *string `json:"primaryColor"`
	AccentColor           *string `json:"accentColor"`
	LogoURL               *string `json:"logoUrl"`
	BackgroundColor       *string `json:"backgroundColor"`
	HeaderColor           *string `json:"headerColor"`
	AgentBubbleColor      *string `json:"agentBubbleColor"`
	ConversationListColor *string `json:"conversationListColor"`
	ComposerColor         *string `json:"composerColor"`
	FilesColor            *string `json:"filesColor"`
	FontFamily            string  `json:"fontFamily"`
	FaviconURL            *string `json:"faviconUrl"`
	AuthMode              string  `json:"authMode"`
	AnonymousAllowed      bool    `json:"anonymousAllowed"`
	ShowOperatorDetail    bool    `json:"showOperatorDetail"`
}

// AppSessionResponse is an app session. Token has the prefix gas_ and works only on /v1.0/apps/{slug}/ for that app.
type AppSessionResponse struct {
	Token         string `json:"token"`
	ExpiresUTC    string `json:"expiresUtc"`
	PrincipalName string `json:"principalName"`
	Anonymous     bool   `json:"anonymous"`
}

// AppTurnView is one turn of an app conversation as an end user sees it. Answer is nil until the turn succeeds.
type AppTurnView struct {
	RunID            string  `json:"runId"`
	Turn             int     `json:"turn"`
	Message          string  `json:"message"`
	Status           string  `json:"status"`
	Answer           *string `json:"answer"`
	Error            *string `json:"error"`
	AwaitingApproval bool    `json:"awaitingApproval"`
	CreatedUTC       string  `json:"createdUtc"`
	CompletedUTC     *string `json:"completedUtc"`
}

// AppConversationView is an app conversation as its owner sees it. Turns is empty in listings and filled when one
// conversation is read.
type AppConversationView struct {
	ID              string        `json:"id"`
	Title           *string       `json:"title"`
	TurnCount       int           `json:"turnCount"`
	Busy            bool          `json:"busy"`
	LastRunID       *string       `json:"lastRunId"`
	CreatedUTC      string        `json:"createdUtc"`
	LastActivityUTC *string       `json:"lastActivityUtc"`
	Turns           []AppTurnView `json:"turns"`
}

// AppConversationStart is the answer to starting an app conversation.
type AppConversationStart struct {
	ConversationID string      `json:"conversationId"`
	Turn           AppTurnView `json:"turn"`
}

// AppTurnStreamItem is one item of an app turn stream. Name is turn.event (Event set), turn.status, or turn.completed
// (Turn set). ID is the run event sequence for turn.event items.
type AppTurnStreamItem struct {
	Name  string
	ID    string
	Event *RunEvent
	Turn  *AppTurnView
	Data  string
}

// AppFileChange is one changed file in a files.changed event.
type AppFileChange struct {
	Path      string  `json:"path"`
	Version   int     `json:"version"`
	Deleted   bool    `json:"deleted"`
	SHA256    *string `json:"sha256"`
	SizeBytes int64   `json:"sizeBytes"`
}

// AppFilesChanged is a files.changed event of an app conversation. The first event lists every current file.
type AppFilesChanged struct {
	ConversationID string          `json:"conversationId"`
	Changed        []AppFileChange `json:"changed"`
}

// AppGatewayClient is the client for an agentic app's end-user gateway at /v1.0/apps/{slug}/. It needs no management
// credentials: start a session with an email and password, or anonymously when the app allows it, and the session token
// (prefix gas_) is kept and sent as a bearer token. The token works only on this app's gateway and reaches only the
// conversations its owner started (anything else is 404). Errors are *Error values: 401 InvalidCredentials,
// AppSignInRequired, AnonymousDisabled, or an expired session; 403 AppAccessDenied; 409 AppNotDeployed,
// ConversationBusy, or AppRateLimited. Safe for concurrent use once a session is started.
type AppGatewayClient struct {
	// Slug is the app URL name.
	Slug string
	// Session is the last session started, or nil.
	Session *AppSessionResponse
	// PollInterval is the wait between polls in WaitForTurn. Default 500 milliseconds.
	PollInterval time.Duration
	c            *Client
}

// NewAppGatewayClient creates a gateway client for the app with this slug at baseURL (DefaultBaseURL when empty).
func NewAppGatewayClient(baseURL, slug string) *AppGatewayClient {
	return &AppGatewayClient{Slug: slug, PollInterval: 500 * time.Millisecond, c: NewClient(baseURL)}
}

// AppGateway creates a gateway client for the app with this slug on the same server and HTTP client. It starts with
// no session and never sends this client's management credentials.
func (c *Client) AppGateway(slug string) *AppGatewayClient {
	g := NewAppGatewayClient(c.BaseURL, slug)
	g.c.HTTPClient = c.HTTPClient
	return g
}

// Token returns the session token, or "" before a session starts.
func (g *AppGatewayClient) Token() string { return g.c.Token }

// SetToken uses a session token issued elsewhere; "" clears it.
func (g *AppGatewayClient) SetToken(token string) {
	g.c.Token = token
	if token == "" {
		g.c.Mode = AuthNone
	} else {
		g.c.Mode = AuthToken
	}
}

func (g *AppGatewayClient) path(suffix string) string {
	return "/v1.0/apps/" + url.PathEscape(g.Slug) + suffix
}

func (g *AppGatewayClient) conversation(id, suffix string) string {
	return g.path("/conversations/" + url.PathEscape(id) + suffix)
}

// Info returns the app's branding and how to sign in. Needs no session.
func (g *AppGatewayClient) Info(ctx context.Context) (*AppInfo, error) {
	var out AppInfo
	if err := g.c.Do(ctx, http.MethodGet, g.path(""), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// LogoURL returns the absolute URL of the app's logo image (404 when the app has none).
func (g *AppGatewayClient) LogoURL() string { return g.c.BaseURL + g.path("/logo") }

// Logo downloads the app's logo image (404 when the app has none).
func (g *AppGatewayClient) Logo(ctx context.Context) ([]byte, error) {
	resp, err := g.c.send(ctx, http.MethodGet, g.path("/logo"), nil, nil, "", "")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// FaviconURL returns the absolute URL of the app's browser tab icon: the favicon asset, else the logo (404 when the app
// has neither).
func (g *AppGatewayClient) FaviconURL() string { return g.c.BaseURL + g.path("/favicon") }

// Favicon downloads the app's browser tab icon: the favicon asset, else the logo (404 when the app has neither).
func (g *AppGatewayClient) Favicon(ctx context.Context) ([]byte, error) {
	resp, err := g.c.send(ctx, http.MethodGet, g.path("/favicon"), nil, nil, "", "")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// StartSession starts a session with an email and password, or anonymously when both are empty (only when the app's
// auth mode is Anonymous and anonymous use is enabled). The token is kept for later calls; on failure the previous
// token is kept.
func (g *AppGatewayClient) StartSession(ctx context.Context, email, password string) (*AppSessionResponse, error) {
	previous := g.c.Token
	g.SetToken("")
	var body any
	if email != "" || password != "" {
		body = map[string]string{"email": email, "password": password}
	}
	var out AppSessionResponse
	if err := g.c.Do(ctx, http.MethodPost, g.path("/session"), nil, body, &out); err != nil {
		g.SetToken(previous)
		return nil, err
	}
	g.SetToken(out.Token)
	g.Session = &out
	return &out, nil
}

// EndSession signs out and forgets the token.
func (g *AppGatewayClient) EndSession(ctx context.Context) error {
	if err := g.c.Do(ctx, http.MethodDelete, g.path("/session"), nil, nil, nil); err != nil {
		return err
	}
	g.SetToken("")
	g.Session = nil
	return nil
}

// Conversations lists the session owner's conversations in the app.
func (g *AppGatewayClient) Conversations(ctx context.Context) ([]AppConversationView, error) {
	var out []AppConversationView
	if err := g.c.Do(ctx, http.MethodGet, g.path("/conversations"), nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// StartConversation starts a conversation with the app's entry agent on the live environment's entry deployment.
func (g *AppGatewayClient) StartConversation(ctx context.Context, message string) (*AppConversationStart, error) {
	var out AppConversationStart
	if err := g.c.Do(ctx, http.MethodPost, g.path("/conversations"), nil, map[string]string{"message": message}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Conversation reads one of the owner's conversations with its turns.
func (g *AppGatewayClient) Conversation(ctx context.Context, id string) (*AppConversationView, error) {
	var out AppConversationView
	if err := g.c.Do(ctx, http.MethodGet, g.conversation(id, ""), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Send sends the next message in a conversation; 409 ConversationBusy while the previous turn runs.
func (g *AppGatewayClient) Send(ctx context.Context, id, message string) (*AppTurnView, error) {
	var out AppTurnView
	if err := g.c.Do(ctx, http.MethodPost, g.conversation(id, "/messages"), nil, map[string]string{"message": message}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// StreamTurn calls fn for each visible item of a turn until turn.completed, fn returns false, or ctx is cancelled.
// afterSequence resumes after a turn.event ID (0 streams from the start).
func (g *AppGatewayClient) StreamTurn(ctx context.Context, id, runID string, afterSequence int64, fn func(AppTurnStreamItem) bool) error {
	q := url.Values{"afterSequence": {strconv.FormatInt(afterSequence, 10)}}
	return g.c.Stream(ctx, g.conversation(id, "/turns/"+url.PathEscape(runID)+"/stream"), q, func(m SSEMessage) (bool, error) {
		item := AppTurnStreamItem{Name: m.Event, ID: m.ID, Data: m.Data}
		switch m.Event {
		case "turn.event":
			item.Event = &RunEvent{}
			if err := json.Unmarshal([]byte(m.Data), item.Event); err != nil {
				return false, err
			}
		case "turn.status", "turn.completed":
			item.Turn = &AppTurnView{}
			if err := json.Unmarshal([]byte(m.Data), item.Turn); err != nil {
				return false, err
			}
		default:
			return true, nil
		}
		return fn(item) && m.Event != "turn.completed", nil
	})
}

// WaitForTurn polls the conversation until the turn with runID reaches a terminal status or ctx is done.
func (g *AppGatewayClient) WaitForTurn(ctx context.Context, id, runID string) (*AppTurnView, error) {
	interval := g.PollInterval
	if interval <= 0 {
		interval = 500 * time.Millisecond
	}
	for {
		view, err := g.Conversation(ctx, id)
		if err != nil {
			return nil, err
		}
		for i := range view.Turns {
			if view.Turns[i].RunID == runID && IsTerminal(view.Turns[i].Status) {
				return &view.Turns[i], nil
			}
		}
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("garrison: waiting for turn %s: %w", runID, ctx.Err())
		case <-time.After(interval):
		}
	}
}

// Files lists the conversation's files.
func (g *AppGatewayClient) Files(ctx context.Context, id string) (*FileSpaceListing, error) {
	var out FileSpaceListing
	if err := g.c.Do(ctx, http.MethodGet, g.conversation(id, "/files"), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ReadFile reads a file of the conversation. version 0 reads the current version.
func (g *AppGatewayClient) ReadFile(ctx context.Context, id, path string, version int) ([]byte, error) {
	resp, err := g.c.send(ctx, http.MethodGet, g.conversation(id, "/files/content"), pathQuery(path, version), nil, "", "")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// FileVersions lists a file's versions, newest first.
func (g *AppGatewayClient) FileVersions(ctx context.Context, id, path string) ([]ConversationFileVersion, error) {
	var out []ConversationFileVersion
	if err := g.c.Do(ctx, http.MethodGet, g.conversation(id, "/files/versions"), pathQuery(path, 0), nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// DownloadURL issues a short-lived download URL for a file that needs no credentials. version 0 means the current one.
func (g *AppGatewayClient) DownloadURL(ctx context.Context, id, path string, version int) (*FileDownloadURL, error) {
	var out FileDownloadURL
	if err := g.c.Do(ctx, http.MethodPost, g.conversation(id, "/files/download-url"), pathQuery(path, version), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// StreamFiles calls fn for each files.changed event of the conversation (the first lists every current file) until fn
// returns false, the server closes the stream, or ctx is cancelled.
func (g *AppGatewayClient) StreamFiles(ctx context.Context, id string, fn func(AppFilesChanged) bool) error {
	err := g.c.Stream(ctx, g.conversation(id, "/files/stream"), nil, func(m SSEMessage) (bool, error) {
		if m.Event != "files.changed" || strings.TrimSpace(m.Data) == "" {
			return true, nil
		}
		var changed AppFilesChanged
		if err := json.Unmarshal([]byte(m.Data), &changed); err != nil {
			return false, err
		}
		return fn(changed), nil
	})
	return err
}
