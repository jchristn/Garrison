namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Text.Json;
    using System.Threading.Tasks;

    /// <summary>
    /// A request sent by <see cref="JsonRpcConnection"/> that is waiting for its response. Continuations run
    /// asynchronously, so completing one never runs caller code on the stdout reader thread.
    /// </summary>
    internal class JsonRpcPendingRequest
    {
        #region Public-Members

        /// <summary>
        /// Method of the request.
        /// </summary>
        public string Method { get; }

        /// <summary>
        /// Completed with the raw result, faulted with <see cref="JsonRpcException"/>, or cancelled when the
        /// connection closes.
        /// </summary>
        public TaskCompletionSource<JsonElement> Completion { get; } = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="method">Method of the request.</param>
        public JsonRpcPendingRequest(string method)
        {
            Method = method ?? String.Empty;
        }

        #endregion
    }
}
