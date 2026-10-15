namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using System.Net;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using k8s;
    using k8s.Autorest;
    using k8s.Models;

    /// <summary>
    /// Ownership check for PersistentVolume workspaces (SR-09). A workspace template names a PersistentVolumeClaim, and
    /// the run namespace may also hold claims that belong to other tenants or to the platform (database backups, Loki,
    /// Tempo). Before a KubernetesJob run pod mounts a claim, the worker reads it and requires the label
    /// <see cref="TenantLabel"/> to equal the run's tenant identifier. Operators label each claim they hand to a tenant,
    /// for example <c>kubectl label pvc shared-repo garrison.io/tenant=ten_abc</c>. The worker needs <c>get</c> on
    /// persistentvolumeclaims in the run namespace. Thread-safe.
    /// </summary>
    public static class WorkspaceClaimGuard
    {
        #region Public-Members

        /// <summary>
        /// Label a PersistentVolumeClaim must carry, with the owning tenant's identifier as its value, before a run of that
        /// tenant may mount it: <c>garrison.io/tenant</c>.
        /// </summary>
        public static string TenantLabel
        {
            get
            {
                return "garrison.io/tenant";
            }
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Why a claim may not be mounted for a tenant, from the claim as read from the API.
        /// </summary>
        /// <param name="claim">Claim as read, or null when it does not exist.</param>
        /// <param name="claimName">Claim name from the run's workspace.</param>
        /// <param name="ns">Run namespace.</param>
        /// <param name="tenantId">Run's tenant identifier.</param>
        /// <returns>The reason, or null when the claim belongs to the tenant.</returns>
        /// <exception cref="ArgumentNullException">Thrown when claimName or tenantId is null or empty.</exception>
        public static string? Refusal(V1PersistentVolumeClaim? claim, string claimName, string ns, string tenantId)
        {
            if (String.IsNullOrEmpty(claimName)) throw new ArgumentNullException(nameof(claimName));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (claim == null) return "PersistentVolumeClaim " + claimName + " does not exist in namespace " + ns + ".";
            string? owner = null;
            IDictionary<string, string>? labels = claim.Metadata?.Labels;
            if (labels != null && labels.TryGetValue(TenantLabel, out string? value)) owner = value;
            if (String.IsNullOrEmpty(owner))
            {
                return "PersistentVolumeClaim " + claimName + " in namespace " + ns + " has no " + TenantLabel + " label, so no tenant may mount it. Label it with the owning tenant's identifier (" + TenantLabel + "=" + tenantId + ").";
            }
            if (!String.Equals(owner, tenantId, StringComparison.Ordinal))
            {
                return "PersistentVolumeClaim " + claimName + " in namespace " + ns + " belongs to another tenant (" + TenantLabel + " does not match this run's tenant).";
            }
            return null;
        }

        /// <summary>
        /// Read the run's workspace claim and decide whether the run may mount it. Runs without a PersistentVolume workspace
        /// pass without an API call.
        /// </summary>
        /// <param name="client">Kubernetes client.</param>
        /// <param name="ns">Run namespace.</param>
        /// <param name="spec">Run spec.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The reason the run must not start, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when client or spec is null.</exception>
        public static async Task<string?> CheckAsync(IKubernetes client, string ns, ExecutionSpec spec, CancellationToken token)
        {
            if (client == null) throw new ArgumentNullException(nameof(client));
            if (spec == null) throw new ArgumentNullException(nameof(spec));
            if (spec.Workspace == null || spec.Workspace.Kind != WorkspaceKindEnum.PersistentVolume) return null;
            string? claimName = spec.Workspace.PersistentVolumeClaim;
            if (String.IsNullOrWhiteSpace(claimName)) return "The run's PersistentVolume workspace names no PersistentVolumeClaim.";
            if (String.IsNullOrEmpty(spec.TenantId)) return "The run spec carries no tenant, so PersistentVolumeClaim " + claimName + " cannot be checked for ownership.";
            token.ThrowIfCancellationRequested();

            V1PersistentVolumeClaim? claim;
            try
            {
                claim = await client.CoreV1.ReadNamespacedPersistentVolumeClaimAsync(claimName, ns, cancellationToken: token).ConfigureAwait(false);
            }
            catch (HttpOperationException e) when (e.Response != null && e.Response.StatusCode == HttpStatusCode.NotFound)
            {
                claim = null;
            }
            catch (HttpOperationException e) when (e.Response != null && e.Response.StatusCode == HttpStatusCode.Forbidden)
            {
                return "The worker may not read PersistentVolumeClaim " + claimName + " in namespace " + ns + " to check its owner; grant the worker get on persistentvolumeclaims.";
            }
            catch (HttpRequestException e)
            {
                return "Reading PersistentVolumeClaim " + claimName + " to check its owner failed: " + e.Message;
            }
            return Refusal(claim, claimName, ns, spec.TenantId);
        }

        #endregion
    }
}
