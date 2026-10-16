namespace Garrison.Core.Helpers
{
    using System;
    using System.Security.Cryptography;
    using System.Text;
    using System.Text.RegularExpressions;
    using Garrison.Core.Models;
    using Garrison.Core.Serialization;

    /// <summary>Content-addressed prepared workspace identity. Mutable refs deliberately have no reusable prepared snapshot.</summary>
    public static class WorkspaceCacheKey
    {
        /// <summary>Return the tenant/template-version/immutable-commit key, or null for a branch or tag.</summary>
        /// <param name="tenantId">Tenant boundary.</param><param name="workspace">Workspace template.</param><param name="credential">Credential metadata, never its decrypted value.</param><returns>SHA-256 cache key or null.</returns>
        public static string? For(string tenantId, WorkspaceTemplate workspace, Secret? credential)
        {
            if (workspace.Kind != Garrison.Core.Enums.WorkspaceKindEnum.GitRepository || !Regex.IsMatch(workspace.GitRef ?? String.Empty, "\\A(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})\\z", RegexOptions.CultureInvariant)) return null;
            string identity = tenantId + "\n" + workspace.Id + "\n" + workspace.LastUpdateUtc.ToString("O") + "\n" + workspace.GitUrl + "\n" + workspace.GitRef!.ToLowerInvariant() + "\n" + workspace.GitDepth + "\n" + Serializer.Serialize(workspace.Files) + "\n" + credential?.Id + "\n" + credential?.LastUpdateUtc.ToString("O");
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(identity))).ToLowerInvariant();
        }
    }
}
