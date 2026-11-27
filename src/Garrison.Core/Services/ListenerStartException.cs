namespace Garrison.Core.Services
{
    using System;

    /// <summary>
    /// Raised when a listener (the REST port, the MCP port, a worker health port) cannot start, for example because the
    /// address is already in use. The message names the listener, the host, and the port, so a startup failure such as
    /// "Address already in use" says which address.
    /// </summary>
    public class ListenerStartException : Exception
    {
        #region Public-Members

        /// <summary>
        /// What was listening, for example REST or MCP.
        /// </summary>
        public string Listener { get; }

        /// <summary>
        /// Host name or address the listener tried to bind.
        /// </summary>
        public string Hostname { get; }

        /// <summary>
        /// Port the listener tried to bind.
        /// </summary>
        public int Port { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="listener">What was listening, for example REST.</param>
        /// <param name="hostname">Host name or address.</param>
        /// <param name="port">Port.</param>
        /// <param name="inner">The error the listener raised.</param>
        /// <exception cref="ArgumentNullException">Thrown when inner is null.</exception>
        public ListenerStartException(string listener, string hostname, int port, Exception inner)
            : base((listener ?? "listener") + " could not listen on " + (hostname ?? String.Empty) + ":" + port + ": " + (inner ?? throw new ArgumentNullException(nameof(inner))).Message, inner)
        {
            Listener = listener ?? "listener";
            Hostname = hostname ?? String.Empty;
            Port = port;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Run a listener's start action, turning any failure into a <see cref="ListenerStartException"/> that names the
        /// address.
        /// </summary>
        /// <param name="listener">What is listening, for example REST.</param>
        /// <param name="hostname">Host name or address.</param>
        /// <param name="port">Port.</param>
        /// <param name="start">Start action.</param>
        /// <exception cref="ArgumentNullException">Thrown when start is null.</exception>
        /// <exception cref="ListenerStartException">Thrown when the start action fails.</exception>
        public static void Run(string listener, string hostname, int port, Action start)
        {
            if (start == null) throw new ArgumentNullException(nameof(start));
            try
            {
                start();
            }
            catch (Exception e) when (e is not OperationCanceledException && e is not ListenerStartException)
            {
                throw new ListenerStartException(listener, hostname, port, e);
            }
        }

        #endregion
    }
}
