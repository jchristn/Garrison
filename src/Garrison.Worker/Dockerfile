# Garrison worker node (Post) image with bundled harnesses.
# Build from the repository root:
#   docker build -f src/Garrison.Worker/Dockerfile -t jchristn77/garrison-worker:<tag> .
# Harness versions are pinned with build arguments and recorded in image labels.

ARG MUX_REF=33672f948c5b7efa2adb6502d5444d167610240e

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source
COPY src/ ./src/
RUN dotnet publish src/Garrison.Worker/Garrison.Worker.csproj -c Release -f net10.0 -o /out/worker /p:UseAppHost=false \
 && dotnet publish src/Garrison.FakeHarness/Garrison.FakeHarness.csproj -c Release -f net10.0 -o /out/fake /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS mux
ARG MUX_REF
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /mux
RUN git clone https://github.com/jchristn/Mux.git . \
 && git checkout "${MUX_REF}" \
 && dotnet publish src/Mux.Cli/Mux.Cli.csproj -c Release -f net10.0 -o /out/mux -p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/runtime:10.0
ARG MUX_REF
ARG GARRISON_VERSION=0.1.0-alpha
ARG NODE_MAJOR=22
ARG CLAUDE_CODE_VERSION=2.1.296
ARG CODEX_VERSION=0.159.3
ARG INCLUDE_GEMINI=false
ARG GEMINI_CLI_VERSION=0.55.1
LABEL org.opencontainers.image.title="garrison-worker" \
      org.opencontainers.image.version="${GARRISON_VERSION}" \
      org.opencontainers.image.source="https://github.com/jchristn/Garrison" \
      org.opencontainers.image.licenses="MIT" \
      io.garrison.harness.claude-code="${CLAUDE_CODE_VERSION}" \
      io.garrison.harness.codex="${CODEX_VERSION}" \
      io.garrison.harness.mux-ref="${MUX_REF}" \
      io.garrison.harness.gemini-cli="${INCLUDE_GEMINI}:${GEMINI_CLI_VERSION}"

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git ripgrep gnupg \
 && curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" "@openai/codex@${CODEX_VERSION}" \
 && if [ "${INCLUDE_GEMINI}" = "true" ]; then npm install -g "@google/gemini-cli@${GEMINI_CLI_VERSION}"; fi \
 # Both CLIs ship their native binaries as optional npm dependencies, which npm skips without failing when a
 # download breaks. Run them here so a partial install fails the build instead of producing a worker without harnesses.
 && claude --version \
 && codex --version \
 && if [ "${INCLUDE_GEMINI}" = "true" ]; then gemini --version; fi \
 && npm cache clean --force \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build /out/worker/ /opt/garrison/worker/
COPY --from=build /out/fake/ /opt/garrison/fake/
COPY --from=mux /out/mux/ /opt/mux/

RUN printf '#!/bin/sh\nexec dotnet /opt/mux/Mux.Cli.dll "$@"\n' > /usr/local/bin/mux \
 && printf '#!/bin/sh\nexec dotnet /opt/garrison/fake/garrison-fake-harness.dll "$@"\n' > /usr/local/bin/garrison-fake-harness \
 && chmod 755 /usr/local/bin/mux /usr/local/bin/garrison-fake-harness \
 && groupadd --gid 10001 garrison \
 && useradd --uid 10001 --gid 10001 --create-home --home-dir /home/garrison garrison \
 && mkdir -p /workspaces \
 && chown -R 10001:10001 /workspaces /opt/garrison

USER 10001
WORKDIR /opt/garrison/worker
ENV HOME=/home/garrison \
    GARRISON_WORKER_WORK_ROOT=/workspaces \
    GARRISON_WORKER_SETTINGS_FILE=/opt/garrison/worker/garrison-worker.json \
    DISABLE_AUTOUPDATER=1 \
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
    MUX_TELEMETRY_ENABLED=false \
    DOTNET_CLI_TELEMETRY_OPTOUT=1
EXPOSE 8710 9465
ENTRYPOINT ["dotnet", "Garrison.Worker.dll"]
