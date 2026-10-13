package garrison

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strconv"
)

// ArtifactsClient provides metadata, binary downloads, signed links, and active-run uploads.
type ArtifactsClient struct{ c *Client }

func (a *ArtifactsClient) base() string          { return a.c.TenantPath("/artifacts") }
func (a *ArtifactsClient) item(id string) string { return a.base() + "/" + url.PathEscape(id) }

// List enumerates metadata, optionally filtered by runId and storeId.
func (a *ArtifactsClient) List(ctx context.Context, query url.Values) (*EnumerationResult[Artifact], error) {
	var result EnumerationResult[Artifact]
	err := a.c.Do(ctx, http.MethodGet, a.base(), query, nil, &result)
	return &result, err
}

// Get reads metadata without file bytes.
func (a *ArtifactsClient) Get(ctx context.Context, id string) (*Artifact, error) {
	var result Artifact
	err := a.c.Do(ctx, http.MethodGet, a.item(id), nil, nil, &result)
	return &result, err
}

// Download reads authenticated file bytes.
func (a *ArtifactsClient) Download(ctx context.Context, id string) ([]byte, error) {
	response, err := a.c.send(ctx, http.MethodGet, a.item(id)+"/content", nil, nil, "", "application/octet-stream")
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	return io.ReadAll(response.Body)
}

// DownloadURL returns a short-lived download-only link.
func (a *ArtifactsClient) DownloadURL(ctx context.Context, id string) (*ArtifactDownload, error) {
	var result ArtifactDownload
	err := a.c.Do(ctx, http.MethodPost, a.item(id)+"/download-url", nil, nil, &result)
	return &result, err
}

// Delete removes content and metadata.
func (a *ArtifactsClient) Delete(ctx context.Context, id string) error {
	return a.c.Do(ctx, http.MethodDelete, a.item(id), nil, nil, nil)
}

// Upload requires an active run epoch, repair phase, and a deployment-selected store/name.
func (a *ArtifactsClient) Upload(ctx context.Context, runID, storeID, name string, content []byte, epoch int64, repairAttempt int, mediaType string) (*Artifact, error) {
	if mediaType == "" {
		mediaType = "application/octet-stream"
	}
	query := url.Values{"storeId": {storeID}, "name": {name}, "epoch": {strconv.FormatInt(epoch, 10)}, "repairAttempt": {strconv.Itoa(repairAttempt)}, "mediaType": {mediaType}}
	response, err := a.c.send(ctx, http.MethodPost, a.c.TenantPath("/runs/"+url.PathEscape(runID)+"/artifacts"), query, content, "application/octet-stream", "")
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	var result Artifact
	err = json.NewDecoder(response.Body).Decode(&result)
	return &result, err
}
