namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;

    /// <summary>
    /// A tool a harness can use when its host has it installed, such as pandoc or LibreOffice (AD4.4). Workers run the
    /// probe (the executable with one version or help flag) and report the tool as the node label
    /// garrison.io/tool-{name}=true when it exits successfully. Probes run on the worker host outside any run, so they
    /// are restricted to a bare executable name found on the PATH and one of a fixed set of version or help flags; they
    /// can report a tool but cannot do anything else (AD-033).
    /// </summary>
    public class HarnessToolProbe
    {
        #region Public-Members

        /// <summary>
        /// Tool name, used in the node label and the capability name: 1 to 63 lowercase letters, digits, dots, and
        /// hyphens, starting with a letter or digit.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the name does not match.</exception>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                if (value == null || !_NamePattern.IsMatch(value)) throw new ArgumentException("A tool probe name is 1 to 63 lowercase letters, digits, dots, and hyphens, starting with a letter or digit.", nameof(Name));
                _Name = value;
            }
        }

        /// <summary>
        /// Executable to look up on the worker's PATH: a bare file name of 1 to 128 letters, digits, dots, underscores,
        /// plus signs, and hyphens, with no directory part.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the executable is not a bare file name.</exception>
        public string Executable
        {
            get
            {
                return _Executable;
            }
            set
            {
                if (value == null || !_ExecutablePattern.IsMatch(value)) throw new ArgumentException("A tool probe executable is a bare file name on the PATH (letters, digits, '.', '_', '+', '-'), with no directory part.", nameof(Executable));
                _Executable = value;
            }
        }

        /// <summary>
        /// Arguments: at most one, from --version, -version, -v, -V, version, --help, and -h. Default --version.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when there is more than one argument or an argument is not allowed.</exception>
        public List<string> Arguments
        {
            get
            {
                return _Arguments;
            }
            set
            {
                List<string> list = value ?? new List<string>();
                if (list.Count > 1 || list.Any(a => !AllowedArguments.Contains(a, StringComparer.Ordinal)))
                    throw new ArgumentException("A tool probe takes at most one argument, from " + String.Join(", ", AllowedArguments) + ".", nameof(Arguments));
                _Arguments = list;
            }
        }

        /// <summary>
        /// What the tool does, shown in the capability catalog. Up to 1024 characters. Null when not set.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the description is longer than 1024 characters.</exception>
        public string? Description
        {
            get
            {
                return _Description;
            }
            set
            {
                if (value != null && value.Length > 1024) throw new ArgumentException("A tool probe description is at most 1024 characters.", nameof(Description));
                _Description = String.IsNullOrWhiteSpace(value) ? null : value;
            }
        }

        /// <summary>
        /// The arguments a probe may pass.
        /// </summary>
        public static readonly IReadOnlyList<string> AllowedArguments = new List<string> { "--version", "-version", "-v", "-V", "version", "--help", "-h" };

        #endregion

        #region Private-Members

        private static readonly Regex _NamePattern = new Regex("^[a-z0-9][a-z0-9.-]{0,62}$", RegexOptions.CultureInvariant);
        private static readonly Regex _ExecutablePattern = new Regex("^[A-Za-z0-9][A-Za-z0-9._+-]{0,127}$", RegexOptions.CultureInvariant);
        private string _Name = "tool";
        private string _Executable = "tool";
        private List<string> _Arguments = new List<string> { "--version" };
        private string? _Description = null;

        #endregion
    }
}
