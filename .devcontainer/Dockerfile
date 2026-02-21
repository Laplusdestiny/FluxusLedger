FROM mcr.microsoft.com/devcontainers/base:ubuntu

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 python3-pip nodejs npm curl git build-essential \
  && npm install -g npm@latest \
  && rm -rf /var/lib/apt/lists/*

USER vscode

WORKDIR /workspaces/FluxusLedger
