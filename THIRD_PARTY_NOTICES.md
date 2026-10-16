# Third-party notices

Garrison is licensed under the MIT license in LICENSE.md. Its application dependencies retain their own licenses and copyrights.

Unmodified license and notice files supplied by restored packages are preserved in [the license archive](assets/licenses/third-party-licenses.zip). The [machine-readable inventory](assets/licenses/dependencies.json) identifies the exact resolved versions and archive paths. For packages without a supplied license file, the archive includes upstream texts with source URLs and SHA-256 hashes in [the provenance manifest](assets/licenses/upstream-sources.json). AWS texts use the current upstream branch because the packages do not record a source commit.

This inventory covers the .NET application, browser runtime bundles, and Python/Go SDK runtime dependencies. JavaScript SDK runtime has no external dependencies. Build/test tools, the operating system, .NET/Node/Python/Go runtimes, and optional external services retain their own distribution notices. Container base images and harness CLIs must be reviewed separately when images are distributed.

Regenerate with `python3 scripts/generate-third-party-notices.py --artifacts <dotnet-artifacts-directory>` after restoring dependencies. Python versions reflect the harness environment because the SDK declares a supported range rather than a lockfile.

| Ecosystem | Package | Version | License | Bundled texts |
|---|---|---|---|---|
| go | [golang.org/x/sys](https://golang.org/x/sys) | v0.29.0 | See bundled license | 2 |
| go | [golang.org/x/term](https://golang.org/x/term) | v0.28.0 | See bundled license | 2 |
| npm | [@babel/runtime](https://babel.dev/docs/en/next/babel-runtime) | 7.29.7 | MIT | 1 |
| npm | [@types/trusted-types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/trusted-types) | 2.0.7 | MIT | 1 |
| npm | [cookie](https://registry.npmjs.org/cookie/-/cookie-1.1.1.tgz) | 1.1.1 | MIT | 1 |
| npm | [dompurify](https://github.com/cure53/DOMPurify) | 3.4.16 | (MPL-2.0 OR Apache-2.0) | 2 |
| npm | [html-parse-stringify](https://github.com/henrikjoreteg/html-parse-stringify) | 3.1.0 | MIT | 1 |
| npm | [i18next](https://www.i18next.com) | 24.2.3 | MIT | 1 |
| npm | [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector) | 8.2.1 | MIT | 1 |
| npm | [marked](https://marked.js.org) | 18.1.0 | MIT | 1 |
| npm | [react](https://react.dev/) | 19.2.8 | MIT | 1 |
| npm | [react-dom](https://react.dev/) | 19.2.8 | MIT | 1 |
| npm | [react-i18next](https://github.com/i18next/react-i18next) | 15.7.4 | MIT | 1 |
| npm | [react-router](https://registry.npmjs.org/react-router/-/react-router-7.18.2.tgz) | 7.18.2 | MIT | 1 |
| npm | [react-router-dom](https://registry.npmjs.org/react-router-dom/-/react-router-dom-7.18.2.tgz) | 7.18.2 | MIT | 1 |
| npm | [scheduler](https://react.dev/) | 0.27.0 | MIT | 1 |
| npm | [set-cookie-parser](https://github.com/nfriedly/set-cookie-parser) | 2.7.2 | MIT | 1 |
| npm | [void-elements](https://github.com/jadejs/void-elements) | 3.1.0 | MIT | 1 |
| nuget | [AWSSDK.Core](https://github.com/aws/aws-sdk-net/) | 4.0.102.10 | Apache-2.0 | 1 |
| nuget | [AWSSDK.S3](https://github.com/aws/aws-sdk-net/) | 4.0.104.3 | Apache-2.0 | 1 |
| nuget | [Caching](https://github.com/jchristn/caching) | 5.1.2 | LICENSE.md | 1 |
| nuget | [Clutch.Sdk](https://github.com/jchristn/Clutch) | 0.3.0 | LICENSE.md | 1 |
| nuget | [Cronos](https://github.com/HangfireIO/Cronos) | 0.13.0 | MIT | 1 |
| nuget | [Fractions](https://github.com/danm-de/Fractions) | 7.3.0 | license.txt | 1 |
| nuget | [Google.Protobuf](https://github.com/protocolbuffers/protobuf) | 3.36.2 | BSD-3-Clause | 1 |
| nuget | [Humanizer.Core](https://github.com/Humanizr/Humanizer) | 2.14.1 | MIT | 1 |
| nuget | [Humanizer.Core](https://github.com/Humanizr/Humanizer) | 3.0.1 | MIT | 1 |
| nuget | [IpMatcher](https://github.com/jchristn/ipmatcher) | 1.1.0 | LICENSE.md | 1 |
| nuget | [Json.More.Net](https://github.com/json-everything/json-everything) | 2.2.0 | MIT | 1 |
| nuget | [JsonPointer.Net](https://github.com/json-everything/json-everything) | 6.0.1 | MIT | 1 |
| nuget | [JsonSchema.Net](https://github.com/json-everything/json-everything) | 8.0.5 | MIT | 1 |
| nuget | [KubernetesClient](https://github.com/kubernetes-client/csharp) | 19.0.2 | Apache-2.0 | 1 |
| nuget | [Microsoft.Data.Sqlite](https://docs.microsoft.com/dotnet/standard/data/sqlite/) | 10.0.12 | MIT | 1 |
| nuget | [Microsoft.Data.Sqlite.Core](https://docs.microsoft.com/dotnet/standard/data/sqlite/) | 10.0.12 | MIT | 1 |
| nuget | [Microsoft.Extensions.Configuration](https://dot.net/) | 10.0.0 | MIT | 1 |
| nuget | [Microsoft.Extensions.Configuration](https://dot.net/) | 8.0.0 | MIT | 2 |
| nuget | [Microsoft.Extensions.Configuration.Abstractions](https://dot.net/) | 10.0.0 | MIT | 1 |
| nuget | [Microsoft.Extensions.Configuration.Abstractions](https://dot.net/) | 8.0.0 | MIT | 2 |
| nuget | [Microsoft.Extensions.Configuration.Binder](https://dot.net/) | 10.0.0 | MIT | 1 |
| nuget | [Microsoft.Extensions.Configuration.Binder](https://dot.net/) | 8.0.2 | MIT | 2 |
| nuget | [Microsoft.Extensions.Configuration.EnvironmentVariables](https://dot.net/) | 10.0.0 | MIT | 1 |
| nuget | [Microsoft.Extensions.Configuration.EnvironmentVariables](https://dot.net/) | 8.0.0 | MIT | 2 |
| nuget | [Microsoft.Extensions.DependencyInjection](https://dot.net/) | 10.0.12 | MIT | 1 |
| nuget | [Microsoft.Extensions.DependencyInjection.Abstractions](https://dot.net/) | 10.0.12 | MIT | 1 |
| nuget | [Microsoft.Extensions.Diagnostics.Abstractions](https://dot.net/) | 10.0.0 | MIT | 1 |
| nuget | [Microsoft.Extensions.Diagnostics.Abstractions](https://dot.net/) | 8.0.0 | MIT | 2 |
| nuget | [Microsoft.Extensions.Logging](https://dot.net/) | 10.0.12 | MIT | 1 |
| nuget | [Microsoft.Extensions.Logging.Abstractions](https://dot.net/) | 10.0.12 | MIT | 1 |
| nuget | [Microsoft.Extensions.Logging.Configuration](https://dot.net/) | 10.0.0 | MIT | 1 |
| nuget | [Microsoft.Extensions.Logging.Configuration](https://dot.net/) | 8.0.0 | MIT | 2 |
| nuget | [Microsoft.Extensions.Options](https://dot.net/) | 10.0.12 | MIT | 1 |
| nuget | [Microsoft.Extensions.Options.ConfigurationExtensions](https://dot.net/) | 10.0.0 | MIT | 1 |
| nuget | [Microsoft.Extensions.Options.ConfigurationExtensions](https://dot.net/) | 8.0.0 | MIT | 2 |
| nuget | [Microsoft.Extensions.Primitives](https://dot.net/) | 10.0.12 | MIT | 1 |
| nuget | [Npgsql](https://github.com/npgsql/npgsql) | 10.0.3 | PostgreSQL | 1 |
| nuget | [OpenTelemetry](https://opentelemetry.io/) | 1.19.1 | Apache-2.0 | 2 |
| nuget | [OpenTelemetry.Api](https://opentelemetry.io/) | 1.19.1 | Apache-2.0 | 2 |
| nuget | [OpenTelemetry.Api.ProviderBuilderExtensions](https://opentelemetry.io/) | 1.19.1 | Apache-2.0 | 2 |
| nuget | [OpenTelemetry.Exporter.OpenTelemetryProtocol](https://opentelemetry.io/) | 1.19.1 | Apache-2.0 | 2 |
| nuget | [OpenTelemetry.Exporter.Prometheus.HttpListener](https://opentelemetry.io/) | 1.19.1-beta.1 | Apache-2.0 | 2 |
| nuget | [OpenTelemetry.Instrumentation.Runtime](https://opentelemetry.io/) | 1.19.0 | Apache-2.0 | 1 |
| nuget | [Padlock](https://github.com/jchristn/padlock) | 1.2.1 | LICENSE.md | 1 |
| nuget | [PolyPrompt](https://github.com/jchristn/PolyPrompt) | 2.8.0 | MIT | 1 |
| nuget | [PrettyId](https://github.com/jchristn/PrettyId) | 2.0.2 | LICENSE.md | 1 |
| nuget | [QoSKit](https://github.com/jchristn/QoSKit) | 0.2.2 | MIT | 1 |
| nuget | [Radiant](https://github.com/jchristn/Radiant) | 0.1.3 | LICENSE.md | 1 |
| nuget | [RegexMatcher](https://github.com/jchristn/regexmatcher) | 1.1.0 | LICENSE.md | 1 |
| nuget | [SQLitePCLRaw.bundle_e_sqlite3](https://www.nuget.org/packages/SQLitePCLRaw.bundle_e_sqlite3/2.1.12) | 2.1.12 | Apache-2.0 | 1 |
| nuget | [SQLitePCLRaw.core](https://www.nuget.org/packages/SQLitePCLRaw.core/2.1.12) | 2.1.12 | Apache-2.0 | 1 |
| nuget | [SQLitePCLRaw.lib.e_sqlite3](https://www.nuget.org/packages/SQLitePCLRaw.lib.e_sqlite3/2.1.12) | 2.1.12 | Apache-2.0 | 1 |
| nuget | [SQLitePCLRaw.provider.e_sqlite3](https://www.nuget.org/packages/SQLitePCLRaw.provider.e_sqlite3/2.1.12) | 2.1.12 | Apache-2.0 | 1 |
| nuget | [SyslogLogging](https://github.com/jchristn/LoggingModule) | 2.2.1 | LICENSE.md | 1 |
| nuget | [SyslogLogging](https://github.com/jchristn/LoggingModule) | 2.4.1 | LICENSE.md | 1 |
| nuget | [System.Diagnostics.DiagnosticSource](https://dot.net/) | 10.0.12 | MIT | 1 |
| nuget | [System.IO.Pipelines](https://dot.net/) | 10.0.12 | MIT | 1 |
| nuget | [System.Text.Encodings.Web](https://dot.net/) | 10.0.12 | MIT | 1 |
| nuget | [System.Text.Json](https://dot.net/) | 10.0.12 | MIT | 1 |
| nuget | [Timestamps](https://github.com/jchristn/timestamps) | 1.0.13 | LICENSE.md | 1 |
| nuget | [UrlMatcher](https://github.com/jchristn/UrlMatcher) | 3.1.0 | LICENSE.md | 1 |
| nuget | [Voltaic](https://github.com/jchristn/Voltaic) | 2.4.0 | LICENSE.md | 1 |
| nuget | [Watson](https://github.com/dotnet/WatsonWebserver) | 7.3.0 | LICENSE.md | 1 |
| nuget | [Watson](https://github.com/dotnet/WatsonWebserver) | 7.3.1 | LICENSE.md | 1 |
| nuget | [YamlDotNet](https://github.com/aaubry/YamlDotNet/wiki) | 18.1.0 | MIT | 1 |
| python | [certifi](https://github.com/certifi/python-certifi) | 2026.7.22 | MPL-2.0 | 1 |
| python | [charset-normalizer](https://pypi.org/project/charset-normalizer) | 3.5.2 | MIT | 1 |
| python | [idna](https://pypi.org/project/idna) | 3.20 | BSD-3-Clause | 1 |
| python | [requests](https://pypi.org/project/requests) | 2.34.2 | Apache-2.0 | 2 |
| python | [urllib3](https://pypi.org/project/urllib3) | 2.8.0 | MIT | 1 |
