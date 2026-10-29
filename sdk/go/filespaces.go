package garrison

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
)

// File space owners: the owner argument of every FileSpacesClient method.
const (
	FileSpaceOwnerConversations = "conversations"
	FileSpaceOwnerRuns          = "runs"
)

// ConversationFile is a file in a conversation file space. SHA256 is lowercase hex; deleted files appear only when
// listing with includeDeleted.
type ConversationFile struct {
	ID             string  `json:"id"`
	TenantID       string  `json:"tenantId"`
	FileSpaceID    string  `json:"fileSpaceId"`
	Path           string  `json:"path"`
	CurrentVersion int     `json:"currentVersion"`
	SizeBytes      int64   `json:"sizeBytes"`
	SHA256         *string `json:"sha256"`
	MediaType      *string `json:"mediaType"`
	Deleted        bool    `json:"deleted"`
	CreatedUTC     string  `json:"createdUtc"`
	LastUpdateUTC  string  `json:"lastUpdateUtc"`
}

// ConversationFileVersion is an immutable version of a conversation file. RunID is nil for API writes.
type ConversationFileVersion struct {
	ID         string  `json:"id"`
	TenantID   string  `json:"tenantId"`
	FileID     string  `json:"fileId"`
	Number     int     `json:"number"`
	SizeBytes  int64   `json:"sizeBytes"`
	SHA256     *string `json:"sha256"`
	MediaType  *string `json:"mediaType"`
	RunID      *string `json:"runId"`
	LeaseEpoch int64   `json:"leaseEpoch"`
	WrittenBy  *string `json:"writtenBy"`
	StorageKey *string `json:"storageKey"`
	CreatedUTC string  `json:"createdUtc"`
}

// FileSpaceListing lists the files in a conversation or run file space. FileSpaceID is nil until the space exists.
type FileSpaceListing struct {
	FileSpaceID *string            `json:"fileSpaceId"`
	FileCount   int                `json:"fileCount"`
	TotalBytes  int64              `json:"totalBytes"`
	Files       []ConversationFile `json:"files"`
}

// FileSpaceUploadResult is the result of a file space write. Conflict is true when the base version was stale; Path is
// then the conflict name the content was written under.
type FileSpaceUploadResult struct {
	RequestedPath string  `json:"requestedPath"`
	Path          string  `json:"path"`
	Version       int     `json:"version"`
	Conflict      bool    `json:"conflict"`
	SHA256        *string `json:"sha256"`
}

// FileDownloadURL is a short-lived download-only URL; fetching it needs no credentials.
type FileDownloadURL struct {
	URL        string `json:"url"`
	ExpiresUTC string `json:"expiresUtc"`
}

// FileSpaceWriteOptions are optional write settings. BaseVersion nil overwrites unconditionally; 0 means the file must
// not exist yet; a stale value writes under a conflict name. MediaType empty sends none.
type FileSpaceWriteOptions struct {
	BaseVersion *int
	MediaType   string
}

type fileSpaceWriteRequest struct {
	Path          string  `json:"path"`
	Content       *string `json:"content,omitempty"`
	ContentBase64 *string `json:"contentBase64,omitempty"`
	MediaType     string  `json:"mediaType,omitempty"`
	BaseVersion   *int    `json:"baseVersion,omitempty"`
}

// FileSpacesClient reads and writes conversation file spaces. Every method takes the owner (FileSpaceOwnerConversations
// or FileSpaceOwnerRuns) and the conversation or run identifier. Errors: 400 InvalidFilePath, 404, 413 FileTooLarge,
// FileSpaceFull, or TooManyFiles.
type FileSpacesClient struct{ c *Client }

func (f *FileSpacesClient) files(owner, id string) (string, error) {
	if owner != FileSpaceOwnerConversations && owner != FileSpaceOwnerRuns {
		return "", fmt.Errorf("garrison: file space owner must be %q or %q, got %q", FileSpaceOwnerConversations, FileSpaceOwnerRuns, owner)
	}
	return f.c.TenantPath("/" + owner + "/" + url.PathEscape(id) + "/files"), nil
}

func pathQuery(path string, version int) url.Values {
	query := url.Values{"path": {path}}
	if version > 0 {
		query.Set("version", strconv.Itoa(version))
	}
	return query
}

// List lists the files in the space.
func (f *FileSpacesClient) List(ctx context.Context, owner, id string, includeDeleted bool) (*FileSpaceListing, error) {
	p, err := f.files(owner, id)
	if err != nil {
		return nil, err
	}
	var out FileSpaceListing
	if err := f.c.Do(ctx, http.MethodGet, p, url.Values{"includeDeleted": {strconv.FormatBool(includeDeleted)}}, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Read reads a file's content as bytes. version 0 reads the current version.
func (f *FileSpacesClient) Read(ctx context.Context, owner, id, path string, version int) ([]byte, error) {
	p, err := f.files(owner, id)
	if err != nil {
		return nil, err
	}
	response, err := f.c.send(ctx, http.MethodGet, p+"/content", pathQuery(path, version), nil, "", "")
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	return io.ReadAll(response.Body)
}

// Versions lists a file's versions, newest first.
func (f *FileSpacesClient) Versions(ctx context.Context, owner, id, path string) ([]ConversationFileVersion, error) {
	p, err := f.files(owner, id)
	if err != nil {
		return nil, err
	}
	var out []ConversationFileVersion
	if err := f.c.Do(ctx, http.MethodGet, p+"/versions", pathQuery(path, 0), nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func (f *FileSpacesClient) write(ctx context.Context, owner, id string, req fileSpaceWriteRequest) (*FileSpaceUploadResult, error) {
	p, err := f.files(owner, id)
	if err != nil {
		return nil, err
	}
	var out FileSpaceUploadResult
	if err := f.c.Do(ctx, http.MethodPost, p, nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// WriteText writes a text file. See FileSpaceWriteOptions for the base version rules.
func (f *FileSpacesClient) WriteText(ctx context.Context, owner, id, path, text string, opts FileSpaceWriteOptions) (*FileSpaceUploadResult, error) {
	return f.write(ctx, owner, id, fileSpaceWriteRequest{Path: path, Content: &text, MediaType: opts.MediaType, BaseVersion: opts.BaseVersion})
}

// WriteBytes writes a binary file, base64-encoded in a JSON body.
func (f *FileSpacesClient) WriteBytes(ctx context.Context, owner, id, path string, content []byte, opts FileSpaceWriteOptions) (*FileSpaceUploadResult, error) {
	encoded := base64.StdEncoding.EncodeToString(content)
	return f.write(ctx, owner, id, fileSpaceWriteRequest{Path: path, ContentBase64: &encoded, MediaType: opts.MediaType, BaseVersion: opts.BaseVersion})
}

// WriteRaw writes a file as a raw application/octet-stream body.
func (f *FileSpacesClient) WriteRaw(ctx context.Context, owner, id, path string, content []byte, opts FileSpaceWriteOptions) (*FileSpaceUploadResult, error) {
	p, err := f.files(owner, id)
	if err != nil {
		return nil, err
	}
	query := pathQuery(path, 0)
	if opts.MediaType != "" {
		query.Set("mediaType", opts.MediaType)
	}
	if opts.BaseVersion != nil {
		query.Set("baseVersion", strconv.Itoa(*opts.BaseVersion))
	}
	response, err := f.c.send(ctx, http.MethodPost, p, query, content, "application/octet-stream", "")
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	var out FileSpaceUploadResult
	if err := json.NewDecoder(response.Body).Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Delete deletes a file.
func (f *FileSpacesClient) Delete(ctx context.Context, owner, id, path string) error {
	p, err := f.files(owner, id)
	if err != nil {
		return err
	}
	return f.c.Do(ctx, http.MethodDelete, p, pathQuery(path, 0), nil, nil)
}

// DownloadURL issues a short-lived download-only URL that needs no credentials. version 0 means the current version.
func (f *FileSpacesClient) DownloadURL(ctx context.Context, owner, id, path string, version int) (*FileDownloadURL, error) {
	p, err := f.files(owner, id)
	if err != nil {
		return nil, err
	}
	var out FileDownloadURL
	if err := f.c.Do(ctx, http.MethodPost, p+"/download-url", pathQuery(path, version), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
