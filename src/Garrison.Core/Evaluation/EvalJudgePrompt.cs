namespace Garrison.Core.Evaluation
{
    using System;
    using System.Collections.Generic;
    using System.Security.Cryptography;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Renders the judge run's input from builtin/eval-judge (AA9.4, AA-025): the check's criteria, then the input, the
    /// reference, and the answer as data between begin and end lines that carry a random marker, so text inside them
    /// cannot fake its own end. Exposes judge.boundary, judge.criteria, judge.input, judge.reference, judge.hasReference,
    /// and judge.output. Thread-safe.
    /// </summary>
    public static class EvalJudgePrompt
    {
        #region Public-Members

        /// <summary>
        /// Name of the built-in template (builtin/eval-judge); a tenant Task template with this name replaces it.
        /// </summary>
        public static readonly string TemplateName = "eval-judge";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Render the judge prompt.
        /// </summary>
        /// <param name="template">Resolved eval-judge template.</param>
        /// <param name="request">What is graded.</param>
        /// <returns>The judge run's input.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="TemplateException">Thrown when the template does not render.</exception>
        public static string Render(PromptTemplate template, EvalScoreRequest request)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
            if (request == null) throw new ArgumentNullException(nameof(request));
            string boundary = Convert.ToHexString(RandomNumberGenerator.GetBytes(8)).ToLowerInvariant();
            Dictionary<string, object?> judge = TemplateContext.NewMap();
            judge["boundary"] = boundary;
            judge["criteria"] = String.IsNullOrWhiteSpace(request.Argument) ? null : request.Argument;
            judge["input"] = request.Input;
            judge["reference"] = request.Reference;
            judge["hasReference"] = !String.IsNullOrEmpty(request.Reference);
            judge["output"] = request.Output ?? String.Empty;
            TemplateContext context = new TemplateContext();
            context.Set("judge", judge);
            context.Set("now", DateTime.UtcNow);
            return TemplateRenderer.Render(template.Content, context, new TemplateRenderOptions { TemplateName = template.Name, AllowSecrets = false }).Trim();
        }

        #endregion
    }
}
