namespace Garrison.Core.Escalations
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;

    /// <summary>
    /// Validates escalations and answers (AA2) for every path that writes them: the MCP tools, REST, and the timeout sweep.
    /// Thread-safe.
    /// </summary>
    public static class EscalationValidator
    {
        #region Public-Members

        /// <summary>
        /// Most options one escalation offers: 20.
        /// </summary>
        public static readonly int MaxOptions = 20;

        /// <summary>
        /// Longest option key, in characters: 64.
        /// </summary>
        public static readonly int MaxOptionKeyLength = 64;

        /// <summary>
        /// Longest option label, in characters: 512.
        /// </summary>
        public static readonly int MaxOptionLabelLength = 512;

        /// <summary>
        /// Longest default answer, in characters: 4000.
        /// </summary>
        public static readonly int MaxDefaultAnswerLength = 4000;

        /// <summary>
        /// Longest answer text, in characters: 8000.
        /// </summary>
        public static readonly int MaxAnswerLength = 8000;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Validate an escalation before it is raised: question, options, default answer, timeout action, and the target's
        /// shape. Trims the question and option keys and renumbers options from list order.
        /// </summary>
        /// <param name="escalation">Escalation.</param>
        /// <param name="maxQuestionBytes">Most UTF-8 bytes in question plus context (Escalations.MaxQuestionBytes).</param>
        /// <exception cref="ArgumentNullException">Thrown when escalation is null.</exception>
        /// <exception cref="ValidationException">Thrown with field errors and codes when the escalation is invalid.</exception>
        public static void ValidateRaise(Escalation escalation, int maxQuestionBytes)
        {
            if (escalation == null) throw new ArgumentNullException(nameof(escalation));
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            escalation.Question = (escalation.Question ?? String.Empty).Trim();
            if (escalation.Question.Length == 0) errors["question"] = "A question is required.";
            int bytes = Encoding.UTF8.GetByteCount(escalation.Question) + Encoding.UTF8.GetByteCount(escalation.Context ?? String.Empty);
            if (bytes > maxQuestionBytes)
            {
                errors["question"] = "The question and context together are " + bytes + " bytes; Escalations.MaxQuestionBytes allows " + maxQuestionBytes + ".";
                codes["question"] = "TooLarge";
            }
            if (!Enum.IsDefined(escalation.Severity)) errors["severity"] = "severity is Info, Warning, or Urgent.";
            if (!Enum.IsDefined(escalation.Mode)) errors["mode"] = "mode is NonBlocking or Blocking.";
            if (!Enum.IsDefined(escalation.TimeoutAction)) errors["timeoutAction"] = "timeoutAction is UseDefaultAnswer, Cancel, or EscalateUp.";
            if (escalation.Options.Count > MaxOptions) errors["options"] = "An escalation offers at most " + MaxOptions + " options.";
            HashSet<string> keys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < escalation.Options.Count; i++)
            {
                EscalationOption option = escalation.Options[i];
                option.Key = (option.Key ?? String.Empty).Trim();
                option.Order = i;
                if (option.Key.Length == 0 || option.Key.Length > MaxOptionKeyLength) errors["options[" + i + "].key"] = "Option keys are 1 to " + MaxOptionKeyLength + " characters.";
                else if (!keys.Add(option.Key)) errors["options[" + i + "].key"] = "Option keys are unique within an escalation.";
                if (option.Label != null && option.Label.Length > MaxOptionLabelLength) errors["options[" + i + "].label"] = "Option labels are limited to " + MaxOptionLabelLength + " characters.";
            }
            if (escalation.DefaultAnswer != null)
            {
                escalation.DefaultAnswer = escalation.DefaultAnswer.Trim();
                if (escalation.DefaultAnswer.Length == 0) escalation.DefaultAnswer = null;
            }
            if (escalation.DefaultAnswer != null)
            {
                if (escalation.DefaultAnswer.Length > MaxDefaultAnswerLength) errors["defaultAnswer"] = "The default answer is limited to " + MaxDefaultAnswerLength + " characters.";
                else if (escalation.Options.Count > 0)
                {
                    EscalationOption? match = escalation.Options.FirstOrDefault(o => String.Equals(o.Key, escalation.DefaultAnswer, StringComparison.OrdinalIgnoreCase));
                    if (match == null)
                    {
                        errors["defaultAnswer"] = "With options, the default answer is one of their keys.";
                        codes["defaultAnswer"] = "UnknownOption";
                    }
                    else
                    {
                        escalation.DefaultAnswer = match.Key;
                    }
                }
            }
            if (escalation.TimeoutAction == EscalationTimeoutActionEnum.UseDefaultAnswer && escalation.DefaultAnswer == null)
            {
                errors["defaultAnswer"] = "The timeout action UseDefaultAnswer needs a default answer.";
                codes["defaultAnswer"] = "DefaultAnswerRequired";
            }
            Target(escalation.TargetKind, escalation.TargetId, "target", errors, codes);
            if (errors.Count > 0) throw new ValidationException("The escalation is invalid.", errors, codes);
        }

        /// <summary>
        /// Validate an answer against an escalation (AA-039). With options, the choice is required and is replaced with the
        /// option's stored key; without options, text is required. Trims both.
        /// </summary>
        /// <param name="escalation">Escalation being answered.</param>
        /// <param name="answer">Answer.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown with field errors and codes when the answer is invalid.</exception>
        public static void ValidateAnswer(Escalation escalation, EscalationAnswerRequest answer)
        {
            if (escalation == null) throw new ArgumentNullException(nameof(escalation));
            if (answer == null) throw new ArgumentNullException(nameof(answer));
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            answer.Choice = String.IsNullOrWhiteSpace(answer.Choice) ? null : answer.Choice.Trim();
            answer.Text = String.IsNullOrWhiteSpace(answer.Text) ? null : answer.Text.Trim();
            if (answer.Text != null && answer.Text.Length > MaxAnswerLength) errors["text"] = "The answer is limited to " + MaxAnswerLength + " characters.";
            if (escalation.Options.Count > 0)
            {
                if (answer.Choice == null)
                {
                    errors["choice"] = "Choose one of the escalation's options.";
                    codes["choice"] = "ChoiceRequired";
                }
                else
                {
                    EscalationOption? match = escalation.Options.FirstOrDefault(o => String.Equals(o.Key, answer.Choice, StringComparison.OrdinalIgnoreCase));
                    if (match == null)
                    {
                        errors["choice"] = "The choice is not one of the escalation's options (" + String.Join(", ", escalation.Options.Select(o => o.Key)) + ").";
                        codes["choice"] = "UnknownOption";
                    }
                    else
                    {
                        answer.Choice = match.Key;
                    }
                }
            }
            else
            {
                if (answer.Choice != null)
                {
                    errors["choice"] = "This escalation has no options; answer with text.";
                    codes["choice"] = "UnknownOption";
                }
                if (answer.Text == null)
                {
                    errors["text"] = "An answer is required.";
                    codes["text"] = "AnswerRequired";
                }
            }
            if (errors.Count > 0) throw new ValidationException("The answer is invalid.", errors, codes);
        }

        /// <summary>
        /// Check a target's shape: User, Role, and Agent need an identifier; Manager takes none.
        /// </summary>
        /// <param name="kind">Target kind.</param>
        /// <param name="id">Target identifier.</param>
        /// <param name="field">Field name prefix for errors (target, escalationTarget).</param>
        /// <param name="errors">Errors to add to.</param>
        /// <param name="codes">Codes to add to.</param>
        /// <exception cref="ArgumentNullException">Thrown when errors or codes is null.</exception>
        public static void Target(EscalationTargetKindEnum kind, string? id, string field, Dictionary<string, string> errors, Dictionary<string, string> codes)
        {
            if (errors == null) throw new ArgumentNullException(nameof(errors));
            if (codes == null) throw new ArgumentNullException(nameof(codes));
            if (!Enum.IsDefined(kind))
            {
                errors[field + "Kind"] = "The target kind is User, Role, Agent, or Manager.";
                return;
            }
            if (kind != EscalationTargetKindEnum.Manager && String.IsNullOrWhiteSpace(id))
            {
                errors[field + "Id"] = "A " + kind + " target needs an identifier.";
                codes[field + "Id"] = "TargetRequired";
            }
        }

        #endregion
    }
}
