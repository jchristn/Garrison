namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Compilation;

    /// <summary>
    /// Substitutes the worker-side placeholders emitted by the invocation compiler ($GARRISON_CONFIG_DIR,
    /// $GARRISON_WORKSPACE_DIR, $GARRISON_HOME_DIR) with absolute paths. Thread-safe after construction.
    /// </summary>
    public class PlaceholderResolver
    {
        #region Public-Members

        /// <summary>
        /// Config directory token.
        /// </summary>
        public static readonly string ConfigToken = "$GARRISON_CONFIG_DIR";

        /// <summary>
        /// Workspace directory token.
        /// </summary>
        public static readonly string WorkspaceToken = "$GARRISON_WORKSPACE_DIR";

        /// <summary>
        /// Home directory token.
        /// </summary>
        public static readonly string HomeToken = "$GARRISON_HOME_DIR";

        #endregion

        #region Private-Members

        private readonly RunDirectories _Directories;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="directories">Run directories.</param>
        /// <exception cref="ArgumentNullException">Thrown when directories is null.</exception>
        public PlaceholderResolver(RunDirectories directories)
        {
            _Directories = directories ?? throw new ArgumentNullException(nameof(directories));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Resolve placeholders in a string.
        /// </summary>
        /// <param name="text">Text.</param>
        /// <returns>Resolved text.</returns>
        public string? Resolve(string? text)
        {
            if (String.IsNullOrEmpty(text) || text.IndexOf("$GARRISON_", StringComparison.Ordinal) < 0) return text;
            return text
                .Replace(WorkspaceToken, _Directories.Workspace, StringComparison.Ordinal)
                .Replace(ConfigToken, _Directories.Config, StringComparison.Ordinal)
                .Replace(HomeToken, _Directories.Home, StringComparison.Ordinal);
        }

        /// <summary>
        /// Resolve placeholders across a spec in place: executable, arguments, environment values, file paths and
        /// contents, result file name, stdin, and workspace seeded files.
        /// </summary>
        /// <param name="spec">Spec.</param>
        /// <exception cref="ArgumentNullException">Thrown when spec is null.</exception>
        public void ResolveSpec(ExecutionSpec spec)
        {
            if (spec == null) throw new ArgumentNullException(nameof(spec));
            spec.Executable = Resolve(spec.Executable) ?? String.Empty;
            List<string> arguments = new List<string>();
            foreach (string argument in spec.Arguments) arguments.Add(Resolve(argument) ?? String.Empty);
            spec.Arguments = arguments;
            foreach (ExecutionEnvironmentVariable variable in spec.Environment) variable.Value = Resolve(variable.Value) ?? String.Empty;
            foreach (ExecutionFile file in spec.Files)
            {
                // Asset files (AD2.4) are binary and keep their exact bytes and workspace-relative paths.
                if (file.ContentBase64 != null) continue;
                file.Path = Resolve(file.Path) ?? String.Empty;
                file.Content = Resolve(file.Content) ?? String.Empty;
            }
            spec.ResultFileName = Resolve(spec.ResultFileName);
            spec.Stdin = Resolve(spec.Stdin);
            foreach (ExecutionWorkspaceFile file in spec.Workspace.Files) file.Content = Resolve(file.Content) ?? String.Empty;
        }

        #endregion
    }
}
