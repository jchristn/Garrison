package garrison

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strconv"
)

// Agent asset kinds (AgentAsset.Kind).
const (
	AgentAssetKindSystemPrompt     = "SystemPrompt"
	AgentAssetKindSkill            = "Skill"
	AgentAssetKindReferenceFile    = "ReferenceFile"
	AgentAssetKindDocumentTemplate = "DocumentTemplate"
)

// AgentRevisionAssetPin pins an agent asset to a revision; Version nil follows the asset's current version.
type AgentRevisionAssetPin struct {
	AssetID string `json:"assetId"`
	Version *int   `json:"version,omitempty"`
}

// AgentAsset is a versioned system prompt, skill, reference file, or document template. PromptTemplateID is required
// for SystemPrompt assets. ArtifactStoreID nil stores files in the Garrison database. CurrentVersion 0 means none yet.
type AgentAsset struct {
	ID               string   `json:"id,omitempty"`
	TenantID         string   `json:"tenantId,omitempty"`
	Name             string   `json:"name"`
	Kind             string   `json:"kind"`
	Description      *string  `json:"description,omitempty"`
	PromptTemplateID *string  `json:"promptTemplateId,omitempty"`
	ArtifactStoreID  *string  `json:"artifactStoreId,omitempty"`
	CurrentVersion   int      `json:"currentVersion,omitempty"`
	Tags             []string `json:"tags,omitempty"`
	CreatedUTC       string   `json:"createdUtc,omitempty"`
	LastUpdateUTC    string   `json:"lastUpdateUtc,omitempty"`
}

// AgentAssetFile is one file in an asset version. SHA256 is lowercase hex; ContentBase64 is set only on upload.
type AgentAssetFile struct {
	Path          string  `json:"path"`
	MediaType     *string `json:"mediaType,omitempty"`
	SizeBytes     int64   `json:"sizeBytes,omitempty"`
	SHA256        string  `json:"sha256,omitempty"`
	StorageKey    string  `json:"storageKey,omitempty"`
	ContentBase64 string  `json:"contentBase64,omitempty"`
}

// AgentAssetVersion is an immutable version of an agent asset.
type AgentAssetVersion struct {
	ID         string           `json:"id"`
	TenantID   string           `json:"tenantId"`
	AssetID    string           `json:"assetId"`
	Number     int              `json:"number"`
	TotalBytes int64            `json:"totalBytes"`
	AuthorName *string          `json:"authorName,omitempty"`
	ChangeNote *string          `json:"changeNote,omitempty"`
	Files      []AgentAssetFile `json:"files"`
	CreatedUTC string           `json:"createdUtc"`
}

// AgentAssetUpload is one file to upload; Content is base64-encoded by UploadVersion. MediaType is optional.
type AgentAssetUpload struct {
	Path      string
	Content   []byte
	MediaType string
}

type agentAssetUploadFile struct {
	Path          string `json:"path"`
	MediaType     string `json:"mediaType,omitempty"`
	ContentBase64 string `json:"contentBase64"`
}

type agentAssetUploadRequest struct {
	ChangeNote string                 `json:"changeNote,omitempty"`
	Files      []agentAssetUploadFile `json:"files"`
}

// AgentAssetsClient manages agent assets, addressed by identifier or name, and their numbered versions.
type AgentAssetsClient struct{ c *Client }

func (a *AgentAssetsClient) base() string             { return a.c.TenantPath("/agent-assets") }
func (a *AgentAssetsClient) item(asset string) string { return a.base() + "/" + url.PathEscape(asset) }
func (a *AgentAssetsClient) version(asset string, number int) string {
	return a.item(asset) + "/versions/" + strconv.Itoa(number)
}

// List enumerates assets; kind (one of the AgentAssetKind constants) narrows it when not empty.
func (a *AgentAssetsClient) List(ctx context.Context, kind string, opts *ListOptions) (*EnumerationResult[AgentAsset], error) {
	query := opts.values()
	if kind != "" {
		query.Set("kind", kind)
	}
	var out EnumerationResult[AgentAsset]
	if err := a.c.Do(ctx, http.MethodGet, a.base(), query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create creates an asset. Upload its content with UploadVersion.
func (a *AgentAssetsClient) Create(ctx context.Context, asset AgentAsset) (*AgentAsset, error) {
	var out AgentAsset
	if err := a.c.Do(ctx, http.MethodPost, a.base(), nil, asset, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads one asset by identifier or name.
func (a *AgentAssetsClient) Get(ctx context.Context, asset string) (*AgentAsset, error) {
	var out AgentAsset
	if err := a.c.Do(ctx, http.MethodGet, a.item(asset), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Update replaces an asset's metadata.
func (a *AgentAssetsClient) Update(ctx context.Context, asset string, body AgentAsset) (*AgentAsset, error) {
	var out AgentAsset
	if err := a.c.Do(ctx, http.MethodPut, a.item(asset), nil, body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Delete deletes an asset. The server answers 409 with code AssetInUse while an agent revision pins it.
func (a *AgentAssetsClient) Delete(ctx context.Context, asset string) error {
	return a.c.Do(ctx, http.MethodDelete, a.item(asset), nil, nil, nil)
}

// ListVersions lists an asset's versions, newest first.
func (a *AgentAssetsClient) ListVersions(ctx context.Context, asset string) ([]AgentAssetVersion, error) {
	var out []AgentAssetVersion
	if err := a.c.Do(ctx, http.MethodGet, a.item(asset)+"/versions", nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// GetVersion reads one version by number.
func (a *AgentAssetsClient) GetVersion(ctx context.Context, asset string, number int) (*AgentAssetVersion, error) {
	var out AgentAssetVersion
	if err := a.c.Do(ctx, http.MethodGet, a.version(asset, number), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// UploadVersion uploads a new version, base64-encoding each file. changeNote is optional (empty sends none). When the
// files are identical to the current version the server returns the current version instead of creating one.
func (a *AgentAssetsClient) UploadVersion(ctx context.Context, asset string, files []AgentAssetUpload, changeNote string) (*AgentAssetVersion, error) {
	req := agentAssetUploadRequest{ChangeNote: changeNote, Files: make([]agentAssetUploadFile, 0, len(files))}
	for _, f := range files {
		req.Files = append(req.Files, agentAssetUploadFile{Path: f.Path, MediaType: f.MediaType, ContentBase64: base64.StdEncoding.EncodeToString(f.Content)})
	}
	var out AgentAssetVersion
	if err := a.c.Do(ctx, http.MethodPost, a.item(asset)+"/versions", nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// UploadRaw uploads a single-file version as raw bytes. mediaType and changeNote are optional.
func (a *AgentAssetsClient) UploadRaw(ctx context.Context, asset, path string, content []byte, mediaType, changeNote string) (*AgentAssetVersion, error) {
	query := url.Values{"path": {path}}
	if mediaType != "" {
		query.Set("mediaType", mediaType)
	}
	if changeNote != "" {
		query.Set("changeNote", changeNote)
	}
	response, err := a.c.send(ctx, http.MethodPost, a.item(asset)+"/versions", query, content, "application/octet-stream", "")
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	var out AgentAssetVersion
	if err := json.NewDecoder(response.Body).Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DownloadFile reads one file of a version as bytes.
func (a *AgentAssetsClient) DownloadFile(ctx context.Context, asset string, number int, path string) ([]byte, error) {
	response, err := a.c.send(ctx, http.MethodGet, a.version(asset, number)+"/files", url.Values{"path": {path}}, nil, "", "")
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	return io.ReadAll(response.Body)
}
