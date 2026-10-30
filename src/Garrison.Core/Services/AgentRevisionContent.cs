namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// The content of an agent revision (AD1): snapshot an agent's definition into a revision, apply a revision back onto
    /// an agent for compilation, compute the content hash, and diff two revisions field by field. Stateless and
    /// thread-safe.
    /// </summary>
    public static class AgentRevisionContent
    {
        #region Public-Members

        /// <summary>
        /// Prompt pin role for the template that describes the agent as an MCP tool.
        /// </summary>
        public static readonly string ToolDescriptionRole = "ToolDescription";

        /// <summary>
        /// Prompt pin role for the template that describes the agent's A2A skills.
        /// </summary>
        public static readonly string SkillDescriptionRole = "SkillDescription";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build revision content from an agent's current fields. Identity, number, state, and authorship are left at
        /// their defaults except tenant and agent identifiers; the content hash is computed.
        /// </summary>
        /// <param name="agent">Agent.</param>
        /// <returns>Revision content.</returns>
        /// <exception cref="ArgumentNullException">Thrown when agent is null.</exception>
        public static AgentRevision FromAgent(Agent agent)
        {
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            AgentRevision revision = new AgentRevision();
            revision.TenantId = agent.TenantId;
            revision.AgentId = agent.Id;
            revision.DisplayName = agent.DisplayName;
            revision.Description = agent.Description;
            revision.InputMode = agent.InputMode;
            revision.InputSchemaJson = agent.InputSchemaJson;
            revision.OutputSchemaJson = agent.OutputSchemaJson;
            revision.DelegationMode = agent.DelegationMode;
            revision.DelegationMaxDepth = agent.DelegationMaxDepth;
            revision.DelegationAllowRecursion = agent.DelegationAllowRecursion;
            revision.DelegationAllowList = new List<string>(agent.DelegationAllowList);
            revision.Tags = new List<string>(agent.Tags);
            if (!String.IsNullOrEmpty(agent.ToolDescriptionTemplateId))
            {
                revision.PromptPins.Add(new AgentRevisionPromptPin { Role = ToolDescriptionRole, TemplateId = agent.ToolDescriptionTemplateId });
            }
            if (!String.IsNullOrEmpty(agent.SkillDescriptionTemplateId))
            {
                revision.PromptPins.Add(new AgentRevisionPromptPin { Role = SkillDescriptionRole, TemplateId = agent.SkillDescriptionTemplateId });
            }
            revision.ContentHash = ComputeHash(revision);
            return revision;
        }

        /// <summary>
        /// Copy a revision's content fields onto an agent. Fields a revision does not carry (name, kind, exposure, remote
        /// settings, skills) keep the agent's values. Used by the compiler to render a pinned revision.
        /// </summary>
        /// <param name="revision">Revision.</param>
        /// <param name="agent">Agent to overwrite (typically a copy read for one compilation).</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static void ApplyTo(AgentRevision revision, Agent agent)
        {
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            agent.DisplayName = revision.DisplayName;
            agent.Description = revision.Description;
            agent.InputMode = revision.InputMode;
            agent.InputSchemaJson = revision.InputSchemaJson;
            agent.OutputSchemaJson = revision.OutputSchemaJson;
            agent.DelegationMode = revision.DelegationMode;
            agent.DelegationMaxDepth = revision.DelegationMaxDepth;
            agent.DelegationAllowRecursion = revision.DelegationAllowRecursion;
            agent.DelegationAllowList = new List<string>(revision.DelegationAllowList);
            agent.Tags = new List<string>(revision.Tags);
            agent.ToolDescriptionTemplateId = revision.PromptPins.FirstOrDefault(p => String.Equals(p.Role, ToolDescriptionRole, StringComparison.Ordinal))?.TemplateId;
            agent.SkillDescriptionTemplateId = revision.PromptPins.FirstOrDefault(p => String.Equals(p.Role, SkillDescriptionRole, StringComparison.Ordinal))?.TemplateId;
        }

        /// <summary>
        /// Compute the content hash: SHA-256 (lowercase hex) of a canonical, line-oriented rendering of every content
        /// field. List order matters for prompt pins and is ignored for the allow list, asset pins, capabilities, and tags.
        /// </summary>
        /// <param name="revision">Revision.</param>
        /// <returns>Hash.</returns>
        /// <exception cref="ArgumentNullException">Thrown when revision is null.</exception>
        public static string ComputeHash(AgentRevision revision)
        {
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            StringBuilder canonical = new StringBuilder();
            foreach (KeyValuePair<string, string?> field in Scalars(revision)) canonical.Append(field.Key).Append('=').Append(Escape(field.Value)).Append('\n');
            foreach (string entry in Sorted(revision.DelegationAllowList)) canonical.Append("allow=").Append(Escape(entry)).Append('\n');
            foreach (string entry in revision.PromptPins.Select(PinText)) canonical.Append("prompt=").Append(Escape(entry)).Append('\n');
            foreach (string entry in Sorted(revision.AssetPins.Select(AssetText))) canonical.Append("asset=").Append(Escape(entry)).Append('\n');
            foreach (string entry in Sorted(revision.Capabilities)) canonical.Append("capability=").Append(Escape(entry)).Append('\n');
            foreach (string entry in Sorted(revision.Tags)) canonical.Append("tag=").Append(Escape(entry)).Append('\n');
            byte[] digest = SHA256.HashData(Encoding.UTF8.GetBytes(canonical.ToString()));
            return Convert.ToHexString(digest).ToLowerInvariant();
        }

        /// <summary>
        /// Field-level difference from one revision to another.
        /// </summary>
        /// <param name="from">Older revision.</param>
        /// <param name="to">Newer revision.</param>
        /// <returns>Diff.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static AgentRevisionDiff Diff(AgentRevision from, AgentRevision to)
        {
            if (from == null) throw new ArgumentNullException(nameof(from));
            if (to == null) throw new ArgumentNullException(nameof(to));
            AgentRevisionDiff diff = new AgentRevisionDiff();
            diff.AgentId = to.AgentId;
            diff.FromRevisionId = from.Id;
            diff.FromNumber = from.Number;
            diff.ToRevisionId = to.Id;
            diff.ToNumber = to.Number;

            Dictionary<string, string?> before = Scalars(from);
            foreach (KeyValuePair<string, string?> field in Scalars(to))
            {
                before.TryGetValue(field.Key, out string? old);
                if (!String.Equals(old, field.Value, StringComparison.Ordinal))
                {
                    diff.Changes.Add(new AgentRevisionChange { Field = field.Key, ChangeType = RevisionChangeTypeEnum.Changed, From = old, To = field.Value });
                }
            }
            ListChanges(diff.Changes, "delegationAllowList", from.DelegationAllowList, to.DelegationAllowList);
            ListChanges(diff.Changes, "promptPins", from.PromptPins.Select(PinText), to.PromptPins.Select(PinText));
            ListChanges(diff.Changes, "assetPins", from.AssetPins.Select(AssetText), to.AssetPins.Select(AssetText));
            ListChanges(diff.Changes, "capabilities", from.Capabilities, to.Capabilities);
            ListChanges(diff.Changes, "tags", from.Tags, to.Tags);
            diff.Identical = diff.Changes.Count == 0;
            return diff;
        }

        #endregion

        #region Private-Methods

        private static Dictionary<string, string?> Scalars(AgentRevision revision)
        {
            Dictionary<string, string?> fields = new Dictionary<string, string?>(StringComparer.Ordinal);
            fields["displayName"] = revision.DisplayName;
            fields["description"] = revision.Description;
            fields["inputMode"] = revision.InputMode.ToString();
            fields["inputSchema"] = revision.InputSchemaJson;
            fields["outputSchema"] = revision.OutputSchemaJson;
            fields["delegationMode"] = revision.DelegationMode.ToString();
            fields["delegationMaxDepth"] = revision.DelegationMaxDepth.ToString(CultureInfo.InvariantCulture);
            fields["delegationAllowRecursion"] = revision.DelegationAllowRecursion ? "true" : "false";
            return fields;
        }

        private static void ListChanges(List<AgentRevisionChange> changes, string field, IEnumerable<string> from, IEnumerable<string> to)
        {
            HashSet<string> before = new HashSet<string>(from, StringComparer.Ordinal);
            HashSet<string> after = new HashSet<string>(to, StringComparer.Ordinal);
            foreach (string removed in Sorted(before.Where(v => !after.Contains(v))))
            {
                changes.Add(new AgentRevisionChange { Field = field, ChangeType = RevisionChangeTypeEnum.Removed, From = removed });
            }
            foreach (string added in Sorted(after.Where(v => !before.Contains(v))))
            {
                changes.Add(new AgentRevisionChange { Field = field, ChangeType = RevisionChangeTypeEnum.Added, To = added });
            }
        }

        private static string PinText(AgentRevisionPromptPin pin)
        {
            return pin.Role + ":" + pin.TemplateId + (pin.PinnedVersion.HasValue ? "@" + pin.PinnedVersion.Value.ToString(CultureInfo.InvariantCulture) : String.Empty);
        }

        private static string AssetText(AgentRevisionAssetPin pin)
        {
            return pin.AssetId + (pin.Version.HasValue ? "@" + pin.Version.Value.ToString(CultureInfo.InvariantCulture) : String.Empty);
        }

        private static List<string> Sorted(IEnumerable<string> values)
        {
            List<string> list = values.ToList();
            list.Sort(StringComparer.Ordinal);
            return list;
        }

        private static string Escape(string? value)
        {
            if (value == null) return "\u0000";
            return value.Replace("\\", "\\\\", StringComparison.Ordinal).Replace("\n", "\\n", StringComparison.Ordinal);
        }

        #endregion
    }
}
