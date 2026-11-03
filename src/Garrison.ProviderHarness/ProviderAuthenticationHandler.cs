namespace Garrison.ProviderHarness
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;

    /// <summary>Applies explicit inference authentication per request. Redirects are disabled to keep credentials at their configured origin.</summary>
    public class ProviderAuthenticationHandler : DelegatingHandler
    {
        private readonly ProviderAuthentication _Authentication;
        private readonly Dictionary<string, string> _Values;

        /// <summary>Construct a private provider transport with resolved credentials.</summary>
        /// <param name="authentication">Explicit scheme.</param><param name="values">Environment variable to secret value map; never logged.</param>
        public ProviderAuthenticationHandler(ProviderAuthentication authentication, Dictionary<string, string> values)
            : base(new HttpClientHandler { AllowAutoRedirect = false })
        {
            _Authentication = authentication;
            _Values = values;
        }

        /// <inheritdoc />
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            request.Headers.Authorization = null;
            InferenceAuthenticationTypeEnum type = _Authentication.Type;
            if (type == InferenceAuthenticationTypeEnum.BearerToken)
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Value(_Authentication.Bindings.Single()));
            else if (type == InferenceAuthenticationTypeEnum.Basic)
            {
                string username = Value(_Authentication.Bindings.Single(b => b.Name == "username"));
                string password = Value(_Authentication.Bindings.Single(b => b.Name == "password"));
                if (username.Contains(':')) throw new InvalidOperationException("Basic authentication username cannot contain a colon.");
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes(username + ":" + password)));
            }
            else if (type != InferenceAuthenticationTypeEnum.None)
            {
                List<string> query = new List<string>();
                foreach (ProviderAuthenticationBinding binding in _Authentication.Bindings)
                {
                    string value = Value(binding);
                    bool isQuery = type == InferenceAuthenticationTypeEnum.QueryString || (type == InferenceAuthenticationTypeEnum.ApiKey && binding.Location == InferenceCredentialLocationEnum.QueryString);
                    if (isQuery) query.Add(Uri.EscapeDataString(binding.Name) + "=" + Uri.EscapeDataString(value));
                    else
                    {
                        request.Headers.Remove(binding.Name);
                        if (!request.Headers.TryAddWithoutValidation(binding.Name, value)) throw new InvalidOperationException("The configured inference authentication header is invalid.");
                    }
                }
                if (query.Count > 0)
                {
                    UriBuilder builder = new UriBuilder(request.RequestUri!);
                    string existing = builder.Query.TrimStart('?');
                    builder.Query = (existing.Length > 0 ? existing + "&" : String.Empty) + String.Join("&", query);
                    request.RequestUri = builder.Uri;
                }
            }
            return base.SendAsync(request, cancellationToken);
        }

        /// <inheritdoc />
        protected override void Dispose(bool disposing) { base.Dispose(disposing); }

        private string Value(ProviderAuthenticationBinding binding)
        {
            string value = _Values[binding.ValueVariable];
            if (value.Contains('\r') || value.Contains('\n')) throw new InvalidOperationException("Inference authentication values cannot contain line breaks.");
            return value;
        }
    }
}
