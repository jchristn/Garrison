namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Shared structural validation and secret references for inference endpoints. Thread-safe.</summary>
    public static class InferenceEndpointRules
    {
        /// <summary>All deployment secret/MCP bindings, including inference authentication secrets.</summary>
        /// <param name="deployment">Deployment.</param><returns>Independent binding list.</returns>
        public static List<DeploymentResourceBinding> Bindings(Deployment deployment)
        {
            List<DeploymentResourceBinding> bindings = new List<DeploymentResourceBinding>(deployment.ResourceBindings);
            if (deployment.InferenceEndpoint != null)
                for (int i = 0; i < deployment.InferenceEndpoint.Credentials.Count; i++)
                    bindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "inference_auth_" + i, ResourceId = deployment.InferenceEndpoint.Credentials[i].SecretId });
            return bindings;
        }

        /// <summary>Validate protocol, URL, explicit auth scheme and named credential references.</summary>
        /// <param name="endpoint">Endpoint.</param><returns>Field errors, empty when valid.</returns>
        public static Dictionary<string, string> Validate(InferenceEndpoint endpoint)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();
            if (!Enum.IsDefined(endpoint.Protocol)) errors["inferenceEndpoint.protocol"] = "Choose OpenAiCompatible or Ollama.";
            if (!Uri.TryCreate(endpoint.BaseUrl, UriKind.Absolute, out Uri? uri) || (uri.Scheme != "http" && uri.Scheme != "https") || uri.UserInfo.Length > 0 || uri.Query.Length > 0 || uri.Fragment.Length > 0)
                errors["inferenceEndpoint.baseUrl"] = "Enter an HTTP or HTTPS base URL without credentials, query parameters, or a fragment. Configure credentials separately.";
            if (!Enum.IsDefined(endpoint.AuthenticationType)) errors["inferenceEndpoint.authenticationType"] = "Choose a supported authentication type.";
            int count = endpoint.Credentials.Count;
            InferenceAuthenticationTypeEnum type = endpoint.AuthenticationType;
            if ((type == InferenceAuthenticationTypeEnum.None && count != 0) || ((type == InferenceAuthenticationTypeEnum.BearerToken || type == InferenceAuthenticationTypeEnum.ApiKey) && count != 1) || ((type == InferenceAuthenticationTypeEnum.Headers || type == InferenceAuthenticationTypeEnum.QueryString) && (count < 1 || count > 32)) || (type == InferenceAuthenticationTypeEnum.Basic && count != 2))
                errors["inferenceEndpoint.credentials"] = "None requires no credentials; BearerToken and ApiKey require one; Headers and QueryString require 1 to 32; Basic requires username and password.";
            HashSet<string> names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < count; i++)
            {
                InferenceCredential c = endpoint.Credentials[i];
                string field = "inferenceEndpoint.credentials[" + i + "]";
                if (c == null) { errors[field] = "A credential entry is required."; continue; }
                if (String.IsNullOrWhiteSpace(c.SecretId)) errors[field + ".secretId"] = "Choose an active tenant secret for this value.";
                if (!Enum.IsDefined(c.Location)) errors[field + ".location"] = "Choose Header or QueryString.";
                bool header = type == InferenceAuthenticationTypeEnum.Headers || (type == InferenceAuthenticationTypeEnum.ApiKey && c.Location == InferenceCredentialLocationEnum.Header);
                bool query = type == InferenceAuthenticationTypeEnum.QueryString || (type == InferenceAuthenticationTypeEnum.ApiKey && c.Location == InferenceCredentialLocationEnum.QueryString);
                if ((header || query) && (String.IsNullOrWhiteSpace(c.Name) || c.Name.Length > 256 || c.Name.Any(Char.IsControl))) errors[field + ".name"] = "Give the header or query parameter name, at most 256 characters.";
                if (header && (!Regex.IsMatch(c.Name ?? String.Empty, @"^[!#$%&'*+.^_`|~0-9A-Za-z-]+$") || new string[] { "Host", "Content-Length", "Connection", "Transfer-Encoding" }.Contains(c.Name, StringComparer.OrdinalIgnoreCase))) errors[field + ".name"] = "Use a valid authentication header name, not a transport header.";
                if ((header || query) && !names.Add((query ? "QueryString" : "Header") + ":" + c.Name)) errors[field + ".name"] = "Credential names must be unique.";
            }
            if (type == InferenceAuthenticationTypeEnum.Basic && (!endpoint.Credentials.Any(c => c != null && c.Name == "username") || !endpoint.Credentials.Any(c => c != null && c.Name == "password"))) errors["inferenceEndpoint.credentials"] = "Basic authentication requires credentials named username and password.";
            return errors;
        }
    }
}
