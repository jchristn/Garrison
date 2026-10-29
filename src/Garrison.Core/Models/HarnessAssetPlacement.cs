namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Where a harness expects assets of one kind (AD2.3). Placements are data on the harness profile, so they can change
    /// without a release when a harness moves its skill directory (R-AD1).
    /// </summary>
    public class HarnessAssetPlacement
    {
        #region Public-Members

        /// <summary>
        /// Asset kind this placement applies to.
        /// </summary>
        public AgentAssetKindEnum Kind { get; set; } = AgentAssetKindEnum.ReferenceFile;

        /// <summary>
        /// Workspace-relative directory template for the asset's files. {{asset.name}} is replaced by the asset name, for
        /// example .claude/skills/{{asset.name}}. Must stay inside the workspace (no leading slash, no "..").
        /// </summary>
        public string PathTemplate
        {
            get
            {
                return _PathTemplate;
            }
            set
            {
                _PathTemplate = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether assets placed here are also listed in the system prompt through the builtin/agent-assets-instructions
        /// fragment, for harnesses that do not discover them on their own. Default true.
        /// </summary>
        public bool ListInSystemPrompt { get; set; } = true;

        #endregion

        #region Private-Members

        private string _PathTemplate = String.Empty;

        #endregion
    }
}
