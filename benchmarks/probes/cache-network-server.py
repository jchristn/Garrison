#!/usr/bin/env python3
"""Disposable loopback HTTPS Git smart endpoint with explicit response delay/pacing and payload counters."""
import argparse
import gzip
import json
import os
from pathlib import Path
import ssl
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote

parser = argparse.ArgumentParser()
parser.add_argument('--root', required=True)
parser.add_argument('--certificate', required=True)
parser.add_argument('--key', required=True)
parser.add_argument('--delay-ms', type=int, default=25)
parser.add_argument('--bytes-per-second', type=int, default=16777216)
args = parser.parse_args()
root = Path(args.root).resolve()
stats_file = root / 'network-stats.json'
lock = threading.Lock()
stats = dict(activeRequests=0, requests=0, requestBodyBytes=0, responseBodyBytes=0, gitRequests=0, snapshotRequests=0)

def save_stats():
    temporary = stats_file.with_suffix('.tmp')
    temporary.write_text(json.dumps(stats))
    temporary.replace(stats_file)

save_stats()

class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *_):
        pass

    def do_GET(self):
        self.serve()

    def do_POST(self):
        self.serve()

    def serve(self):
        with lock:
            stats['activeRequests'] += 1
            save_stats()
        try:
            self.serve_core()
        finally:
            with lock:
                stats['activeRequests'] -= 1
                save_stats()

    def serve_core(self):
        split = urlsplit(self.path)
        path = unquote(split.path)
        length = int(self.headers.get('Content-Length', '0'))
        if length < 0 or length > 16 * 1024 * 1024:
            self.send_error(413)
            return
        body = self.rfile.read(length)
        request_bytes = len(body)
        if self.headers.get('Content-Encoding', '').lower() == 'gzip':
            body = gzip.decompress(body)
        snapshot = path == '/snapshot.zip' and self.command == 'GET'
        if snapshot:
            payload = (root / 'prepared.zip').read_bytes()
            status = 200
            content_type = 'application/zip'
        elif path.startswith('/repository.git/'):
            environment = {
                'PATH': os.environ.get('PATH', '/usr/bin:/bin'),
                'HOME': str(root),
                'GIT_CONFIG_GLOBAL': os.devnull,
                'GIT_CONFIG_NOSYSTEM': '1',
                'GIT_CONFIG_COUNT': '1',
                'GIT_CONFIG_KEY_0': 'pack.threads',
                'GIT_CONFIG_VALUE_0': '1',
                'GIT_PROJECT_ROOT': str(root),
                'GIT_HTTP_EXPORT_ALL': '1',
                'PATH_INFO': path,
                'QUERY_STRING': split.query,
                'REQUEST_METHOD': self.command,
                'CONTENT_TYPE': self.headers.get('Content-Type', ''),
                'CONTENT_LENGTH': str(len(body)),
                'REMOTE_ADDR': self.client_address[0],
                'SERVER_PROTOCOL': 'HTTP/1.1',
                'HTTP_GIT_PROTOCOL': self.headers.get('Git-Protocol', ''),
            }
            result = subprocess.run(['git', 'http-backend'], input=body, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=environment, timeout=30, check=True)
            head, payload = result.stdout.split(b'\r\n\r\n', 1)
            fields = {}
            for line in head.decode().split('\r\n'):
                key, value = line.split(':', 1)
                fields[key.lower()] = value.strip()
            status = int(fields.get('status', '200').split()[0])
            content_type = fields.get('content-type', 'application/octet-stream')
        else:
            self.send_error(404)
            return
        time.sleep(args.delay_ms / 1000)
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(payload)))
        self.send_header('Connection', 'close')
        self.end_headers()
        sent = 0
        started = time.monotonic()
        for offset in range(0, len(payload), 16384):
            chunk = payload[offset:offset + 16384]
            self.wfile.write(chunk)
            self.wfile.flush()
            sent += len(chunk)
            if args.bytes_per_second > 0:
                remaining = sent / args.bytes_per_second - (time.monotonic() - started)
                if remaining > 0:
                    time.sleep(remaining)
        with lock:
            stats['requests'] += 1
            stats['requestBodyBytes'] += request_bytes
            stats['responseBodyBytes'] += len(payload)
            stats['snapshotRequests' if snapshot else 'gitRequests'] += 1
            save_stats()
        self.close_connection = True

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(args.certificate, args.key)
server.socket = context.wrap_socket(server.socket, server_side=True)
print(json.dumps({'port': server.server_port}), flush=True)
server.serve_forever(poll_interval=0.1)
