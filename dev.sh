#!/bin/sh
set -eu
cd "$(dirname "$0")"
exec npm run dev --workspace=continuum-frontend -- --host 0.0.0.0 --port "${PORT:-8080}"