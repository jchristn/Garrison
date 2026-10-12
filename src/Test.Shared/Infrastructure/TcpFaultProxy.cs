namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Concurrent;
    using System.Net;
    using System.Net.Sockets;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// TCP relay in front of a server (PostgreSQL in the outage tests) that can be cut: <see cref="Cut"/> closes every
    /// relayed connection and stops listening, so new connections are refused exactly as when the database stops;
    /// <see cref="Restore"/> listens again on the same port. Thread-safe.
    /// </summary>
    public sealed class TcpFaultProxy : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Local port clients connect to (127.0.0.1).
        /// </summary>
        public int Port { get; }

        /// <summary>
        /// Whether the relay is cut.
        /// </summary>
        public bool IsCut
        {
            get
            {
                return Volatile.Read(ref _Cut) == 1;
            }
        }

        #endregion

        #region Private-Members

        private readonly string _TargetHost;
        private readonly int _TargetPort;
        private readonly ConcurrentDictionary<Guid, TcpClient> _Open = new ConcurrentDictionary<Guid, TcpClient>();
        private readonly object _Lock = new object();
        private TcpListener? _Listener = null;
        private CancellationTokenSource _Stop = new CancellationTokenSource();
        private int _Cut = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Start relaying from a free 127.0.0.1 port to a target.
        /// </summary>
        /// <param name="targetHost">Target host.</param>
        /// <param name="targetPort">Target port.</param>
        /// <exception cref="ArgumentNullException">Thrown when the host is null or empty.</exception>
        public TcpFaultProxy(string targetHost, int targetPort)
        {
            if (String.IsNullOrEmpty(targetHost)) throw new ArgumentNullException(nameof(targetHost));
            _TargetHost = targetHost;
            _TargetPort = targetPort;
            Port = TestServerHost.FreePort();
            Listen();
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Drop every relayed connection and refuse new ones.
        /// </summary>
        public void Cut()
        {
            lock (_Lock)
            {
                Interlocked.Exchange(ref _Cut, 1);
                _Stop.Cancel();
                try
                {
                    _Listener?.Stop();
                }
                catch (SocketException)
                {
                }
                _Listener = null;
                foreach (TcpClient client in _Open.Values)
                {
                    try
                    {
                        client.Client.LingerState = new LingerOption(true, 0);
                        client.Close();
                    }
                    catch (Exception)
                    {
                    }
                }
                _Open.Clear();
            }
        }

        /// <summary>
        /// Accept and relay connections again.
        /// </summary>
        public void Restore()
        {
            lock (_Lock)
            {
                if (_Listener != null) return;
                _Stop.Dispose();
                _Stop = new CancellationTokenSource();
                Listen();
                Interlocked.Exchange(ref _Cut, 0);
            }
        }

        /// <summary>
        /// Stop relaying.
        /// </summary>
        public void Dispose()
        {
            Cut();
            _Stop.Dispose();
        }

        #endregion

        #region Private-Methods

        private void Listen()
        {
            TcpListener listener = new TcpListener(IPAddress.Loopback, Port);
            listener.Server.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
            listener.Start();
            _Listener = listener;
            CancellationToken token = _Stop.Token;
            _ = Task.Run(() => AcceptAsync(listener, token));
        }

        private async Task AcceptAsync(TcpListener listener, CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                TcpClient inbound;
                try
                {
                    inbound = await listener.AcceptTcpClientAsync(token).ConfigureAwait(false);
                }
                catch (Exception)
                {
                    return;
                }
                _ = Task.Run(() => RelayAsync(inbound, token));
            }
        }

        private async Task RelayAsync(TcpClient inbound, CancellationToken token)
        {
            TcpClient outbound = new TcpClient();
            Guid inboundId = Guid.NewGuid();
            Guid outboundId = Guid.NewGuid();
            _Open[inboundId] = inbound;
            _Open[outboundId] = outbound;
            try
            {
                await outbound.ConnectAsync(_TargetHost, _TargetPort, token).ConfigureAwait(false);
                NetworkStream a = inbound.GetStream();
                NetworkStream b = outbound.GetStream();
                Task up = a.CopyToAsync(b, token);
                Task down = b.CopyToAsync(a, token);
                await Task.WhenAny(up, down).ConfigureAwait(false);
            }
            catch (Exception)
            {
            }
            finally
            {
                _Open.TryRemove(inboundId, out TcpClient? _);
                _Open.TryRemove(outboundId, out TcpClient? _);
                inbound.Dispose();
                outbound.Dispose();
            }
        }

        #endregion
    }
}
