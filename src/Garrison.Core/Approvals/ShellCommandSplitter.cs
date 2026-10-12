namespace Garrison.Core.Approvals
{
    using System;
    using System.Text;

    /// <summary>
    /// Splits a shell command line on the operators that start another command (<c>;</c>, <c>&amp;&amp;</c>,
    /// <c>||</c>, <c>|</c>, <c>|&amp;</c>, <c>&amp;</c>, and new lines) while respecting single quotes, double quotes, and
    /// backslash escapes, and notes command or process substitution (P12.3, the Armada matcher semantics in D-025).
    /// Redirections such as <c>2&gt;&amp;1</c>, <c>&amp;&gt;</c>, and <c>&gt;|</c> are not split. Variable expansion
    /// (<c>$VAR</c>, <c>${VAR}</c>) is not treated as substitution. Thread-safe (stateless).
    /// </summary>
    public static class ShellCommandSplitter
    {
        #region Public-Methods

        /// <summary>
        /// Split a command line.
        /// </summary>
        /// <param name="line">Command line; null is treated as empty.</param>
        /// <returns>Result; never null.</returns>
        public static ShellSplitResult Split(string? line)
        {
            ShellSplitResult result = new ShellSplitResult();
            if (String.IsNullOrEmpty(line)) return result;

            StringBuilder current = new StringBuilder();
            bool inSingle = false;
            bool inDouble = false;
            int i = 0;
            while (i < line.Length)
            {
                char c = line[i];
                char next = i + 1 < line.Length ? line[i + 1] : '\0';
                char previous = i > 0 ? line[i - 1] : '\0';

                if (inSingle)
                {
                    current.Append(c);
                    if (c == '\'') inSingle = false;
                    i++;
                    continue;
                }

                if (c == '\\' && i + 1 < line.Length)
                {
                    current.Append(c);
                    current.Append(next);
                    i += 2;
                    continue;
                }

                if (inDouble)
                {
                    if (c == '`' || (c == '$' && next == '(')) result.HasSubstitution = true;
                    if (c == '"') inDouble = false;
                    current.Append(c);
                    i++;
                    continue;
                }

                if (c == '\'')
                {
                    inSingle = true;
                    current.Append(c);
                    i++;
                    continue;
                }
                if (c == '"')
                {
                    inDouble = true;
                    current.Append(c);
                    i++;
                    continue;
                }
                if (c == '`' || (c == '$' && next == '(') || ((c == '<' || c == '>') && next == '('))
                {
                    result.HasSubstitution = true;
                    current.Append(c);
                    i++;
                    continue;
                }
                if (c == '\n' || c == '\r' || c == ';')
                {
                    Flush(result, current);
                    i++;
                    continue;
                }
                if (c == '&')
                {
                    if (previous == '>' || previous == '<' || next == '>')
                    {
                        current.Append(c);
                        i++;
                        continue;
                    }
                    Flush(result, current);
                    i += next == '&' ? 2 : 1;
                    continue;
                }
                if (c == '|')
                {
                    if (previous == '>')
                    {
                        current.Append(c);
                        i++;
                        continue;
                    }
                    Flush(result, current);
                    i += (next == '|' || next == '&') ? 2 : 1;
                    continue;
                }

                current.Append(c);
                i++;
            }

            if (inSingle || inDouble) result.Unbalanced = true;
            Flush(result, current);
            return result;
        }

        #endregion

        #region Private-Methods

        private static void Flush(ShellSplitResult result, StringBuilder current)
        {
            string command = current.ToString().Trim();
            current.Clear();
            if (command.Length > 0) result.Commands.Add(command);
        }

        #endregion
    }
}
