namespace Garrison.FakeHarness
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// One isolation probe, parsed from <c>--probe "kind target [argument]"</c> or from a prompt line
    /// <c>probe kind target [argument]</c> (with <c>--probe-prompt</c>). Kinds:
    /// <list type="bullet">
    /// <item><c>read path</c>: read a file; <c>*</c> and <c>?</c> in any path segment match every entry there.</item>
    /// <item><c>list directory</c>: list a directory's entries.</item>
    /// <item><c>env NAME</c>: whether this process has the variable (a trailing <c>*</c> matches a prefix).</item>
    /// <item><c>proc-env NAME</c>: whether any readable <c>/proc/*/environ</c> has the variable (Linux).</item>
    /// <item><c>connect host:port</c>: open a TCP connection.</item>
    /// <item><c>http url</c>: GET the URL, with the Kubernetes service account token when one is mounted.</item>
    /// <item><c>marker name text</c>: write text to a file of that plain name in the working directory.</item>
    /// <item><c>hold milliseconds</c>: wait, so another run can probe while this one is alive.</item>
    /// </list>
    /// </summary>
    public class FakeProbe
    {
        #region Public-Members

        /// <summary>
        /// Every probe kind, lower case.
        /// </summary>
        public static readonly IReadOnlyList<string> Kinds = new List<string> { "read", "list", "env", "proc-env", "connect", "http", "marker", "hold" };

        /// <summary>
        /// Prefix of a probe line in the prompt (case-insensitive).
        /// </summary>
        public static readonly string PromptPrefix = "probe ";

        /// <summary>
        /// Probe kind, lower case; one of <see cref="Kinds"/>.
        /// </summary>
        public string Kind
        {
            get
            {
                return _Kind;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value)) throw new ArgumentNullException(nameof(Kind));
                string kind = value.Trim().ToLowerInvariant();
                if (!Kinds.Contains(kind)) throw new ArgumentException("Unknown probe kind '" + value + "'. Kinds: " + String.Join(", ", Kinds) + ".", nameof(Kind));
                _Kind = kind;
            }
        }

        /// <summary>
        /// Target: a path, a variable name, host:port, a URL, a marker file name, or milliseconds. Never empty.
        /// </summary>
        public string Target
        {
            get
            {
                return _Target;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value)) throw new ArgumentNullException(nameof(Target));
                _Target = value.Trim();
            }
        }

        /// <summary>
        /// Extra argument: the text of a marker probe; null for other kinds.
        /// </summary>
        public string? Argument { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Kind = "read";
        private string _Target = ".";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public FakeProbe()
        {
        }

        /// <summary>
        /// Instantiate with values.
        /// </summary>
        /// <param name="kind">Kind; one of <see cref="Kinds"/>.</param>
        /// <param name="target">Target.</param>
        /// <param name="argument">Argument, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when kind or target is empty.</exception>
        /// <exception cref="ArgumentException">Thrown when kind is not a known probe kind.</exception>
        public FakeProbe(string kind, string target, string? argument)
        {
            Kind = kind;
            Target = target;
            Argument = argument;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parse one probe: <c>kind target [argument]</c>, optionally preceded by <c>probe </c>. The marker kind needs an
        /// argument (its text, the rest of the line); the other kinds take everything after the kind as the target.
        /// </summary>
        /// <param name="text">Text.</param>
        /// <param name="probe">Parsed probe, or null.</param>
        /// <param name="error">Why the text is not a probe, or null.</param>
        /// <returns>True when parsed.</returns>
        public static bool TryParse(string? text, out FakeProbe? probe, out string? error)
        {
            probe = null;
            error = null;
            string line = (text ?? String.Empty).Trim();
            if (line.StartsWith(PromptPrefix, StringComparison.OrdinalIgnoreCase)) line = line.Substring(PromptPrefix.Length).Trim();
            if (line.Length == 0)
            {
                error = "Empty probe.";
                return false;
            }

            int space = line.IndexOf(' ');
            string kind = (space < 0 ? line : line.Substring(0, space)).ToLowerInvariant();
            string rest = space < 0 ? String.Empty : line.Substring(space + 1).Trim();
            if (!Kinds.Contains(kind))
            {
                error = "Unknown probe kind '" + kind + "'. Kinds: " + String.Join(", ", Kinds) + ".";
                return false;
            }
            if (rest.Length == 0)
            {
                error = "Probe '" + kind + "' needs a target.";
                return false;
            }

            string target = rest;
            string? argument = null;
            if (kind == "marker")
            {
                int split = rest.IndexOf(' ');
                if (split < 0)
                {
                    error = "Probe 'marker' needs a file name and text.";
                    return false;
                }
                target = rest.Substring(0, split);
                argument = rest.Substring(split + 1).Trim();
            }

            probe = new FakeProbe(kind, target, argument);
            return true;
        }

        /// <summary>
        /// The probe lines of a prompt: lines that start with <c>probe </c> (case-insensitive, after leading
        /// whitespace). Other lines are ignored, so the probes survive a prompt template wrapped around them.
        /// </summary>
        /// <param name="prompt">Prompt text, or null.</param>
        /// <returns>Probe lines, in order.</returns>
        public static List<string> PromptLines(string? prompt)
        {
            List<string> lines = new List<string>();
            if (String.IsNullOrEmpty(prompt)) return lines;
            foreach (string raw in prompt.Split('\n'))
            {
                string line = raw.Trim();
                if (line.StartsWith(PromptPrefix, StringComparison.OrdinalIgnoreCase)) lines.Add(line);
            }
            return lines;
        }

        #endregion
    }
}
