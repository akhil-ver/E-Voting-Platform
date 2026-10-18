#!/usr/bin/env bash
# Script to launch Hyperledger Besu dev network or local node
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if command -v docker >/dev/null 2>&1; then
    echo "Starting Hyperledger Besu dev container via Docker Compose..."
    docker compose -f "$DIR/docker-compose.besu.yml" up -d
    echo "Besu dev node running at http://127.0.0.1:8545 (Chain ID: 1337 or 2018)"
else
    echo "Docker not detected. Starting local Hardhat EVM development node on http://127.0.0.1:8545..."
    cd "$DIR" && npx hardhat node --port 8545
fi
