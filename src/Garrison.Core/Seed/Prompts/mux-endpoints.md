{
  "endpoints": [
    {
      "name": "garrison",
      "adapterType": {{deployment.parameters.adapterType | default: "openai-compatible" | json}},
      "baseUrl": {{deployment.parameters.baseUrl | default: "https://api.openai.com/v1" | json}},
      "model": {{deployment.model | default: "gpt-4o-mini" | json}},
      "apiKey": "${GARRISON_MUX_API_KEY}",
      "isDefault": true,
      "timeoutMs": {{deployment.parameters.timeoutMs | default: "600000"}},
{{#if deployment.parameters.maxTokens}}
      "maxTokens": {{deployment.parameters.maxTokens}},
{{/if}}
      "autoApproveTools": true
    }
  ]
}
