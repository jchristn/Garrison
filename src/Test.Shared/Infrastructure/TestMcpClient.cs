namespace Test.Shared.Infrastructure
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Serialization;
    using Garrison.ProviderHarness;
    using Voltaic.Mcp;

    /// <summary>Typed MCP test client; avoids fixed-contract JSON DOM navigation.</summary>
    public class TestMcpClient : IDisposable
    {
        private readonly McpHttpClient _Client = new McpHttpClient();
        private bool _Disposed;
        /// <summary>Connect a test caller to the fixture MCP endpoint.</summary>
        /// <param name="host">Fixture host.</param>
        /// <param name="bearer">User/run token, or null for the fixture administrator key.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Task.</returns>
        public async Task ConnectAsync(TestServerHost host, string? bearer, CancellationToken token)
        {
            if (bearer == null) { _Client.SetRequestHeader("x-api-key", host.Settings.Auth.AdminApiKey); _Client.SetRequestHeader("x-tenant-id", host.TenantId); }
            else _Client.SetRequestHeader("Authorization", "Bearer " + bearer);
            Assert.True(await _Client.ConnectStreamableAsync(host.McpUrl, "/mcp", token).ConfigureAwait(false), "MCP test connection");
        }
        /// <summary>Connect using a normal API credential rather than the administrator key.</summary>
        /// <param name="host">Fixture host.</param>
        /// <param name="accessKey">Fixture access key.</param>
        /// <param name="secretKey">Fixture secret key.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Task.</returns>
        public async Task ConnectAccessKeyAsync(TestServerHost host, string accessKey, string secretKey, CancellationToken token)
        {
            _Client.SetRequestHeader("x-access-key", accessKey);
            _Client.SetRequestHeader("x-secret-key", secretKey);
            Assert.True(await _Client.ConnectStreamableAsync(host.McpUrl, "/mcp", token).ConfigureAwait(false), "MCP credential connection");
        }
        /// <summary>List caller-visible tools.</summary>
        /// <param name="token">Cancellation.</param>
        /// <returns>Typed tools page.</returns>
        public Task<ProviderToolPage> ToolsAsync(CancellationToken token) { return _Client.CallAsync<ProviderToolPage>("tools/list", new { }, 30000, token); }
        /// <summary>Call a tool and read its text content.</summary>
        /// <param name="name">Tool name.</param>
        /// <param name="arguments">Typed arguments.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Tool text.</returns>
        public async Task<string> CallAsync(string name, object arguments, CancellationToken token)
        {
            ProviderToolResult result = await _Client.CallAsync<ProviderToolResult>("tools/call", new { name, arguments }, 30000, token).ConfigureAwait(false);
            string text = ProviderMcpBridge.Text(result);
            if (result.IsError) throw new TestAssertionException(text);
            return text;
        }
        /// <summary>Call a tool returning a typed JSON record.</summary>
        /// <typeparam name="T">Record type.</typeparam>
        /// <param name="name">Tool name.</param>
        /// <param name="arguments">Typed arguments.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Record.</returns>
        public async Task<T> CallAsync<T>(string name, object arguments, CancellationToken token)
        {
            string text = await CallAsync(name, arguments, token).ConfigureAwait(false);
            return Serializer.Deserialize<T>(text) ?? throw new TestAssertionException("Empty typed MCP record.");
        }
        /// <summary>Verify a denied/invalid call without exposing fixture payloads.</summary>
        /// <param name="name">Tool name.</param>
        /// <param name="arguments">Arguments.</param>
        /// <param name="code">Expected error code.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Task.</returns>
        public async Task ExpectErrorAsync(string name, object arguments, string code, CancellationToken token)
        {
            bool rejected = false;
            try { await CallAsync(name, arguments, token).ConfigureAwait(false); }
            catch (Exception error) { rejected = error.Message.Contains(code, StringComparison.Ordinal); }
            Assert.True(rejected, name + " must reject with " + code);
        }
        /// <inheritdoc />
        public void Dispose() { Dispose(true); GC.SuppressFinalize(this); }
        /// <summary>Dispose the test connection.</summary>
        /// <param name="disposing">Whether to release managed resources.</param>
        protected virtual void Dispose(bool disposing) { if (_Disposed) return; if (disposing) _Client.Dispose(); _Disposed = true; }
    }
}
