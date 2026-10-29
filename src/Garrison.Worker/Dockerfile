# Garrison worker node (Post) image with bundled harnesses.
# Build from the repository root:
#   docker build -f src/Garrison.Worker/Dockerfile -t jchristn77/garrison-worker:<tag> .
# Harness versions are pinned with build arguments and recorded in image labels.

# Mux 1.3.0 (commit 60fd88a). Built from source until Mux publishes release archives
# (mux-<version>-linux-<arch>.tar.gz); switch to the archive for the pinned version then.
ARG MUX_REF=60fd88aeed706e13c2ae20689fb56b887d327bf4
ARG MUX_VERSION=1.3.0

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source
COPY src/ ./src/
COPY sdk/csharp/ ./sdk/csharp/
RUN dotnet publish src/Garrison.Worker/Garrison.Worker.csproj -c Release -f net10.0 -o /out/worker /p:UseAppHost=false \
 && dotnet publish src/Garrison.FakeHarness/Garrison.FakeHarness.csproj -c Release -f net10.0 -o /out/fake /p:UseAppHost=false \
 && dotnet publish src/Garrison.ProviderHarness/Garrison.ProviderHarness.csproj -c Release -f net10.0 -o /out/provider /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS mux
ARG MUX_REF
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /mux
RUN git clone https://github.com/jchristn/Mux.git . \
 && git checkout "${MUX_REF}" \
 && dotnet publish src/Mux.Cli/Mux.Cli.csproj -c Release -f net10.0 -o /out/mux -p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/runtime:10.0
ARG MUX_REF
ARG MUX_VERSION
ARG GARRISON_VERSION=0.2.0
ARG NODE_MAJOR=22
ARG CLAUDE_CODE_VERSION=2.1.296
ARG CODEX_VERSION=0.159.3
ARG INCLUDE_GEMINI=false
ARG GEMINI_CLI_VERSION=0.55.1
ARG INCLUDE_OPENCODE=false
ARG OPENCODE_VERSION=1.19.5
ARG INCLUDE_PI=false
ARG PI_VERSION=1.4.0
LABEL org.opencontainers.image.title="garrison-worker" \
      org.opencontainers.image.version="${GARRISON_VERSION}" \
      org.opencontainers.image.source="https://github.com/jchristn/Garrison" \
      org.opencontainers.image.licenses="MIT" \
      io.garrison.harness.claude-code="${CLAUDE_CODE_VERSION}" \
      io.garrison.harness.codex="${CODEX_VERSION}" \
      io.garrison.harness.mux="${MUX_VERSION}" \
      io.garrison.harness.mux-ref="${MUX_REF}" \
      io.garrison.harness.gemini-cli="${INCLUDE_GEMINI}:${GEMINI_CLI_VERSION}" \
      io.garrison.harness.opencode="${INCLUDE_OPENCODE}:${OPENCODE_VERSION}" \
      io.garrison.harness.pi="${INCLUDE_PI}:${PI_VERSION}"

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git ripgrep gnupg \
 && curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" "@openai/codex@${CODEX_VERSION}" \
 && if [ "${INCLUDE_GEMINI}" = "true" ]; then npm install -g "@google/gemini-cli@${GEMINI_CLI_VERSION}"; fi \
 && if [ "${INCLUDE_OPENCODE}" = "true" ]; then npm install -g "opencode-ai@${OPENCODE_VERSION}"; fi \
 && if [ "${INCLUDE_PI}" = "true" ]; then npm install -g "@earendil-works/pi-coding-agent@${PI_VERSION}"; fi \
 # Claude Code, Codex, and opencode ship their native binaries as optional npm dependencies, which npm skips without
 # failing when a download breaks. Run them here so a partial install fails the build instead of producing a worker
 # without harnesses.
 && claude --version \
 && codex --version \
 && if [ "${INCLUDE_GEMINI}" = "true" ]; then gemini --version; fi \
 && if [ "${INCLUDE_OPENCODE}" = "true" ]; then opencode --version | grep -q "${OPENCODE_VERSION}"; fi \
 && if [ "${INCLUDE_PI}" = "true" ]; then pi --version | grep -q "${PI_VERSION}"; fi \
 && npm cache clean --force \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build /out/worker/ /opt/garrison/worker/
COPY --from=build /out/fake/ /opt/garrison/fake/
COPY --from=build /out/provider/ /opt/garrison/provider/
COPY --from=mux /out/mux/ /opt/mux/
COPY --from=mux /mux/LICENSE.md /licenses/Mux-LICENSE.md

RUN printf '#!/bin/sh\nexec dotnet /opt/mux/Mux.Cli.dll "$@"\n' > /usr/local/bin/mux \
 && printf '#!/bin/sh\nexec dotnet /opt/garrison/fake/garrison-fake-harness.dll "$@"\n' > /usr/local/bin/garrison-fake-harness \
 && printf '#!/bin/sh\nexec dotnet /opt/garrison/provider/garrison-provider-api.dll "$@"\n' > /usr/local/bin/garrison-provider-api \
 && chmod 755 /usr/local/bin/mux /usr/local/bin/garrison-fake-harness /usr/local/bin/garrison-provider-api \
 && mux --version | grep -q "${MUX_VERSION}" \
 && garrison-provider-api --version \
 && groupadd --gid 10001 garrison \
 && useradd --uid 10001 --gid 10001 --create-home --home-dir /home/garrison garrison \
 && mkdir -p /workspaces \
 && chown -R 10001:10001 /workspaces /opt/garrison

COPY LICENSE.md THIRD_PARTY_NOTICES.md /licenses/
COPY assets/licenses/ /licenses/assets/licenses/
USER 10001
WORKDIR /opt/garrison/worker
ENV HOME=/home/garrison \
    GARRISON_WORKER_WORK_ROOT=/workspaces \
    GARRISON_WORKER_CONTAINERIZED=true \
    GARRISON_WORKER_SETTINGS_FILE=/opt/garrison/worker/garrison-worker.json \
    DISABLE_AUTOUPDATER=1 \
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
    MUX_TELEMETRY_ENABLED=false \
    OPENCODE_DISABLE_AUTOUPDATE=1 \
    PI_SKIP_VERSION_CHECK=1 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1
EXPOSE 8710 9465
ENTRYPOINT ["dotnet", "Garrison.Worker.dll"]
