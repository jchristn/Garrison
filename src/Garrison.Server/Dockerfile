# Garrison control plane (Command) image.
# Build from the repository root:
#   docker build -f src/Garrison.Server/Dockerfile -t jchristn77/garrison-server:<tag> .

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source
COPY src/ ./src/
RUN dotnet publish src/Garrison.Server/Garrison.Server.csproj -c Release -f net10.0 -o /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/runtime:10.0
ARG GARRISON_VERSION=0.2.0
LABEL org.opencontainers.image.title="garrison-server" \
      org.opencontainers.image.version="${GARRISON_VERSION}" \
      org.opencontainers.image.source="https://github.com/jchristn/Garrison" \
      org.opencontainers.image.licenses="MIT"
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --gid 10001 garrison \
 && useradd --uid 10001 --gid 10001 --create-home --home-dir /home/garrison garrison \
 && mkdir -p /app /app/data /app/logs \
 && chown -R 10001:10001 /app
WORKDIR /app
COPY --from=build --chown=10001:10001 /out/ /app/
COPY LICENSE.md THIRD_PARTY_NOTICES.md /licenses/
COPY assets/licenses/ /licenses/assets/licenses/
USER 10001
ENV GARRISON_SETTINGS_FILE=/app/garrison.json \
    DOTNET_CLI_TELEMETRY_OPTOUT=1
EXPOSE 8700 8701 8702 9464
ENTRYPOINT ["dotnet", "Garrison.Server.dll"]
