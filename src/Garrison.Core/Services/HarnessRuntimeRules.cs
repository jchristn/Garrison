namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Serialization;

    /// <summary>Resolves shared runtime settings without copying them into persisted deployments. Thread-safe.</summary>
    public static class HarnessRuntimeRules
    {
        /// <summary>Resolve a deployment against its referenced saved connection. Saved connection settings are authoritative.</summary>
        /// <param name="deployment">Stored deployment.</param><param name="profile">Referenced profile.</param><returns>Effective deployment; shared settings return an independent copy.</returns>
        public static Deployment Effective(Deployment deployment, HarnessProfile profile)
        {
            if (profile.RuntimeConfiguration == null) return deployment;
            Deployment effective = Serializer.Copy<Deployment>(deployment)!;
            HarnessRuntimeConfiguration runtime = profile.RuntimeConfiguration;
            effective.Model = runtime.Model;
            effective.InferenceEndpoint = runtime.InferenceEndpoint;
            effective.ResourceBindings.RemoveAll(b => b.Kind == ResourceBindingKindEnum.Secret && b.Alias == "credential");
            if (!String.IsNullOrEmpty(runtime.CredentialSecretId)) effective.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "credential", ResourceId = runtime.CredentialSecretId });
            effective.Parameters.RemoveAll(p => (profile.HarnessType == HarnessTypeEnum.Mux && p.Name == "endpoint") || (profile.HarnessType == HarnessTypeEnum.ProviderApi && new string[] { "baseUrl", "allowAnonymous", "provider" }.Contains(p.Name)));
            if (!String.IsNullOrEmpty(runtime.EndpointName)) effective.Parameters.Add(new DeploymentParameter { Name = "endpoint", Value = runtime.EndpointName });
            return effective;
        }

        /// <summary>Remove superseded inline connection fields before persisting a saved-profile reference.</summary>
        /// <param name="deployment">Deployment to normalize.</param><param name="profile">Selected profile.</param>
        public static void ClearOverrides(Deployment deployment, HarnessProfile profile)
        {
            if (profile.RuntimeConfiguration == null) return;
            deployment.Model = null;
            deployment.InferenceEndpoint = null;
            deployment.ResourceBindings.RemoveAll(b => b.Kind == ResourceBindingKindEnum.Secret && b.Alias == "credential");
            deployment.Parameters.RemoveAll(p => (profile.HarnessType == HarnessTypeEnum.Mux && p.Name == "endpoint") || (profile.HarnessType == HarnessTypeEnum.ProviderApi && new string[] { "baseUrl", "allowAnonymous", "provider" }.Contains(p.Name)));
        }

        /// <summary>Validate the connection shape and active tenant-local string secret references.</summary>
        /// <param name="database">Database.</param><param name="tenantId">Tenant.</param><param name="profile">Proposed profile.</param><param name="token">Cancellation.</param><param name="cache">Optional manifest reference overlay.</param><returns>Completion.</returns>
        /// <exception cref="ValidationException">Thrown with connection field errors when configuration or secret references are invalid.</exception>
        public static async Task ValidateAsync(DatabaseDriverBase database, string tenantId, HarnessProfile profile, CancellationToken token, ConfigurationReferenceCache? cache = null)
        {
            Dictionary<string, string> errors = Validate(profile);
            if (profile.RuntimeConfiguration != null)
            {
                Deployment effective = Effective(new Deployment(), profile);
                foreach (DeploymentResourceBinding binding in InferenceEndpointRules.Bindings(effective).Where(b => b.Kind == ResourceBindingKindEnum.Secret))
                {
                    Secret? secret = cache != null ? await cache.ReadAsync("Secret", binding.ResourceId, token).ConfigureAwait(false) as Secret : await database.Secrets.ReadAsync(tenantId, binding.ResourceId, token).ConfigureAwait(false);
                    if (secret?.Active != true) errors["runtimeConfiguration"] = "Connection credentials must reference active secrets in this tenant.";
                    else if (profile.RuntimeConfiguration.InferenceEndpoint != null && (secret.Kind == SecretKindEnum.GenericFile || secret.Kind == SecretKindEnum.CodexAuthJson)) errors["runtimeConfiguration"] = "HTTP credentials require string secrets, not CLI sign-in files.";
                }
            }
            if (errors.Any()) throw new ValidationException("The runtime connection is not valid.", errors);
        }

        /// <summary>Validate protocol-specific runtime fields.</summary>
        /// <param name="profile">Profile.</param><returns>Field errors.</returns>
        public static Dictionary<string, string> Validate(HarnessProfile profile)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();
            HarnessRuntimeConfiguration? runtime = profile.RuntimeConfiguration;
            if (runtime == null) return errors;
            if (runtime.Model?.Length > 512) errors["runtimeConfiguration.model"] = "Model names must be at most 512 characters.";
            if (runtime.EndpointName?.Length > 256) errors["runtimeConfiguration.endpointName"] = "Endpoint names must be at most 256 characters.";
            if (profile.HarnessType == HarnessTypeEnum.ProviderApi)
            {
                if (runtime.InferenceEndpoint == null) errors["runtimeConfiguration.inferenceEndpoint"] = "Configure the inference endpoint for this saved connection.";
                else foreach (KeyValuePair<string, string> error in InferenceEndpointRules.Validate(runtime.InferenceEndpoint)) errors["runtimeConfiguration." + error.Key] = error.Value;
                if (String.IsNullOrWhiteSpace(runtime.Model)) errors["runtimeConfiguration.model"] = "Choose a model served by this endpoint.";
                if (!String.IsNullOrEmpty(runtime.CredentialSecretId)) errors["runtimeConfiguration.credentialSecretId"] = "Configure HTTP authentication on the inference endpoint.";
            }
            else if (runtime.InferenceEndpoint != null) errors["runtimeConfiguration.inferenceEndpoint"] = "HTTP inference endpoints require a ProviderApi harness.";
            if (profile.HarnessType == HarnessTypeEnum.Mux)
            {
                if (String.IsNullOrWhiteSpace(runtime.EndpointName) || runtime.EndpointName.Contains("://")) errors["runtimeConfiguration.endpointName"] = "Choose the worker-configured Mux endpoint name.";
                if (!String.IsNullOrEmpty(runtime.Model) || !String.IsNullOrEmpty(runtime.CredentialSecretId)) errors["runtimeConfiguration"] = "Mux owns its model and credentials; configure only the endpoint name.";
            }
            else if (!String.IsNullOrEmpty(runtime.EndpointName)) errors["runtimeConfiguration.endpointName"] = "Named endpoints apply to Mux only.";
            return errors;
        }
    }
}
