namespace Garrison.Core.Enums
{
    /// <summary>
    /// Kind of agent asset (AD2, AD-004).
    /// </summary>
    public enum AgentAssetKindEnum
    {
        /// <summary>
        /// A system prompt: a reference to a prompt template (AD-010). Has no files of its own.
        /// </summary>
        SystemPrompt,

        /// <summary>
        /// A skill: a directory of files, for example a Claude Code SKILL.md with supporting files.
        /// </summary>
        Skill,

        /// <summary>
        /// A reference file the agent reads, such as a style guide or a glossary.
        /// </summary>
        ReferenceFile,

        /// <summary>
        /// A document template, such as a .docx or .dotx reference document.
        /// </summary>
        DocumentTemplate
    }
}
