namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// Raised when a run cannot be compiled (missing references, template errors, disallowed secrets).
    /// </summary>
    public class CompilationException : Exception
    {
        /// <summary>
        /// Stable error code, for example TemplateRenderFailed or ReferenceNotFound.
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="code">Stable error code.</param>
        /// <param name="message">Message.</param>
        public CompilationException(string code, string message) : base(message)
        {
            Code = code ?? "CompileFailed";
        }

        /// <summary>
        /// Instantiate with an inner exception.
        /// </summary>
        /// <param name="code">Stable error code.</param>
        /// <param name="message">Message.</param>
        /// <param name="inner">Inner exception.</param>
        public CompilationException(string code, string message, Exception inner) : base(message, inner)
        {
            Code = code ?? "CompileFailed";
        }
    }
}
