namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Settings;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Settings;
    using Garrison.Worker.Settings;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Checks the deployment assets for the P15.22 findings that live outside the server code (docs/SECURITY_REVIEW.md):
    /// Docker Compose and the secret scripts carry no public default keys or passwords (SR-08), local launchers opt in to
    /// development mode explicitly (SR-08), scrapes use the dedicated metrics listeners rather than the anonymous relay on
    /// the REST and health ports (SR-20), NetworkPolicies keep run, server, and worker pods away from the cloud metadata
    /// service (SR-23), and the dashboard sends a Content-Security-Policy and framing headers (SR-25). Also checks that the
    /// metrics listener hostname can be set from the environment and answers for that host.
    /// </summary>
    public static class SecurityAssetsSuite
    {
        #region Private-Members

        private static readonly string[] _RequiredComposeVariables = new[]
        {
            "GARRISON_DB_PASSWORD", "GARRISON_MASTER_KEY", "GARRISON_AUTH_SIGNING_KEY", "GARRISON_ADMIN_API_KEY", "GARRISON_ADMIN_PASSWORD",
            "GARRISON_DEFAULT_ACCESS_KEY", "GARRISON_DEFAULT_SECRET_KEY", "GARRISON_NODE_ACCESS_KEY", "GARRISON_NODE_SECRET_KEY", "GARRISON_GRAFANA_PASSWORD"
        };

        private static readonly string[] _PublicDefaults = new[]
        {
            "garrisonadmin", "secret_garrison_default_change_me", "secret_garrison_node_change_me", "garrison-default-master-key-override-me", "garrison-default-signing-key-override-me"
        };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
            cases.Add(new TestCaseDescriptor("security-assets", "compose-no-default-secrets", "Docker Compose requires every key and password and has no public default fallback (SR-08)", ct => ComposeAsync()));
            cases.Add(new TestCaseDescriptor("security-assets", "secret-scripts-no-default-password", "generate-secrets and the Compose env generator never fall back to a default administrator or Grafana password (SR-08)", ct => SecretScriptsAsync()));
            cases.Add(new TestCaseDescriptor("security-assets", "dev-mode-explicit", "Local throwaway servers opt in to development mode with GARRISON_ALLOW_INSECURE_DEFAULTS (SR-08)", ct => DevelopmentModeAsync()));
            cases.Add(new TestCaseDescriptor("security-assets", "network-policies-metadata", "Run default egress excludes 169.254.0.0/16 and server and worker egress excludes 169.254.169.254, in Kustomize and Helm (SR-23)", ct => NetworkPoliciesAsync()));
            cases.Add(new TestCaseDescriptor("security-assets", "dashboard-headers", "The dashboard nginx sends CSP, frame-ancestors, X-Frame-Options, nosniff, and Referrer-Policy on every location (SR-25)", ct => DashboardHeadersAsync()));
            cases.Add(new TestCaseDescriptor("security-assets", "metrics-scrape-listener", "No scrape config or annotation targets /metrics on 8700 or 8710; pods bind the metrics listener to their pod IP (SR-20)", ct => MetricsScrapeAsync()));
            cases.Add(new TestCaseDescriptor("security-assets", "metrics-listener-hostname", "GARRISON_PROMETHEUS_HOSTNAME and GARRISON_WORKER_PROMETHEUS_HOSTNAME set the listener hostname, and a listener bound to a configured host answers /metrics for that host (SR-20)", ct => MetricsHostnameAsync(ct)));
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            suites.Add(new TestSuiteDescriptor("security-assets", "Security review deployment assets", cases));
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string Root()
        {
            try
            {
                return TelemetryCoverageDocument.RepositoryRoot();
            }
            catch (DirectoryNotFoundException)
            {
                // Binaries built with --artifacts-path outside the repository: look above the working directory instead.
                DirectoryInfo? directory = new DirectoryInfo(Environment.CurrentDirectory);
                while (directory != null)
                {
                    if (File.Exists(Path.Combine(directory.FullName, "GARRISON_PLAN.md"))) return directory.FullName;
                    directory = directory.Parent;
                }
                throw;
            }
        }

        private static string Read(string relative)
        {
            string path = Path.Combine(Root(), relative.Replace('/', Path.DirectorySeparatorChar));
            if (!File.Exists(path)) throw new TestAssertionException("Missing repository file " + relative + ".");
            return File.ReadAllText(path).Replace("\r\n", "\n");
        }

        private static IEnumerable<string> Files(string relativeDirectory, params string[] patterns)
        {
            string root = Root();
            string directory = Path.Combine(root, relativeDirectory.Replace('/', Path.DirectorySeparatorChar));
            foreach (string pattern in patterns)
            {
                foreach (string file in Directory.EnumerateFiles(directory, pattern, SearchOption.AllDirectories))
                {
                    string relative = Path.GetRelativePath(root, file).Replace(Path.DirectorySeparatorChar, '/');
                    // Skip untracked scratch output (k8s/tests/.work, rendered by test scripts) and test results: they are
                    // not shipped assets and may predate the checkout.
                    if (relative.Contains("/.work/", StringComparison.Ordinal) || relative.Contains("/results/", StringComparison.Ordinal)) continue;
                    yield return relative;
                }
            }
        }

        private static string Document(string yaml, string kind, string name)
        {
            foreach (string document in Regex.Split(yaml, "^---\\s*$", RegexOptions.Multiline))
            {
                if (Regex.IsMatch(document, "^kind:\\s*" + kind + "\\s*$", RegexOptions.Multiline) && Regex.IsMatch(document, "^\\s+name:\\s*" + Regex.Escape(name) + "\\s*$", RegexOptions.Multiline)) return document;
            }
            throw new TestAssertionException("No " + kind + " named " + name + " found.");
        }

        private static Task ComposeAsync()
        {
            foreach (string file in new[] { "docker/compose.yaml", "docker/compose.observability.yaml" })
            {
                string text = Read(file);
                foreach (string value in _PublicDefaults)
                {
                    Assert.True(!text.Contains(value, StringComparison.Ordinal), file + " still carries the public default " + value + ".");
                }
                foreach (string variable in _RequiredComposeVariables)
                {
                    Assert.True(!Regex.IsMatch(text, "\\$\\{" + variable + ":?-"), file + " gives " + variable + " a fallback value; it must be required with ${" + variable + ":?...}.");
                }
            }
            string compose = Read("docker/compose.yaml");
            foreach (string variable in _RequiredComposeVariables)
            {
                Assert.True(compose.Contains("${" + variable + ":?", StringComparison.Ordinal), "compose.yaml does not require " + variable + ".");
            }
            string example = Read("docker/.env.example");
            foreach (string assignment in new[] { "GARRISON_ADMIN_PASSWORD=password", "GARRISON_ADMIN_API_KEY=garrisonadmin", "GARRISON_GRAFANA_PASSWORD=password" })
            {
                Assert.True(!Regex.IsMatch(example, "^" + Regex.Escape(assignment) + "\\s*$", RegexOptions.Multiline), ".env.example sets " + assignment + ".");
            }
            return Task.CompletedTask;
        }

        private static Task SecretScriptsAsync()
        {
            string shell = Read("k8s/scripts/generate-secrets.sh");
            Assert.True(!shell.Contains("GARRISON_ADMIN_PASSWORD:-password", StringComparison.Ordinal), "generate-secrets.sh falls back to the default administrator password.");
            Assert.True(!shell.Contains("GARRISON_GRAFANA_PASSWORD:-password", StringComparison.Ordinal), "generate-secrets.sh falls back to the default Grafana password.");
            string batch = Read("k8s/scripts/generate-secrets.bat");
            Assert.True(!batch.Contains("set ADMIN_PASSWORD=password", StringComparison.Ordinal), "generate-secrets.bat falls back to the default administrator password.");
            Assert.True(!batch.Contains("set GRAFANA_PASSWORD=password", StringComparison.Ordinal), "generate-secrets.bat falls back to the default Grafana password.");

            foreach (string file in new[] { "docker/env-secrets.sh", "docker/env-secrets.ps1" })
            {
                string text = Read(file);
                foreach (string variable in _RequiredComposeVariables)
                {
                    Assert.True(text.Contains(variable, StringComparison.Ordinal), file + " does not generate " + variable + ".");
                }
            }
            Assert.True(Read("docker/update.sh").Contains("env-secrets.sh", StringComparison.Ordinal), "update.sh does not run env-secrets.sh.");
            Assert.True(Read("docker/factory/reset.sh").Contains("env-secrets.sh\" --fresh", StringComparison.Ordinal), "reset.sh does not run env-secrets.sh --fresh.");
            Assert.True(Read("docker/update.bat").Contains("env-secrets.ps1", StringComparison.Ordinal), "update.bat does not run env-secrets.ps1.");
            Assert.True(Read("docker/factory/reset.bat").Contains("env-secrets.ps1\" -Fresh", StringComparison.Ordinal), "reset.bat does not run env-secrets.ps1 -Fresh.");
            return Task.CompletedTask;
        }

        private static Task DevelopmentModeAsync()
        {
            foreach (string file in new[] { "scripts/run-sdk-harnesses.sh", "scripts/run-sdk-harnesses.bat", "dashboard/tests/contract/run.mjs", "k8s/tests/local-dry-run.sh", "benchmarks/common.sh", "benchmarks/common.bat" })
            {
                Assert.True(Read(file).Contains("GARRISON_ALLOW_INSECURE_DEFAULTS", StringComparison.Ordinal), file + " starts a server on the public defaults without GARRISON_ALLOW_INSECURE_DEFAULTS.");
            }
            return Task.CompletedTask;
        }

        private static Task NetworkPoliciesAsync()
        {
            string kustomize = Read("k8s/base/networkpolicies.yaml");
            string runDefault = Document(kustomize, "NetworkPolicy", "garrison-run-default-egress");
            Assert.True(runDefault.Contains("169.254.0.0/16", StringComparison.Ordinal), "garrison-run-default-egress does not exclude 169.254.0.0/16.");
            foreach (string name in new[] { "garrison-server", "garrison-worker" })
            {
                string policy = Document(kustomize, "NetworkPolicy", name);
                Assert.True(Regex.IsMatch(policy, "policyTypes:.*\"Egress\""), name + " NetworkPolicy has no Egress policy type.");
                Assert.True(policy.Contains("169.254.169.254/32", StringComparison.Ordinal), name + " NetworkPolicy does not exclude 169.254.169.254/32.");
            }

            string helm = Read("k8s/helm/garrison/templates/networkpolicies.yaml");
            foreach (string name in new[] { "garrison-server", "garrison-worker" })
            {
                string policy = Document(helm, "NetworkPolicy", name);
                Assert.True(Regex.IsMatch(policy, "policyTypes:.*\"Egress\""), "Helm " + name + " NetworkPolicy has no Egress policy type.");
                Assert.True(policy.Contains("169.254.169.254/32", StringComparison.Ordinal), "Helm " + name + " NetworkPolicy does not exclude 169.254.169.254/32.");
            }
            Assert.True(Document(helm, "NetworkPolicy", "garrison-run-default-egress").Contains("$rule.except", StringComparison.Ordinal), "Helm run default egress does not render except.");
            string values = Read("k8s/helm/garrison/values.yaml");
            Match runEgress = Regex.Match(values, "runEgress:\\n((?:[ ]{4,}.*\\n|\\s*\\n)+)");
            Assert.True(runEgress.Success, "Helm values have no runEgress block.");
            Assert.True(runEgress.Groups[1].Value.Contains("169.254.0.0/16", StringComparison.Ordinal), "Helm runEgress does not exclude 169.254.0.0/16.");
            return Task.CompletedTask;
        }

        private static Task DashboardHeadersAsync()
        {
            string headers = Read("dashboard/nginx-security-headers.conf");
            Match csp = Regex.Match(headers, "add_header Content-Security-Policy \"([^\"]*)\" always;");
            Assert.True(csp.Success, "No Content-Security-Policy header (with always).");
            string policy = csp.Groups[1].Value;
            foreach (string directive in new[] { "default-src 'self'", "script-src 'self'", "img-src 'self' data:", "connect-src 'self'", "frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'" })
            {
                Assert.True(policy.Contains(directive, StringComparison.Ordinal), "The Content-Security-Policy lacks " + directive + ".");
            }
            Assert.True(!policy.Contains("unsafe-inline", StringComparison.Ordinal) && !policy.Contains("unsafe-eval", StringComparison.Ordinal), "The Content-Security-Policy allows unsafe inline or eval.");
            Assert.True(!Regex.IsMatch(policy, "img-src[^;]*(https?:|\\*)"), "img-src allows remote images.");
            Assert.True(headers.Contains("add_header X-Frame-Options \"DENY\" always;", StringComparison.Ordinal), "No X-Frame-Options DENY.");
            Assert.True(headers.Contains("add_header X-Content-Type-Options \"nosniff\" always;", StringComparison.Ordinal), "No X-Content-Type-Options nosniff.");
            Assert.True(headers.Contains("add_header Referrer-Policy \"no-referrer\" always;", StringComparison.Ordinal), "No Referrer-Policy no-referrer.");

            const string include = "include /etc/nginx/garrison-security-headers.inc;";
            string nginx = Read("dashboard/nginx.conf");
            string server = nginx.Substring(nginx.IndexOf("server {", StringComparison.Ordinal));
            string serverLevel = server.Substring(0, server.IndexOf("location", StringComparison.Ordinal));
            Assert.True(serverLevel.Contains(include, StringComparison.Ordinal), "nginx.conf does not include the security headers at server level.");
            // nginx drops inherited add_header directives in a location that sets its own, so each such location repeats the include.
            foreach (Match location in Regex.Matches(server, "location [^{]*\\{([^}]*)\\}"))
            {
                string body = location.Groups[1].Value;
                if (!body.Contains("add_header", StringComparison.Ordinal)) continue;
                Assert.True(body.Contains(include, StringComparison.Ordinal), "nginx.conf " + location.Value.Split('{')[0].Trim() + " sets add_header without the security headers.");
            }
            Assert.True(Read("dashboard/Dockerfile").Contains("nginx-security-headers.conf /etc/nginx/garrison-security-headers.inc", StringComparison.Ordinal), "The dashboard image does not install the security headers.");
            Assert.True(Read("dashboard/docker-entrypoint.sh").Contains("garrison_csp_connect", StringComparison.Ordinal), "The dashboard entrypoint does not set the CSP connect-src variable.");
            return Task.CompletedTask;
        }

        private static Task MetricsScrapeAsync()
        {
            List<string> yamlFiles = Files("k8s", "*.yaml").Concat(Files("docker", "*.yaml")).ToList();
            foreach (string file in yamlFiles)
            {
                string text = Read(file);
                Assert.True(!Regex.IsMatch(text, "prometheus\\.io/port:\\s*\"?(8700|8710)\"?"), file + " points a prometheus.io/port annotation at the REST or health port.");
                Assert.True(!Regex.IsMatch(text, "targets:.*:(8700|8710)\""), file + " scrapes the REST or health port.");
            }
            foreach (string file in new[] { "k8s/base/server-deployment.yaml", "k8s/helm/garrison/templates/server.yaml" })
            {
                string text = Read(file);
                Assert.True(Regex.IsMatch(text, "prometheus\\.io/port:\\s*\"9464\""), file + " does not annotate the metrics listener 9464.");
                Assert.True(Regex.IsMatch(text, "GARRISON_PROMETHEUS_HOSTNAME[\\s\\S]{0,120}status\\.podIP"), file + " does not bind the metrics listener to the pod IP.");
            }
            foreach (string file in new[] { "k8s/base/worker-statefulset.yaml", "k8s/components/worker-pools/worker-mux.yaml", "k8s/helm/garrison/templates/workers.yaml" })
            {
                string text = Read(file);
                Assert.True(Regex.IsMatch(text, "prometheus\\.io/port:\\s*\"9465\""), file + " does not annotate the metrics listener 9465.");
                Assert.True(Regex.IsMatch(text, "GARRISON_WORKER_PROMETHEUS_HOSTNAME[\\s\\S]{0,120}status\\.podIP"), file + " does not bind the metrics listener to the pod IP.");
            }
            string compose = Read("docker/compose.yaml");
            Assert.True(compose.Contains("hostname: 'garrison-server'", StringComparison.Ordinal), "The Compose server has no hostname, so its metrics listener cannot be scraped by name.");
            string prometheus = Read("docker/observability/prometheus.yaml");
            Assert.True(prometheus.Contains("garrison-server:9464", StringComparison.Ordinal) && prometheus.Contains("garrison-worker-1:9465", StringComparison.Ordinal), "Compose Prometheus does not scrape the metrics listeners.");
            return Task.CompletedTask;
        }

        private static async Task MetricsHostnameAsync(CancellationToken token)
        {
            string? serverPrevious = Environment.GetEnvironmentVariable("GARRISON_PROMETHEUS_HOSTNAME");
            string? workerPrevious = Environment.GetEnvironmentVariable("GARRISON_WORKER_PROMETHEUS_HOSTNAME");
            try
            {
                Environment.SetEnvironmentVariable("GARRISON_PROMETHEUS_HOSTNAME", "10.42.0.17");
                Environment.SetEnvironmentVariable("GARRISON_WORKER_PROMETHEUS_HOSTNAME", "10.42.0.18");
                ServerSettings server = new ServerSettings();
                server.ApplyEnvironment();
                Assert.Equal("10.42.0.17", server.Telemetry.PrometheusHostname, "Server metrics hostname from GARRISON_PROMETHEUS_HOSTNAME");
                Assert.True(server.EnvironmentOverrides.Contains("Telemetry.PrometheusHostname"), "The override is recorded as coming from the environment.");
                WorkerSettings worker = new WorkerSettings();
                worker.ApplyEnvironment();
                Assert.Equal("10.42.0.18", worker.Telemetry.PrometheusHostname, "Worker metrics hostname from GARRISON_WORKER_PROMETHEUS_HOSTNAME");
            }
            finally
            {
                Environment.SetEnvironmentVariable("GARRISON_PROMETHEUS_HOSTNAME", serverPrevious);
                Environment.SetEnvironmentVariable("GARRISON_WORKER_PROMETHEUS_HOSTNAME", workerPrevious);
            }

            // A listener bound to a configured address (here 127.0.0.1, standing in for a pod IP) answers a scrape
            // addressed to that host, which is how Prometheus reaches it by pod IP.
            int port = TestServerHost.FreePort();
            TelemetrySettings settings = new TelemetrySettings();
            settings.Enabled = true;
            settings.ServiceName = "garrison-hostname-test";
            settings.PrometheusEnable = true;
            settings.PrometheusHostname = "127.0.0.1";
            settings.PrometheusPort = port;
            using (GarrisonTelemetry telemetry = new GarrisonTelemetry(settings, "hostname-test", null))
            {
                Assert.Equal("127.0.0.1", telemetry.PrometheusHostname, "Bound hostname");
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(30);
                    using (HttpResponseMessage response = await client.GetAsync("http://127.0.0.1:" + port + "/metrics", token).ConfigureAwait(false))
                    {
                        string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(200, (int)response.StatusCode, "Scrape addressed to the bound host");
                        Assert.True(body.Contains("# TYPE", StringComparison.Ordinal), "Prometheus exposition text");
                    }
                }
            }
        }

        #endregion
    }
}
