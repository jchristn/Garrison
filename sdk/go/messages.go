package garrison

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
)

// Message urgencies (AgentMessage.Urgency). Urgent wakes the recipient now, within Messaging.UrgentWakesPerHour.
const (
	MessageUrgencyNormal = "Normal"
	MessageUrgencyUrgent = "Urgent"
)

// Message statuses (AgentMessage.Status).
const (
	MessageStatusQueued       = "Queued"
	MessageStatusDelivered    = "Delivered"
	MessageStatusAcknowledged = "Acknowledged"
	MessageStatusExpired      = "Expired"
	MessageStatusRejected     = "Rejected"
)

// Message rejection reasons (AgentMessage.RejectionReason). A refused send answers 409 with the reason as its code.
const (
	MessageRejectionHopLimit     = "HopLimit"
	MessageRejectionLineRate     = "LineRate"
	MessageRejectionThreadBudget = "ThreadBudget"
	MessageRejectionNoLine       = "NoLine"
	MessageRejectionFrozen       = "Frozen"
)

// AgentMessageArtifact is a run artifact attached to a message by reference.
type AgentMessageArtifact struct {
	ArtifactID string `json:"artifactId"`
	Name       string `json:"name"`
	MediaType  string `json:"mediaType"`
	SizeBytes  int64  `json:"sizeBytes"`
}

// AgentMessage is a message from an agent or a person to an agent. Subject and body are text the sender wrote; treat
// them as untrusted. SenderAgentID is nil for a person's message.
type AgentMessage struct {
	ID                  string                 `json:"id"`
	TenantID            string                 `json:"tenantId"`
	ThreadID            string                 `json:"threadId"`
	ParentMessageID     *string                `json:"parentMessageId,omitempty"`
	HopCount            int                    `json:"hopCount"`
	SenderAgentID       *string                `json:"senderAgentId,omitempty"`
	SenderAgentName     *string                `json:"senderAgentName,omitempty"`
	SenderRunID         *string                `json:"senderRunId,omitempty"`
	SenderPrincipalType string                 `json:"senderPrincipalType,omitempty"`
	SenderPrincipalID   *string                `json:"senderPrincipalId,omitempty"`
	SenderName          *string                `json:"senderName,omitempty"`
	RecipientAgentID    string                 `json:"recipientAgentId"`
	RecipientAgentName  *string                `json:"recipientAgentName,omitempty"`
	Urgency             string                 `json:"urgency"`
	Subject             string                 `json:"subject"`
	Body                string                 `json:"body,omitempty"`
	Artifacts           []AgentMessageArtifact `json:"artifacts"`
	Status              string                 `json:"status"`
	RejectionReason     *string                `json:"rejectionReason,omitempty"`
	RejectionDetail     *string                `json:"rejectionDetail,omitempty"`
	EscalationID        *string                `json:"escalationId,omitempty"`
	WokeRecipient       bool                   `json:"wokeRecipient,omitempty"`
	DeliveredRunID      *string                `json:"deliveredRunId,omitempty"`
	DeliveredUTC        *string                `json:"deliveredUtc,omitempty"`
	AcknowledgedUTC     *string                `json:"acknowledgedUtc,omitempty"`
	ExpiresUTC          *string                `json:"expiresUtc,omitempty"`
	CreatedUTC          string                 `json:"createdUtc,omitempty"`
	LastUpdateUTC       string                 `json:"lastUpdateUtc,omitempty"`
}

// AgentMessageFilter filters Messages.List; empty fields are not sent. Sender, Recipient, and Agent (to or from) take
// an identifier or name; From and To are ISO 8601 times.
type AgentMessageFilter struct {
	Sender         string
	Recipient      string
	Agent          string
	Status         string
	Urgency        string
	Reason         string
	Thread         string
	DeliveredRunID string
	From           string
	To             string
	Search         string
	MaxResults     int
	Skip           int
}

// AgentMessageSendRequest is a person's message to an agent. IdempotencyKey makes a retry return the first message.
type AgentMessageSendRequest struct {
	Recipient       string   `json:"recipient,omitempty"`
	Subject         string   `json:"subject"`
	Body            string   `json:"body,omitempty"`
	Urgency         string   `json:"urgency,omitempty"`
	ParentMessageID string   `json:"parentMessageId,omitempty"`
	ArtifactIDs     []string `json:"artifactIds,omitempty"`
	TTLSeconds      int      `json:"ttlSeconds,omitempty"`
	IdempotencyKey  string   `json:"idempotencyKey,omitempty"`
}

// MessagesClient lists and reads messages between agents and their threads, and writes to an agent as a person. Agents
// use the garrison_*_message MCP tools. Reading needs Read on AgentMessage; sending needs Create.
type MessagesClient struct{ c *Client }

// List returns a page of messages, newest first, with their artifacts.
func (m *MessagesClient) List(ctx context.Context, filter AgentMessageFilter) (*EnumerationResult[AgentMessage], error) {
	q := url.Values{}
	set := func(name, value string) {
		if value != "" {
			q.Set(name, value)
		}
	}
	set("sender", filter.Sender)
	set("recipient", filter.Recipient)
	set("agent", filter.Agent)
	set("status", filter.Status)
	set("urgency", filter.Urgency)
	set("reason", filter.Reason)
	set("thread", filter.Thread)
	set("deliveredRunId", filter.DeliveredRunID)
	set("from", filter.From)
	set("to", filter.To)
	set("search", filter.Search)
	if filter.MaxResults > 0 {
		q.Set("maxResults", strconv.Itoa(filter.MaxResults))
	}
	if filter.Skip > 0 {
		q.Set("skip", strconv.Itoa(filter.Skip))
	}
	var out EnumerationResult[AgentMessage]
	if err := m.c.Do(ctx, http.MethodGet, m.c.TenantPath("/messages"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads a message.
func (m *MessagesClient) Get(ctx context.Context, id string) (*AgentMessage, error) {
	var out AgentMessage
	if err := m.c.Do(ctx, http.MethodGet, m.c.TenantPath("/messages/"+url.PathEscape(id)), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Thread returns every message in a thread, oldest first, rejected ones included.
func (m *MessagesClient) Thread(ctx context.Context, threadID string) ([]AgentMessage, error) {
	var out []AgentMessage
	if err := m.c.Do(ctx, http.MethodGet, m.c.TenantPath("/message-threads/"+url.PathEscape(threadID)), nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// Send writes to an agent. A refused message returns an error with status 409 and the rejection reason as its code.
func (m *MessagesClient) Send(ctx context.Context, request AgentMessageSendRequest) (*AgentMessage, error) {
	var out AgentMessage
	if err := m.c.Do(ctx, http.MethodPost, m.c.TenantPath("/messages"), nil, request, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
