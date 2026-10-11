namespace Garrison.Worker
{
    /// <summary>
    /// Application entry point.
    /// </summary>
    public static class Program
    {
        /// <summary>
        /// Main entry point.
        /// </summary>
        /// <param name="args">Command-line arguments: run-one --spec &lt;path&gt; runs a single run inside a run pod; otherwise the first may be the settings file path.</param>
        /// <returns>Exit code.</returns>
        public static int Main(string[] args)
        {
            if (Garrison.Worker.Kubernetes.RunOneCommand.Matches(args)) return Garrison.Worker.Kubernetes.RunOneCommand.Run(args);
            return Bootstrapper.Run(args);
        }
    }
}
