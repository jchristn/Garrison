namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Kind of agent asset.
    /// </summary>
    public enum AgentAssetKindEnum
    {
        /// <summary>
        /// SystemPrompt: a system prompt backed by a prompt template (promptTemplateId is required).
        /// </summary>
        SystemPrompt,

        /// <summary>
        /// Skill: a skill directory, for example a SKILL.md with supporting files.
        /// </summary>
        Skill,

        /// <summary>
        /// ReferenceFile: reference material placed in the workspace.
        /// </summary>
        ReferenceFile,

        /// <summary>
        /// DocumentTemplate: a document template placed in the workspace.
        /// </summary>
        DocumentTemplate
    }
}
