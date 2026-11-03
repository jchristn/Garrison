package garrison

// InferenceCredential references an encrypted tenant secret; values are never returned with endpoint configuration.
type InferenceCredential struct {
	Name     string `json:"name"`
	Location string `json:"location"` // Header or QueryString.
	SecretID string `json:"secretId"`
}

// InferenceEndpoint selects an HTTP protocol independently of its authentication scheme.
type InferenceEndpoint struct {
	Protocol           string                `json:"protocol"` // OpenAiCompatible or Ollama.
	BaseURL            string                `json:"baseUrl"`
	AuthenticationType string                `json:"authenticationType"` // None, BearerToken, ApiKey, Headers, QueryString, Basic.
	Credentials        []InferenceCredential `json:"credentials"`
}
