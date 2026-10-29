namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A tool a harness can use when its host has it installed, such as pandoc. Workers run the probe (the executable with
    /// one version or help flag) and report the tool as the node label garrison.io/tool-{name}=true when it exits
    /// successfully; each probe becomes a HarnessBuiltIn capability. Not thread-safe.
    /// </summary>
    public class HarnessToolProbe
    {
        #region Public-Members

        /// <summary>
        /// The arguments the server accepts for a probe: --version, -version, -v, -V, version, --help, and -h.
        /// </summary>
        public static readonly IReadOnlyList<string> AllowedArguments = new List<string> { "--version", "-version", "-v", "-V", "version", "--help", "-h" };

        /// <summary>
        /// Tool name, used in the node label and the capability name: 1 to 63 lowercase letters, digits, dots, and
        /// hyphens, starting with a letter or digit. Never null.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Executable to look up on the worker's PATH: a bare file name of 1 to 128 letters, digits, dots, underscores,
        /// plus signs, and hyphens, with no directory part. Never null.
        /// </summary>
        public string Executable
        {
            get
            {
                return _Executable;
            }
            set
            {
                _Executable = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Arguments: at most one, from <see cref="AllowedArguments"/>. Default --version. Never null.
        /// </summary>
        public List<string> Arguments
        {
            get
            {
                return _Arguments;
            }
            set
            {
                _Arguments = value ?? new List<string>();
            }
        }

        /// <summary>
        /// What the tool does, shown in the capability catalog. The server accepts up to 1024 characters. Null when not
        /// set.
        /// </summary>
        public string? Description { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Name = String.Empty;
        private string _Executable = String.Empty;
        private List<string> _Arguments = new List<string> { "--version" };

        #endregion
    }
}
